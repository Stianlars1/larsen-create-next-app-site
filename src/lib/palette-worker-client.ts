import type { GeneratedTheme, PaletteOptions } from "./palette";

type Reply = { id: number; result?: GeneratedTheme; error?: string };
let worker: Worker | null = null;
let sequence = 0;
const pending = new Map<
  number,
  {
    resolve: (value: GeneratedTheme) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }
>();
function failAll(message: string) {
  worker?.terminate();
  worker = null;
  for (const request of pending.values()) {
    clearTimeout(request.timer);
    request.reject(new Error(message));
  }
  pending.clear();
}
export function generateInWorker(
  options: PaletteOptions,
): Promise<GeneratedTheme> {
  if (!worker) {
    worker = new Worker(new URL("./palette.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = ({ data }: MessageEvent<Reply>) => {
      const request = pending.get(data.id);
      if (!request) return;
      pending.delete(data.id);
      clearTimeout(request.timer);
      if (data.error) request.reject(new Error(data.error));
      else if (data.result) request.resolve(data.result);
      else
        request.reject(
          new Error("Tintful Worker returned an invalid response."),
        );
    };
    worker.onerror = () =>
      failAll("Tintful Worker failed. Retry the selection to restart it.");
    worker.onmessageerror = () =>
      failAll(
        "Tintful Worker response could not be read. Retry the selection.",
      );
  }
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(
      () => failAll("Tintful generation timed out. Retry the selection."),
      30000,
    );
    pending.set(id, { resolve, reject, timer });
    try {
      worker!.postMessage({ id, options });
    } catch (error) {
      failAll(error instanceof Error ? error.message : String(error));
    }
  });
}
