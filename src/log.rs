use std::collections::HashMap;

use axum::{extract::{Query, State}, response::IntoResponse, Json};
use axum_extra::extract::WithRejection;
use serde::{Deserialize, Serialize};
use sqlx::{prelude::FromRow, Pool, Postgres};

use crate::{account::{Account, AccountError}, extractor_error::ExtractorError, plutus_error::{Outcome, PlutusFormat}, session::RawSessionID, utils, AppState};

#[derive(FromRow, Serialize, Deserialize, Clone)]
pub struct RawLog {
    pub id: i64,
    pub balance: f64,
    pub origin: String,
    pub destination: String,
    pub state: String,
    pub timestamp: f64
}
impl Into<Log> for RawLog {
    fn into(self) -> Log {
        Log {
            id: self.id,
            balance: self.balance,
            origin: serde_json::from_str(&self.origin).unwrap(),
            destination: serde_json::from_str(&self.destination).unwrap(),
            state: serde_json::from_str(&self.state).unwrap(),
            timestamp: self.timestamp
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct Log {
    pub id: i64,
    pub balance: f64,
    pub origin: Source, // from who
    pub destination: Source, // to who
    pub state: Outcome, // whether successful or not
    pub timestamp: f64
}
impl Log {
    pub async fn append(db: &Pool<Postgres>, balance: f64, origin: Source, destination: Source, state: Outcome) {
        sqlx::query("insert into plutus.log(balance, origin, destination, state, timestamp) values($1, $2, $3, $4, $5);")
            // .bind(serde_json::to_string(&species).unwrap())
            .bind(balance)
            .bind(serde_json::to_string(&origin).unwrap())
            .bind(serde_json::to_string(&destination).unwrap())
            .bind(serde_json::to_string(&state).unwrap())
            .bind(utils::get_time())
            .execute(db)
            .await.unwrap();
    }

    pub async fn fetch(db: &Pool<Postgres>, account: i64, amount: i32) -> Vec<Log> {
        // not sure why the regular method doesnt work
        // possible sql injection vulnerability?
        sqlx::query_as::<_, RawLog>(&format!("
        select *
        from plutus.log
        where
            (origin::jsonb ->> 'AutoTransfer' = '{account}') or
            (origin::jsonb ->> 'User' = '{account}') or
            (origin::jsonb ->> 'Bank' = '{account}') or

            (destination::jsonb ->> 'AutoTransfer' = '{account}') or
            (destination::jsonb ->> 'User' = '{account}') or
            (destination::jsonb ->> 'Bank' = '{account}')
            
            order by timestamp desc limit $1;
        ").to_string())
            .bind(amount)
            .fetch_all(db)
            .await.unwrap()
            .iter().map(|x| RawLog::into(x.clone()))
            .collect::<Vec<Log>>()
    }
}

#[derive(Serialize, Deserialize)]
pub enum LogSpecies {
    Incoming,
    Outgoing
}

#[derive(Serialize, Deserialize)]
pub enum Source {
    Bank,
    User(i64), // from
    AutoTransfer(i64), // from (account_id)
}


pub async fn fetch(
    State(app_state): State<AppState>,
    Query(query): Query<HashMap<String, String>>,
    WithRejection(Json(session_id), _): WithRejection<Json<RawSessionID>, ExtractorError>
) -> impl IntoResponse {
    utils::request_boiler(app_state, query, session_id, vec![
        ("account", PlutusFormat::BigNumber),
        ("amount", PlutusFormat::Number)
    ], |db, s, q| async move {
        let id = utils::from_query("account", &q).parse::<i64>().unwrap();

        let amount = utils::from_query("amount", &q).parse::<i32>().unwrap().min(100);

        if !Account::is_owner(&db, id, s.user).await {
            return Outcome::Account(AccountError::NoExist);
        }

        Outcome::Data(
            serde_json::to_string(&Log::fetch(&db, id, amount).await).unwrap()
        )
    }).await
}
