export type Language = "en" | "bn" | "es" | "fr" | "hi" | "ru";
export type View =
  "overview" | "assistant" | "records" | "profile" | "resources";
export type Profile = {
  name: string;
  age: number | null;
  mission: string;
  language: Language;
  conditions: string;
  medications: string;
  allergies: string;
  history: string;
  emergency_contact: string;
  equipment: string;
  ai_consent: boolean;
};
export type User = {
  id: string;
  email: string;
  profile: Profile;
  demo: boolean;
};
export type Observation = {
  id: string;
  created_at: string;
  heart_rate: number | null;
  spo2: number | null;
  temperature: number | null;
  systolic: number | null;
  diastolic: number | null;
  sleep_hours: number | null;
  mood: string;
  notes: string;
};
export type Assessment = {
  urgency: "emergency" | "review" | "unknown";
  title: string;
  summary: string;
  steps: string[];
  questions: string[];
  sources: { title: string; url: string }[];
  notice: string;
  mode: string;
  provider_status: string;
  response_language: Language;
  input_language: Language;
  trace: string[];
};
export type Report = {
  id: string;
  created_at: string;
  text: string;
  body_system: string;
  severity: number;
  duration: string;
  assessment: Assessment;
  acknowledged: boolean;
};
export type Dashboard = {
  user: User;
  observations: Observation[];
  reports: Report[];
  latest: Observation | null;
  alerts: Report[];
  ai_configured: boolean;
  voice_configured: boolean;
};
export const languages: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "bn", label: "বাংলা" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "hi", label: "हिन्दी" },
  { code: "ru", label: "Русский" },
];
export const emptyProfile: Profile = {
  name: "",
  age: null,
  mission: "",
  language: "en",
  conditions: "",
  medications: "",
  allergies: "",
  history: "",
  emergency_contact: "",
  equipment: "",
  ai_consent: false,
};

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    ...options,
    headers:
      options.body instanceof FormData
        ? options.headers
        : { "Content-Type": "application/json", ...options.headers },
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    const detail =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.map((d: { msg: string }) => d.msg).join(". ")
          : "Something went wrong. Try again.";
    throw Object.assign(new Error(detail), { status: response.status });
  }
  return data as T;
}

export const copy = {
  en: {
    overview: "Overview",
    assistant: "Astra assistant",
    records: "Health records",
    profile: "Health profile",
    resources: "Reference library",
    report: "Report a symptom",
    checkin: "Log a check-in",
    hello: "Your health, in perspective.",
    subtitle:
      "A clearer picture of your wellbeing, wherever your mission takes you.",
    heart: "Heart rate",
    oxygen: "Blood oxygen",
    temperature: "Temperature",
    sleep: "Sleep",
    recorded: "Recorded",
    unknown: "Not measured",
    save: "Save changes",
    cancel: "Cancel",
    logout: "Sign out",
    demo: "Sample mission",
    body: "Body systems",
    trends: "Measurement trends",
    activity: "Recent reports",
    noReports: "No symptom reports yet.",
    newProfile: "Create your health baseline",
    profileIntro:
      "Add what you know. Leave unavailable information blank; you can update it later.",
    prototype: "Research prototype · Not clinically validated",
    loading: "Connecting to your health workspace…",
  },
  bn: {
    overview: "সারসংক্ষেপ",
    assistant: "Astra সহকারী",
    records: "স্বাস্থ্য রেকর্ড",
    profile: "স্বাস্থ্য প্রোফাইল",
    resources: "তথ্যসূত্র",
    report: "উপসর্গ জানান",
    checkin: "স্বাস্থ্য তথ্য লিখুন",
    hello: "আপনার স্বাস্থ্যের তথ্য একসঙ্গে।",
    subtitle:
      "মিশনের প্রতিটি পর্যায়ে নিজের স্বাস্থ্য সম্পর্কে আরও পরিষ্কার ধারণা।",
    heart: "হৃদস্পন্দন",
    oxygen: "রক্তে অক্সিজেন",
    temperature: "তাপমাত্রা",
    sleep: "ঘুম",
    recorded: "সংরক্ষিত",
    unknown: "মাপা হয়নি",
    save: "পরিবর্তন সংরক্ষণ",
    cancel: "বাতিল",
    logout: "সাইন আউট",
    demo: "নমুনা মিশন",
    body: "শরীরের সিস্টেম",
    trends: "পরিমাপের পরিবর্তন",
    activity: "সাম্প্রতিক উপসর্গ",
    noReports: "এখনো উপসর্গ জানানো হয়নি।",
    newProfile: "স্বাস্থ্য প্রোফাইল তৈরি করুন",
    profileIntro:
      "জানা তথ্য দিন। অজানা তথ্য ফাঁকা রাখুন; পরে আপডেট করতে পারবেন।",
    prototype: "গবেষণা প্রোটোটাইপ · চিকিৎসাগতভাবে যাচাইকৃত নয়",
    loading: "স্বাস্থ্য তথ্য সংযুক্ত হচ্ছে…",
  },
};
