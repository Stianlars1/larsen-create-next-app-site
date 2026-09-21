import assert from "node:assert/strict";
import test from "node:test";
import { generateInWorker } from "./palette-worker-client.ts";

class FakeWorker {
  static instances = [];
  messages = [];
  terminated = false;
  constructor() { FakeWorker.instances.push(this); }
  postMessage(message) { this.messages.push(message); }
  terminate() { this.terminated = true; }
  reply(id, result) { this.onmessage({ data: { id, result } }); }
}

test("Worker correlates out-of-order replies, rejects transport failures, and restarts", async () => {
  const original = globalThis.Worker;
  globalThis.Worker = FakeWorker;
  try {
    const first = generateInWorker({ hex: "#111111" });
    const second = generateInWorker({ hex: "#222222" });
    const worker = FakeWorker.instances.at(-1);
    const [a, b] = worker.messages;
    worker.reply(b.id, { css: "second" });
    worker.reply(a.id, { css: "first" });
    assert.equal((await second).css, "second");
    assert.equal((await first).css, "first");
    worker.reply(a.id, { css: "stale duplicate" });
    const failure = generateInWorker({ hex: "#333333" });
    const rejected = assert.rejects(failure, /Worker failed/);
    worker.onerror();
    await rejected;
    assert.equal(worker.terminated, true);
    const restarted = generateInWorker({ hex: "#444444" });
    const nextWorker = FakeWorker.instances.at(-1);
    assert.notEqual(nextWorker, worker);
    const nextRequest = nextWorker.messages[0];
    nextWorker.onmessage({ data: { id: nextRequest.id, error: "qualityStatus=fail" } });
    await assert.rejects(restarted, /qualityStatus=fail/);
    const unreadable = generateInWorker({ hex: "#555555" });
    const messageRejected = assert.rejects(unreadable, /could not be read/);
    nextWorker.onmessageerror();
    await messageRejected;
  } finally { globalThis.Worker = original; }
});
