use std::sync::Arc;
use std::time::Duration;

use chrono::Utc;
use lomalista::api::{AppState, router};
use lomalista::store::Store;

fn env_or(name: &str, default: &str) -> String {
    std::env::var(name).unwrap_or_else(|_| default.to_string())
}

#[tokio::main]
async fn main() {
    let db = env_or("LOMALISTA_DB", "lomalista.sqlite");
    let bind = env_or("LOMALISTA_BIND", "127.0.0.1:3000");
    let static_dir = std::env::var("LOMALISTA_STATIC_DIR").ok();
    let retention: i64 = env_or("LOMALISTA_RETENTION_DAYS", "365")
        .parse()
        .expect("LOMALISTA_RETENTION_DAYS must be an integer");

    let state = Arc::new(AppState::new(Store::open(&db).expect("cannot open database")));

    let archiver_state = state.clone();
    tokio::spawn(async move {
        let mut tick = tokio::time::interval(Duration::from_secs(3600));
        loop {
            tick.tick().await;
            let s = archiver_state.clone();
            let today = Utc::now().date_naive();
            match tokio::task::spawn_blocking(move || s.store.run_archiver(today, retention)).await {
                Ok(Ok((a, d))) if a + d > 0 => eprintln!("archiver: archived {a}, deleted {d}"),
                Ok(Err(e)) => eprintln!("archiver failed: {e:?}"),
                _ => {}
            }
        }
    });

    let app = router(state, static_dir.as_deref());
    let listener = tokio::net::TcpListener::bind(&bind).await.expect("cannot bind");
    eprintln!("lomalista listening on {bind}");
    axum::serve(listener, app).await.unwrap();
}
