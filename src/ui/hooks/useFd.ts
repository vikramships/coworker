import { useCallback, useState } from "react";
import type { FdFileInfo, FdOptions } from "../types";

type FdStatus = "idle" | "loading" | "success" | "error";

export function useFd() {
  const [status, setStatus] = useState<FdStatus>("idle");
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
      } else if (event.type === "fd.error") {
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
    options?: FdOptions
  ): Promise<FdFileInfo[]> => {
    return new Promise((resolve, reject) => {
      const cleanup = setupListener("fd.find.result", (payload) => {
        resolve((payload as { files: FdFileInfo[] }).files);
        cleanup();
      }, (message) => {
        setError(message);
        reject(new Error(message));
        cleanup();
      });

      send({
        type: "fd.find",
        payload: { root, pattern, options }
      });
    });
  }, [send, setupListener]);

  const list = useCallback((
    root: string,
    options?: FdOptions
  ): Promise<FdFileInfo[]> => {
    return new Promise((resolve, reject) => {
      const cleanup = setupListener("fd.list.result", (payload) => {
        resolve((payload as { files: FdFileInfo[] }).files);
        cleanup();
      }, (message) => {
        setError(message);
        reject(new Error(message));
        cleanup();
      });

      send({
        type: "fd.list",
        payload: { root, options }
      });
    });
  }, [send, setupListener]);

  return {
    find,
    list,
    status,
    error,
    isLoading: status === "loading"
  };
}
