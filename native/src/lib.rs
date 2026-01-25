use napi_derive::napi;
use napi::Result;
use std::path::Path;

#[napi]
pub async fn get_platform() -> String {
  std::env::consts::OS.to_string()
}

#[napi]
pub async fn get_arch() -> String {
  std::env::consts::ARCH.to_string()
}

// File operations
#[napi]
pub async fn read_file_text(path: String) -> Result<String> {
  std::fs::read_to_string(path).map_err(napi::Error::from)
}

#[napi]
pub async fn write_file_text(path: String, content: String) -> Result<bool> {
  if let Some(parent) = Path::new(&path).parent() {
    std::fs::create_dir_all(parent).map_err(napi::Error::from)?;
  }
  std::fs::write(path, content).map_err(napi::Error::from)?;
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
pub async fn get_file_size(path: String) -> Result<u64> {
  std::fs::metadata(path)
    .map(|m| m.len())
    .map_err(napi::Error::from)
}

// Simple file listing (Rust-based, no subprocess)
#[napi]
pub async fn list_directory(path: String) -> Result<Vec<String>> {
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
    Err(e) => Err(napi::Error::from(e))
  }
}

// Quick file search (simple pattern matching)
#[napi]
pub async fn search_files(
  root: String,
  pattern: String,
  max_depth: Option<i32>,
) -> Result<Vec<String>> {
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

        if name.to_lowercase().contains(&pattern.to_lowercase()) {
          results.push(path.to_string_lossy().to_string());
        }

        if path.is_dir() {
          search_recursive(&path, pattern, depth + 1, max_depth, results);
        }
      }
    }
  }

  search_recursive(root_path, pattern, 0, max_depth, &mut results);
  Ok(results)
}

// Git operations (simplified)
#[napi]
pub async fn git_status_fast(_repo_path: String) -> Result<String> {
  // Placeholder - git operations require git2 crate
  // Return empty status for now
  Ok("{}".to_string())
}
