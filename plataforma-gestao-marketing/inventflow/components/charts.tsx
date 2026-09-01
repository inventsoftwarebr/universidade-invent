import type { ReactNode } from "react";

/**
 * Gráficos em SVG servidos pelo servidor, sem biblioteca de charts.
 *
 * Regras que valem para todos, e que a revisão deve cobrar:
 * - uma escala só por gráfico (nunca dois eixos Y);
 * - cor por identidade, vinda dos tokens validados (--cat-*, --flow-*, status);
 * - grade em fio sólido e recuado, marca fina, rótulo seletivo;
 * - todo gráfico tem uma visão em tabela — cor nunca é o único caminho para o dado;
 * - todo valor tem <title>, que o navegador mostra ao passar o mouse.
 */

export interface TableView {
  head: string[];
  rows: (string | number)[][];
}

export function Viz({
  id,
  name,
  ask,
  foot,
  table,
  children,
}: {
  id: string;
  name: string;
  ask: string;
  foot?: ReactNode;
  table?: TableView;
  children: ReactNode;
}) {
  return (
    <figure className="viz" style={{ margin: 0 }}>
      <header>
        <span className="id">{id}</span>
        <p className="name">{name}</p>
        <p className="ask">{ask}</p>
      </header>
      <div className="plot">{children}</div>
      {table ? (
        <details className="panel">
          <summary>Ver dados</summary>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  {table.head.map((cell, index) => (
                    <th key={cell} className={index === 0 ? undefined : "num"}>
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={String(row[0])}>
                    {row.map((cell, index) => (
                      <td key={index} className={index === 0 ? undefined : "num"}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
      {foot ? <figcaption className="foot">{foot}</figcaption> : null}
    </figure>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="legend">
      {items.map((item) => (
        <span key={item.label}>
          <i style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function NoData({ children }: { children: ReactNode }) {
  return <p className="pending">{children}</p>;
}

const AXIS = { fontSize: 10, fill: "var(--muted)", fontFamily: "var(--mono)" } as const;
const LABEL = { fontSize: 11, fill: "var(--ink-soft)" } as const;

/* ----------------------------- rosca (part-to-whole) -------------------- */

export function Donut({
  segments,
  total,
  centerLabel,
}: {
  segments: { label: string; value: number; color: string }[];
  total: number;
  centerLabel: string;
}) {
  const size = 168;
  const radius = 62;
  const stroke = 22;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img"
        aria-label={`Distribuição: ${segments.map((s) => `${s.label} ${s.value}`).join(", ")}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={stroke}
        />
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((segment) => {
              const fraction = segment.value / total;
              // 2px de respiro entre fatias, em vez de contorno.
              const length = Math.max(0, fraction * circumference - 2);
              const dash = `${length} ${circumference - length}`;
              const rotation = (offset / total) * 360 - 90;
              offset += segment.value;
              return (
                <circle
                  key={segment.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={stroke}
                  strokeDasharray={dash}
                  transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
                >
                  <title>{`${segment.label}: ${segment.value}`}</title>
                </circle>
              );
            })}
        <text
          x={size / 2}
          y={size / 2 - 2}
          textAnchor="middle"
          style={{ fontSize: 30, fontWeight: 600, fill: "var(--ink)" }}
        >
          {total}
        </text>
        <text x={size / 2} y={size / 2 + 16} textAnchor="middle" style={AXIS}>
          {centerLabel}
        </text>
      </svg>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 7 }}>
        {segments.map((segment) => (
          <li key={segment.label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <i
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: segment.color,
                flex: "none",
              }}
            />
            <span style={{ fontSize: 13.5 }}>{segment.label}</span>
            <strong style={{ fontVariantNumeric: "tabular-nums", marginLeft: "auto" }}>
              {segment.value}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------- linha ---------------------------------- */

export function LineChart({
  points,
  target,
  format,
  color = "var(--cat-1)",
  maxY,
}: {
  points: { label: string; value: number | null }[];
  target?: { value: number; label: string };
  format: (value: number) => string;
  color?: string;
  maxY?: number;
}) {
  const w = 520;
  const h = 180;
  const pad = { top: 14, right: 46, bottom: 26, left: 38 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const values = points.map((p) => p.value).filter((v): v is number => v !== null);
  const top = maxY ?? Math.max(1, ...values) * 1.15;

  const x = (index: number) =>
    pad.left + (points.length <= 1 ? plotW / 2 : (index / (points.length - 1)) * plotW);
  const y = (value: number) => pad.top + plotH - (value / top) * plotH;

  const drawn = points
    .map((p, i) => ({ ...p, i }))
    .filter((p): p is { label: string; value: number; i: number } => p.value !== null);

  const path = drawn
    .map((p, index) => `${index === 0 ? "M" : "L"} ${x(p.i).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(" ");

  const last = drawn.at(-1);
  const ticks = [0, top / 2, top];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label="Série ao longo do tempo">
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={pad.left}
            x2={w - pad.right}
            y1={y(tick)}
            y2={y(tick)}
            stroke="var(--grid)"
            strokeWidth="1"
          />
          <text x={pad.left - 6} y={y(tick) + 3.5} textAnchor="end" style={AXIS}>
            {format(tick)}
          </text>
        </g>
      ))}

      {target ? (
        <g>
          <line
            x1={pad.left}
            x2={w - pad.right}
            y1={y(target.value)}
            y2={y(target.value)}
            stroke="var(--ok)"
            strokeWidth="1.5"
            opacity="0.7"
          />
          <text x={w - pad.right + 4} y={y(target.value) + 3.5} style={{ ...AXIS, fill: "var(--ok)" }}>
            {target.label}
          </text>
        </g>
      ) : null}

      {path ? <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" /> : null}

      {drawn.map((p) => (
        <circle key={p.label} cx={x(p.i)} cy={y(p.value)} r="4" fill={color}>
          <title>{`${p.label}: ${format(p.value)}`}</title>
        </circle>
      ))}

      {last ? (
        <text
          x={x(last.i)}
          y={Math.max(11, y(last.value) - 11)}
          textAnchor={last.i === points.length - 1 ? "end" : "middle"}
          style={{ ...LABEL, fontWeight: 600 }}
        >
          {format(last.value)}
        </text>
      ) : null}

      {points.map((p, index) =>
        // Espaçados a partir do fim: o último rótulo sempre aparece e nenhum
        // encosta no vizinho.
        (points.length - 1 - index) % Math.ceil(points.length / 6) === 0 ? (
          <text key={p.label} x={x(index)} y={h - 8} textAnchor="middle" style={AXIS}>
            {p.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

/* --------------------------- barras horizontais ------------------------- */

export function GroupedBars({
  rows,
  series,
  format,
}: {
  rows: { label: string; values: number[] }[];
  series: { label: string; color: string }[];
  format: (value: number) => string;
}) {
  const rowHeight = 40;
  const w = 520;
  const labelW = 152;
  const h = rows.length * rowHeight + 12;
  const plotW = w - labelW - 56;
  const max = Math.max(1, ...rows.flatMap((r) => r.values));
  const barH = series.length > 1 ? 9 : 12;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label="Barras comparativas">
      {rows.map((row, index) => {
        const top = index * rowHeight + 8;
        return (
          <g key={row.label}>
            <text x={0} y={top + (series.length * (barH + 2)) / 2 + 3} style={LABEL}>
              {row.label.length > 22 ? `${row.label.slice(0, 21)}…` : row.label}
            </text>
            {row.values.map((value, seriesIndex) => {
              const width = (value / max) * plotW;
              const y = top + seriesIndex * (barH + 2);
              return (
                <g key={seriesIndex}>
                  <rect
                    x={labelW}
                    y={y}
                    width={Math.max(1, width)}
                    height={barH}
                    rx="3"
                    fill={series[seriesIndex]?.color ?? "var(--cat-1)"}
                  >
                    <title>{`${row.label} — ${series[seriesIndex]?.label}: ${format(value)}`}</title>
                  </rect>
                  <text x={labelW + Math.max(1, width) + 6} y={y + barH - 1} style={AXIS}>
                    {format(value)}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

/* --------------------------- barras empilhadas -------------------------- */

export function StackedBars({
  groups,
  series,
}: {
  groups: { label: string; values: number[] }[];
  series: { label: string; color: string }[];
}) {
  const w = 520;
  const h = 180;
  const pad = { top: 14, right: 10, bottom: 26, left: 30 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const max = Math.max(1, ...groups.map((g) => g.values.reduce((a, b) => a + b, 0)));
  const slot = plotW / Math.max(1, groups.length);
  const barW = Math.min(34, slot * 0.62);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label="Barras empilhadas por período">
      {[0, max / 2, max].map((tick) => {
        const y = pad.top + plotH - (tick / max) * plotH;
        return (
          <g key={tick}>
            <line x1={pad.left} x2={w - pad.right} y1={y} y2={y} stroke="var(--grid)" strokeWidth="1" />
            <text x={pad.left - 6} y={y + 3.5} textAnchor="end" style={AXIS}>
              {Math.round(tick)}
            </text>
          </g>
        );
      })}

      {groups.map((group, index) => {
        const cx = pad.left + slot * index + slot / 2;
        let cursor = pad.top + plotH;
        return (
          <g key={group.label}>
            {group.values.map((value, seriesIndex) => {
              const height = (value / max) * plotH;
              // 2px de fundo entre segmentos, em vez de contorno.
              const drawn = Math.max(0, height - 2);
              cursor -= height;
              if (value === 0) return null;
              return (
                <rect
                  key={seriesIndex}
                  x={cx - barW / 2}
                  y={cursor}
                  width={barW}
                  height={drawn}
                  rx="2"
                  fill={series[seriesIndex]?.color ?? "var(--cat-1)"}
                >
                  <title>{`${group.label} — ${series[seriesIndex]?.label}: ${value}`}</title>
                </rect>
              );
            })}
            {(groups.length - 1 - index) % Math.ceil(groups.length / 6) === 0 ? (
              <text x={cx} y={h - 8} textAnchor="middle" style={AXIS}>
                {group.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------ área empilhada -------------------------- */

export function StackedArea({
  days,
  series,
}: {
  days: string[];
  series: { label: string; color: string; values: number[] }[];
}) {
  const w = 520;
  const h = 190;
  const pad = { top: 14, right: 10, bottom: 26, left: 32 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const totals = days.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0));
  const max = Math.max(1, ...totals);

  const x = (index: number) =>
    pad.left + (days.length <= 1 ? plotW / 2 : (index / (days.length - 1)) * plotW);
  const y = (value: number) => pad.top + plotH - (value / max) * plotH;

  let base = days.map(() => 0);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label="Fluxo acumulado de tarefas">
      {[0, max / 2, max].map((tick) => (
        <g key={tick}>
          <line x1={pad.left} x2={w - pad.right} y1={y(tick)} y2={y(tick)} stroke="var(--grid)" strokeWidth="1" />
          <text x={pad.left - 6} y={y(tick) + 3.5} textAnchor="end" style={AXIS}>
            {Math.round(tick)}
          </text>
        </g>
      ))}

      {series.map((s) => {
        const upper = base.map((b, i) => b + (s.values[i] ?? 0));
        const top = upper.map((value, i) => `${x(i).toFixed(1)},${y(value).toFixed(1)}`).join(" ");
        const bottom = [...base]
          .map((value, i) => ({ value, i }))
          .reverse()
          .map(({ value, i }) => `${x(i).toFixed(1)},${y(value).toFixed(1)}`)
          .join(" ");
        base = upper;
        return (
          <polygon key={s.label} points={`${top} ${bottom}`} fill={s.color} stroke="var(--surface)" strokeWidth="1">
            <title>{s.label}</title>
          </polygon>
        );
      })}

      {days.map((day, index) =>
        index % Math.ceil(days.length / 5) === 0 || index === days.length - 1 ? (
          <text key={day} x={x(index)} y={h - 8} textAnchor="middle" style={AXIS}>
            {day.slice(8, 10)}/{day.slice(5, 7)}
          </text>
        ) : null,
      )}
    </svg>
  );
}

/* ------------------------------ dispersão ------------------------------- */

export function AgingPlot({
  points,
  alertDays,
}: {
  points: { label: string; days: number; group: string; color: string }[];
  alertDays: number;
}) {
  const w = 520;
  const h = 190;
  const pad = { top: 16, right: 14, bottom: 30, left: 72 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const maxDays = Math.max(alertDays + 4, ...points.map((p) => p.days));

  const groups = [...new Set(points.map((p) => p.group))];
  const y = (group: string) =>
    pad.top + plotH - ((groups.indexOf(group) + 0.5) / groups.length) * plotH;
  const x = (days: number) => pad.left + (days / maxDays) * plotW;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label="Envelhecimento das tarefas em andamento">
      {groups.map((group) => (
        <g key={group}>
          <line x1={pad.left} x2={w - pad.right} y1={y(group)} y2={y(group)} stroke="var(--grid)" strokeWidth="1" />
          <text x={pad.left - 6} y={y(group) + 3.5} textAnchor="end" style={{ ...AXIS, fontSize: 9 }}>
            {group}
          </text>
        </g>
      ))}

      <line
        x1={x(alertDays)}
        x2={x(alertDays)}
        y1={pad.top - 4}
        y2={pad.top + plotH}
        stroke="var(--warn)"
        strokeWidth="1.5"
      />
      <text x={x(alertDays) + 4} y={pad.top + 2} style={{ ...AXIS, fill: "var(--warn)" }}>
        {alertDays}d
      </text>

      {points.map((point, index) => (
        <circle
          key={`${point.label}-${index}`}
          cx={x(point.days)}
          cy={y(point.group) + ((index % 5) - 2) * 3}
          r="5"
          fill={point.color}
          stroke="var(--surface)"
          strokeWidth="2"
        >
          <title>{`${point.label} — ${point.days} dias em aberto`}</title>
        </circle>
      ))}

      {[0, Math.round(maxDays / 2), Math.round(maxDays)].map((tick) => (
        <text key={tick} x={x(tick)} y={h - 9} textAnchor="middle" style={AXIS}>
          {tick}d
        </text>
      ))}
    </svg>
  );
}

/* ------------------------------ mini série ------------------------------ */

export function Sparkline({
  values,
  target,
}: {
  values: (number | null)[];
  target: number | null;
}) {
  const w = 120;
  const h = 30;
  const clean = values.filter((v): v is number => v !== null);
  if (clean.length < 2) return <span className="muted mono" style={{ fontSize: 11 }}>sem série</span>;

  const max = Math.max(...clean, target ?? 0) * 1.1 || 1;
  const x = (i: number) => (i / (values.length - 1)) * (w - 4) + 2;
  const y = (v: number) => h - 3 - (v / max) * (h - 8);

  const path = values
    .map((v, i) => (v === null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`))
    .filter((p): p is string => p !== null)
    .join(" ");

  const lastIndex = values.length - 1;
  const lastValue = values[lastIndex];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label="Série do indicador">
      {target !== null ? (
        <line x1="2" x2={w - 2} y1={y(target)} y2={y(target)} stroke="var(--ok)" strokeWidth="1" opacity="0.6" />
      ) : null}
      <polyline points={path} fill="none" stroke="var(--cat-1)" strokeWidth="2" strokeLinejoin="round" />
      {typeof lastValue === "number" ? (
        <circle cx={x(lastIndex)} cy={y(lastValue)} r="3" fill="var(--cat-1)" />
      ) : null}
    </svg>
  );
}

/* ---------------------- barras com marcador (P85) ----------------------- */

export function BarsWithMarker({
  rows,
  format,
}: {
  rows: { label: string; value: number; marker: number | null; count: number }[];
  format: (value: number) => string;
}) {
  const w = 520;
  const rowHeight = 46;
  const labelW = 152;
  const h = rows.length * rowHeight + 8;
  const plotW = w - labelW - 62;
  const max = Math.max(1, ...rows.flatMap((r) => [r.value, r.marker ?? 0]));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label="Tempo de ciclo médio e P85">
      {rows.map((row, index) => {
        const top = index * rowHeight + 10;
        const width = Math.max(1, (row.value / max) * plotW);
        return (
          <g key={row.label}>
            <text x={0} y={top + 11} style={LABEL}>
              {row.label}
            </text>
            <text x={0} y={top + 25} style={{ ...AXIS, fontSize: 9 }}>
              {row.count} tarefas
            </text>
            <rect x={labelW} y={top} width={width} height="12" rx="3" fill="var(--cat-1)">
              <title>{`${row.label} — média ${format(row.value)}`}</title>
            </rect>
            <text x={labelW + width + 6} y={top + 11} style={AXIS}>
              {format(row.value)}
            </text>
            {row.marker !== null ? (
              <g>
                <line
                  x1={labelW + (row.marker / max) * plotW}
                  x2={labelW + (row.marker / max) * plotW}
                  y1={top - 4}
                  y2={top + 16}
                  stroke="var(--cat-2)"
                  strokeWidth="2.5"
                >
                  <title>{`P85: ${format(row.marker)}`}</title>
                </line>
                <text
                  x={labelW + (row.marker / max) * plotW}
                  y={top + 28}
                  textAnchor="middle"
                  style={{ ...AXIS, fill: "var(--cat-2)" }}
                >
                  P85 {format(row.marker)}
                </text>
              </g>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------ barra única ----------------------------- */

/** Divisão de um todo em duas partes — mais legível que uma rosca de 2 fatias. */
export function SplitBar({
  parts,
  format,
}: {
  parts: { label: string; value: number; color: string }[];
  format: (value: number) => string;
}) {
  const total = parts.reduce((sum, p) => sum + p.value, 0);
  if (total === 0) return <NoData>Sem esforço estimado registrado.</NoData>;

  return (
    <div>
      <div style={{ display: "flex", gap: 2, height: 26, borderRadius: 3, overflow: "hidden" }}>
        {parts.map((part) => (
          <div
            key={part.label}
            title={`${part.label}: ${format(part.value)}`}
            style={{
              width: `${(part.value / total) * 100}%`,
              background: part.color,
            }}
          />
        ))}
      </div>
      <div className="legend" style={{ marginTop: 10 }}>
        {parts.map((part) => (
          <span key={part.label}>
            <i style={{ background: part.color }} />
            {part.label} — <strong>{Math.round((part.value / total) * 100)}%</strong>{" "}
            <span className="muted">({format(part.value)})</span>
          </span>
        ))}
      </div>
    </div>
  );
}
