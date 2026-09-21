import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateMock, setSelectionMock, trackProductEventMock } = vi.hoisted(() => ({
  generateMock: vi.fn(),
  setSelectionMock: vi.fn(),
  trackProductEventMock: vi.fn(),
}));

vi.mock("@/components/theme/site-theme", () => ({
  useSiteTheme: () => ({ setSelection: setSelectionMock }),
}));
vi.mock("@/lib/palette", () => ({
  generate: generateMock,
  isValidHex: (value: string) => value === "#112233",
}));
vi.mock("@/lib/analytics/events", () => ({ trackProductEvent: trackProductEventMock }));

import { PaletteSessionProvider, usePaletteSession } from "./palette-session";

const theme = { css: "", dark: {}, light: {} } as never;

function PaletteControls() {
  const { updatePalette } = usePaletteSession();
  return (
    <>
      <button
        onClick={() => updatePalette({ hex: "#112233" }, { source: "palette_demo" })}
        type="button"
      >
        Generate valid palette
      </button>
      <button
        onClick={() => updatePalette({ hex: "invalid" }, { source: "palette_demo" })}
        type="button"
      >
        Generate invalid palette
      </button>
    </>
  );
}

function renderPaletteControls() {
  return render(
    <PaletteSessionProvider
      initialOptions={{ hex: "#4DA0FF", preset: "shadcn", format: "hsl-values", neutralTint: "weak" }}
      initialTheme={theme}
    >
      <PaletteControls />
    </PaletteSessionProvider>,
  );
}

describe("PaletteSessionProvider analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateMock.mockResolvedValue(theme);
    trackProductEventMock.mockReturnValue(true);
  });

  it("tracks the first successful user-triggered generation only", async () => {
    renderPaletteControls();
    expect(trackProductEventMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Generate valid palette" }));

    await waitFor(() =>
      expect(trackProductEventMock).toHaveBeenCalledWith({
        name: "palette_generator_used",
        data: {
          surface: "palette_demo",
          preset: "shadcn",
          format: "hsl-values",
          neutral_tint: "weak",
        },
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Generate valid palette" }));
    await waitFor(() => expect(generateMock).toHaveBeenCalledTimes(2));
    expect(trackProductEventMock).toHaveBeenCalledTimes(1);
  });

  it("does not track an invalid input", async () => {
    renderPaletteControls();

    fireEvent.click(screen.getByRole("button", { name: "Generate invalid palette" }));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(generateMock).not.toHaveBeenCalled();
    expect(trackProductEventMock).not.toHaveBeenCalled();
  });
});
