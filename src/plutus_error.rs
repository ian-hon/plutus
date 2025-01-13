use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub enum PlutusError {
    Success,

    // expected "username" to be in query args
    InvalidArguments,

    // expected "name" not to have any special characters
    InvalidFormat, 
}

pub enum PlutusFormat {
    Unspecified, // anything goes

    Float, // f64

    Number,     // i32; only numbers 0-9
    BigNumber,  // i64; only numbers 0-9
    // Hex,        // i64; only alphanumerics
    Key,        // all lowercase, no spaces or special characters

    FlexibleKey,    // non case-sensitive, no special characters or spaces
}

pub fn check(c: &HashMap<String, String>, t: Vec<(&str, PlutusFormat)>) -> PlutusError {
    let t = t.into_iter().map(|x| (x.0.to_string(), x.1)).collect::<Vec<(String, PlutusFormat)>>();
    for i in t {
        match c.get(&i.0) {
            Some(v) => {
                match i.1 {
                    PlutusFormat::Float => {
                        if v.parse::<f64>().is_err() {
                            return PlutusError::InvalidFormat;
                        }
                    },
                    PlutusFormat::Number => {
                        if v.parse::<i32>().is_err() {
                            return PlutusError::InvalidFormat;
                        }
                    },
                    PlutusFormat::BigNumber => {
                        if v.parse::<i64>().is_err() {
                            return PlutusError::InvalidFormat;
                        }
                    },
                    PlutusFormat::Key => {
                        // "a-z, 0-9, _"
                        if !v.bytes().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || (b == b'_')) {
                            return PlutusError::InvalidFormat;
                        }
                    }
                    _ => {}
                }
            },
            None => {
                return PlutusError::InvalidArguments;
            }
        }
    }

    PlutusError::Success
}
