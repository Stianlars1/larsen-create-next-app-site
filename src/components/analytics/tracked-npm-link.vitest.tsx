import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { trackProductEventMock } = vi.hoisted(() => ({ trackProductEventMock: vi.fn() }));

vi.mock("@/lib/analytics/events", () => ({ trackProductEvent: trackProductEventMock }));

import { TrackedNpmLink } from "./tracked-npm-link";

describe("TrackedNpmLink", () => {
  it("reports the closed surface without preventing navigation", () => {
    render(<TrackedNpmLink surface="footer">npm</TrackedNpmLink>);
    const link = screen.getByRole("link", { name: "npm" });

    link.addEventListener("click", (event) => event.preventDefault(), { once: true });
    fireEvent.click(link);

    expect(link.getAttribute("href")).toBe(
      "https://www.npmjs.com/package/@larsen-utvikling/create-next-app",
    );
    expect(trackProductEventMock).toHaveBeenCalledWith({
      name: "npm_link_clicked",
      data: { surface: "footer" },
    });
  });
});
