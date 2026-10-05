"use client";
import { useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  LoaderCircle,
  X,
  Check,
  ClipboardList,
} from "lucide-react";
import {
  api,
  copy,
  emptyProfile,
  languages,
  type Profile,
  type User,
  type Language,
} from "@/lib/astra";

export function Auth({ onReady }: { onReady: () => Promise<void> }) {
  const [register, setRegister] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api<User>(`auth/${register ? "register" : "login"}`, {
        method: "POST",
        body: JSON.stringify({
          email: f.get("email"),
          password: f.get("password"),
        }),
      });
      await onReady();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function demo() {
    setBusy(true);
    setError("");
    try {
      await api("auth/demo", { method: "POST" });
      await onReady();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="entry-page">
      <header className="entry-header">
        <Logo />
        <span className="badge">CREW HEALTH WORKSPACE</span>
      </header>
      <main className="entry-content">
        <div className="entry-story">
          <div className="eyebrow">
            <span className="tiny-dot" /> BUILT FOR THE JOURNEY
          </div>
          <h1>
            Closer to your health.
            <br />
            <em>Further into space.</em>
          </h1>
          <p>
            A personal health workspace for your mission. Bring your history,
            daily measurements, and questions together with Astra.
          </p>
          <div className="orbit-art" aria-hidden="true">
            <div className="planet" />
            <div className="orbit o1" />
            <div className="orbit o2" />
            <div className="satellite" />
            <span className="orbit-caption">EVERY MISSION STARTS WITH YOU</span>
          </div>
          <div className="entry-features">
            <span>
              <ShieldCheck size={16} />
              Private health records
            </span>
            <span>
              <ClipboardList size={16} />
              Text & voice reporting
            </span>
          </div>
        </div>
        <section className="auth-card">
          <div className="eyebrow">WELCOME TO ASTRA</div>
          <h2>{register ? "Start your health journey" : "Welcome back"}</h2>
          <p>
            {register
              ? "Create an account to build your health baseline."
              : "Sign in to your personal health workspace."}
          </p>
          <form onSubmit={submit}>
            <label>
              Email address
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                maxLength={254}
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                placeholder="At least 10 characters"
                autoComplete={register ? "new-password" : "current-password"}
                minLength={10}
                maxLength={128}
                required
              />
            </label>
            {error && (
              <div role="alert" className="error-message">
                {error}
              </div>
            )}
            <button className="btn primary full" disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <>
                  {register ? "Create account" : "Sign in"}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
          <p className="auth-switch">
            {register ? "Already have an account?" : "New to Astra?"}{" "}
            <button
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
              disabled={busy}
            >
              {register ? "Sign in" : "Create account"}
            </button>
          </p>
          <div className="divider">
            <span>or explore first</span>
          </div>
          <button className="btn secondary full" onClick={demo} disabled={busy}>
            Explore a sample mission
            <ArrowRight size={16} />
          </button>
          <small className="auth-note">
            Sample mode uses synthetic data in a separate workspace.
          </small>
        </section>
      </main>
      <footer className="entry-footer">
        Astra · Research prototype. Not clinically validated or intended to
        replace medical care.
      </footer>
    </div>
  );
}

export function Logo() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="m16 4 11 24h-5l-6-14-6 14H5Z" fill="currentColor" />
          <path
            d="M4 23q12-11 25-8"
            fill="none"
            stroke="#73d8c5"
            strokeWidth="2"
          />
        </svg>
      </span>
      <span>
        astra<span className="brand-period">.</span>
      </span>
    </div>
  );
}

export function ProfileForm({
  user,
  onSaved,
  language,
}: {
  user: User;
  onSaved: () => Promise<void>;
  language: Language;
}) {
  const [profile, setProfile] = useState<Profile>({
      ...emptyProfile,
      ...user.profile,
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const t = copy[language === "bn" ? "bn" : "en"];
  function field(key: keyof Profile, value: string | number | null | boolean) {
    setSaved(false);
    setProfile({ ...profile, [key]: value });
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("profile", { method: "PUT", body: JSON.stringify(profile) });
      await onSaved();
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const fields: {
    key:
      | "conditions"
      | "medications"
      | "allergies"
      | "history"
      | "equipment"
      | "emergency_contact";
    label: string;
    placeholder: string;
  }[] = [
    {
      key: "conditions",
      label: "Existing conditions",
      placeholder: "Known diagnoses, or none known",
    },
    {
      key: "medications",
      label: "Current medicines",
      placeholder: "Names, doses, frequency; leave blank if unavailable",
    },
    {
      key: "allergies",
      label: "Allergies & reactions",
      placeholder: "Medicine, food or other allergies",
    },
    {
      key: "history",
      label: "Medical & family history",
      placeholder: "Previous surgery, relevant events and family history",
    },
    {
      key: "equipment",
      label: "Available medical equipment",
      placeholder: "Devices and medical supplies available on your mission",
    },
    {
      key: "emergency_contact",
      label: "Medical contact / escalation route",
      placeholder: "Crew medical officer or emergency contact",
    },
  ];
  return (
    <section className="panel profile-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">YOUR BASELINE</span>
          <h2>{t.newProfile}</h2>
          <p>{t.profileIntro}</p>
        </div>
        <ShieldCheck className="accent" size={26} />
      </div>
      <form onSubmit={submit}>
        <div className="form-grid">
          <label>
            Full name
            <input
              value={profile.name}
              onChange={(e) => field("name", e.target.value)}
              maxLength={80}
              required
              autoComplete="name"
            />
          </label>
          <label>
            Age
            <input
              type="number"
              min="18"
              max="100"
              value={profile.age ?? ""}
              onChange={(e) =>
                field("age", e.target.value ? Number(e.target.value) : null)
              }
            />
          </label>
          <label>
            Mission / location
            <input
              value={profile.mission}
              onChange={(e) => field("mission", e.target.value)}
              maxLength={120}
              placeholder="Your mission or Earth location"
            />
          </label>
          <label>
            Preferred input language
            <select
              value={profile.language}
              onChange={(e) => field("language", e.target.value)}
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          {fields.map((f) => (
            <label key={f.key}>
              {f.label}
              <textarea
                value={profile[f.key]}
                onChange={(e) => field(f.key, e.target.value)}
                placeholder={f.placeholder}
                rows={3}
                maxLength={
                  f.key === "history"
                    ? 4000
                    : f.key === "emergency_contact"
                      ? 200
                      : f.key === "equipment"
                        ? 1000
                        : 2000
                }
              />
            </label>
          ))}
        </div>
        <label className="consent">
          <input
            type="checkbox"
            checked={profile.ai_consent}
            onChange={(e) => field("ai_consent", e.target.checked)}
          />
          <span>
            <strong>Enable external AI processing</strong>
            <small>
              When AI is configured, symptom text and relevant health context
              are sent to OpenAI. Recorded audio is sent only when you request
              transcription. Audio is not stored by Astra. Leave this off to use
              guided mode.
            </small>
          </span>
        </label>
        <div className="form-footer">
          <span className="muted">
            You can update your baseline at any time.
          </span>
          <button className="btn primary" disabled={busy}>
            {busy ? (
              <LoaderCircle className="spin" size={16} />
            ) : saved ? (
              <Check size={16} />
            ) : null}
            {saved ? "Saved" : t.save}
          </button>
        </div>
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
      </form>
    </section>
  );
}

export function CheckIn({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const body: Record<string, string | number | null> = {};
    for (const k of [
      "heart_rate",
      "spo2",
      "temperature",
      "systolic",
      "diastolic",
      "sleep_hours",
    ])
      body[k] = f.get(k) ? Number(f.get(k)) : null;
    body.mood = String(f.get("mood"));
    body.notes = String(f.get("notes"));
    try {
      await api("observations", { method: "POST", body: JSON.stringify(body) });
      await onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <section
        className="modal panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkin-title"
      >
        <div className="panel-heading">
          <div>
            <span className="eyebrow">DAILY CHECK-IN</span>
            <h2 id="checkin-title">How are you today?</h2>
            <p>Enter measured values. Leave unavailable values blank.</p>
          </div>
          <button
            className="icon-btn"
            aria-label="Close check-in"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            {[
              {
                name: "heart_rate",
                label: "Heart rate · bpm",
                min: 1,
                max: 350,
              },
              { name: "spo2", label: "Blood oxygen · %", min: 0, max: 100 },
              {
                name: "temperature",
                label: "Temperature · °C",
                min: 25,
                max: 45,
              },
              { name: "sleep_hours", label: "Sleep · hours", min: 0, max: 24 },
              {
                name: "systolic",
                label: "Systolic BP · mmHg",
                min: 30,
                max: 300,
              },
              {
                name: "diastolic",
                label: "Diastolic BP · mmHg",
                min: 10,
                max: 200,
              },
            ].map((f) => (
              <label key={f.name}>
                {f.label}
                <input
                  name={f.name}
                  type="number"
                  step="0.1"
                  min={f.min}
                  max={f.max}
                  placeholder="Not measured"
                />
              </label>
            ))}
            <label>
              How do you feel?
              <select name="mood">
                <option value="neutral">Neutral</option>
                <option value="good">Good</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label>
              Notes
              <textarea
                name="notes"
                maxLength={2000}
                placeholder="Changes, activity, or measurement context"
              />
            </label>
          </div>
          {error && (
            <div role="alert" className="error-message">
              {error}
            </div>
          )}
          <div className="form-footer">
            <button type="button" className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn primary" disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Check size={16} />
              )}
              Save check-in
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
