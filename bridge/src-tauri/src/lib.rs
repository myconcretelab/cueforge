mod audio;
mod config;
mod local_api;
mod models;
mod runtime;

use std::sync::Arc;

use runtime::Runtime;
use tauri::{Manager, Runtime as TauriRuntime};
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_updater::UpdaterExt;
use url::Url;

pub fn run() {
    let runtime = Runtime::load().expect("initialisation de SonoRiva Bridge impossible");
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(
            |app, _arguments, _working_directory| {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            },
        ))
        .plugin(tauri_plugin_updater::Builder::new().build());
    builder
        .plugin(tauri_plugin_deep_link::init())
        .manage(runtime.clone())
        .setup(move |app| {
            let local_runtime = runtime.clone();
            tauri::async_runtime::spawn(async move {
                if let Err(error) = local_api::serve(local_runtime).await {
                    eprintln!("Serveur local SonoRiva Bridge arrêté: {error}");
                }
            });

            let migration_runtime = runtime.clone();
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                if let Err(error) = migration_runtime.migrate_legacy_tokens().await {
                    eprintln!("Migration de l’association SonoRiva impossible: {error}");
                }
            });

            let update_handle = app.handle().clone();
            let update_runtime = runtime.clone();
            tauri::async_runtime::spawn(async move {
                if let Err(error) = install_available_update(update_handle, update_runtime).await {
                    eprintln!("Mise à jour automatique de SonoRiva Bridge impossible: {error}");
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
        .expect("exécution de SonoRiva Bridge impossible");
}

async fn install_available_update<R: TauriRuntime>(
    app: tauri::AppHandle<R>,
    runtime: Arc<Runtime>,
) -> Result<(), String> {
    let Some(update) = app
        .updater()
        .map_err(|error| error.to_string())?
        .check()
        .await
        .map_err(|error| error.to_string())?
    else {
        return Ok(());
    };
    let version = update.version.clone();
    let bytes = update
        .download(|_, _| {}, || {})
        .await
        .map_err(|error| error.to_string())?;
    let mut audio = runtime
        .audio
        .lock()
        .map_err(|_| "Moteur audio inaccessible pendant la mise à jour.".to_string())?;
    if !audio.snapshots().is_empty() {
        eprintln!(
            "Mise à jour SonoRiva Bridge {version} téléchargée mais différée: une lecture audio est active."
        );
        return Ok(());
    }
    update.install(bytes).map_err(|error| error.to_string())?;
    drop(audio);
    app.restart();
}

fn handle_pairing_url<R: TauriRuntime>(app: &tauri::AppHandle<R>, runtime: Arc<Runtime>, url: Url) {
    if url.scheme() != "sonoriva-bridge" || url.host_str() != Some("pair") {
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
        .unwrap_or_else(|| "https://app.sonoriva.fr".to_string());
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
    tauri::async_runtime::spawn(async move {
        if let Err(error) = runtime.claim_pairing(&ticket, &server_url).await {
            eprintln!("Association SonoRiva Bridge refusée: {error}");
        }
    });
}
