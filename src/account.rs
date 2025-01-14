use std::collections::HashMap;

use axum::{extract::{Query, State}, response::IntoResponse, Json};
use axum_extra::extract::WithRejection;
use rand::Rng;
use serde::{Deserialize, Serialize};
use sqlx::{prelude::FromRow, Pool, Postgres, Row};

use crate::{extractor_error::ExtractorError, plutus_error::{PlutusError, PlutusFormat, Outcome}, session::RawSessionID, utils, AppState};

const ID_LENGTH: u32 = 64;

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

    pub async fn delete(db: &Pool<Postgres>, id: i64) -> AccountError {
        if Account::fetch(db, id).await.is_none() {
            return AccountError::NoExist;
        }

        sqlx::query("delete from plutus.account where id = $1;")
            .bind(id)
            .execute(db)
            .await.unwrap();

        AccountError::Success
    }
    
    pub async fn generate_id(db: &Pool<Postgres>) -> i64 {
        let ids = sqlx::query("select id from plutus.session;")
            .fetch_all(db).await.unwrap().into_iter().map(|x| x.get(0)).collect::<Vec<i64>>();

        let mut rng = rand::thread_rng();
        loop {
            let candidate = rng.gen_range(0..=(2i64.pow(ID_LENGTH)));

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
}

#[derive(Serialize, Deserialize)]
pub enum AccountError {
    Success,

    NoExist,
    NoPermission,
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

        Outcome::Account(AccountError::Success)
    }).await
}

pub async fn fetch(
    State(app_state): State<AppState>,
    Query(query): Query<HashMap<String, String>>,
    WithRejection(Json(session_id), _): WithRejection<Json<RawSessionID>, ExtractorError>
) -> impl IntoResponse {
    utils::request_boiler(app_state, query, session_id, vec![
        ("id", PlutusFormat::Number)
    ], |db, session, query| async move {
        Outcome::Success(
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
        Outcome::Success(serde_json::to_string(&Account::fetch_all(&db, session.user).await).unwrap())
    }).await
}

pub async fn delete(
    State(app_state): State<AppState>,
    Query(query): Query<HashMap<String, String>>,
    WithRejection(Json(session_id), _): WithRejection<Json<RawSessionID>, ExtractorError>
) -> impl IntoResponse {
    utils::request_boiler(app_state, query, session_id, vec![
        ("id", PlutusFormat::Number)
    ], |db, session, query| async move {
        let id = utils::from_query("id", &query).parse::<i64>().unwrap();
        if Account::is_owner(&db, id, session.user.clone()).await {
            Outcome::Account(Account::delete(&db, id).await)
        } else {
            Outcome::Account(AccountError::NoPermission)
        }
    }).await
}
