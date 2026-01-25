use napi_derive::napi;
use std::path::Path;

#[napi]
pub async fn get_platform() -> String {
    std::env::consts::OS.to_string()
}

#[napi]
pub async fn get_arch() -> String {
    std::env::consts::ARCH.to_string()
}

// File operations with caching
#[napi]
pub async fn read_file_text(path: String) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

#[napi]
pub async fn write_file_text(path: String, content: String) -> Result<bool, String> {
    if let Some(parent) = Path::new(&path).parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(true)
}

#[napi]
pub async fn file_exists(path: String) -> bool {
    Path::new(&path).exists()
}

#[napi]
pub async fn is_directory(path: String) -> bool {
    Path::new(&path).is_dir()
}

#[napi]
pub async fn get_file_size(path: String) -> Result<u64, String> {
    std::fs::metadata(path)
        .map(|m| m.len())
        .map_err(|e| e.to_string())
}

// Simple file listing (Rust-based, no subprocess)
#[napi]
pub async fn list_directory(path: String) -> Result<Vec<String>, String> {
    match std::fs::read_dir(path) {
        Ok(entries) => {
            Ok(entries
                .filter_map(|entry| entry.ok())
                .map(|entry| entry.file_name().to_string_lossy().to_string())
                .collect::<Vec<_>>()
                .into_iter()
                .filter(|name| !name.starts_with('.'))
                .collect())
        }
        Err(e) if e.kind() == std::io::ErrorKind::PermissionDenied => {
            // Return empty list for permission errors
            Ok(Vec::new())
        }
        Err(e) => Err(e.to_string())
    }
}

// Git operations
#[napi]
pub async fn git_status_fast(repo_path: String) -> Result<String, String> {
    crate::git::git_status(repo_path)
        .await
        .map(|status| serde_json::to_string(&status).unwrap_or_default())
        .map_err(|e| e.to_string())
}

// Quick file search (simple pattern matching)
#[napi]
pub async fn search_files(
    root: String,
    pattern: String,
    max_depth: Option<i32>,
) -> Result<Vec<String>, String> {
    let max_depth = max_depth.unwrap_or(5);
    let pattern = pattern.trim_matches('*');

    let mut results = Vec::new();
    let root_path = Path::new(&root);

    fn search_recursive(
        dir: &Path,
        pattern: &str,
        depth: i32,
        max_depth: i32,
        results: &mut Vec<String>,
    ) {
        if depth > max_depth {
            return;
        }

        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.filter_map(|e| e.ok()) {
                let path = entry.path();
                let name = entry.file_name().to_string_lossy().to_string();

                if name.contains(pattern) {
                    results.push(path.to_string_lossy().to_string());
                }

                if path.is_dir() && !name.starts_with('.') {
                    search_recursive(&path, pattern, depth + 1, max_depth, results);
                }
            }
        }
    }

    search_recursive(root_path, pattern, 0, max_depth, &mut results);
    Ok(results)
}

// Platform-specific path operations
#[napi]
pub fn path_join(a: String, b: String) -> String {
    let a_path = Path::new(&a);
    let result = if a_path.ends_with("/") {
        format!("{}{}", a, b)
    } else {
        format!("{}/{}", a, b)
    };
    result
}

#[napi]
pub fn path_basename(path: String) -> String {
    Path::new(&path)
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default()
}

#[napi]
pub fn path_dirname(path: String) -> String {
    Path::new(&path)
        .parent()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default()
}

#[napi]
pub fn path_extension(path: String) -> String {
    Path::new(&path)
        .extension()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default()
}

// Environment info
#[napi]
pub fn get_home_dir() -> String {
    dirs::home_dir()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string()
}

#[napi]
pub fn get_temp_dir() -> String {
    std::env::temp_dir().to_string_lossy().to_string()
}

#[napi]
pub fn get_cwd() -> String {
    std::env::current_dir()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string()
}
