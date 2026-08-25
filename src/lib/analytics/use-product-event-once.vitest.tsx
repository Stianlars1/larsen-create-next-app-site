import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { trackProductEventMock } = vi.hoisted(() => ({ trackProductEventMock: vi.fn() }));

vi.mock("./events", () => ({ trackProductEvent: trackProductEventMock }));

import { useProductEventOnce } from "./use-product-event-once";

describe("useProductEventOnce", () => {
  beforeEach(() => vi.clearAllMocks());

  it("records the first accepted event only", () => {
    trackProductEventMock.mockReturnValue(true);
    const { result } = renderHook(() => useProductEventOnce());

    act(() => {
      expect(
        result.current({ name: "command_builder_used", data: { control: "app_name" } }),
      ).toBe(true);
      expect(
        result.current({ name: "command_builder_used", data: { control: "linter" } }),
      ).toBe(false);
    });

    expect(trackProductEventMock).toHaveBeenCalledTimes(1);
  });

  it("keeps trying when the dispatcher rejects an event", () => {
    trackProductEventMock.mockReturnValueOnce(false).mockReturnValueOnce(true);
    const { result } = renderHook(() => useProductEventOnce());

    act(() => {
      expect(
        result.current({ name: "command_builder_used", data: { control: "app_name" } }),
      ).toBe(false);
      expect(
        result.current({ name: "command_builder_used", data: { control: "linter" } }),
      ).toBe(true);
    });

    expect(trackProductEventMock).toHaveBeenCalledTimes(2);
  });
});
