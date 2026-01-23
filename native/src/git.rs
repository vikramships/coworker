use crate::types::*;
use anyhow::Result;
use git2::{Repository, Status, StatusOptions};
use std::path::Path;

pub async fn git_status(repo_path: String) -> Result<Vec<GitStatusEntry>> {
    let repo = Repository::open(&repo_path)?;
    let mut opts = StatusOptions::new();
    opts.include_untracked(true);
    opts.recurse_untracked_dirs(true);

    let statuses = repo.statuses(Some(&mut opts))?;
    let mut entries = Vec::new();

    for entry in statuses.iter() {
        let status = entry.status();
        let path = entry.path().unwrap_or("").to_string();

        let status_type = if status.contains(Status::INDEX_NEW) {
            GitStatusType::Added
        } else if status.contains(Status::INDEX_MODIFIED) {
            GitStatusType::Modified
        } else if status.contains(Status::INDEX_DELETED) {
            GitStatusType::Deleted
        } else if status.contains(Status::WT_MODIFIED) {
            GitStatusType::Modified
        } else if status.contains(Status::WT_DELETED) {
            GitStatusType::Deleted
        } else if status.contains(Status::WT_NEW) {
            GitStatusType::Untracked
        } else {
            continue; // Skip clean files
        };

        entries.push(GitStatusEntry {
            path,
            status: status_type,
        });
    }

    Ok(entries)
}

pub async fn git_commit(repo_path: String, message: String, files: Vec<String>) -> Result<String> {
    let repo = Repository::open(&repo_path)?;
    let mut index = repo.index()?;

    // Add files to index
    for file in files {
        index.add_path(Path::new(&file))?;
    }

    index.write()?;
    let tree_id = index.write_tree()?;
    let tree = repo.find_tree(tree_id)?;

    // Get parent commit
    let parent_commit = match repo.head().ok().and_then(|head| head.target()) {
        Some(target) => Some(repo.find_commit(target)?),
        None => None,
    };

    let parents = parent_commit.as_ref().map(|c| vec![c]).unwrap_or_default();

    // Create commit
    let sig = repo.signature()?;
    let commit_id = repo.commit(
        Some("HEAD"),
        &sig,
        &sig,
        &message,
        &tree,
        &parents,
    )?;

    Ok(commit_id.to_string())
}

pub async fn git_log(repo_path: String, limit: Option<i32>) -> Result<Vec<GitCommit>> {
    let repo = Repository::open(&repo_path)?;
    let mut revwalk = repo.revwalk()?;
    revwalk.push_head()?;

    let mut commits = Vec::new();
    let max_commits = limit.unwrap_or(50) as usize;

    for (i, oid) in revwalk.enumerate() {
        if i >= max_commits {
            break;
        }

        let oid = oid?;
        let commit = repo.find_commit(oid)?;

        commits.push(GitCommit {
            id: oid.to_string(),
            message: commit.message().unwrap_or("").to_string(),
            author: commit.author().name().unwrap_or("").to_string(),
            email: commit.author().email().unwrap_or("").to_string(),
            timestamp: commit.time().seconds(),
        });
    }

    Ok(commits)
}

pub async fn git_diff(repo_path: String, file_path: Option<String>) -> Result<String> {
    let repo = Repository::open(&repo_path)?;

    let mut diff_opts = git2::DiffOptions::new();
    if let Some(ref path) = file_path {
        diff_opts.pathspec(path);
    }

    let diff = if let Some(ref _file) = file_path {
        // Diff specific file
        repo.diff_index_to_workdir(None, Some(&mut diff_opts))?
    } else {
        // Diff all changes
        repo.diff_index_to_workdir(None, Some(&mut diff_opts))?
    };

    let mut diff_text = String::new();
    diff.print(git2::DiffFormat::Patch, |_delta, _hunk, line| {
        match line.origin() {
            '+' => diff_text.push_str(&format!("+{}", String::from_utf8_lossy(line.content()))),
            '-' => diff_text.push_str(&format!("-{}", String::from_utf8_lossy(line.content()))),
            ' ' => diff_text.push_str(&format!(" {}", String::from_utf8_lossy(line.content()))),
            _ => {}
        }
        true
    })?;

    Ok(diff_text)
}