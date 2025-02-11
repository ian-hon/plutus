use axum::{extract::State, response::IntoResponse, Json};
use axum_extra::extract::WithRejection;
use serde::{Deserialize, Serialize};
use sha256::digest;
use sqlx::{prelude::FromRow, Pool, Postgres, Row};
use strum_macros::Display;

use crate::{account::Account, extractor_error::ExtractorError, session};

#[derive(Serialize, Deserialize, FromRow, Debug)]
pub struct RawUser {
    username: String,
    password: String,
}

#[derive(Serialize, Deserialize, FromRow)]
pub struct User {
    pub username: String,
    password: String,
    pub default_account: i64
}
impl User {
    pub async fn fetch(db: &Pool<Postgres>, username: &String) -> Option<User> {
        sqlx::query_as::<_, User>("select * from plutus.user where plutus.user.username = $1;")
            .bind(username)
            .fetch_optional(db)
            .await
            .unwrap()
    }

    pub async fn login(db: &Pool<Postgres>, username: String, password: String) -> UserError {
        if !User::username_existance(db, &username).await {
            return UserError::UsernameNoExist;
        }

        if sqlx::query("select count(*) from plutus.user where plutus.user.username = $1 and plutus.user.password = $2;")
            .bind(username.clone())
            .bind(digest(password))
            .fetch_one(db)
            .await
            .unwrap().get::<i64, usize>(0) < 1 {
            return UserError::PasswordWrong
        }

        UserError::Success(session::Session::get_session_id(db, username).await)
    }

    pub async fn username_existance(db: &Pool<Postgres>, username: &String) -> bool {
        sqlx::query("select count(*) from plutus.user where plutus.user.username = $1;")
            .bind(username.clone())
            .fetch_one(db)
            .await
            .unwrap().get::<i64, usize>(0) >= 1
    }

    pub async fn signup(db: &Pool<Postgres>, username: String, password: String) -> UserError {
        if User::username_existance(db, &username).await {
            return UserError::UsernameExist;
        }

        let a = Account::create(db, "savings".to_string(), username.to_string()).await;

        sqlx::query("insert into plutus.user(username, password, default_account) values($1, $2, $3);")
            .bind(username.clone())
            .bind(digest(password))
            .bind(a.id)
            .execute(db)
            .await.unwrap();

        UserError::Success(session::Session::get_session_id(db, username).await)
    }
}

#[derive(Display, Serialize, Deserialize, PartialEq, Eq)]
pub enum UserError {
    Success(String),

    // login
    PasswordWrong,
    UsernameNoExist,

    // signup
    UsernameExist
}

pub async fn login(
    State(db): State<Pool<Postgres>>,
    WithRejection(Json(user_info), _): WithRejection<Json<RawUser>, ExtractorError>
) -> impl IntoResponse {
    // Success(string)
    // PasswordWrong
    // UsernameNoExist
    
    // extractor errors
    
    serde_json::to_string(&User::login(&db, user_info.username, user_info.password).await).unwrap()
}

pub async fn signup(
    State(db): State<Pool<Postgres>>,
    WithRejection(Json(user_info), _): WithRejection<Json<RawUser>,
    ExtractorError>
) -> impl IntoResponse {
    // Success(String)
    // UsernameExist

    // extractor errors

    // TODO: input sanitization for this
    serde_json::to_string(&User::signup(&db, user_info.username, user_info.password).await).unwrap()
}
