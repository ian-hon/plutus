use std::collections::HashMap;

use axum::{extract::{Query, State}, response::IntoResponse, Json};
use axum_extra::extract::WithRejection;
use rand::Rng;
use serde::{Deserialize, Serialize};
use sqlx::{prelude::FromRow, Pool, Postgres, Row};

use crate::{extractor_error::ExtractorError, limit::{self, Limit, LimitError}, log::{Log, LogSpecies, Source}, plutus_error::{Outcome, PlutusFormat}, session::RawSessionID, utils, AppState};

const ID_LENGTH: u32 = 4 * 2;

#[derive(FromRow, Serialize, Deserialize)]
pub struct Account {
    pub id: i64,
    pub name: String,
    pub owner: String,
    pub balance: f64,
}
impl Account {
    pub async fn fetch(db: &Pool<Postgres>, id: i64) -> Option<Account> {
         sqlx::query_as::<_, Account>("select * from plutus.account where id = $1;")
            .bind(id)
            .fetch_optional(db)
            .await.unwrap()
    }

    pub async fn fetch_all(db: &Pool<Postgres>, user: String) -> Vec<Account> {
        sqlx::query_as::<_, Account>("select * from plutus.account where owner = $1;")
            .bind(user)
            .fetch_all(db)
            .await.unwrap()
    }

    pub async fn create(db: &Pool<Postgres>, name: String, owner: String) -> Account {
        let candidate = Account {
            id: Account::generate_id(db).await,
            name,
            owner,
            balance: 0f64
        };
        sqlx::query("insert into plutus.account(id, name, owner, balance) values($1, $2, $3, $4);")
            .bind(candidate.id)
            .bind(candidate.name.clone())
            .bind(candidate.owner.clone())
            .bind(candidate.balance)
            .execute(db)
            .await.unwrap();
        candidate
    }

    pub async fn edit(db: &Pool<Postgres>, id: i64, name: String) -> Option<AccountError> {
        if Account::fetch(db, id).await.is_none() {
            return Some(AccountError::NoExist);
        }

        sqlx::query("update plutus.account set name = $1 where id = $2;")
            .bind(name)
            .bind(id)
            .execute(db)
            .await.unwrap();

        None
    }

    pub async fn delete(db: &Pool<Postgres>, id: i64) -> Option<AccountError> {
        // none -> no error
        // some -> with error (obv)
        if Account::fetch(db, id).await.is_none() {
            return Some(AccountError::NoExist);
        }

        sqlx::query("delete from plutus.account where id = $1;")
            .bind(id)
            .execute(db)
            .await.unwrap();

        None
    }
    
    pub async fn generate_id(db: &Pool<Postgres>) -> i64 {
        let ids = sqlx::query("select id from plutus.session;")
            .fetch_all(db).await.unwrap().into_iter().map(|x| x.get(0)).collect::<Vec<i64>>();

        let mut rng = rand::thread_rng();
        loop {
            let candidate = rng.gen_range(0..=(16i64.pow(ID_LENGTH)));

            if ids.contains(&candidate) {
                continue;
            }

            return candidate;
        }
    }

    pub async fn is_owner(db: &Pool<Postgres>, id: i64, user: String) -> bool {
        match Account::fetch(db, id).await {
            Some(a) => {
                a.owner == user
            },
            None => false
        }
    }

    // balance related
    pub async fn transfer(db: &Pool<Postgres>, origin: i64, destination: i64, amount: f64, log: bool) -> Option<Outcome> {
        // possible returns
        // AccountError::NoExist
        // AccountError::InsufficientBalance
        // LimitError::WillSurpassLimit

        let origin = Account::fetch(db, origin).await;
        if origin.is_none() {
            return Some(Outcome::Account(AccountError::NoExist));
        }
        let origin = origin.unwrap();

        let destination = Account::fetch(db, destination).await;
        if destination.is_none() {
            return Some(Outcome::Account(AccountError::NoExist));
        }
        let destination = destination.unwrap();

        if origin.balance < amount {
            return Some(Outcome::Account(AccountError::InsufficientBalance));
        }

        if Limit::check_limits(db, origin.id, amount).await {
            return Some(Outcome::Limit(LimitError::WillSurpassLimit));
        }

        sqlx::query("update plutus.account set balance = balance - $1 where id = $2;")
            .bind(amount)
            .bind(origin.id)
            .execute(db)
            .await.unwrap();

        sqlx::query("update plutus.account set balance = balance + $1 where id = $2;")
            .bind(amount)
            .bind(destination.id)
            .execute(db)
            .await.unwrap();
        
        if log {
            Log::append(db, LogSpecies::Outgoing, amount, Source::User(origin.id), Source::User(destination.id), Outcome::Success).await;
            Log::append(db, LogSpecies::Incoming, amount, Source::User(origin.id), Source::User(destination.id), Outcome::Success).await;
        }

        match Limit::fetch(db, origin.id).await {
            Some(l) => {
                sqlx::query("update plutus.limit set usage = usage + $1 where id = $2;")
                    .bind(amount)
                    .bind(l.id)
                    .execute(db)
                    .await.unwrap();
            },
            None => {}
        }

        None
    }
    // 
}

#[derive(Serialize, Deserialize, PartialEq, Eq)]
pub enum AccountError {
    NoExist,
    NoPermission,

    InsufficientBalance,
}

pub async fn transfer(
    State(app_state): State<AppState>,
    Query(query): Query<HashMap<String, String>>,
    WithRejection(Json(session_id), _): WithRejection<Json<RawSessionID>, ExtractorError>
) -> impl IntoResponse {
    utils::request_boiler(app_state, query, session_id, vec![
        ("origin", PlutusFormat::BigNumber),
        ("destination", PlutusFormat::BigNumber),
        ("amount", PlutusFormat::Float)
    ], |db, session, query| async move {
        let origin = utils::from_query("origin", &query).parse::<i64>().unwrap();
        let destination = utils::from_query("destination", &query).parse::<i64>().unwrap();
        let amount = utils::from_query("amount", &query).parse::<f64>().unwrap();

        if !Account::is_owner(&db, origin, session.user).await {
            return Outcome::Account(AccountError::NoPermission);
        }

        if Account::fetch(&db, destination).await.is_none() {
            return Outcome::Account(AccountError::NoPermission);
        }

        if amount <= 0f64 {
            return Outcome::Account(AccountError::InsufficientBalance);
        }

        match Account::transfer(&db, origin, destination, amount, true).await {
            Some(o) => {
                if o == Outcome::Account(AccountError::NoExist) {
                    return Outcome::Account(AccountError::NoPermission);
                }
                o
            },
            None => Outcome::Success
        }
    }).await
}

pub async fn create(
    State(app_state): State<AppState>,
    Query(query): Query<HashMap<String, String>>,
    WithRejection(Json(session_id), _): WithRejection<Json<RawSessionID>, ExtractorError>
) -> impl IntoResponse {
    utils::request_boiler(app_state, query, session_id, vec![
        ("name", PlutusFormat::Unspecified)
    ], |db, session, query| async move {
        Account::create(&db, utils::from_query("name", &query), session.user).await;

        Outcome::Success
    }).await
}

pub async fn edit(
    State(app_state): State<AppState>,
    Query(query): Query<HashMap<String, String>>,
    WithRejection(Json(session_id), _): WithRejection<Json<RawSessionID>, ExtractorError>
) -> impl IntoResponse {
    utils::request_boiler(app_state, query, session_id, vec![
        ("id", PlutusFormat::BigNumber),
        ("name", PlutusFormat::Unspecified)
    ], |db, session, query| async move {
        let id = utils::from_query("id", &query).parse::<i64>().unwrap();
        if !Account::is_owner(&db, id, session.user).await {
            return Outcome::Account(AccountError::NoPermission);
        }

        match Account::edit(&db, id, utils::from_query("name", &query)).await {
            Some(e) => Outcome::Account(if e == AccountError::NoExist { AccountError::NoPermission } else { e }),
            None => Outcome::Success
        }
    }).await
}

pub async fn fetch(
    State(app_state): State<AppState>,
    Query(query): Query<HashMap<String, String>>,
    WithRejection(Json(session_id), _): WithRejection<Json<RawSessionID>, ExtractorError>
) -> impl IntoResponse {
    utils::request_boiler(app_state, query, session_id, vec![
        ("id", PlutusFormat::BigNumber)
    ], |db, session, query| async move {
        Outcome::Data(
            serde_json::to_string(
                &match Account::fetch(&db, utils::from_query("id", &query).parse::<i64>().unwrap()).await {
                    Some(a) => {
                        if a.owner == session.user {
                            Some(a)
                        } else {
                            None
                        }
                    },
                    None => None
                }
            ).unwrap()
        )
    }).await
}

pub async fn fetch_all(
    State(app_state): State<AppState>,
    Query(query): Query<HashMap<String, String>>,
    WithRejection(Json(session_id), _): WithRejection<Json<RawSessionID>, ExtractorError>
) -> impl IntoResponse {
    utils::request_boiler(app_state, query, session_id, vec![], |db, session, _| async move {
        Outcome::Data(serde_json::to_string(&Account::fetch_all(&db, session.user).await).unwrap())
    }).await
}

pub async fn delete(
    State(app_state): State<AppState>,
    Query(query): Query<HashMap<String, String>>,
    WithRejection(Json(session_id), _): WithRejection<Json<RawSessionID>, ExtractorError>
) -> impl IntoResponse {
    utils::request_boiler(app_state, query, session_id, vec![
        ("id", PlutusFormat::BigNumber)
    ], |db, session, query| async move {
        let id = utils::from_query("id", &query).parse::<i64>().unwrap();
        if Account::is_owner(&db, id, session.user.clone()).await {
            match Account::delete(&db, id).await {
                Some(r) => Outcome::Account(r),
                None => Outcome::Success
            }
        } else {
            Outcome::Account(AccountError::NoPermission)
        }
    }).await
}
