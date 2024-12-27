use std::{collections::HashMap, future::Future, time::{SystemTime, UNIX_EPOCH}};

use axum::response::IntoResponse;
use sqlx::{Pool, Postgres};

use crate::{plutus_error::{self, PlutusError, PlutusFormat}, session::{RawSessionID, Session}, AppState};

pub fn get_time() -> i64 {
    // epoch unix, in seconds
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("time went backwards (???)")
        .as_secs() as i64
}

pub fn from_query(k: &str, q: &HashMap<String, String>) -> String {
    return urlencoding::decode(q.get(&k.to_string()).unwrap().clone().as_str()).unwrap().to_string()
}

pub async fn request_boiler<F, Fut>(
    app_state: AppState,
    query: HashMap<String, String>,
    session_id: RawSessionID,

    hermes_check: Vec<(&str, PlutusFormat)>,
    
    func: F) -> impl IntoResponse
where F: Fn(Pool<Postgres>, Session, HashMap<String, String>) -> Fut, Fut: Future<Output = String>,
{
    match session_id.into_session(&app_state.db).await {
        Ok(s) => {
            match plutus_error::check(&query, hermes_check) {
                PlutusError::Success => func(app_state.db, s, query).await.into_response(),
                r => serde_json::to_string(&r).unwrap().into_response()
            }
        },
        Err(e) => serde_json::to_string(&e).unwrap().into_response()
    }
}

// returns AppState instead of just .db
pub async fn request_boiler_whole<F, Fut>(
    app_state: AppState,
    query: HashMap<String, String>,
    session_id: RawSessionID,

    hermes_check: Vec<(&str, PlutusFormat)>,
    
    func: F) -> impl IntoResponse
where F: Fn(AppState, Session, HashMap<String, String>) -> Fut, Fut: Future<Output = String>,
{
    match session_id.into_session(&app_state.db).await {
        Ok(s) => {
            match plutus_error::check(&query, hermes_check) {
                PlutusError::Success => func(app_state, s, query).await.into_response(),
                r => serde_json::to_string(&r).unwrap().into_response()
            }
        },
        Err(e) => serde_json::to_string(&e).unwrap().into_response()
    }
}

// #region random
pub fn async_rng_range(start: f64, end: f64) -> f64 {
    start + (rand::random::<f64>() * (end - start))
}

pub fn async_rng_range_int(start: i32, end: i32) -> i32 {
    // start + (rand::random::<f64>() * (end - start))
    start + async_rng_int(end - start)
}

pub fn async_rng_bool(i: f64) -> bool {
    rand::random::<f64>() > i
}

pub fn async_rng_float(end: impl Into<f64>) -> f64 {
    rand::random::<f64>() * end.into()
}

pub fn async_rng_int(end: impl Into<i32>) -> i32 {
    (rand::random::<f64>() * (end.into() + 1) as f64) as i32
}

pub fn async_rng_int_large(end: impl Into<i64>) -> i64 {
    (rand::random::<f64>() * (end.into() + 1) as f64) as i64
}

pub fn async_rng_index<T>(inv: &Vec<T>) -> usize {
    async_rng_int(inv.len() as i32 - 1) as usize
}

pub fn async_rng_item<T>(inv: &Vec<T>) -> &T {
    &inv[async_rng_index(inv)]
}
// #endregion
