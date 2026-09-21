import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { trackProductEventMock } = vi.hoisted(() => ({ trackProductEventMock: vi.fn() }));

vi.mock("@/lib/analytics/events", () => ({ trackProductEvent: trackProductEventMock }));
vi.mock("@/components/theme/palette-session", () => ({
  usePaletteSession: () => ({
    options: { hex: "#4DA0FF", preset: "shadcn", format: "hsl-values", neutralTint: "weak" },
    theme: { css: "", dark: {}, light: {}, ramps: { light: {}, dark: {} }, options: { hex: "#4DA0FF", preset: "shadcn", format: "hsl-values", neutralTint: "weak" } },
    customPaletteActive: false,
    setCustomPaletteActive: vi.fn(),
    updatePalette: vi.fn(),
  }),
}));
vi.mock("@/lib/use-in-view", () => ({ useInView: () => ({ ref: vi.fn(), inView: false }) }));
vi.mock("@/components/ui/copy-command-button", () => ({
  CopyCommandButton: () => <button type="button">Copy command</button>,
}));

import { CommandBuilder } from "./command-builder";

describe("CommandBuilder analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    trackProductEventMock.mockReturnValue(true);
  });

  it("records the first changed control only", () => {
    render(<CommandBuilder />);
    const appName = screen.getByLabelText("App name");

    fireEvent.change(appName, { target: { value: "first-app" } });
    fireEvent.change(appName, { target: { value: "second-app" } });

    expect(trackProductEventMock).toHaveBeenCalledTimes(1);
    expect(trackProductEventMock).toHaveBeenCalledWith({
      name: "command_builder_used",
      data: { control: "app_name" },
    });
  });
});
