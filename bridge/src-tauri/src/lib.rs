mod audio;
mod config;
mod local_api;
mod models;
mod runtime;

use std::sync::Arc;

use runtime::Runtime;
use tauri::{Manager, Runtime as TauriRuntime};
use tauri_plugin_deep_link::DeepLinkExt;
use url::Url;

pub fn run() {
    let runtime = Runtime::load().expect("initialisation de CueForge Bridge impossible");
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .manage(runtime.clone())
        .setup(move |app| {
            let local_runtime = runtime.clone();
            tauri::async_runtime::spawn(async move {
                if let Err(error) = local_api::serve(local_runtime).await {
                    eprintln!("Serveur local CueForge Bridge arrêté: {error}");
                }
            });

            #[cfg(any(target_os = "linux", all(debug_assertions, windows)))]
            app.deep_link().register_all()?;

            let handle = app.handle().clone();
            let deep_link_runtime = runtime.clone();
            app.deep_link().on_open_url(move |event| {
                for url in event.urls() {
                    handle_pairing_url(&handle, deep_link_runtime.clone(), url.clone());
                }
            });
            if let Ok(Some(urls)) = app.deep_link().get_current() {
                for url in urls {
                    handle_pairing_url(app.handle(), runtime.clone(), url);
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("exécution de CueForge Bridge impossible");
}

fn handle_pairing_url<R: TauriRuntime>(app: &tauri::AppHandle<R>, runtime: Arc<Runtime>, url: Url) {
    if url.scheme() != "cueforge-bridge" || url.host_str() != Some("pair") {
        return;
    }
    let Some(ticket) = url
        .query_pairs()
        .find_map(|(key, value)| (key == "ticket").then(|| value.into_owned()))
    else {
        return;
    };
    let server_url = url
        .query_pairs()
        .find_map(|(key, value)| (key == "server").then(|| value.into_owned()))
        .unwrap_or_else(|| "https://app.cueforge.fr".to_string());
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
    tauri::async_runtime::spawn(async move {
        if let Err(error) = runtime.claim_pairing(&ticket, &server_url).await {
            eprintln!("Association CueForge Bridge refusée: {error}");
        }
    });
}
