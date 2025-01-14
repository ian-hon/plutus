use std::collections::HashMap;

use axum::{extract::{Query, State}, response::IntoResponse, Json};
use axum_extra::extract::WithRejection;
use serde::{Deserialize, Serialize};
use sqlx::{prelude::FromRow, Pool, Postgres, Row};

use crate::{account::{Account, AccountError}, extractor_error::ExtractorError, plutus_error::{PlutusFormat, Outcome}, session::RawSessionID, utils, AppState};

#[derive(FromRow, Serialize, Deserialize)]
pub struct Limit {
    pub id: i64,
    pub account: i64,

    pub usage: f64,
    pub cap: f64,

    pub duration: i32,
    pub last_enforcement: i32,
}

impl Limit {
    pub async fn create(db: &Pool<Postgres>, account: i64, cap: f64, duration: i32) -> Result<Limit, LimitError> {
        // dont limit creation?
        // multiple limits per account?
        match Limit::fetch(db, account).await {
            Some(_) => Err(LimitError::LimitAlreadyExists),
            None => {
                let mut result = Limit {
                    id: 0,
                    account,
                    usage: 0f64,
                    cap,
                    duration,
                    last_enforcement: utils::get_epoch_day() as i32
                };

                result.id = sqlx::query("insert into plutus.limit(account, usage, cap, duration, last_enforcement) values($1, $2, $3, $4, $5) returning id;")
                    .bind(result.account)
                    .bind(result.usage)
                    .bind(result.cap)
                    .bind(result.duration)
                    .bind(result.last_enforcement)
                    .fetch_one(db)
                    .await.unwrap()
                    .get(0);

                Ok(result)
            }
        }
    }

    pub async fn fetch(db: &Pool<Postgres>, account: i64) -> Option<Limit> {
        sqlx::query_as::<_, Limit>("select * from plutus.limit where account = $1;")
            .bind(account)
            .fetch_optional(db)
            .await.unwrap()
    }

    pub async fn delete(db: &Pool<Postgres>, account: i64) -> LimitError {
        if Limit::fetch(db, account).await.is_none() {
            return LimitError::LimitDoesntExist;
        }

        sqlx::query("delete from plutus.limit where account = $1;")
            .bind(account)
            .execute(db)
            .await.unwrap();

        LimitError::Success
    }

    pub async fn edit(db: &Pool<Postgres>, account: i64, cap: f64, duration: i32) -> LimitError {
        if Limit::fetch(db, account).await.is_none() {
            return LimitError::LimitDoesntExist;
        }

        sqlx::query("update plutus.limit set cap = $1, duration = $2;")
            .bind(cap)
            .bind(duration)
            .execute(db)
            .await.unwrap();

        LimitError::Success
    }
}

#[derive(Serialize, Deserialize)]
pub enum LimitError {
    Success,

    LimitAlreadyExists,
    LimitDoesntExist,
}

pub async fn create(
    State(app_state): State<AppState>,
    Query(query): Query<HashMap<String, String>>,
    WithRejection(Json(session_id), _): WithRejection<Json<RawSessionID>, ExtractorError>
) -> impl IntoResponse {
    utils::request_boiler(app_state, query, session_id, vec![
        ("account", PlutusFormat::BigNumber),
        ("cap", PlutusFormat::Float),
        ("duration", PlutusFormat::Number)
    ], |db, session, query| async move {
        let id = utils::from_query("account", &query).parse::<i64>().unwrap();

        if !Account::is_owner(&db, id, session.user).await {
            return Outcome::Account(AccountError::NoPermission);
        }

        match Limit::create(
            &db,
            id,
            utils::from_query("cap", &query).parse::<f64>().unwrap(),
            utils::from_query("duration", &query).parse::<i32>().unwrap()
        ).await
        .map_err(|e| Outcome::Limit(e)) {
            Ok(l) => Outcome::Success(serde_json::to_string(&l).unwrap()),
            Err(e) => e
        }
    }).await
}

pub async fn fetch(
    State(app_state): State<AppState>,
    Query(query): Query<HashMap<String, String>>,
    WithRejection(Json(session_id), _): WithRejection<Json<RawSessionID>, ExtractorError>
) -> impl IntoResponse {
    utils::request_boiler(app_state, query, session_id, vec![
        ("account", PlutusFormat::BigNumber)
    ], |db, _, query| async move {
        Outcome::Success(
            serde_json::to_string(
                &Limit::fetch(
                    &db,
                    utils::from_query("account", &query).parse::<i64>().unwrap()
                ).await
            ).unwrap()
        )
    }).await
}

pub async fn delete(
    State(app_state): State<AppState>,
    Query(query): Query<HashMap<String, String>>,
    WithRejection(Json(session_id), _): WithRejection<Json<RawSessionID>, ExtractorError>
) -> impl IntoResponse {
    utils::request_boiler(app_state, query, session_id, vec![
        ("account", PlutusFormat::BigNumber)
    ], |db, session, query| async move {
        let id = utils::from_query("account", &query).parse::<i64>().unwrap();

        if !Account::is_owner(&db, id, session.user).await {
            return Outcome::Account(AccountError::NoPermission);
        }

        Outcome::Limit(
            Limit::delete(&db, id).await
        )
    }).await
}

pub async fn edit(
    State(app_state): State<AppState>,
    Query(query): Query<HashMap<String, String>>,
    WithRejection(Json(session_id), _): WithRejection<Json<RawSessionID>, ExtractorError>
) -> impl IntoResponse {
    utils::request_boiler(app_state, query, session_id, vec![
        ("account", PlutusFormat::BigNumber),
        ("cap", PlutusFormat::Float),
        ("duration", PlutusFormat::Number)
    ], |db, session, query| async move {
        let id = utils::from_query("account", &query).parse::<i64>().unwrap();

        if !Account::is_owner(&db, id, session.user).await {
            return Outcome::Account(AccountError::NoPermission);
        }

        Outcome::Limit(
            Limit::edit(
                &db,
                id,
                utils::from_query("cap", &query).parse::<f64>().unwrap(),
                utils::from_query("duration", &query).parse::<i32>().unwrap()
            ).await
        )
    }).await
}
