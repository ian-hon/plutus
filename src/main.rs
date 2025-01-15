use std::{env, net::SocketAddr, time::Duration};

use axum::{extract::{FromRef, State}, http::StatusCode, response::{IntoResponse, Response}, routing::{get, post}, Router};
use dotenv::dotenv;
use tower_http::cors::{Any, CorsLayer};
use sqlx::{postgres::{PgPoolOptions, PgRow}, PgPool, Pool, Postgres, Row};

mod plutus_error;
mod utils;
mod session;
mod extractor_error;

mod user;
mod account;
mod limit;
mod transfer;

pub async fn not_implemented_yet() -> Response {
    (StatusCode::NOT_IMPLEMENTED, "not implemented yet chill".to_string()).into_response()
}

#[derive(Clone, FromRef)]
pub struct AppState {
    pub db: Pool<Postgres>
}

pub async fn increment_tasks(db: &Pool<Postgres>) {
    let mut interval = tokio::time::interval(Duration::from_secs(60 * 20)); // 20 min interval
    loop {
        interval.tick().await;

        let today = utils::get_epoch_day();

        let last_incremented = sqlx::query("select coalesce(max(last_incremented), 0) from plutus.scheduling;")
            .fetch_one(db)
            .await.unwrap().get::<i64, usize>(0);

        if today != last_incremented {
            sqlx::query("insert into plutus.scheduling(last_incremented) values($1);")
                .bind(today)
                .execute(db)
                .await.unwrap();

            limit::Limit::increment_limits(db).await;
            transfer::Transfer::increment_transfers(db).await;
        }

        // wait every 20 mins
        // after waiting, check if last_incremented (in epoch day) is different that today's epoch day
        // (subject to timezones?)
        // if different, run tasks & update last_incremented
    }
}

#[tokio::main]
async fn main() {
    dotenv().ok();

    let app_state = AppState {
        db: PgPool::connect(env::var("PG_ADDRESS").unwrap().to_string().replace("[YOUR-PASSWORD]", env::var("PG_PASSWORD").unwrap().as_str()).to_string().as_str()).await.unwrap()
    };

    let db_clone = app_state.db.clone();
    tokio::spawn(async move {
        increment_tasks(&db_clone).await;
    });

    let app = Router::new()
        .route("/", get(|| async { "plutus at your service" }))
        .route("/user/login", post(user::login))
        .route("/user/signup", post(user::signup))

        .route("/account/create", post(account::create))
        .route("/account/edit", post(account::edit))
        .route("/account/delete", post(account::delete))
        .route("/account/fetch", post(account::fetch))
        .route("/account/fetch/all", post(account::fetch_all))

        .route("/limit/create", post(limit::create))
        .route("/limit/fetch", post(limit::fetch))
        .route("/limit/delete", post(limit::delete))
        .route("/limit/edit", post(limit::edit))

        .route("/transfer/create", post(transfer::create))
        .route("/transfer/edit", post(transfer::edit))
        .route("/transfer/fetch/incoming", post(transfer::fetch_incoming))
        .route("/transfer/fetch/outgoing", post(transfer::fetch_outgoing))
        .route("/transfer/delete", post(transfer::delete))

        .layer(
            CorsLayer::new()
                .allow_methods(Any)
                .allow_origin(Any)
                .allow_headers(Any)
        )

        .with_state(app_state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8511").await.unwrap();
    axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>()).await.unwrap();
}
