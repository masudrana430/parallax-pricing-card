"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  ChevronRight,
  Download,
  Heart,
  LayoutDashboard,
  LogOut,
  Plus,
  ShieldCheck,
  Sparkles,
  Thermometer,
  UserRound,
  Wind,
  Moon,
  ClipboardList,
  LoaderCircle,
  Menu,
  X,
} from "lucide-react";
import {
  api,
  copy,
  languages,
  type Dashboard,
  type Language,
  type Observation,
  type View,
} from "@/lib/astra";
import { Auth, CheckIn, Logo, ProfileForm } from "./Forms";
import { BodyMap, Trend } from "./Visuals";
import { AssessmentCard, Assistant } from "./Assistant";

export default function AstraApp() {
  const [data, setData] = useState<Dashboard | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [view, setView] = useState<View>("overview"),
    [language, setLanguage] = useState<Language>("en"),
    [checkin, setCheckin] = useState(false),
    [mobile, setMobile] = useState(false);
  const refresh = useCallback(async () => {
    const d = await api<Dashboard>("dashboard");
    setData(d);
    setError("");
  }, []);
  useEffect(() => {
    api<Dashboard>("dashboard")
      .then((d) => {
        setData(d);
        setLanguage(d.user.profile.language || "en");
      })
      .catch((e) => {
        if (e.status !== 401) setError(e.message);
      })
      .finally(() => setLoading(false));
  }, []);
  const ready = useCallback(async () => {
    await refresh();
    setView("overview");
  }, [refresh]);
  const t = copy[language === "bn" ? "bn" : "en"];
  async function logout() {
    try {
      await api("auth/logout", { method: "POST" });
      setData(null);
      setView("overview");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function exportData() {
    try {
      const payload = await api("export");
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "astra-health-records.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (loading)
    return (
      <div className="loading-screen">
        <Logo />
        <LoaderCircle className="spin" />
        <p>{t.loading}</p>
      </div>
    );
  if (!data)
    return (
      <>
        {error && (
          <div className="service-error" role="alert">
            {error}
            <button onClick={() => location.reload()}>Retry connection</button>
          </div>
        )}
        <Auth onReady={ready} />
      </>
    );
  const nav: [View, typeof Activity][] = [
    ["overview", LayoutDashboard],
    ["assistant", Sparkles],
    ["records", ClipboardList],
    ["profile", UserRound],
    ["resources", BookOpen],
  ];
  const profileComplete = !!data.user.profile.name;
  function navigate(v: View) {
    setView(v);
    setMobile(false);
  }
  return (
    <div className="workspace">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <div className="sidebar-top">
          <Logo />
          <button
            className="mobile-close icon-btn"
            aria-label="Close navigation"
            onClick={() => setMobile(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">PERSONAL WORKSPACE</div>
        <nav aria-label="Main navigation">
          {nav.map(([v, Icon]) => (
            <button
              key={v}
              className={`nav-item ${view === v ? "active" : ""}`}
              onClick={() => navigate(v)}
            >
              <Icon size={18} />
              <span>{t[v]}</span>
              {v === "assistant" && <span className="nav-ai">AI</span>}
            </button>
          ))}
        </nav>
        <div className="mission-card">
          <div className="mission-orbit">
            <Activity size={19} />
          </div>
          <span className="eyebrow">MISSION CONTEXT</span>
          <p>{data.user.profile.mission || "Add your mission"}</p>
          <span className="muted">
            {data.user.demo
              ? "Simulated environment"
              : "Self-reported information"}
          </span>
          <button onClick={() => navigate("profile")}>
            View profile
            <ArrowRight size={14} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <div className="user-chip">
            <div className="avatar">{data.user.profile.name?.[0] || "A"}</div>
            <div>
              <strong>{data.user.profile.name || "New explorer"}</strong>
              <span>{data.user.demo ? t.demo : "Personal account"}</span>
            </div>
          </div>
          <button onClick={logout} className="logout">
            <LogOut size={16} />
            {t.logout}
          </button>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-btn"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{t[view]}</strong>
          </div>
          <div className="topbar-actions">
            <span className="prototype-badge">
              <span className="tiny-dot" />
              Prototype
            </span>
            <select
              aria-label="Input language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            <button
              className="notification-btn icon-btn"
              aria-label={`${data.alerts.length} reports need review`}
              onClick={() => navigate("records")}
            >
              <Bell size={18} />
              {data.alerts.length > 0 && <span className="notification-dot" />}
            </button>
            <div className="avatar small-avatar">
              {data.user.profile.name?.[0] || "A"}
            </div>
          </div>
        </header>
        <main id="main" className="content">
          {data.user.demo && (
            <div className="demo-banner">
              <Sparkles size={15} />
              <span>
                Sample mission · All measurements are synthetic. Your changes
                stay in this demo workspace.
              </span>
            </div>
          )}
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
          {!profileComplete ? (
            <ProfileForm
              user={data.user}
              language={language}
              onSaved={refresh}
            />
          ) : (
            <>
              {view === "overview" && (
                <Overview
                  data={data}
                  language={language}
                  onReport={() => navigate("assistant")}
                  onCheckin={() => setCheckin(true)}
                  onRecords={() => navigate("records")}
                />
              )}{" "}
              {view === "assistant" && (
                <Assistant data={data} language={language} refresh={refresh} />
              )}{" "}
              {view === "profile" && (
                <ProfileForm
                  user={data.user}
                  language={language}
                  onSaved={refresh}
                />
              )}{" "}
              {view === "records" && (
                <Records
                  data={data}
                  exportData={exportData}
                  onCheckin={() => setCheckin(true)}
                  refresh={refresh}
                />
              )}{" "}
              {view === "resources" && <Resources />}
            </>
          )}
          <footer className="workspace-footer">
            <ShieldCheck size={13} />
            {t.prototype}
            <span>Made for a more informed journey.</span>
          </footer>
        </main>
      </div>
      {checkin && (
        <CheckIn onClose={() => setCheckin(false)} onSaved={refresh} />
      )}
    </div>
  );
}

function Overview({
  data,
  language,
  onReport,
  onCheckin,
  onRecords,
}: {
  data: Dashboard;
  language: Language;
  onReport: () => void;
  onCheckin: () => void;
  onRecords: () => void;
}) {
  const [selected, setSelected] = useState("heart"),
    [metric, setMetric] = useState<"heart_rate" | "sleep_hours" | "spo2">(
      "heart_rate",
    ),
    [days, setDays] = useState(7);
  const t = copy[language === "bn" ? "bn" : "en"];
  const latest = data.latest;
  const cards = [
    {
      name: t.heart,
      value: latest?.heart_rate,
      unit: "bpm",
      Icon: Heart,
      color: "rose",
    },
    {
      name: t.oxygen,
      value: latest?.spo2,
      unit: "%",
      Icon: Wind,
      color: "blue",
    },
    {
      name: t.temperature,
      value: latest?.temperature,
      unit: "°C",
      Icon: Thermometer,
      color: "amber",
    },
    {
      name: t.sleep,
      value: latest?.sleep_hours,
      unit: "hrs",
      Icon: Moon,
      color: "violet",
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">MISSION HEALTH OVERVIEW</div>
          <h1>{t.hello}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="heading-actions">
          <button className="btn secondary" onClick={onCheckin}>
            <Plus size={16} />
            {t.checkin}
          </button>
          <button className="btn primary" onClick={onReport}>
            <Sparkles size={16} />
            {t.report}
          </button>
        </div>
      </div>
      <section className="welcome-strip">
        <div>
          <span className="tiny-dot" />
          <strong>
            {language === "bn" ? "স্বাগতম" : "Welcome back"},{" "}
            {data.user.profile.name.split(" ")[0]}.
          </strong>
          <span>
            {data.alerts.length
              ? `${data.alerts.length} report${data.alerts.length > 1 ? "s" : ""} waiting for your review.`
              : "Your workspace is ready for your next check-in."}
          </span>
        </div>
        <button onClick={onRecords}>
          View records
          <ArrowRight size={15} />
        </button>
      </section>
      <div className="metric-grid">
        {cards.map(({ name, value, unit, Icon, color }) => (
          <section className="metric-card" key={name}>
            <div className="metric-title">
              <span>{name}</span>
              <div className={`metric-icon ${color}`}>
                <Icon size={17} />
              </div>
            </div>
            <div className="metric-value">
              {value ?? "—"}
              <small>{value != null ? unit : ""}</small>
            </div>
            <div className="metric-bottom">
              <span
                className={`metric-state ${value != null ? "has-data" : ""}`}
              >
                <span className="tiny-dot" />
                {value != null ? t.recorded : t.unknown}
              </span>
              <small>
                {value != null && latest
                  ? new Date(latest.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  : "Add a check-in"}
              </small>
            </div>
          </section>
        ))}
      </div>
      <div className="overview-grid">
        <section className="panel body-panel">
          <div className="panel-heading">
            <div>
              <h2>{t.body}</h2>
              <p>Explore your available information.</p>
            </div>
            <span className="badge">8 SYSTEMS</span>
          </div>
          <BodyMap
            selected={selected}
            onSelect={setSelected}
            reports={data.reports}
          />
        </section>
        <div className="overview-right">
          <section className="panel trend-panel">
            <div className="panel-heading">
              <div>
                <h2>{t.trends}</h2>
                <p>Changes in what you recorded.</p>
              </div>
              <select
                aria-label="Trend period"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              >
                <option value="7">7 days</option>
                <option value="30">30 days</option>
              </select>
            </div>
            <div className="segmented">
              {(
                [
                  ["heart_rate", t.heart],
                  ["sleep_hours", t.sleep],
                  ["spo2", t.oxygen],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  className={metric === key ? "active" : ""}
                  onClick={() => setMetric(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <Trend
              observations={data.observations}
              metric={metric}
              days={days}
            />
          </section>
          <section className="companion-card">
            <div className="companion-icon">
              <Sparkles size={23} />
            </div>
            <span className="eyebrow">MEET YOUR HEALTH COMPANION</span>
            <h2>
              Have a question?
              <br />
              Start with Astra.
            </h2>
            <p>
              Share what you&apos;re feeling, in your own words. We&apos;ll help
              organize the next step.
            </p>
            <button onClick={onReport}>
              Talk to Astra
              <ArrowRight size={16} />
            </button>
            <div className="companion-orbit" aria-hidden="true" />
          </section>
        </div>
      </div>
      <section className="panel activity-panel">
        <div className="panel-heading">
          <div>
            <h2>{t.activity}</h2>
            <p>A timeline of what you shared.</p>
          </div>
          <button className="text-button" onClick={onRecords}>
            All records
            <ArrowRight size={14} />
          </button>
        </div>
        {data.reports.length ? (
          data.reports.slice(0, 3).map((r) => (
            <button className="activity-row" key={r.id} onClick={onRecords}>
              <div className="activity-icon">
                <ClipboardList size={17} />
              </div>
              <div>
                <strong>
                  {r.text.slice(0, 85)}
                  {r.text.length > 85 ? "…" : ""}
                </strong>
                <small>
                  {new Date(r.created_at).toLocaleString()} · {r.body_system}
                </small>
              </div>
              <span className={`status-chip ${r.assessment.urgency}`}>
                {r.assessment.title}
              </span>
              <ChevronRight size={16} />
            </button>
          ))
        ) : (
          <div className="empty-state">
            <ClipboardList size={24} />
            <span>{t.noReports}</span>
            <button onClick={onReport}>
              Share your first report
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </section>
    </>
  );
}

function Records({
  data,
  exportData,
  onCheckin,
  refresh,
}: {
  data: Dashboard;
  exportData: () => Promise<void>;
  onCheckin: () => void;
  refresh: () => Promise<void>;
}) {
  const [tab, setTab] = useState("measurements");
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR PERSONAL TIMELINE</span>
          <h1>Health records</h1>
          <p>Measurements and reports, saved with context.</p>
        </div>
        <div className="heading-actions">
          <button className="btn secondary" onClick={exportData}>
            <Download size={16} />
            Export my records
          </button>
          <button className="btn primary" onClick={onCheckin}>
            <Plus size={16} />
            Log a check-in
          </button>
        </div>
      </div>
      <div className="tabs">
        <button
          className={tab === "measurements" ? "active" : ""}
          onClick={() => setTab("measurements")}
        >
          Measurements <span>{data.observations.length}</span>
        </button>
        <button
          className={tab === "reports" ? "active" : ""}
          onClick={() => setTab("reports")}
        >
          Symptom reports <span>{data.reports.length}</span>
        </button>
      </div>
      {tab === "measurements" ? (
        <section className="panel records-panel">
          {data.observations.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {[
                      "Recorded at",
                      "Heart · bpm",
                      "Oxygen · %",
                      "Temp · °C",
                      "Blood pressure",
                      "Sleep · hrs",
                      "Mood / notes",
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.observations.map((o: Observation) => (
                    <tr key={o.id}>
                      <td>{new Date(o.created_at).toLocaleString()}</td>
                      <td>{o.heart_rate ?? "—"}</td>
                      <td>{o.spo2 ?? "—"}</td>
                      <td>{o.temperature ?? "—"}</td>
                      <td>
                        {o.systolic != null
                          ? `${o.systolic}/${o.diastolic}`
                          : "—"}
                      </td>
                      <td>{o.sleep_hours ?? "—"}</td>
                      <td>
                        {o.mood}
                        <small>{o.notes}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <Activity size={24} />
              <p>No measurements yet. Add your first check-in.</p>
            </div>
          )}
        </section>
      ) : (
        <div className="report-list">
          {data.reports.length ? (
            data.reports.map((r) => (
              <section className="panel" key={r.id}>
                <div className="panel-heading">
                  <div>
                    <h3>{r.text}</h3>
                    <p>
                      {new Date(r.created_at).toLocaleString()} ·{" "}
                      {r.body_system} · Severity {r.severity}/10
                    </p>
                  </div>
                </div>
                <AssessmentCard report={r} onReviewed={refresh} />
              </section>
            ))
          ) : (
            <section className="panel empty-state">
              No symptom reports yet.
            </section>
          )}
        </div>
      )}
    </>
  );
}

function Resources() {
  const sources = [
    {
      title: "Autonomous medical operations",
      org: "NASA",
      url: "https://www.nasa.gov/directorates/stmd/game-changing-development-program/autonomous-medical-operations-amo/",
      description:
        "How autonomous decision support can assist crew medical personnel.",
    },
    {
      title: "Spaceflight hazards",
      org: "NASA",
      url: "https://www.nasa.gov/ochmo-hmta-human-spaceflight-hazards/",
      description:
        "Radiation, isolation, distance from Earth, gravity and closed environments.",
    },
    {
      title: "Chest pain",
      org: "NHS",
      url: "https://www.nhs.uk/symptoms/chest-pain/",
      description:
        "Public information on warning signs and seeking assessment.",
    },
    {
      title: "Shortness of breath",
      org: "NHS",
      url: "https://www.nhs.uk/symptoms/shortness-of-breath/",
      description: "Public information on urgent breathing symptoms.",
    },
    {
      title: "Dizziness",
      org: "NHS",
      url: "https://www.nhs.uk/symptoms/dizziness/",
      description: "Public information on dizziness and medical assessment.",
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">EVIDENCE & CONTEXT</span>
          <h1>Reference library</h1>
          <p>Understand the information behind this prototype.</p>
        </div>
        <BookOpen className="accent" size={28} />
      </div>
      <div className="info-banner">
        <ShieldCheck size={20} />
        <p>
          These are public references. Earth-based guidance is not an approved
          spacecraft procedure. Mission medical personnel must validate and
          adapt procedures before operational use.
        </p>
      </div>
      <div className="resource-grid">
        {sources.map((s) => (
          <a
            key={s.url}
            className="panel resource-card"
            href={s.url}
            target="_blank"
            rel="noreferrer"
          >
            <span className="eyebrow">{s.org}</span>
            <h3>{s.title}</h3>
            <p>{s.description}</p>
            <span className="resource-link">
              Read source
              <ArrowRight size={15} />
            </span>
          </a>
        ))}
      </div>
      <section className="panel">
        <h3>What the dashboard means</h3>
        <p className="muted">
          Recorded means a value was entered, not that it is clinically normal.
          Not assessed means Astra does not have an assessment for that body
          system. All sample mission data is synthetic. No device telemetry is
          connected in this version.
        </p>
      </section>
    </>
  );
}
