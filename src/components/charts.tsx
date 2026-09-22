import { num } from "../i18n";
export const chartColors = [
  "#b4a0ed",
  "#7aafbc",
  "#a5b99c",
  "#c2ac8e",
  "#ae96b1",
];
export function ChartTooltip({
  active,
  payload,
  label,
  unit,
  labelPrefix = "",
}: {
  active?: boolean;
  payload?: readonly { value?: unknown; name?: unknown; color?: string }[];
  label?: unknown;
  unit?: string;
  labelPrefix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label != null && (
        <div className="chart-tooltip-label">
          {labelPrefix}{" "}
          {typeof label === "number" ? num(label, 3) : String(label)}
        </div>
      )}
      {payload.map((entry, index) => (
        <div className="chart-tooltip-row" key={index}>
          <span
            className="chart-tooltip-dot"
            style={{
              background:
                entry.color || chartColors[index % chartColors.length],
            }}
          />
          <span>{String(entry.name ?? "")}</span>
          <strong>
            {entry.value == null ? "—" : num(Number(entry.value), 3)}
            {unit && <small> {unit}</small>}
          </strong>
        </div>
      ))}
    </div>
  );
}
