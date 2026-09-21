import { ROUTE_ADMIN, ROUTE_ADMIN_LOCK } from "@/lib/routes";
import type { AdminDashboardData, ReachMetric } from "@/lib/admin/dashboard";
import type { AdminResult } from "@/lib/admin/result";
import type { UmamiEventPoint, UmamiPageviewSeries, UmamiStats } from "@/lib/admin/umami";
import { formatCount, formatDate, formatDuration, formatLatency, formatRate, reasonLabel } from "./format";
import { BarList, Panel, StatCard, StatusPill, TimeSeries } from "./panels";
import styles from "./dashboard.module.css";

function resultStatus(result: AdminResult<unknown>): "up" | "down" | "unknown" {
  if (result.ok) return "up";
  return result.reason === "unconfigured" ? "unknown" : "down";
}

function resultText(result: AdminResult<unknown>): string {
  return result.ok ? "Available" : reasonLabel(result.reason);
}

function metricCard(label: string, metric: ReachMetric) {
  return (
    <StatCard
      hint={`Reach ${formatRate(metric.reach)}${metric.reason ? ` - ${reasonLabel(metric.reason)}` : ""}`}
      label={label}
      value={formatCount(metric.count)}
    />
  );
}

function trafficChart(series: AdminResult<UmamiPageviewSeries>) {
  if (!series.ok) return <p className={styles.unavailable}>{reasonLabel(series.reason)}</p>;
  return (
    <TimeSeries
      labels={series.data.pageviews.map((point) => point.x.slice(5, 10))}
      series={[
        { name: "Pageviews", values: series.data.pageviews.map((point) => point.y) },
        { name: "Visitors", values: series.data.visitors.map((point) => point.y) },
      ]}
      title="Traffic trend"
    />
  );
}

function productChart(series: AdminResult<UmamiEventPoint[]>) {
  if (!series.ok) return <p className={styles.unavailable}>{reasonLabel(series.reason)}</p>;
  const dates = [...new Set(series.data.map((point) => point.at))].sort();
  const events = [...new Set(series.data.map((point) => point.event))];

  return (
    <TimeSeries
      labels={dates.map((date) => date.slice(5, 10))}
      series={events.map((event) => ({
        name: event,
        values: dates.map(
          (date) => series.data.find((point) => point.event === event && point.at === date)?.count ?? 0,
        ),
      }))}
      title="Product activity"
    />
  );
}

function trafficValue(traffic: AdminResult<UmamiStats>, key: keyof UmamiStats): number | null {
  return traffic.ok ? traffic.data[key] : null;
}

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const windowStart = formatDate(new Date(data.window.startAt).toISOString());
  const windowEnd = formatDate(new Date(data.window.endAt).toISOString());
  const currentWindow = data.window.key;

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Larsen create-next-app</p>
          <h1 className={styles.title}>Admin</h1>
          <p className={styles.subtitle}>
            Observed {formatDate(data.observedAt)}. Traffic source: Umami.
          </p>
        </div>
        <form action={ROUTE_ADMIN_LOCK} method="post">
          <button className={styles.lock} type="submit">
            Lock
          </button>
        </form>
      </header>

      <nav className={styles.periods} aria-label="Reporting window">
        {(["24h", "7d", "30d"] as const).map((window) => (
          <a
            aria-current={currentWindow === window ? "page" : undefined}
            href={window === "30d" ? ROUTE_ADMIN : `${ROUTE_ADMIN}?window=${window}`}
            key={window}
          >
            {window}
          </a>
        ))}
      </nav>

      <p className={styles.window}>
        Window: {windowStart} to {windowEnd}
      </p>

      <section className={styles.statGrid} aria-label="Traffic overview">
        <StatCard label="Active visitors" value={formatCount(data.active.ok ? data.active.data.visitors : null)} hint="Last 5 minutes" />
        <StatCard label="Visitors" value={formatCount(trafficValue(data.traffic, "visitors"))} hint={data.traffic.ok ? currentWindow : reasonLabel(data.traffic.reason)} />
        <StatCard label="Pageviews" value={formatCount(trafficValue(data.traffic, "pageviews"))} hint={data.traffic.ok ? currentWindow : reasonLabel(data.traffic.reason)} />
        <StatCard label="Visits" value={formatCount(trafficValue(data.traffic, "visits"))} hint={data.traffic.ok ? currentWindow : reasonLabel(data.traffic.reason)} />
      </section>

      <div className={styles.grid}>
        <Panel title="Traffic" subtitle="Pageviews and visitors in the selected window">
          {trafficChart(data.trafficSeries)}
          {data.traffic.ok ? <p className={styles.footnote}>Average engagement time: {formatDuration(data.traffic.data.totalTime)}</p> : null}
        </Panel>

        <Panel title="Product reach" subtitle="Unique event visitors divided by all visitors">
          <div className={styles.metricGrid}>
            {metricCard("Palette generator", data.product.paletteGenerator)}
            {metricCard("Command builder", data.product.commandBuilder)}
            {metricCard("Command copies", data.product.commandCopy)}
            {metricCard("Stylesheet copies", data.product.stylesheetCopy)}
          </div>
        </Panel>

        <Panel title="Product activity" subtitle="Custom events from Umami">
          {productChart(data.productSeries)}
        </Panel>

        <Panel title="Command copy surfaces" subtitle="Successful command copies">
          {data.commandCopySurfaces.ok ? (
            <BarList
              rows={data.commandCopySurfaces.data.map((row) => ({ label: row.value, value: row.total }))}
              title="Command copy surfaces"
            />
          ) : (
            <p className={styles.unavailable}>{reasonLabel(data.commandCopySurfaces.reason)}</p>
          )}
        </Panel>

        <Panel title="npm" subtitle="Package downloads are not unique users or installs">
          <div className={styles.metricGrid}>
            <StatCard
              label="Last available day"
              value={formatCount(data.npm.downloads.ok ? data.npm.downloads.data.lastDay : null)}
            />
            <StatCard label="Last 7 days" value={formatCount(data.npm.downloads.ok ? data.npm.downloads.data.lastWeek : null)} />
            <StatCard label="Last 30 days" value={formatCount(data.npm.downloads.ok ? data.npm.downloads.data.lastMonth : null)} />
            <StatCard label="npm latest" value={data.npm.package.ok ? data.npm.package.data.latestVersion : "Unavailable"} />
          </div>
          {data.npm.downloads.ok ? (
            <TimeSeries
              labels={data.npm.downloads.data.daily.map((point) => point.day.slice(5))}
              series={[{ name: "Downloads", values: data.npm.downloads.data.daily.map((point) => point.downloads) }]}
              title="npm downloads"
            />
          ) : (
            <p className={styles.unavailable}>{reasonLabel(data.npm.downloads.reason)}</p>
          )}
          {data.npm.package.ok ? (
            <p className={styles.footnote}>
              Site version {data.npm.package.data.siteVersion}. Published {formatDate(data.npm.package.data.publishedAt)}. {data.npm.package.data.drift ? "Version drift detected." : "Versions match."}
            </p>
          ) : (
            <p className={styles.unavailable}>{reasonLabel(data.npm.package.reason)}</p>
          )}
        </Panel>

        <Panel title="Health" subtitle="Request-time snapshot, not uptime history">
          <dl className={styles.healthList}>
            <div>
              <dt>Public site</dt>
              <dd>
                <StatusPill status={data.publicSite.status}>{data.publicSite.status}</StatusPill> {formatLatency(data.publicSite.latencyMs)} {data.publicSite.note ? `- ${data.publicSite.note}` : ""}
              </dd>
            </div>
            <div>
              <dt>Umami</dt>
              <dd><StatusPill status={resultStatus(data.traffic)}>{resultText(data.traffic)}</StatusPill></dd>
            </div>
            <div>
              <dt>npm registry</dt>
              <dd><StatusPill status={resultStatus(data.npm.package)}>{resultText(data.npm.package)}</StatusPill></dd>
            </div>
            <div>
              <dt>npm downloads API</dt>
              <dd><StatusPill status={resultStatus(data.npm.downloads)}>{resultText(data.npm.downloads)}</StatusPill></dd>
            </div>
          </dl>
          <p className={styles.footnote}>
            {data.deployment.environment} {data.deployment.branch ?? ""} {data.deployment.commit ?? ""} {data.deployment.region ?? ""} {data.deployment.nodeVersion}
          </p>
        </Panel>
      </div>
    </div>
  );
}
