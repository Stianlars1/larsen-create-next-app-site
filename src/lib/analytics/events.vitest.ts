import { beforeEach, describe, expect, it, vi } from "vitest";

const { umamiTrackMock, vercelTrackMock, googleEventMock } = vi.hoisted(() => ({
  umamiTrackMock: vi.fn(),
  vercelTrackMock: vi.fn(),
  googleEventMock: vi.fn(),
}));

vi.mock("./umami-track", () => ({ umamiTrack: umamiTrackMock }));
vi.mock("@vercel/analytics", () => ({ track: vercelTrackMock }));
vi.mock("./google-analytics", () => ({ event: googleEventMock }));

import { isAdminPath, trackProductEvent } from "./events";

describe("product event dispatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "", "/");
  });

  it("dispatches a valid event to all provider adapters", () => {
    expect(
      trackProductEvent({ name: "command_copied", data: { surface: "hero" } }),
    ).toBe(true);

    expect(umamiTrackMock).toHaveBeenCalledWith("command_copied", { surface: "hero" });
    expect(vercelTrackMock).toHaveBeenCalledWith("command_copied", { surface: "hero" });
    expect(googleEventMock).toHaveBeenCalledWith("command_copied", { surface: "hero" });
  });

  it("rejects an unknown property value without calling any provider", () => {
    expect(
      trackProductEvent({
        name: "command_copied",
        data: { surface: "unknown" },
      } as never),
    ).toBe(false);

    expect(umamiTrackMock).not.toHaveBeenCalled();
    expect(vercelTrackMock).not.toHaveBeenCalled();
    expect(googleEventMock).not.toHaveBeenCalled();
  });

  it("rejects extra event data rather than forwarding it", () => {
    expect(
      trackProductEvent({
        name: "npm_link_clicked",
        data: { surface: "hero", command: "npx secret-project" },
      } as never),
    ).toBe(false);

    expect(umamiTrackMock).not.toHaveBeenCalled();
    expect(vercelTrackMock).not.toHaveBeenCalled();
    expect(googleEventMock).not.toHaveBeenCalled();
  });

  it("does not dispatch an event while viewing admin", () => {
    window.history.pushState({}, "", "/admin");

    expect(
      trackProductEvent({ name: "command_copied", data: { surface: "hero" } }),
    ).toBe(false);
    expect(umamiTrackMock).not.toHaveBeenCalled();
    expect(vercelTrackMock).not.toHaveBeenCalled();
    expect(googleEventMock).not.toHaveBeenCalled();
  });

  it("recognizes only the admin route and its descendants", () => {
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/unlock")).toBe(true);
    expect(isAdminPath("/administrators")).toBe(false);
    expect(isAdminPath(null)).toBe(false);
  });
});
