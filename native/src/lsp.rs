use crate::types::*;
use anyhow::Result;
use lsp_server::{Connection, Message, Request, RequestId};
use lsp_types::*;
use std::collections::HashMap;
use std::process::{Command, Stdio};
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct LspService {
    servers: Arc<Mutex<HashMap<String, ServerInstance>>>,
}

struct ServerInstance {
    process: std::process::Child,
    connection: Connection,
}

impl LspService {
    pub fn new() -> Self {
        Self {
            servers: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn start_server(&self, language: String, root_path: String) -> Result<bool> {
        let mut servers = self.servers.lock().await;

        if servers.contains_key(&language) {
            return Ok(true);
        }

        // Start language server based on language
        let (process, connection) = match language.as_str() {
            "typescript" | "javascript" => self.start_typescript_server(&root_path)?,
            "rust" => self.start_rust_server(&root_path)?,
            "python" => self.start_python_server(&root_path)?,
            _ => return Ok(false), // Unsupported language
        };

        let instance = ServerInstance { process, connection };
        servers.insert(language.clone(), instance);
        // Initialize the server
        self.initialize_server(&language).await?;

        Ok(true)
    }

    pub async fn stop_server(&self, language: String) -> Result<bool> {
        let mut servers = self.servers.lock().await;
        if let Some(mut instance) = servers.remove(&language) {
            let _ = instance.process.kill();
            Ok(true)
        } else {
            Ok(false)
        }
    }

    pub async fn get_completions(&self, language: String, file_path: String, position: LspPosition, _content: String) -> Result<Vec<LspCompletionItem>> {
        let servers = self.servers.lock().await;
        if let Some(instance) = servers.get(&language) {
            // Send completion request
            let params = CompletionParams {
                text_document_position: TextDocumentPositionParams {
                    text_document: TextDocumentIdentifier {
                        uri: Url::from_file_path(&file_path).unwrap(),
                    },
                    position: Position {
                        line: position.line,
                        character: position.character,
                    },
                },
                work_done_progress_params: WorkDoneProgressParams::default(),
                partial_result_params: PartialResultParams::default(),
                context: None,
            };

            let request = Request {
                id: RequestId::from(1),
                method: "textDocument/completion".to_string(),
                params: serde_json::to_value(params).unwrap(),
            };

            instance.connection.sender.send(Message::Request(request))?;

            // For now, return empty - would need to handle response
            Ok(vec![])
        } else {
            Ok(vec![])
        }
    }

    pub async fn get_diagnostics(&self, language: String, _file_path: String) -> Result<Vec<LspDiagnostic>> {
        // Diagnostics are usually pushed by the server, but we can request them
        let servers = self.servers.lock().await;
        if let Some(_instance) = servers.get(&language) {
            // TODO: Implement diagnostics retrieval
            Ok(vec![])
        } else {
            Ok(vec![])
        }
    }

    pub async fn open_file(&self, language: String, file_path: String, content: String) -> Result<()> {
        let servers = self.servers.lock().await;
        if let Some(instance) = servers.get(&language) {
            let params = DidOpenTextDocumentParams {
                text_document: TextDocumentItem {
                    uri: Url::from_file_path(&file_path).unwrap(),
                    language_id: language,
                    version: 1,
                    text: content,
                },
            };

            let notification = lsp_server::Notification {
                method: "textDocument/didOpen".to_string(),
                params: serde_json::to_value(params).unwrap(),
            };

            instance.connection.sender.send(Message::Notification(notification))?;
        }
        Ok(())
    }

    pub async fn close_file(&self, language: String, file_path: String) -> Result<()> {
        let servers = self.servers.lock().await;
        if let Some(instance) = servers.get(&language) {
            let params = DidCloseTextDocumentParams {
                text_document: TextDocumentIdentifier {
                    uri: Url::from_file_path(&file_path).unwrap(),
                },
            };

            let notification = lsp_server::Notification {
                method: "textDocument/didClose".to_string(),
                params: serde_json::to_value(params).unwrap(),
            };

            instance.connection.sender.send(Message::Notification(notification))?;
        }
        Ok(())
    }

    pub async fn update_file(&self, language: String, file_path: String, content: String) -> Result<()> {
        let servers = self.servers.lock().await;
        if let Some(instance) = servers.get(&language) {
            let params = DidChangeTextDocumentParams {
                text_document: VersionedTextDocumentIdentifier {
                    uri: Url::from_file_path(&file_path).unwrap(),
                    version: 2,
                },
                content_changes: vec![TextDocumentContentChangeEvent {
                    range: None,
                    range_length: None,
                    text: content,
                }],
            };

            let notification = lsp_server::Notification {
                method: "textDocument/didChange".to_string(),
                params: serde_json::to_value(params).unwrap(),
            };

            instance.connection.sender.send(Message::Notification(notification))?;
        }
        Ok(())
    }

    fn start_typescript_server(&self, root_path: &str) -> Result<(std::process::Child, Connection)> {
        let (connection, io_threads) = Connection::stdio();
        std::mem::forget(io_threads); // Keep threads alive

        let child = Command::new("typescript-language-server")
            .arg("--stdio")
            .current_dir(root_path)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()?;

        Ok((child, connection))
    }

    fn start_rust_server(&self, root_path: &str) -> Result<(std::process::Child, Connection)> {
        let (connection, io_threads) = Connection::stdio();
        std::mem::forget(io_threads);

        let child = Command::new("rust-analyzer")
            .current_dir(root_path)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()?;

        Ok((child, connection))
    }

    fn start_python_server(&self, root_path: &str) -> Result<(std::process::Child, Connection)> {
        let (connection, io_threads) = Connection::stdio();
        std::mem::forget(io_threads);

        let child = Command::new("pyright-langserver")
            .arg("--stdio")
            .current_dir(root_path)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()?;

        Ok((child, connection))
    }

    async fn initialize_server(&self, language: &str) -> Result<()> {
        let servers = self.servers.lock().await;
        if let Some(instance) = servers.get(language) {
            let init_params = InitializeParams {
                process_id: Some(std::process::id()),
                root_path: None,
                root_uri: None,
                initialization_options: None,
                capabilities: ClientCapabilities::default(),
                trace: Some(TraceValue::Off),
                workspace_folders: None,
                client_info: None,
                locale: None,
                work_done_progress_params: WorkDoneProgressParams::default(),
            };

            let request = Request {
                id: RequestId::from(0),
                method: "initialize".to_string(),
                params: serde_json::to_value(init_params).unwrap(),
            };

            instance.connection.sender.send(Message::Request(request))?;
        }
        Ok(())
    }
}