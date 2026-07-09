// Tauri app entry. The frontend is the existing Vite/React SPA served from
// ../dist (see tauri.conf.json); this host just opens the native window and
// loads it. No custom Rust commands yet — that's where a Steamworks binding
// (achievements, cloud saves) will hook in as a later slice.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Footy Dynasty");
}
