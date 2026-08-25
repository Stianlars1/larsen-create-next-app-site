import type { ReactNode } from "react";

import styles from "./dashboard.module.css";

export function Panel({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className={styles.panel}>
      <header className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>{title}</h2>
        {subtitle ? <p className={styles.panelSubtitle}>{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{value}</strong>
      {hint ? <span className={styles.statHint}>{hint}</span> : null}
    </div>
  );
}

export function StatusPill({
  children,
  status,
}: {
  children: ReactNode;
  status: "up" | "down" | "unknown";
}) {
  return (
    <span className={styles.status} data-status={status}>
      {children}
    </span>
  );
}

export function BarList({
  rows,
  title,
}: {
  rows: Array<{ label: string; value: number }>;
  title: string;
}) {
  if (rows.length === 0) return <p className={styles.empty}>No data yet.</p>;
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <ul className={styles.barList} aria-label={title}>
      {rows.map((row) => (
        <li className={styles.barRow} key={row.label}>
          <span>{row.label}</span>
          <span className={styles.barTrack} aria-hidden="true">
            <span className={styles.barFill} style={{ inlineSize: `${(row.value / max) * 100}%` }} />
          </span>
          <strong>{row.value.toLocaleString("en-US")}</strong>
        </li>
      ))}
    </ul>
  );
}

type Series = { name: string; values: number[] };

function points(values: number[], max: number, width: number, height: number): string {
  if (values.length === 0) return "";
  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - (value / max) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

export function TimeSeries({
  labels,
  series,
  title,
}: {
  labels: string[];
  series: Series[];
  title: string;
}) {
  const values = series.flatMap((entry) => entry.values);
  if (labels.length === 0 || values.length === 0) return <p className={styles.empty}>No data yet.</p>;
  const max = Math.max(...values, 1);
  const width = 640;
  const height = 160;

  return (
    <figure className={styles.chart} aria-label={title}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        <title>{title}</title>
        {series.map((entry, index) => (
          <polyline
            className={styles.chartLine}
            data-series={String(index)}
            fill="none"
            key={entry.name}
            points={points(entry.values, max, width, height)}
          />
        ))}
      </svg>
      <figcaption className={styles.chartCaption}>
        {series.map((entry) => `${entry.name}: ${entry.values.reduce((sum, value) => sum + value, 0)}`).join(". ")}
      </figcaption>
    </figure>
  );
}
