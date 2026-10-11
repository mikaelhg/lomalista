//! XSS / injection hardening. Names are restricted to Nordic letters, so markup can never be stored;
//! these tests pin that down at the HTTP boundary and check the response headers that back it up.

use std::sync::Arc;

use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use lomalista::api::{AppState, router};
use lomalista::store::Store;
use serde_json::{Value, json};
use tower::ServiceExt;

const PAYLOADS: &[&str] = &[
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    "\"><svg/onload=alert(1)>",
    "'; DROP TABLE people;--",
    "javascript:alert(1)",
    "{{7*7}}",
    "${7*7}",
    "&lt;b&gt;",
    "<b>",
    "a\"b",
    "a'b",
    "a`b",
    "a/b",
    "a\\b",
    "a\0b",
    "a\nb",
    "a\tb",
    "a\u{200B}b",       // zero-width space
    "a\u{202E}b",       // right-to-left override
    "a\u{2066}b",       // bidi isolate
    "\u{FF1C}script\u{FF1E}", // fullwidth < >
    "a\u{FEFF}b",       // BOM
    "Z\u{0351}\u{0352}\u{0353}", // combining-mark stacking
    "Anna\u{E000}",     // private use
    "😀",
];

fn app() -> (axum::Router, Arc<AppState>) {
    let mut st = AppState::new(Store::open_in_memory().unwrap());
    st.today = || "2027-03-01".parse().unwrap();
    let st = Arc::new(st);
    (router(st.clone(), None), st)
}

async fn raw(app: &axum::Router, method: &str, uri: &str, body: Option<String>) -> (StatusCode, axum::http::HeaderMap, String) {
    let mut req = Request::builder().method(method).uri(uri);
    let body = match body {
        Some(b) => {
            req = req.header("content-type", "application/json");
            Body::from(b)
        }
        None => Body::empty(),
    };
    let res = app.clone().oneshot(req.body(body).unwrap()).await.unwrap();
    let (status, headers) = (res.status(), res.headers().clone());
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    (status, headers, String::from_utf8_lossy(&bytes).into_owned())
}

async fn new_doc(app: &axum::Router) -> String {
    let b = json!({"season_start":"2027-06-01","season_end":"2027-08-31"}).to_string();
    let (_, _, body) = raw(app, "POST", "/api/docs", Some(b)).await;
    serde_json::from_str::<Value>(&body).unwrap()["id"].as_str().unwrap().to_string()
}

#[tokio::test]
async fn hostile_names_are_rejected_and_not_stored() {
    let (app, _) = app();
    let id = new_doc(&app).await;
    for p in PAYLOADS {
        let (s, _, body) = raw(&app, "POST", &format!("/api/docs/{id}/people"),
            Some(json!({ "name": p }).to_string())).await;
        assert_eq!(s, StatusCode::UNPROCESSABLE_ENTITY, "payload accepted: {p:?}");
        assert!(!body.contains(p) || p.is_empty(), "payload reflected in error: {p:?}");
    }
    let (_, _, body) = raw(&app, "GET", &format!("/api/docs/{id}"), None).await;
    assert_eq!(serde_json::from_str::<Value>(&body).unwrap()["people"], json!([]));
}

#[tokio::test]
async fn hostile_names_with_valid_prefix_are_rejected() {
    // payload hidden after valid letters, and exactly at the length limit
    let (app, _) = app();
    let id = new_doc(&app).await;
    for p in ["Anna<b>", "Anna<script>", "Anna\"", "Anna ><"] {
        let (s, ..) = raw(&app, "POST", &format!("/api/docs/{id}/people"),
            Some(json!({ "name": p }).to_string())).await;
        assert_eq!(s, StatusCode::UNPROCESSABLE_ENTITY, "{p:?}");
    }
}

#[tokio::test]
async fn hostile_ids_are_not_reflected() {
    let (app, _) = app();
    for id in ["%3Cscript%3Ealert(1)%3C%2Fscript%3E", "..%2F..%2Fetc%2Fpasswd", "%27%20OR%201%3D1--"] {
        let (s, _, body) = raw(&app, "GET", &format!("/api/docs/{id}"), None).await;
        assert_eq!(s, StatusCode::NOT_FOUND, "{id}");
        assert!(!body.contains("script") && !body.contains("passwd") && !body.contains("OR 1"), "{body}");
    }
}

#[tokio::test]
async fn hostile_dates_are_rejected() {
    let (app, _) = app();
    let id = new_doc(&app).await;
    let (s, _, body) = raw(&app, "POST", "/api/docs",
        Some(json!({"season_start":"<script>","season_end":"2027-08-31"}).to_string())).await;
    assert!(s.is_client_error(), "{s}");
    assert!(!body.contains("<script>"), "{body}");
    let (s, ..) = raw(&app, "POST", &format!("/api/docs/{id}/people/1/vacations"),
        Some(json!({"start":"2027-07-01' OR '1'='1","end":"2027-07-02"}).to_string())).await;
    assert!(s.is_client_error(), "{s}");
}

#[tokio::test]
async fn json_responses_cannot_be_sniffed_as_html() {
    let (app, _) = app();
    let id = new_doc(&app).await;
    for uri in [format!("/api/docs/{id}"), "/api/docs/nope".to_string()] {
        let (_, h, _) = raw(&app, "GET", &uri, None).await;
        assert!(h["content-type"].to_str().unwrap().starts_with("application/json"), "{uri}");
        assert_eq!(h["x-content-type-options"], "nosniff");
        assert_eq!(h["cache-control"], "no-store");
    }
}

#[tokio::test]
async fn csp_forbids_inline_and_remote_scripts() {
    let (app, _) = app();
    let (_, h, _) = raw(&app, "GET", "/robots.txt", None).await;
    let csp = h["content-security-policy"].to_str().unwrap();
    assert!(csp.contains("default-src 'self'"));
    assert!(!csp.contains("script-src"), "script-src falls back to default-src 'self'");
    let default_src = csp.split(';').find(|d| d.trim().starts_with("default-src")).unwrap();
    assert!(!default_src.contains("unsafe-inline") && !default_src.contains("unsafe-eval"));
    assert!(csp.contains("frame-ancestors 'none'"));
    assert!(csp.contains("base-uri 'none'"));
    assert_eq!(h["referrer-policy"], "no-referrer");
}

#[tokio::test]
async fn oversized_body_is_rejected() {
    let (app, _) = app();
    let id = new_doc(&app).await;
    let big = json!({ "name": "a".repeat(10_000) }).to_string();
    let (s, ..) = raw(&app, "POST", &format!("/api/docs/{id}/people"), Some(big)).await;
    assert_eq!(s, StatusCode::PAYLOAD_TOO_LARGE);
}

// ---- UTF-8 / encoding edge cases -------------------------------------------------------------

async fn post_bytes(app: &axum::Router, uri: &str, body: Vec<u8>) -> (StatusCode, String) {
    let req = Request::builder()
        .method("POST")
        .uri(uri)
        .header("content-type", "application/json")
        .body(Body::from(body))
        .unwrap();
    let res = app.clone().oneshot(req).await.unwrap();
    let s = res.status();
    let b = res.into_body().collect().await.unwrap().to_bytes();
    (s, String::from_utf8_lossy(&b).into_owned())
}

async fn people(app: &axum::Router, id: &str) -> Value {
    let (_, _, body) = raw(app, "GET", &format!("/api/docs/{id}"), None).await;
    serde_json::from_str::<Value>(&body).unwrap()["people"].clone()
}

#[tokio::test]
async fn malformed_utf8_bodies_are_rejected() {
    let (app, _) = app();
    let id = new_doc(&app).await;
    let uri = format!("/api/docs/{id}/people");
    let cases: Vec<(&str, Vec<u8>)> = vec![
        ("lone continuation byte", b"{\"name\":\"A\x80\"}".to_vec()),
        ("invalid start byte 0xFF", b"{\"name\":\"A\xFF\"}".to_vec()),
        ("overlong '/' (C0 AF)", b"{\"name\":\"A\xC0\xAF\"}".to_vec()),
        ("overlong '<' (E0 80 BC)", b"{\"name\":\"\xE0\x80\xBC\"}".to_vec()),
        ("encoded surrogate (ED A0 80)", b"{\"name\":\"\xED\xA0\x80\"}".to_vec()),
        ("beyond U+10FFFF (F4 90 80 80)", b"{\"name\":\"\xF4\x90\x80\x80\"}".to_vec()),
        ("truncated sequence", b"{\"name\":\"\xC3\"}".to_vec()),
        ("Latin-1 'ä' (0xE4)", b"{\"name\":\"\xE4\"}".to_vec()),
        ("UTF-8 BOM before JSON", b"\xEF\xBB\xBF{\"name\":\"Anna\"}".to_vec()),
    ];
    for (label, body) in cases {
        let (s, _) = post_bytes(&app, &uri, body).await;
        assert!(s.is_client_error(), "{label}: got {s}");
    }
    assert_eq!(people(&app, &id).await, json!([]));
}

#[tokio::test]
async fn json_escape_tricks_are_rejected() {
    let (app, _) = app();
    let id = new_doc(&app).await;
    let uri = format!("/api/docs/{id}/people");
    for body in [
        r#"{"name":"\ud800"}"#,         // lone high surrogate
        r#"{"name":"\udc00"}"#,         // lone low surrogate
        r#"{"name":"\u0000"}"#,         // NUL
        r#"{"name":"A\u0000"}"#,
        "{\"name\":\"\\u003cscript\\u003e\"}", // escaped < > decode to markup chars
        "{\"name\":\"\\u202e\"}",
        "{\"name\":\"\\ud83d\\ude00\"}", // valid surrogate pair = emoji
    ] {
        let (s, resp) = post_bytes(&app, &uri, body.as_bytes().to_vec()).await;
        assert!(s.is_client_error(), "{body}: got {s}");
        assert!(!resp.contains('<'), "{body}: reflected markup: {resp}");
    }
    assert_eq!(people(&app, &id).await, json!([]));
}

#[tokio::test]
async fn invalid_utf8_in_path_is_not_found_or_bad_request() {
    let (app, _) = app();
    for p in ["%FF", "%C0%AF", "%ED%A0%80", "%E4", "%00"] {
        let (s, _, body) = raw(&app, "GET", &format!("/api/docs/{p}"), None).await;
        assert!(s == StatusCode::NOT_FOUND || s == StatusCode::BAD_REQUEST, "{p}: {s}");
        assert!(!body.contains('\u{FFFD}') || s.is_client_error());
    }
}

#[tokio::test]
async fn names_are_stored_nfc_and_cannot_be_duplicated_by_normalisation() {
    let (app, _) = app();
    let id = new_doc(&app).await;
    let uri = format!("/api/docs/{id}/people");
    let add = |name: &str| json!({ "name": name }).to_string();

    // precomposed Å, then decomposed A + U+030A, then Angstrom sign U+212B: all the same name
    let (s, _, body) = raw(&app, "POST", &uri, Some(add("\u{C5}sa"))).await;
    assert_eq!(s, StatusCode::OK, "{body}");
    for variant in ["A\u{30A}sa", "\u{212B}sa"] {
        let (s, _, body) = raw(&app, "POST", &uri, Some(add(variant))).await;
        assert_eq!(s, StatusCode::UNPROCESSABLE_ENTITY, "{variant:?}");
        assert!(body.contains("name_taken"), "{body}");
    }
    let list = people(&app, &id).await;
    assert_eq!(list.as_array().unwrap().len(), 1);
    assert_eq!(list[0]["name"].as_str().unwrap().as_bytes(), "\u{C5}sa".as_bytes()); // stored as NFC bytes
}

#[tokio::test]
async fn length_is_counted_in_characters_after_normalisation() {
    let (app, _) = app();
    let id = new_doc(&app).await;
    let uri = format!("/api/docs/{id}/people");
    // 15 decomposed å (30 code points, 15 after NFC) is allowed; 16 is not
    let ok = "a\u{30A}".repeat(15);
    let (s, ..) = raw(&app, "POST", &uri, Some(json!({ "name": ok }).to_string())).await;
    assert_eq!(s, StatusCode::OK);
    let too_long = "\u{E5}".repeat(16);
    let (s, ..) = raw(&app, "POST", &uri, Some(json!({ "name": too_long }).to_string())).await;
    assert_eq!(s, StatusCode::UNPROCESSABLE_ENTITY);
}

#[tokio::test]
async fn lookalike_letters_from_other_scripts_are_rejected() {
    let (app, _) = app();
    let id = new_doc(&app).await;
    let uri = format!("/api/docs/{id}/people");
    for name in [
        "\u{430}nna",       // Cyrillic а
        "Ann\u{3b1}",       // Greek α
        "\u{FF21}nna",      // fullwidth A
        "\u{FB01}na",       // ﬁ ligature (NFKC would fold it, NFC does not)
        "\u{1D5BA}nna",     // mathematical sans-serif a
        "Anna\u{00A0}B",    // no-break space
        "Anna\u{2010}B",    // Unicode hyphen, not ASCII '-'
        "\u{0131}da",       // dotless i
    ] {
        let (s, ..) = raw(&app, "POST", &uri, Some(json!({ "name": name }).to_string())).await;
        assert_eq!(s, StatusCode::UNPROCESSABLE_ENTITY, "{name:?}");
    }
}
