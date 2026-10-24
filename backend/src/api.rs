use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use axum::extract::{Path, State};
use axum::http::{HeaderName, HeaderValue, StatusCode, header};
use axum::response::{IntoResponse, Response};
use axum::routing::{delete, get, post};
use axum::{Json, Router};
use chrono::{NaiveDate, Utc};
use serde::Deserialize;
use serde_json::json;
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::services::{ServeDir, ServeFile};
use tower_http::set_header::SetResponseHeaderLayer;

use crate::store::{Store, StoreError};

/// Documents can be created at most this many times per hour, service-wide. There is no
/// authentication, so this is the only brake on someone filling the database.
const MAX_CREATES_PER_HOUR: usize = 120;

pub struct AppState {
    pub store: Store,
    creations: Mutex<Vec<Instant>>,
    pub today: fn() -> NaiveDate,
}

impl AppState {
    pub fn new(store: Store) -> Self {
        AppState { store, creations: Mutex::new(Vec::new()), today: || Utc::now().date_naive() }
    }

    fn allow_creation(&self) -> bool {
        let mut v = self.creations.lock().unwrap_or_else(|p| p.into_inner());
        let hour = Duration::from_secs(3600);
        v.retain(|t| t.elapsed() < hour);
        if v.len() >= MAX_CREATES_PER_HOUR {
            return false;
        }
        v.push(Instant::now());
        true
    }
}

type Shared = Arc<AppState>;

struct ApiError(StatusCode, &'static str);

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.0, Json(json!({ "error": self.1 }))).into_response()
    }
}

impl From<StoreError> for ApiError {
    fn from(e: StoreError) -> Self {
        match e {
            StoreError::NotFound => ApiError(StatusCode::NOT_FOUND, "not_found"),
            StoreError::Archived => ApiError(StatusCode::CONFLICT, "archived"),
            StoreError::Invalid(v) => ApiError(StatusCode::UNPROCESSABLE_ENTITY, v.code()),
            StoreError::Db(_) => ApiError(StatusCode::INTERNAL_SERVER_ERROR, "internal"),
        }
    }
}

type ApiResult<T> = Result<Json<T>, ApiError>;

#[derive(Deserialize)]
struct NewPerson {
    name: String,
}

#[derive(Deserialize)]
struct NewVacation {
    start: NaiveDate,
    end: NaiveDate,
}

async fn create_doc(State(s): State<Shared>) -> ApiResult<serde_json::Value> {
    if !s.allow_creation() {
        return Err(ApiError(StatusCode::TOO_MANY_REQUESTS, "rate_limited"));
    }
    let id = s.store.create_document((s.today)())?;
    Ok(Json(json!({ "id": id })))
}

async fn get_doc(State(s): State<Shared>, Path(id): Path<String>) -> ApiResult<crate::store::Document> {
    Ok(Json(s.store.get_document(&id)?))
}

async fn add_person(
    State(s): State<Shared>,
    Path(id): Path<String>,
    Json(b): Json<NewPerson>,
) -> ApiResult<crate::store::Person> {
    Ok(Json(s.store.add_person(&id, &b.name)?))
}

async fn delete_person(
    State(s): State<Shared>,
    Path((id, pid)): Path<(String, i64)>,
) -> Result<StatusCode, ApiError> {
    s.store.delete_person(&id, pid)?;
    Ok(StatusCode::NO_CONTENT)
}

async fn add_vacation(
    State(s): State<Shared>,
    Path((id, pid)): Path<(String, i64)>,
    Json(b): Json<NewVacation>,
) -> ApiResult<crate::store::Vacation> {
    Ok(Json(s.store.add_vacation(&id, pid, b.start, b.end, (s.today)())?))
}

async fn delete_vacation(
    State(s): State<Shared>,
    Path((id, pid, vid)): Path<(String, i64, i64)>,
) -> Result<StatusCode, ApiError> {
    s.store.delete_vacation(&id, pid, vid)?;
    Ok(StatusCode::NO_CONTENT)
}

fn header_layer(name: &'static str, value: &'static str) -> SetResponseHeaderLayer<HeaderValue> {
    SetResponseHeaderLayer::overriding(HeaderName::from_static(name), HeaderValue::from_static(value))
}

/// Builds the full app. When `static_dir` is given, serves the built frontend with SPA fallback.
pub fn router(state: Shared, static_dir: Option<&str>) -> Router {
    let api = Router::new()
        .route("/docs", post(create_doc))
        .route("/docs/{id}", get(get_doc))
        .route("/docs/{id}/people", post(add_person))
        .route("/docs/{id}/people/{pid}", delete(delete_person))
        .route("/docs/{id}/people/{pid}/vacations", post(add_vacation))
        .route("/docs/{id}/people/{pid}/vacations/{vid}", delete(delete_vacation))
        .layer(SetResponseHeaderLayer::overriding(
            header::CACHE_CONTROL,
            HeaderValue::from_static("no-store"),
        ))
        .with_state(state);

    let mut app = Router::new()
        .nest("/api", api)
        .route("/robots.txt", get(|| async { "User-agent: *\nDisallow: /\n" }));
    if let Some(dir) = static_dir {
        let index = ServeFile::new(format!("{dir}/index.html"));
        app = app.fallback_service(ServeDir::new(dir).fallback(index));
    }
    app.layer(RequestBodyLimitLayer::new(4096))
        .layer(header_layer("referrer-policy", "no-referrer"))
        .layer(header_layer("x-content-type-options", "nosniff"))
        .layer(header_layer("x-robots-tag", "noindex, nofollow"))
        .layer(header_layer(
            "content-security-policy",
            "default-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
        ))
}
