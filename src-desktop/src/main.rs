//! PICS Omni-Extractor: Desktop Ghost Daemon
//! Passively monitors encrypted messaging apps (WhatsApp, Telegram, Signal) 
//! by watching their local LevelDB / SQLite Write-Ahead Logs (WAL) for changes.

use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use reqwest::Client;
use serde::Serialize;
use std::path::{Path, PathBuf};
use std::sync::mpsc::channel;
use std::time::Duration;

const PICS_API_URL: &str = "http://127.0.0.1:54321/functions/v1/stream-processor";
const API_KEY: &str = "dummy-desktop-key";

#[derive(Serialize)]
struct PicsPayload {
    action: String,
    eventType: String,
    profileId: String,
    description: String,
    metadata: serde_json::Value,
}

#[tokio::main]
async fn main() -> notify::Result<()> {
    env_logger::init();
    println!("[PICS Desktop Ghost] Starting local DB interception...");

    // Setup an mpsc channel to receive file change events
    let (tx, rx) = channel();

    // Setup the notify watcher
    let mut watcher = RecommendedWatcher::new(tx, Config::default())?;

    // In a real app, dynamically resolve the user's AppData directories
    // Example path for WhatsApp Desktop SQLite database (UWP app)
    let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_else(|_| String::from("C:\\"));
    
    // We watch the parent directory of target databases so we catch WAL file creations/modifications
    let whatsapp_db_path = PathBuf::from(&local_app_data).join("Packages/5319275A.WhatsAppDesktop_cv1g1gvanyjgm/LocalState/chatStorage.sqlite");
    if whatsapp_db_path.parent().unwrap().exists() {
         println!("[PICS] Hooking into WhatsApp LocalState...");
         watcher.watch(whatsapp_db_path.parent().unwrap(), RecursiveMode::NonRecursive)?;
    }

    let signal_db_path = PathBuf::from(&std::env::var("APPDATA").unwrap_or_else(|_| String::from("C:\\"))).join("Signal/sql/db.sqlite");
    if signal_db_path.parent().unwrap().exists() {
        println!("[PICS] Hooking into Signal SQLite directory...");
        watcher.watch(signal_db_path.parent().unwrap(), RecursiveMode::NonRecursive)?;
    }

    let client = Client::new();

    println!("[PICS] Listening silently in the background...");

    // Event loop
    loop {
        match rx.recv_timeout(Duration::from_secs(2)) {
            Ok(Ok(event)) => {
                // If a WAL file or the DB itself was written to, a new message arrived
                let is_db_modified = event.paths.iter().any(|p| {
                    let ext = p.extension().unwrap_or_default();
                    ext == "sqlite" || ext == "wal" || ext == "db"
                });

                if is_db_modified {
                    let path = event.paths.first().unwrap();
                    println!("[PICS] Activity detected in: {:?}", path);
                    
                    // Note: Instead of doing a heavy full SELECT, we would parse the WAL delta.
                    // For this prototype, we simulate extraction.
                    
                    let target = if path.to_string_lossy().contains("WhatsApp") { "whatsapp" } else { "signal" };
                    
                    // Stream extraction to PICS
                    let payload = PicsPayload {
                        action: "emit_event".into(),
                        eventType: format!("ambient_desktop_{}_intercept", target),
                        profileId: "unknown".into(),
                        description: "New message extracted directly from local disk Write-Ahead Log".into(),
                        metadata: serde_json::json!({
                            "source": format!("{}_desktop", target),
                            "note": "Extracted via WAL bypassing encryption layer"
                        }),
                    };

                    let c = client.clone();
                    tokio::spawn(async move {
                        let _ = c.post(PICS_API_URL)
                            .bearer_auth(API_KEY)
                            .json(&payload)
                            .send()
                            .await;
                    });
                }
            },
            Ok(Err(e)) => println!("watch error: {:?}", e),
            Err(_) => {
                // Ignore timeout, loop continues...
            }
        }
    }
}
