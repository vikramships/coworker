import { useCallback, useState } from "react";
import type { RgMatch, RgOptions } from "../types";

type RgStatus = "idle" | "loading" | "success" | "error";

export function useRg() {
  const [status, setStatus] = useState<RgStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const setupListener = useCallback((
    successType: string,
    onSuccess: (data: unknown) => void,
    onError: (message: string) => void
  ) => {
    const listener = (_event: Event, payload: string) => {
      const event = JSON.parse(payload);

      if (event.type === successType) {
        onSuccess(event.payload);
        setStatus("success");
      } else if (event.type === "rg.error") {
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

  const search = useCallback((
    root: string,
    query: string,
    options?: RgOptions
  ): Promise<RgMatch[]> => {
    return new Promise((resolve, reject) => {
      const cleanup = setupListener("rg.search.result", (payload) => {
        resolve((payload as { results: RgMatch[] }).results);
        cleanup();
      }, (message) => {
        setError(message);
        reject(new Error(message));
        cleanup();
      });

      send({
        type: "rg.search",
        payload: { root, query, options }
      });
    });
  }, [send, setupListener]);

  const files = useCallback((
    root: string,
    pattern?: string,
    options?: { ext?: string }
  ): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const cleanup = setupListener("rg.files.result", (payload) => {
        resolve((payload as { files: string[] }).files);
        cleanup();
      }, (message) => {
        setError(message);
        reject(new Error(message));
        cleanup();
      });

      send({
        type: "rg.files",
        payload: { root, pattern, options }
      });
    });
  }, [send, setupListener]);

  return {
    search,
    files,
    status,
    error,
    isLoading: status === "loading"
  };
}
