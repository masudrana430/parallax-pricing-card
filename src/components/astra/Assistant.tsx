"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Mic,
  Square,
  Sparkles,
  LoaderCircle,
  AlertTriangle,
  ChevronDown,
  ExternalLink,
  Check,
} from "lucide-react";
import {
  api,
  languages,
  type Dashboard,
  type Language,
  type Report,
} from "@/lib/astra";
import { systems } from "./Visuals";

export function AssessmentCard({
  report,
  onReviewed,
}: {
  report: Report;
  onReviewed?: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const a = report.assessment;
  async function review() {
    setBusy(true);
    try {
      await api(`reports/${report.id}/acknowledge`, { method: "POST" });
      await onReviewed?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className={`assessment ${a.urgency}`}>
      <div className="assessment-heading">
        <span className={`status-chip ${a.urgency}`}>
          {a.urgency === "emergency" ? (
            <AlertTriangle size={14} />
          ) : (
            <Sparkles size={14} />
          )}{" "}
          {a.title}
        </span>
        <span className="muted">
          {a.mode === "ai" ? "AI-assisted" : "Guided mode"}
        </span>
      </div>
      <p className="assessment-summary" lang={a.response_language}>{a.summary}</p>
      <h4>Next steps</h4>
      <ol lang={a.response_language}>
        {a.steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      {a.questions.length > 0 && (
        <div className="followups">
          <h4>Help me understand</h4>
          {a.questions.map((q, i) => (
            <p key={i}>{q}</p>
          ))}
        </div>
      )}
      {a.sources.length > 0 && (
        <div className="sources">
          {a.sources.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
              {s.title}
              <ExternalLink size={12} />
            </a>
          ))}
        </div>
      )}
      {a.response_language !== a.input_language && (
        <p className="notice">
          Safety messages are in English for this language. Translation has not
          been validated.
        </p>
      )}
      {a.provider_status === "unavailable" && (
        <p className="notice">
          AI is unavailable. This response used the limited guided workflow.
        </p>
      )}
      <details className="agent-trace">
        <summary>
          How Astra handled this report <ChevronDown size={13} />
        </summary>
        {a.trace.map((s, i) => (
          <p key={i}>
            <span>{i + 1}</span>
            {s}
          </p>
        ))}
      </details>
      <p className="notice">{a.notice}</p>
      {onReviewed && (
        <button
          className="btn secondary small"
          onClick={review}
          disabled={busy || report.acknowledged}
        >
          {report.acknowledged ? (
            <>
              <Check size={14} />
              Marked reviewed by you
            </>
          ) : busy ? (
            "Saving…"
          ) : (
            "Mark reviewed by me"
          )}
        </button>
      )}
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
    </article>
  );
}

export function Assistant({
  data,
  language,
  refresh,
}: {
  data: Dashboard;
  language: Language;
  refresh: () => Promise<void>;
}) {
  const [text, setText] = useState(""),
    [duration, setDuration] = useState(""),
    [severity, setSeverity] = useState(0),
    [system, setSystem] = useState("general");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [recording, setRecording] = useState(false),
    [transcribing, setTranscribing] = useState(false),
    [voiceDraft, setVoiceDraft] = useState(false),
    [confirmed, setConfirmed] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (recorder.current) {
        recorder.current.onstop = null;
        if (recorder.current.state === "recording") recorder.current.stop();
      }
      stream.current?.getTracks().forEach((t) => t.stop());
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const voiceAvailable = data.voice_configured && data.user.profile.ai_consent;
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (voiceDraft && !confirmed) return;
    setBusy(true);
    setError("");
    try {
      await api<Report>("assistant", {
        method: "POST",
        body: JSON.stringify({
          text,
          language,
          body_system: system,
          severity,
          duration,
        }),
      });
      setText("");
      setVoiceDraft(false);
      setConfirmed(false);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function toggleRecording() {
    if (recording) {
      recorder.current?.stop();
      setRecording(false);
      if (timer.current) clearTimeout(timer.current);
      return;
    }
    setError("");
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("Recording is not supported in this browser. Please use text.");
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      const type = ["audio/webm", "audio/mp4"].find((t) =>
        MediaRecorder.isTypeSupported(t),
      );
      const rec = new MediaRecorder(
        media,
        type ? { mimeType: type } : undefined,
      );
      recorder.current = rec;
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onstop = async () => {
        if (timer.current) clearTimeout(timer.current);
        media.getTracks().forEach((t) => t.stop());
        setRecording(false);
        setTranscribing(true);
        try {
          const f = new FormData();
          f.append(
            "file",
            new Blob(chunks, { type: rec.mimeType }),
            rec.mimeType.includes("mp4") ? "recording.m4a" : "recording.webm",
          );
          f.append("language", language);
          const result = await api<{ text: string }>("transcribe", {
            method: "POST",
            body: f,
          });
          setText(result.text);
          setVoiceDraft(true);
          setConfirmed(false);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setTranscribing(false);
        }
      };
      rec.start();
      setRecording(true);
      timer.current = setTimeout(() => {
        if (rec.state === "recording") rec.stop();
      }, 60000);
    } catch {
      setError(
        "Microphone permission was unavailable. You can type your report.",
      );
    }
  }
  const suggestions =
    language === "bn"
      ? ["মাথা ঘুরছে", "ঘুম কম হয়েছে", "নতুন উপসর্গ জানাতে চাই"]
      : [
          "I feel dizzy after exercise",
          "My sleep has changed",
          "I want to report a new symptom",
        ];
  return (
    <div className="assistant-layout">
      <section className="panel assistant-main">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">YOUR MISSION COMPANION</span>
            <h2>A little clarity, when you need it.</h2>
            <p>
              Describe what changed. Astra will record it, ask questions, and
              point you toward appropriate medical support.
            </p>
          </div>
          <div className="assistant-symbol">
            <Sparkles size={24} />
          </div>
        </div>
        <div className="chat-feed">
          {data.reports.length === 0 ? (
            <div className="assistant-welcome">
              <div className="assistant-avatar">
                <Sparkles size={22} />
              </div>
              <h3>
                {language === "bn"
                  ? "কেমন অনুভব করছেন?"
                  : "How are you feeling?"}
              </h3>
              <p>
                Your history adds context. New symptoms still need assessment;
                Astra cannot establish a diagnosis.
              </p>
              <div className="suggestions">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => setText(s)}>
                    {s}
                    <ArrowUp size={13} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            data.reports
              .slice(0, 6)
              .reverse()
              .map((r) => (
                <div className="conversation-turn" key={r.id}>
                  <div className="user-message">
                    <p>{r.text}</p>
                    <small>
                      {new Date(r.created_at).toLocaleString()} ·{" "}
                      {r.duration || "Onset not specified"} · Severity{" "}
                      {r.severity}/10
                    </small>
                  </div>
                  <AssessmentCard report={r} />
                </div>
              ))
          )}
        </div>
        <form className="composer" onSubmit={send}>
          <div className="composer-meta">
            <label>
              Body system
              <select
                value={system}
                onChange={(e) => setSystem(e.target.value)}
              >
                <option value="general">General / unsure</option>
                {systems.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Started / duration
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                maxLength={100}
                placeholder="e.g. 30 minutes ago"
              />
            </label>
            <label>
              Severity · {severity}/10
              <input
                aria-label="Symptom severity"
                type="range"
                min="0"
                max="10"
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="composer-box">
            <textarea
              lang={language}
              aria-label="Describe your symptoms"
              placeholder={
                language === "bn"
                  ? "আপনার উপসর্গ লিখুন…"
                  : "Describe your symptoms in your preferred language…"
              }
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (voiceDraft) setConfirmed(false);
              }}
              maxLength={4000}
              rows={3}
              required
            />
            <div className="composer-actions">
              <span>
                {languages.find((l) => l.code === language)?.label} ·{" "}
                {text.length}/4000
              </span>
              <div>
                <button
                  type="button"
                  className={`icon-btn ${recording ? "recording" : ""}`}
                  disabled={!voiceAvailable || busy || transcribing}
                  onClick={toggleRecording}
                  aria-label={recording ? "Stop recording" : "Record voice"}
                  title={
                    !voiceAvailable
                      ? "Enable AI and provider consent to use voice"
                      : "Record up to 60 seconds"
                  }
                >
                  {transcribing ? (
                    <LoaderCircle className="spin" size={18} />
                  ) : recording ? (
                    <Square size={18} />
                  ) : (
                    <Mic size={18} />
                  )}
                </button>
                <button
                  className="send-btn"
                  aria-label="Send symptom report"
                  disabled={
                    busy ||
                    recording ||
                    transcribing ||
                    !text.trim() ||
                    (voiceDraft && !confirmed)
                  }
                >
                  {busy ? (
                    <LoaderCircle className="spin" size={19} />
                  ) : (
                    <ArrowUp size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
          {voiceDraft && (
            <label className="transcript-confirm">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              I reviewed the transcript, including medicines, numbers and
              negations.
            </label>
          )}
          {recording && (
            <p className="notice">
              Recording · stops after 60 seconds. Stop to send audio to the
              configured transcription provider.
            </p>
          )}
          {!voiceAvailable && (
            <p className="notice">
              Voice requires a configured transcription provider and your
              consent. Text input is available.
            </p>
          )}
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
        </form>
      </section>
      <aside className="assistant-aside">
        <section className="panel">
          <span className="eyebrow">AWARE OF YOUR CONTEXT</span>
          <h3>Your health baseline</h3>
          <dl>
            <dt>Mission</dt>
            <dd>{data.user.profile.mission || "Not provided"}</dd>
            <dt>Known conditions</dt>
            <dd>{data.user.profile.conditions || "Not provided"}</dd>
            <dt>Allergies</dt>
            <dd>{data.user.profile.allergies || "Not provided"}</dd>
            <dt>Available equipment</dt>
            <dd>{data.user.profile.equipment || "Not provided"}</dd>
          </dl>
        </section>
        <section className="panel safety-panel">
          <AlertTriangle size={20} />
          <h3>Urgent symptoms?</h3>
          <p>
            Contact your crew medical officer and follow the mission emergency
            procedure. Do not wait for an app response.
          </p>
          <small>
            On Earth, contact local emergency services when immediate help is
            needed.
          </small>
        </section>
        <section className="assistant-note">
          <h4>What Astra can help with</h4>
          <p>
            Organizing your reports, asking clarification questions, and showing
            source-based escalation guidance.
          </p>
          <p>
            It cannot scan your body, confirm a diagnosis, or prescribe
            medicines.
          </p>
        </section>
      </aside>
    </div>
  );
}
