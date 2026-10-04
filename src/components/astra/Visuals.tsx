import { useState } from "react";
import {
  Activity,
  Brain,
  Eye,
  Heart,
  Wind,
  Bone,
  Utensils,
  Smile,
  Scan,
} from "lucide-react";
import type { Observation, Report } from "@/lib/astra";

export const systems = [
  { id: "heart", label: "Cardiovascular", icon: Heart },
  { id: "lungs", label: "Respiratory", icon: Wind },
  { id: "brain", label: "Neurological", icon: Brain },
  { id: "muscle", label: "Muscle & bone", icon: Bone },
  { id: "digestive", label: "Digestive", icon: Utensils },
  { id: "vision", label: "Vision", icon: Eye },
  { id: "skin", label: "Skin", icon: Scan },
  { id: "mental", label: "Mental wellbeing", icon: Smile },
];

export function BodyMap({
  selected,
  onSelect,
  reports,
}: {
  selected: string;
  onSelect: (s: string) => void;
  reports: Report[];
}) {
  const info = systems.find((s) => s.id === selected)!;
  const related = reports.filter((r) => r.body_system === selected);
  return (
    <div className="body-layout">
      <div className="body-scan">
        <span className="scan-tag">SCHEMATIC VIEW</span>
        <svg
          viewBox="0 0 220 380"
          role="img"
          aria-label="Illustrative body diagram; does not measure organs"
        >
          <defs>
            <linearGradient id="bodyFill" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#52c8bc" stopOpacity=".19" />
              <stop offset="1" stopColor="#51b4d3" stopOpacity=".03" />
            </linearGradient>
          </defs>
          <g fill="none" stroke="#233b40" strokeWidth=".7">
            <path d="M20 95h180M20 160h180M20 230h180M20 300h180M110 15v350" />
            <ellipse cx="110" cy="185" rx="90" ry="153" />
            <ellipse cx="110" cy="185" rx="60" ry="153" />
          </g>
          <g fill="url(#bodyFill)" stroke="#5eb8b0" strokeWidth="1.2">
            <ellipse cx="110" cy="48" rx="24" ry="30" />
            <path d="M96 77v15L66 101 49 165 35 220 48 224 71 162 77 143 82 218 73 290 72 350 91 350 103 282 110 244 117 282 129 350 148 350 147 290 138 218 143 143 149 162 172 224 185 220 171 165 154 101 124 92V77" />
          </g>
          <g stroke="#5bada5" strokeWidth="1" fill="none" opacity=".6">
            <path d="M110 95v141M78 122h64M82 206h56M88 242l22-6 22 6M84 296h16M120 296h16" />
            <ellipse cx="96" cy="143" rx="13" ry="25" />
            <ellipse cx="124" cy="143" rx="13" ry="25" />
            <path d="M94 184q32-17 35 0t-35 13 30 13" />
            <path d="M99 50q-6-18 0-19t11 3 11-3 0 19" />
          </g>
          <circle
            className="scan-point"
            cx={
              selected === "brain" || selected === "vision"
                ? 110
                : selected === "heart"
                  ? 115
                  : selected === "lungs"
                    ? 96
                    : selected === "digestive"
                      ? 110
                      : selected === "muscle"
                        ? 85
                        : selected === "skin"
                          ? 165
                          : 110
            }
            cy={
              selected === "brain" || selected === "vision"
                ? 45
                : selected === "heart" || selected === "lungs"
                  ? 140
                  : selected === "digestive"
                    ? 190
                    : selected === "muscle"
                      ? 280
                      : selected === "skin"
                        ? 200
                        : 95
            }
            r="8"
          />
          <path d="M110 12v-5M110 365v8M18 185H8M202 185h10" stroke="#61cfbf" />
        </svg>
        <span className="scan-caption">
          <span className="tiny-dot" /> Select a system to explore
        </span>
      </div>
      <div className="systems-list">
        {systems.map((s) => (
          <button
            key={s.id}
            className={`system-row ${selected === s.id ? "selected" : ""}`}
            onClick={() => onSelect(s.id)}
          >
            <s.icon size={17} />
            <span>
              {s.label}
              <small>
                {reports.some((r) => r.body_system === s.id)
                  ? "Self-report available"
                  : "Not assessed"}
              </small>
            </span>
            <span className="system-dot" />
          </button>
        ))}
      </div>
      <div className="system-detail">
        <info.icon size={16} />
        <strong>{info.label}</strong>
        <span>
          {related.length
            ? `${related.length} self-report${related.length > 1 ? "s" : ""}. Reports do not establish a diagnosis.`
            : "No assessment available. This view does not scan or diagnose your body."}
        </span>
      </div>
    </div>
  );
}

export function Trend({
  observations,
  metric,
  days,
}: {
  observations: Observation[];
  metric: "heart_rate" | "sleep_hours" | "spo2";
  days: number;
}) {
  const [now] = useState(() => Date.now());
  const points = observations
    .filter(
      (o) =>
        o[metric] !== null && Date.parse(o.created_at) >= now - days * 86400000,
    )
    .slice(0, 30)
    .reverse();
  if (points.length < 2)
    return (
      <div className="empty-chart">
        <Activity size={30} />
        <p>Log at least two measurements to see your trend.</p>
        <small>No measurements are inferred.</small>
      </div>
    );
  const values = points.map((p) => p[metric]!);
  const low = Math.min(...values) - 2,
    high = Math.max(...values) + 2;
  const xy = values.map(
    (v, i) =>
      `${20 + (i * 580) / (values.length - 1)},${165 - ((v - low) * 125) / (high - low)}`,
  );
  return (
    <div
      className="chart"
      aria-label={`${metric} trend from ${points.length} recorded measurements`}
    >
      <svg
        viewBox="0 0 630 210"
        role="img"
        aria-label="Trend chart of recorded values"
      >
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#62d6c1" stopOpacity=".2" />
            <stop offset="1" stopColor="#62d6c1" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[40, 80, 120, 160].map((y) => (
          <line
            key={y}
            x1="20"
            x2="600"
            y1={y}
            y2={y}
            stroke="#253339"
            strokeDasharray="3 5"
          />
        ))}
        <polygon
          points={`20,180 ${xy.join(" ")} 600,180`}
          fill="url(#chartFill)"
        />
        <polyline
          points={xy.join(" ")}
          fill="none"
          stroke="#66d6c0"
          strokeWidth="2.5"
        />
        {xy.map((p, i) => {
          const [x, y] = p.split(",");
          return (
            <g key={points[i].id}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="#101b20"
                stroke="#66d6c0"
                strokeWidth="2"
              />
              <text
                x={x}
                y={Number(y) - 12}
                textAnchor="middle"
                fill="#bfd1d1"
                fontSize="11"
              >
                {values[i]}
              </text>
            </g>
          );
        })}
        {[0, points.length - 1].map((i) => (
          <text
            key={i}
            x={i === 0 ? 20 : 600}
            y="202"
            textAnchor={i === 0 ? "start" : "end"}
            fill="#728b92"
            fontSize="11"
          >
            {new Date(points[i].created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </text>
        ))}
      </svg>
      <div className="chart-legend">
        <span className="tiny-dot" />
        Recorded measurements{" "}
        <span>{points.length} entries · no diagnostic interpretation</span>
      </div>
    </div>
  );
}
