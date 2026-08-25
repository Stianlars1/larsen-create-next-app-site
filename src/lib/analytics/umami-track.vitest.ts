import { afterEach, describe, expect, it, vi } from "vitest";

import { flushPendingUmamiEvents, umamiTrack } from "./umami-track";

afterEach(() => {
  delete window.umami;
  flushPendingUmamiEvents();
});

describe("Umami event queue", () => {
  it("queues early events and flushes them in order", () => {
    const track = vi.fn();

    umamiTrack("command_copied", { surface: "hero" });
    umamiTrack("npm_link_clicked", { surface: "footer" });
    expect(track).not.toHaveBeenCalled();

    window.umami = { track };
    flushPendingUmamiEvents();

    expect(track).toHaveBeenNthCalledWith(1, "command_copied", { surface: "hero" });
    expect(track).toHaveBeenNthCalledWith(2, "npm_link_clicked", { surface: "footer" });
  });

  it("bounds a missing tracker queue at 25 events", () => {
    const track = vi.fn();

    for (let index = 0; index < 30; index += 1) {
      umamiTrack("command_copied", { surface: "hero", index });
    }

    window.umami = { track };
    flushPendingUmamiEvents();

    expect(track).toHaveBeenCalledTimes(25);
  });

  it("never lets a tracker failure reach product code", () => {
    window.umami = { track: () => { throw new Error("blocked"); } };

    expect(() => umamiTrack("command_copied", { surface: "hero" })).not.toThrow();
  });
});
