use std::collections::HashMap;

use axum::{extract::{Query, State}, response::IntoResponse, Json};
use axum_extra::extract::WithRejection;
use serde::{Deserialize, Serialize};
use sqlx::{prelude::FromRow, Pool, Postgres};

use crate::{account::{Account, AccountError}, extractor_error::ExtractorError, plutus_error::{Outcome, PlutusFormat}, session::RawSessionID, utils, AppState};

#[derive(FromRow, Serialize, Deserialize, Clone)]
pub struct RawLog {
    pub id: i64,
    pub species: String,
    pub origin: String,
    pub destination: String,
    pub state: String,
    pub timestamp: f64
}
impl Into<Log> for RawLog {
    fn into(self) -> Log {
        Log {
            id: self.id,
            species: serde_json::from_str(&self.species).unwrap(),
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
    pub species: LogSpecies, // whether is outgoing/incoming
    pub origin: Source, // from who
    pub destination: Source, // to who
    pub state: Outcome, // whether successful or not
    pub timestamp: f64
}
impl Log {
    pub async fn append(db: &Pool<Postgres>, species: LogSpecies, origin: Source, destination: Source, state: Outcome) {
        sqlx::query("insert into plutus.log(species, origin, destination, state, timestamp) values($1, $2, $3, $4, $5);")
            .bind(serde_json::to_string(&species).unwrap())
            .bind(serde_json::to_string(&origin).unwrap())
            .bind(serde_json::to_string(&destination).unwrap())
            .bind(serde_json::to_string(&state).unwrap())
            .bind(utils::get_time())
            .execute(db)
            .await.unwrap();
    }

    pub async fn fetch(db: &Pool<Postgres>, account: i64) -> Vec<Log> {
        sqlx::query_as::<_, RawLog>("select * from plutus.log where origin = $1;")
            .bind(account)
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
    AutoTransfer(i64), // from
}


pub async fn fetch(
    State(app_state): State<AppState>,
    Query(query): Query<HashMap<String, String>>,
    WithRejection(Json(session_id), _): WithRejection<Json<RawSessionID>, ExtractorError>
) -> impl IntoResponse {
    utils::request_boiler(app_state, query, session_id, vec![
        ("account", PlutusFormat::BigNumber)
    ], |db, s, q| async move {
        let id = utils::from_query("account", &q).parse::<i64>().unwrap();

        if !Account::is_owner(&db, id, s.user).await {
            return Outcome::Account(AccountError::NoExist);
        }

        Outcome::Data(
            serde_json::to_string(&Log::fetch(&db, id).await).unwrap()
        )
    }).await
}
