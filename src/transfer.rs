use std::collections::HashMap;

use axum::{extract::{Query, State}, response::IntoResponse, Json};
use axum_extra::extract::WithRejection;
use serde::{Deserialize, Serialize};
use sqlx::{prelude::FromRow, Pool, Postgres};

use crate::{account::{Account, AccountError}, extractor_error::ExtractorError, limit::LimitError, plutus_error::{PlutusFormat, Outcome}, session::RawSessionID, utils, AppState};

#[derive(FromRow, Serialize, Deserialize)]
pub struct Transfer {
    pub id: i64,
    pub origin: i64,
    pub destination: i64,
    pub amount: f64,
    pub duration: i32, // how often to transfer (every x number of days)
    pub last_transfer: i32 // previous transfer (in epoch days)
}
impl Transfer {
    pub async fn create(db: &Pool<Postgres>, origin: i64, destination: i64, amount: f64, duration: i32) {
        sqlx::query("insert into plutus.transfer(origin, destination, amount, duration, last_transfer) values ($1, $2, $3, $4, $5);")
            .bind(origin)
            .bind(destination)
            .bind(amount)
            .bind(duration)
            .bind(utils::get_epoch_day())
            .execute(db)
            .await.unwrap();
    }

    pub async fn edit(db: &Pool<Postgres>, id: i64, amount: f64, duration: i32) {
        sqlx::query("update plutus.transfer set amount = $1, duration = $2 where id = $3;")
            .bind(amount)
            .bind(duration)
            .bind(id)
            .execute(db)
            .await.unwrap();
    }

    pub async fn fetch_incoming(db: &Pool<Postgres>, destination: i64) -> Vec<Transfer> {
        sqlx::query_as::<_, Transfer>("select * from plutus.transfer where destination = $1;")
            .bind(destination)
            .fetch_all(db)
            .await.unwrap()
    }

    pub async fn fetch_outgoing(db: &Pool<Postgres>, origin: i64) -> Vec<Transfer> {
        sqlx::query_as::<_, Transfer>("select * from plutus.transfer where origin = $1;")
            .bind(origin)
            .fetch_all(db)
            .await.unwrap()
    }

    pub async fn fetch(db: &Pool<Postgres>, id: i64) -> Option<Transfer> {
        sqlx::query_as::<_, Transfer>("select * from plutus.transfer where id = $1;")
            .bind(id)
            .fetch_optional(db)
            .await.unwrap()
    }

    pub async fn delete(db: &Pool<Postgres>, id: i64) -> Option<TransferError> {
        if Transfer::fetch(db, id).await.is_none() {
            return Some(TransferError::TransferDoesntExist);
        }

        sqlx::query("delete from plutus.transfer where id = $1;")
            .bind(id)
            .execute(db)
            .await.unwrap();

        None
    }
}

#[derive(Serialize, Deserialize)]
pub enum TransferError {
    TransferDoesntExist,

    ToDoesntExist,
    FromDoesntExist,

    TargetSame, // when to and from are the same

    InsufficientBalance
}

pub async fn create(
    State(app_state): State<AppState>,
    Query(query): Query<HashMap<String, String>>,
    WithRejection(Json(session_id), _): WithRejection<Json<RawSessionID>, ExtractorError>
) -> impl IntoResponse {
    utils::request_boiler(app_state, query, session_id, vec![
        ("origin", PlutusFormat::BigNumber),
        ("destination", PlutusFormat::BigNumber),
        ("amount", PlutusFormat::Float),
        ("duration", PlutusFormat::BigNumber),
    ], |db, session, query| async move {
        // check existance of both from and to

        let destination = utils::from_query("destination", &query).parse::<i64>().unwrap();
        let origin = utils::from_query("origin", &query).parse::<i64>().unwrap();

        if !Account::is_owner(&db, origin, session.user).await {
            // owns origin
            return Outcome::Account(AccountError::NoPermission);
        }

        if Account::fetch(&db, destination).await.is_none() {
            // destination exists
            return Outcome::Transfer(TransferError::ToDoesntExist);
        }

        if destination == origin {
            return Outcome::Transfer(TransferError::TargetSame);
        }

        Transfer::create(
            &db,
            origin,
            destination,
            utils::from_query("amount", &query).parse::<f64>().unwrap(),
            utils::from_query("duration", &query).parse::<i32>().unwrap(),
        ).await;

        Outcome::Success
    }).await
}

pub async fn edit(
    State(app_state): State<AppState>,
    Query(query): Query<HashMap<String, String>>,
    WithRejection(Json(session_id), _): WithRejection<Json<RawSessionID>, ExtractorError>
) -> impl IntoResponse {
    utils::request_boiler(app_state, query, session_id, vec![
        ("transfer", PlutusFormat::BigNumber),
        ("amount", PlutusFormat::Float),
        ("duration", PlutusFormat::BigNumber),
    ], |db, session, query| async move {
        let id = utils::from_query("transfer", &query).parse::<i64>().unwrap();

        let transfer = Transfer::fetch(&db, id).await;
        if transfer.is_none() {
            return Outcome::Account(AccountError::NoPermission);
        }
        let transfer = transfer.unwrap();

        if !Account::is_owner(&db, transfer.origin, session.user).await {
            return Outcome::Account(AccountError::NoPermission);
        }

        Transfer::edit(
            &db,
            id,
            utils::from_query("amount", &query).parse::<f64>().unwrap(),
            utils::from_query("duration", &query).parse::<i32>().unwrap(),
        ).await;

        Outcome::Success
    }).await
}

pub async fn fetch_incoming(
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

        Outcome::Data(serde_json::to_string(&Transfer::fetch_incoming(&db, id).await).unwrap())
    }).await
}

pub async fn fetch_outgoing(
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

        Outcome::Data(serde_json::to_string(&Transfer::fetch_outgoing(&db, id).await).unwrap())
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

        match Transfer::delete(&db, id).await {
            Some(e) => Outcome::Transfer(e),
            None => Outcome::Success
        }
    }).await
}
