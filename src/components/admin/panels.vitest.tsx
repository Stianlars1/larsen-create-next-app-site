import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BarList, StatusPill, TimeSeries } from "./panels";

describe("admin panels", () => {
  it("renders an explicit no-data state and accessible chart summary", () => {
    render(
      <>
        <BarList rows={[]} title="Copy surfaces" />
        <TimeSeries
          series={[{ name: "Pageviews", values: [3, 7] }]}
          labels={["24 Aug", "25 Aug"]}
          title="Traffic trend"
        />
      </>,
    );

    expect(screen.getByText("No data yet.")).not.toBeNull();
    expect(screen.getByLabelText("Traffic trend")).not.toBeNull();
  });

  it("does not present unknown state as healthy", () => {
    render(<StatusPill status="unknown">Not configured</StatusPill>);

    expect(screen.getByText("Not configured").getAttribute("data-status")).toBe("unknown");
  });
});
