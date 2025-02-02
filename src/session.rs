use rand::Rng;
use serde::{Deserialize, Serialize};
use sqlx::{prelude::FromRow, Pool, Postgres, Row};

use crate::utils;

const SESSION_LENGTH: u32 = 5 * 3 * 4; // fffff-fffff-fffff
const SESSION_EXPIRY: i64 = 3600 * 24; // 24 hours after no activity

#[derive(FromRow, Clone)]
pub struct Session {
    pub id: i64,
    pub user: String,
    pub last_used: i64
}
impl Session {
    // fetch ONLY
    pub async fn fetch_by_username(db: &Pool<Postgres>, user: String, only_alive: bool) -> Option<Session> {
        // only alive -> non-expired ids
        let r = sqlx::query_as::<_, Session>("select * from plutus.session where plutus.session.user = $1 and plutus.session.last_used > $2;")
            .bind(user)
            .bind(if only_alive { utils::get_time() - SESSION_EXPIRY } else { 0 }) // sometimes i wish this was python
            .fetch_optional(db)
            .await.unwrap();

        if r.is_some() {
            r.as_ref().unwrap().refresh_last_used(db).await;
        }

        r
    }

    // fetch ONLY
    pub async fn fetch_by_id(db: &Pool<Postgres>, id: i64, only_alive: bool) -> Option<Session> {
        let r = sqlx::query_as::<_, Session>("select * from plutus.session where plutus.session.id = $1 and plutus.session.last_used > $2;")
            .bind(id)
            .bind(if only_alive { utils::get_time() - SESSION_EXPIRY } else { 0 })
            .fetch_optional(db)
            .await.unwrap();

        if r.is_some() {
            r.as_ref().unwrap().refresh_last_used(db).await;
        }

        r
    }

    async fn refresh_last_used(&self, db: &Pool<Postgres>) {
        sqlx::query("update plutus.session set last_used = $1 where id = $2;")
            .bind(utils::get_time())
            .bind(self.id)
            .execute(db)
            .await.unwrap();
    }

    // generated when needed
    pub async fn get_session_id(db: &Pool<Postgres>, user: String) -> String {
        // used ONLY when login or signup
        match Session::fetch_by_username(db, user.clone(), true).await {
            Some(s) => format!("{:x}", s.id),
            None => {
                let id = generate_id(db).await;
                Session::insert_new(id, user, db).await;
                format!("{:x}", id)
            }
        }
    }

    // insert into db
    pub async fn insert_new(id: i64, user: String, db: &Pool<Postgres>) {
        sqlx::query("insert into plutus.session values($1, $2, $3);")
            .bind(id)
            .bind(user)
            .bind(utils::get_time())
            .execute(db)
            .await.unwrap();
    }
}

#[derive(Serialize, Deserialize)]
pub struct RawSessionID { // used ONLY for the json payload
    pub id: String,
}
impl RawSessionID {
    pub fn to_int(self) -> Result<i64, SessionError> {
        match i64::from_str_radix(&self.id.replace("-", ""), 16) {
            Ok(i) => Ok(i),
            Err(_) => Err(SessionError::SessionIDInvalid)
        }
    }

    pub async fn into_session(self, db: &Pool<Postgres>) -> Result<Session, SessionError> {
        match self.to_int() {
            Ok(i) => {
                match Session::fetch_by_id(db, i, true).await {
                    Some(s) => Ok(s), // exist, not expired
                    None => match Session::fetch_by_id(db, i, false).await {
                        Some(_) => Err(SessionError::SessionIDExpired), // exists, but expired
                        None => Err(SessionError::SessionIDNoExist) // doesnt exist
                    }
                }
            }
            Err(e) => Err(e)
        }
    }
}

#[derive(Serialize, Deserialize, PartialEq, Eq)]
pub enum SessionError {
    SessionIDNoExist,
    SessionIDExpired,
    SessionIDInvalid
}

async fn generate_id(db: &Pool<Postgres>) -> i64 {
    // cannot just bitshift, can be reversible
    /*
    or can you?
    let i = last row id

    let a = ENV_1 << i;
    let b = a << ENV_2;
    let c = ENV3 >> b;

    possible?
    */
    let ids = sqlx::query("select id from plutus.session;")
        .fetch_all(db).await.unwrap().into_iter().map(|x| x.get(0)).collect::<Vec<i64>>();

    let mut rng = rand::thread_rng();
    loop { // lets see how long it takes an inf loop to bite my back in the ass
        let candidate = rng.gen_range(0..=(2i64.pow(SESSION_LENGTH)));

        if ids.contains(&candidate) {
            continue;
        }

        return candidate;
    }
}
