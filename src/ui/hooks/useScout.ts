import { useCallback, useState } from "react";
import type { ScoutFileInfo, ScoutSearchResult } from "../types";

type ScoutStatus = "idle" | "loading" | "success" | "error";

export function useScout() {
  const [status, setStatus] = useState<ScoutStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Listen for scout events from main process
  const setupListener = useCallback((
    onSuccess: (data: unknown) => void,
    onError: (message: string) => void
  ) => {
    const listener = (_event: Event, payload: string) => {
      const event = JSON.parse(payload);

      if (event.type === "scout.find.result" || event.type === "scout.search.result" || event.type === "scout.list.result") {
        onSuccess(event.payload);
        setStatus("success");
      } else if (event.type === "scout.error") {
        onError(event.payload.message);
        setStatus("error");
      }
    };

    window.addEventListener("server-event", listener as EventListener);

    return () => {
      window.removeEventListener("server-event", listener as EventListener);
    };
  }, []);

  const send = useCallback((event: { type: string; payload: unknown }) => {
    setStatus("loading");
    setError(null);
    window.postMessage(JSON.stringify(event), "*");
  }, []);

  const find = useCallback((
    root: string,
    pattern: string,
    limit = 100
  ): Promise<ScoutFileInfo[]> => {
    return new Promise((resolve, reject) => {
      const cleanup = setupListener((payload) => {
        resolve((payload as { files: ScoutFileInfo[] }).files);
        cleanup();
      }, (message) => {
        setError(message);
        reject(new Error(message));
        cleanup();
      });

      send({
        type: "scout.find",
        payload: { root, pattern, limit }
      });
    });
  }, [send, setupListener]);

  const search = useCallback((
    root: string,
    query: string,
    options?: { ext?: string; limit?: number }
  ): Promise<ScoutSearchResult[]> => {
    return new Promise((resolve, reject) => {
      const cleanup = setupListener((payload) => {
        resolve((payload as { results: ScoutSearchResult[] }).results);
        cleanup();
      }, (message) => {
        setError(message);
        reject(new Error(message));
        cleanup();
      });

      send({
        type: "scout.search",
        payload: {
          root,
          query,
          ext: options?.ext,
          limit: options?.limit
        }
      });
    });
  }, [send, setupListener]);

  const list = useCallback((
    root: string
  ): Promise<ScoutFileInfo[]> => {
    return new Promise((resolve, reject) => {
      const cleanup = setupListener((payload) => {
        resolve((payload as { files: ScoutFileInfo[] }).files);
        cleanup();
      }, (message) => {
        setError(message);
        reject(new Error(message));
        cleanup();
      });

      send({
        type: "scout.list",
        payload: { root }
      });
    });
  }, [send, setupListener]);

  return {
    find,
    search,
    list,
    status,
    error,
    isLoading: status === "loading"
  };
}
