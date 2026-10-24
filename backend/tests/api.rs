use std::sync::Arc;

use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use lomalista::api::{AppState, router};
use lomalista::store::Store;
use serde_json::{Value, json};
use tower::ServiceExt;

fn app() -> (axum::Router, Arc<AppState>) {
    let mut st = AppState::new(Store::open_in_memory().unwrap());
    st.today = || "2027-03-01".parse().unwrap();
    let st = Arc::new(st);
    (router(st.clone(), None), st)
}

async fn call(app: &axum::Router, method: &str, uri: &str, body: Option<Value>) -> (StatusCode, Value) {
    let mut req = Request::builder().method(method).uri(uri);
    let body = match body {
        Some(b) => {
            req = req.header("content-type", "application/json");
            Body::from(b.to_string())
        }
        None => Body::empty(),
    };
    let res = app.clone().oneshot(req.body(body).unwrap()).await.unwrap();
    let status = res.status();
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    (status, serde_json::from_slice(&bytes).unwrap_or(Value::Null))
}

async fn new_doc(app: &axum::Router) -> String {
    let (s, v) = call(app, "POST", "/api/docs", None).await;
    assert_eq!(s, StatusCode::OK);
    v["id"].as_str().unwrap().to_string()
}

#[tokio::test]
async fn full_flow() {
    let (app, _) = app();
    let id = new_doc(&app).await;

    let (s, p) = call(&app, "POST", &format!("/api/docs/{id}/people"), Some(json!({"name":"Jørgen"}))).await;
    assert_eq!(s, StatusCode::OK);
    let pid = p["id"].as_i64().unwrap();

    let (s, _) = call(&app, "POST", &format!("/api/docs/{id}/people/{pid}/vacations"),
        Some(json!({"start":"2027-07-01","end":"2027-07-14"}))).await;
    assert_eq!(s, StatusCode::OK);

    let (s, d) = call(&app, "GET", &format!("/api/docs/{id}"), None).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(d["people"][0]["name"], "Jørgen");
    assert_eq!(d["people"][0]["vacations"][0]["start"], "2027-07-01");
    assert_eq!(d["archived"], false);

    let (s, _) = call(&app, "DELETE", &format!("/api/docs/{id}/people/{pid}"), None).await;
    assert_eq!(s, StatusCode::NO_CONTENT);
}

#[tokio::test]
async fn rejects_bad_input() {
    let (app, _) = app();
    let id = new_doc(&app).await;
    for name in ["Bob1", "abcdefghijklmnop", "", "😀"] {
        let (s, v) = call(&app, "POST", &format!("/api/docs/{id}/people"), Some(json!({"name":name}))).await;
        assert_eq!(s, StatusCode::UNPROCESSABLE_ENTITY, "{name}");
        assert!(v["error"].is_string());
    }
    let (_, p) = call(&app, "POST", &format!("/api/docs/{id}/people"), Some(json!({"name":"Anna"}))).await;
    let pid = p["id"].as_i64().unwrap();
    for (start, end, code) in [
        ("2027-02-01", "2027-02-28", "range_in_past"),
        ("2028-09-02", "2028-09-05", "range_too_far"),
        ("2027-07-02", "2027-07-01", "range_order"),
    ] {
        let (s, v) = call(&app, "POST", &format!("/api/docs/{id}/people/{pid}/vacations"),
            Some(json!({"start":start,"end":end}))).await;
        assert_eq!((s, v["error"].as_str()), (StatusCode::UNPROCESSABLE_ENTITY, Some(code)), "{start}");
    }
    let (s, _) = call(&app, "GET", "/api/docs/nonsense", None).await;
    assert_eq!(s, StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn archived_is_read_only() {
    let (app, st) = app();
    let id = new_doc(&app).await;
    st.store.run_archiver("2028-03-01".parse().unwrap(), 365).unwrap();
    let (s, v) = call(&app, "POST", &format!("/api/docs/{id}/people"), Some(json!({"name":"Anna"}))).await;
    assert_eq!(s, StatusCode::CONFLICT);
    assert_eq!(v["error"], "archived");
    let (s, d) = call(&app, "GET", &format!("/api/docs/{id}"), None).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(d["archived"], true);
}

#[tokio::test]
async fn security_headers_present() {
    let (app, _) = app();
    let res = app.clone().oneshot(Request::get("/robots.txt").body(Body::empty()).unwrap()).await.unwrap();
    assert_eq!(res.headers()["referrer-policy"], "no-referrer");
    assert!(res.headers().contains_key("content-security-policy"));
}
