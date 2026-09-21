import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { trackProductEventMock } = vi.hoisted(() => ({ trackProductEventMock: vi.fn() }));

vi.mock("@/lib/analytics/events", () => ({ trackProductEvent: trackProductEventMock }));
vi.mock("flubber", () => ({ interpolate: () => () => "M0 0" }));

import { CopyCommandButton } from "./copy-command-button";

describe("CopyCommandButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const writeText = vi.fn<(data: string) => Promise<void>>().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  it("tracks only after a command is copied", async () => {
    render(
      <CopyCommandButton
        command="npx example"
        tracking={{ event: "command_copied", surface: "hero" }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy command" }));

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith("npx example"));
    expect(trackProductEventMock).toHaveBeenCalledWith({
      name: "command_copied",
      data: { surface: "hero" },
    });
  });

  it("does not track when clipboard access fails", async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error("blocked"));
    render(
      <CopyCommandButton
        command="npx example"
        tracking={{ event: "command_copied", surface: "hero" }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy command" }));

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());
    expect(trackProductEventMock).not.toHaveBeenCalled();
  });
});
