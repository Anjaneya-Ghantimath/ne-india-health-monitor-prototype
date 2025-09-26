"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  Bell,
  BellRing,
  Brain,
  ChevronDown,
  ChevronRight,
  Flame,
  Gauge,
  Globe,
  Languages,
  LineChart as LineChartIcon,
  MapPin,
  Menu,
  PhoneCall,
  ShieldAlert,
  Siren,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";

// ------------------ Types ------------------

type RiskLevel = "low" | "medium" | "high" | "critical";

type SensorStatus = "online" | "offline" | "maintenance";

type SensorReading = {
  sensorId: string;
  location: string;
  coordinates: [number, number];
  parameters: {
    pH: number;
    turbidity: number;
    bacteria: number; // CFU/ml
    temperature: number; // °C
    timestamp: string;
  };
  status: SensorStatus;
  batteryLevel: number;
  lastMaintenance: string;
  communityId: string;
};

type Community = {
  communityId: string;
  name: string;
  population: number;
  riskLevel: RiskLevel;
  activeAlerts: number;
  healthWorker: string;
  lastIncident: string;
  responseRate: number;
};

type AlertItem = {
  id: string;
  severity: RiskLevel;
  title: string;
  message: string;
  channel: "sms" | "app" | "voice";
  communityId: string;
  createdAt: string;
  acknowledged?: boolean;
};

// ------------------ Localization ------------------

const i18n = {
  en: {
    app: "Smart Community Health Monitoring",
    dashboard: "Dashboard",
    waterQuality: "Water Quality Monitor",
    analytics: "Health Analytics",
    alerts: "Community Alerts",
    profiles: "Community Profiles",
    reports: "Reports & Data",
    settings: "Settings",
    emergency: "Emergency Alert",
    communities: "Communities Monitored",
    sensors: "Active Sensors",
    recentAlerts: "Recent Alerts",
    riskIndex: "Risk Index",
    online: "Online",
    offline: "Offline",
    maintenance: "Maintenance",
    risk: "Risk",
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
    parameters: "Parameters",
    pH: "pH",
    turbidity: "Turbidity (NTU)",
    bacteria: "Bacteria (CFU/ml)",
    temperature: "Temperature (°C)",
    status: "Status",
    location: "Location",
    trend7: "7 Day Trend",
    trend30: "30 Day Trend",
    riskScore: "Risk Score",
    outbreakPrediction: "Outbreak Prediction",
    timeline: "Timeline",
    confidence: "Model Confidence",
    earlyWarning: "Early Warning",
    createAlert: "Create Alert",
    history: "Alert History",
    acknowledge: "Acknowledge",
    broadcast: "Broadcast",
    sms: "SMS",
    app: "App",
    voice: "Voice",
    language: "Language",
    user: "Health Worker",
    search: "Search",
  },
  hi: {
    app: "स्मार्ट सामुदायिक स्वास्थ्य मॉनिटरिंग",
    dashboard: "डैशबोर्ड",
    waterQuality: "जल गुणवत्ता मॉनिटर",
    analytics: "स्वास्थ्य विश्लेषण",
    alerts: "समुदाय अलर्ट",
    profiles: "समुदाय प्रोफाइल",
    reports: "रिपोर्ट और डेटा",
    settings: "सेटिंग्स",
    emergency: "आपातकालीन अलर्ट",
    communities: "निगरानी समुदाय",
    sensors: "सक्रिय सेंसर",
    recentAlerts: "हाल के अलर्ट",
    riskIndex: "जोखिम सूचकांक",
    online: "ऑनलाइन",
    offline: "ऑफलाइन",
    maintenance: "रखरखाव",
    risk: "जोखिम",
    low: "निम्न",
    medium: "मध्यम",
    high: "उच्च",
    critical: "गंभीर",
    parameters: "पैरामीटर",
    pH: "pH",
    turbidity: "मटमैला (NTU)",
    bacteria: "बैक्टीरिया (CFU/ml)",
    temperature: "तापमान (°C)",
    status: "स्थिति",
    location: "स्थान",
    trend7: "7 दिन का ट्रेंड",
    trend30: "30 दिन का ट्रेंड",
    riskScore: "जोखिम स्कोर",
    outbreakPrediction: "प्रकोप पूर्वानुमान",
    timeline: "समयरेखा",
    confidence: "मॉडल विश्वास",
    earlyWarning: "प्रारंभिक चेतावनी",
    createAlert: "अलर्ट बनाएँ",
    history: "अलर्ट इतिहास",
    acknowledge: "स्वीकार करें",
    broadcast: "प्रसारण",
    sms: "एसएमएस",
    app: "ऐप",
    voice: "वॉयस",
    language: "भाषा",
    user: "स्वास्थ्य कर्मी",
    search: "खोजें",
  },
  as: {
    app: "স্মাৰ্ট কমিউনিটি হেল্থ মনিটৰিং",
    dashboard: "ডেশবোৰ্ড",
    waterQuality: "পানী গুণ মান মনিটৰ",
    analytics: "স্বাস্থ্য বিশ্লেষণ",
    alerts: "কমিউনিটি এলাৰ্ট",
    profiles: "কমিউনিটি প্ৰফাইল",
    reports: "ৰিপোৰ্টস আৰু ডাটা",
    settings: "ছেটিংছ",
    emergency: "জৰুৰী এলাৰ্ট",
    communities: "মনিটৰ কৰা কমিউনিটি",
    sensors: "এক্টিভ ছেন্সৰ",
    recentAlerts: "শেহতীয়া এলাৰ্ট",
    riskIndex: "ঝুঁকি সূচক",
    online: "অনলাইন",
    offline: "অফলাইন",
    maintenance: "মেইনটেনেন্স",
    risk: "ঝুঁকি",
    low: "কম",
    medium: "মধ্যম",
    high: "উচ্চ",
    critical: "গম্ভীৰ",
    parameters: "পাৰামিটাৰ",
    pH: "pH",
    turbidity: "মলিনতা (NTU)",
    bacteria: "ব্যাকটেরিয়া (CFU/ml)",
    temperature: "তাপমান (°C)",
    status: "স্থিতি",
    location: "অৱস্থান",
    trend7: "৭ দিনের ধারা",
    trend30: "৩০ দিনের ধারা",
    riskScore: "ঝুঁকি স্কোৰ",
    outbreakPrediction: "ৰোগ বিস্তাৰ পূৰ্বানুমান",
    timeline: "টাইমলাইন",
    confidence: "মডেল আত্মবিশ্বাস",
    earlyWarning: "আগতীয়া সতৰ্কবাণী",
    createAlert: "এলাৰ্ট সৃষ্টি কৰক",
    history: "এলাৰ্ট ইতিহাস",
    acknowledge: "স্বীকাৰ কৰক",
    broadcast: "প্ৰচাৰ",
    sms: "SMS",
    app: "এপ",
    voice: "ভয়চ",
    language: "ভাষা",
    user: "স্বাস্থ্য কৰ্মী",
    search: "সন্ধান",
  },
};

type LangKey = keyof typeof i18n;

// ------------------ Helpers ------------------

function riskColor(level: RiskLevel) {
  switch (level) {
    case "low":
      return "bg-green-100 text-green-700 border-green-300";
    case "medium":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "high":
      return "bg-orange-100 text-orange-700 border-orange-300";
    case "critical":
      return "bg-red-100 text-red-700 border-red-300 animate-pulse";
  }
}

function randomBetween(min: number, max: number, decimals = 1) {
  const n = Math.random() * (max - min) + min;
  const p = Math.pow(10, decimals);
  return Math.round(n * p) / p;
}

function nowIso() {
  return new Date().toISOString();
}

// ------------------ Mock Seeds ------------------

const COMMUNITIES: Community[] = [
  {
    communityId: "COMM_001",
    name: "Guwahati Rural",
    population: 1250,
    riskLevel: "low",
    activeAlerts: 0,
    healthWorker: "Dr. Anita Sharma",
    lastIncident: "2025-08-15",
    responseRate: 92,
  },
  {
    communityId: "COMM_002",
    name: "Dibrugarh Village",
    population: 980,
    riskLevel: "medium",
    activeAlerts: 1,
    healthWorker: "Nurse Rajiv Barman",
    lastIncident: "2025-09-04",
    responseRate: 88,
  },
  {
    communityId: "COMM_003",
    name: "Tezpur Township",
    population: 2100,
    riskLevel: "low",
    activeAlerts: 0,
    healthWorker: "Dr. P. Devi",
    lastIncident: "2025-07-28",
    responseRate: 95,
  },
  {
    communityId: "COMM_004",
    name: "Jorhat Community",
    population: 1560,
    riskLevel: "high",
    activeAlerts: 2,
    healthWorker: "Health Worker L. Das",
    lastIncident: "2025-09-20",
    responseRate: 76,
  },
  {
    communityId: "COMM_005",
    name: "Silchar Settlement",
    population: 1345,
    riskLevel: "medium",
    activeAlerts: 0,
    healthWorker: "Paramedic S. Ahmed",
    lastIncident: "2025-08-29",
    responseRate: 84,
  },
];

const SENSOR_LOCATIONS = [
  "Primary Source",
  "Community Well",
  "Treatment Plant",
  "Distribution Point",
];

// ------------------ Reducers / State ------------------

type NavKey = "dashboard" | "water" | "analytics" | "alerts" | "profiles" | "reports" | "settings";

type AlertAction =
  | { type: "add"; payload: AlertItem }
  | { type: "ack"; id: string };

function alertReducer(state: AlertItem[], action: AlertAction): AlertItem[] {
  switch (action.type) {
    case "add":
      return [action.payload, ...state].slice(0, 50);
    case "ack":
      return state.map((a) => (a.id === action.id ? { ...a, acknowledged: true } : a));
    default:
      return state;
  }
}

// ------------------ Main Component ------------------

export default function Home() {
  const [lang, setLang] = useState<LangKey>("en");
  const t = i18n[lang];

  const [nav, setNav] = useState<NavKey>("dashboard");
  const [dark, setDark] = useState(false);
  const [textLg, setTextLg] = useState(false);

  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");

  const [alerts, dispatchAlerts] = useReducer(alertReducer, []);

  const [sensors, setSensors] = useState<SensorReading[]>(() => {
    const base: SensorReading[] = [];
    COMMUNITIES.forEach((c, ci) => {
      SENSOR_LOCATIONS.forEach((loc, li) => {
        base.push({
          sensorId: `WQ_${c.name.split(" ")[0].toUpperCase()}_${String(li + 1).padStart(3, "0")}`,
          location: `${c.name} - ${loc}`,
          coordinates: [26.1 + ci * 0.1 + li * 0.02, 91.7 + ci * 0.05 + li * 0.01],
          parameters: {
            pH: randomBetween(6.6, 8.2, 2),
            turbidity: randomBetween(0.2, 3.5, 2),
            bacteria: Math.round(randomBetween(5, 60, 0)),
            temperature: randomBetween(18, 30, 1),
            timestamp: nowIso(),
          },
          status: Math.random() < 0.85 ? "online" : Math.random() < 0.5 ? "maintenance" : "offline",
          batteryLevel: Math.round(randomBetween(40, 100, 0)),
          lastMaintenance: "2025-09-20",
          communityId: c.communityId,
        });
      });
    });
    return base;
  });

  const intervalRef = useRef<number | null>(null);

  // Real-time simulation: update every 6s
  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  useEffect(() => {
    intervalRef.current && clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSensors((prev) =>
        prev.map((s) => {
          // Occasional status flips
          const status: SensorStatus = Math.random() < 0.96 ? s.status : ([("online"), ("offline"), ("maintenance")] as SensorStatus[])[Math.floor(Math.random() * 3)];
          const drift = (v: number, min: number, max: number, step = 0.3) =>
            Math.min(max, Math.max(min, v + randomBetween(-step, step, 2)));
          const next = {
            ...s,
            status,
            parameters: {
              pH: drift(s.parameters.pH, 5.5, 9.5, 0.15),
              turbidity: drift(s.parameters.turbidity, 0, 10, 0.4),
              bacteria: Math.round(Math.min(500, Math.max(0, s.parameters.bacteria + randomBetween(-5, 12, 0)))),
              temperature: drift(s.parameters.temperature, 10, 40, 0.4),
              timestamp: nowIso(),
            },
            batteryLevel: Math.max(5, s.batteryLevel - (Math.random() < 0.3 ? 1 : 0)),
          } as SensorReading;

          // Trigger alerts based on thresholds
          const issues: string[] = [];
          if (next.parameters.pH < 6.5 || next.parameters.pH > 8.5) issues.push("pH out of range");
          if (next.parameters.turbidity > 4) issues.push("High turbidity");
          if (next.parameters.bacteria > 100) issues.push("Bacterial contamination");
          const severity: RiskLevel = issues.length >= 2 ? (next.parameters.bacteria > 200 ? "critical" : "high") : issues.length === 1 ? "medium" : "low";

          if (severity !== "low" && Math.random() < 0.5) {
            const community = COMMUNITIES.find((c) => c.communityId === next.communityId)!;
            const id = `${next.sensorId}_${Date.now()}`;
            dispatchAlerts({
              type: "add",
              payload: {
                id,
                severity,
                title: `${community.name} - ${issues[0] || "Anomaly"}`,
                message: `${next.location}: ${issues.join(", ")}`,
                channel: ["sms", "app", "voice"][Math.floor(Math.random() * 3)] as AlertItem["channel"],
                communityId: next.communityId,
                createdAt: nowIso(),
              },
            });
            toast(`${community.name}: ${issues[0]}`, {
              description: new Date().toLocaleString(),
              icon: severityIcon(severity),
            });
          }

          return next;
        })
      );
    }, 6000);

    return () => {
      intervalRef.current && clearInterval(intervalRef.current);
    };
  }, []);

  const communitiesStats = useMemo(() => COMMUNITIES, []);

  const activeSensors = sensors.filter((s) => s.status === "online").length;

  const recentAlerts = alerts.slice(0, 5);

  const riskIndex = useMemo(() => {
    // simple aggregation
    const score = sensors.reduce((acc, s) => {
      let p = 0;
      if (s.parameters.pH < 6.5 || s.parameters.pH > 8.5) p += 1;
      if (s.parameters.turbidity > 4) p += 1;
      if (s.parameters.bacteria > 100) p += 2;
      return acc + p;
    }, 0);
    const max = sensors.length * 4;
    const pct = max ? Math.round((score / max) * 100) : 0;
    let level: RiskLevel = pct < 25 ? "low" : pct < 50 ? "medium" : pct < 75 ? "high" : "critical";
    return { pct, level };
  }, [sensors]);

  // Predictive mock data
  const trendData = useMemo(() => buildTrend(timeRange), [timeRange]);
  const modelConfidence = useMemo(() => randomBetween(70, 97, 0), [alerts.length]);

  return (
    <TooltipProvider>
      <div className={`${textLg ? "text-[17px]" : "text-base"} min-h-screen grid grid-cols-[260px_1fr] grid-rows-[64px_1fr] bg-[var(--background)] text-[var(--foreground)]`}>        
        {/* Header */}
        <header className="col-span-2 row-start-1 flex items-center justify-between px-4 md:px-6 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <img alt="logo" src="https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=64&q=60&auto=format&fit=crop" className="h-8 w-8 rounded" />
              <span className="font-semibold">{t.app}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={lang} onValueChange={(v: LangKey) => setLang(v)}>
              <SelectTrigger className="w-[160px]">
                <Languages className="mr-2 h-4 w-4" />
                <SelectValue placeholder={t.language} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t.language}</SelectLabel>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="as">Assamese</SelectItem>
                  <SelectItem value="hi">हिन्दी</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button variant="secondary" className="hidden md:inline-flex" onClick={() => setTextLg((s) => !s)}>
              A±
            </Button>
            <Button variant="secondary" onClick={() => setDark((d) => !d)}>
              {dark ? "Light" : "Dark"}
            </Button>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <Button className="bg-red-600 hover:bg-red-700" onClick={() => toast(t.emergency, { icon: <Siren className="h-4 w-4 text-red-500" /> })}>
              <Siren className="mr-2 h-4 w-4" /> {t.emergency}
            </Button>
            <Button variant="ghost" size="icon" aria-label="user">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Sidebar */}
        <aside className="row-start-2 col-start-1 border-r hidden md:flex flex-col overflow-hidden">
          <ScrollArea className="h-full">
            <nav className="p-3 space-y-1">
              {[
                { key: "dashboard", label: t.dashboard, icon: Activity },
                { key: "water", label: t.waterQuality, icon: Gauge },
                { key: "analytics", label: t.analytics, icon: Brain },
                { key: "alerts", label: t.alerts, icon: Bell },
                { key: "profiles", label: t.profiles, icon: User },
                { key: "reports", label: t.reports, icon: LineChartIcon },
                { key: "settings", label: t.settings, icon: ChevronRight },
              ].map((item) => (
                <Button
                  key={item.key}
                  variant={nav === (item.key as NavKey) ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setNav(item.key as NavKey)}
                >
                  <item.icon className="mr-2 h-4 w-4" /> {item.label}
                </Button>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* Main */}
        <main className="row-start-2 col-start-2 p-4 md:p-6 space-y-6">
          {nav === "dashboard" && (
            <Dashboard t={t} sensors={sensors} alerts={recentAlerts} communities={communitiesStats} riskIndex={riskIndex} activeSensors={activeSensors} />
          )}
          {nav === "water" && (
            <WaterQuality t={t} sensors={sensors} timeRange={timeRange} setTimeRange={setTimeRange} />
          )}
          {nav === "analytics" && (
            <Analytics t={t} trendData={trendData} modelConfidence={modelConfidence} />
          )}
          {nav === "alerts" && (
            <Alerts t={t} alerts={alerts} onAck={(id) => dispatchAlerts({ type: "ack", id })} />
          )}
          {nav === "profiles" && (
            <Profiles t={t} sensors={sensors} communities={communitiesStats} />
          )}
          {nav === "reports" && <Reports t={t} />}
          {nav === "settings" && <Settings t={t} />}
        </main>
        <Toaster richColors position="top-right" />
      </div>
    </TooltipProvider>
  );
}

// ------------------ Subcomponents ------------------

function severityIcon(level: RiskLevel) {
  const cls = "h-4 w-4";
  switch (level) {
    case "low":
      return <ShieldAlert className={cls} />;
    case "medium":
      return <AlertCircle className={cls} />;
    case "high":
      return <Flame className={cls} />;
    case "critical":
      return <BellRing className={cls} />;
  }
}

function StatCard({ title, value, icon, tone }: { title: string; value: string | number; icon: JSX.Element; tone?: "ok" | "warn" | "danger" }) {
  const toneCls = tone === "danger" ? "border-red-300" : tone === "warn" ? "border-yellow-300" : "border-green-300";
  return (
    <Card className={`border ${toneCls}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Dashboard({
  t,
  sensors,
  alerts,
  communities,
  riskIndex,
  activeSensors,
}: {
  t: any;
  sensors: SensorReading[];
  alerts: AlertItem[];
  communities: Community[];
  riskIndex: { pct: number; level: RiskLevel };
  activeSensors: number;
}) {
  const totalCommunities = communities.length;

  const simpleTrend = useMemo(() => buildTrend("7d"), []);

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title={t.communities} value={totalCommunities} icon={<Globe className="h-4 w-4" />} tone="ok" />
        <StatCard title={t.sensors} value={activeSensors} icon={<Gauge className="h-4 w-4" />} tone={activeSensors > 6 ? "ok" : "warn"} />
        <StatCard title={t.recentAlerts} value={alerts.length} icon={<Bell className="h-4 w-4" />} tone={alerts.length > 2 ? "warn" : "ok"} />
        <StatCard title={t.riskIndex} value={`${riskIndex.pct}%`} icon={<ShieldAlert className="h-4 w-4" />} tone={riskIndex.level === "critical" ? "danger" : riskIndex.level === "high" ? "warn" : "ok"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Real-time Water Quality</CardTitle>
            <CardDescription>Live aggregates across sensors</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={simpleTrend} margin={{ left: 12, right: 12, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="pH" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis />
                <ReTooltip />
                <Area type="monotone" dataKey="pH" stroke="#22c55e" fillOpacity={1} fill="url(#pH)" />
                <Area type="monotone" dataKey="turbidity" stroke="#f59e0b" fill="#f59e0b22" />
                <Area type="monotone" dataKey="bacteria" stroke="#ef4444" fill="#ef444422" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
            <CardDescription>Newest notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.length === 0 && <div className="text-sm text-muted-foreground">No active alerts</div>}
              {alerts.map((a) => (
                <div key={a.id} className={`flex items-start gap-2 p-2 rounded border ${riskColor(a.severity)}`}>
                  {severityIcon(a.severity)}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{a.title}</div>
                    <div className="text-xs opacity-80">{a.message}</div>
                  </div>
                  <Badge variant="secondary" className="capitalize">{a.channel}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sensor status grid */}
      <Card>
        <CardHeader>
          <CardTitle>Sensor Status</CardTitle>
          <CardDescription>Overview of network health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sensors.slice(0, 9).map((s) => (
              <div key={s.sensorId} className="p-3 rounded border">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{s.sensorId}</div>
                  <Badge className="capitalize" variant="outline">
                    {s.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" /> {s.location}
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                  <MiniMetric label="pH" value={s.parameters.pH.toFixed(2)} safe={s.parameters.pH >= 6.5 && s.parameters.pH <= 8.5} />
                  <MiniMetric label="NTU" value={s.parameters.turbidity.toFixed(1)} safe={s.parameters.turbidity <= 4} />
                  <MiniMetric label="CFU" value={s.parameters.bacteria} safe={s.parameters.bacteria <= 100} />
                  <MiniMetric label="°C" value={s.parameters.temperature.toFixed(1)} safe={s.parameters.temperature <= 35} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MiniMetric({ label, value, safe }: { label: string; value: string | number; safe: boolean }) {
  return (
    <div className={`rounded p-2 border ${safe ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function WaterQuality({
  t,
  sensors,
  timeRange,
  setTimeRange,
}: {
  t: any;
  sensors: SensorReading[];
  timeRange: "7d" | "30d";
  setTimeRange: (v: "7d" | "30d") => void;
}) {
  const data = useMemo(() => buildTrend(timeRange), [timeRange]);

  const aggregates = useMemo(() => {
    const online = sensors.filter((s) => s.status === "online");
    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    return {
      pH: avg(online.map((s) => s.parameters.pH)).toFixed(2),
      turbidity: avg(online.map((s) => s.parameters.turbidity)).toFixed(2),
      bacteria: Math.round(avg(online.map((s) => s.parameters.bacteria))),
      temperature: avg(online.map((s) => s.parameters.temperature)).toFixed(1),
    };
  }, [sensors]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge className="capitalize">{t.parameters}</Badge>
          <div className="text-sm text-muted-foreground">pH 6.5-8.5 • NTU ≤ 4 • CFU ≤ 100</div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v: "7d" | "30d") => setTimeRange(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t.trend7}</SelectItem>
              <SelectItem value="30d">{t.trend30}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t.pH} / {t.turbidity}</CardTitle>
            <CardDescription>Time series</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis />
                <ReTooltip />
                <Line type="monotone" dataKey="pH" stroke="#22c55e" dot={false} />
                <Line type="monotone" dataKey="turbidity" stroke="#f59e0b" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.bacteria} / {t.temperature}</CardTitle>
            <CardDescription>Time series</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis />
                <ReTooltip />
                <Bar dataKey="bacteria" fill="#ef4444" />
                <Bar dataKey="temperature" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Simplified map grid */}
      <Card>
        <CardHeader>
          <CardTitle>Location Map (Simplified)</CardTitle>
          <CardDescription>Relative positioning of sensors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sensors.slice(0, 8).map((s) => (
              <div key={s.sensorId} className="p-3 rounded border">
                <div className="text-sm font-medium truncate">{s.location}</div>
                <div className="text-xs text-muted-foreground">{s.coordinates[0].toFixed(3)}, {s.coordinates[1].toFixed(3)}</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{s.status}</Badge>
                  <Badge variant="secondary">{Math.max(0, s.batteryLevel)}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Analytics({ t, trendData, modelConfidence }: { t: any; trendData: any[]; modelConfidence: number }) {
  // A very simple risk score projection
  const nextWeeks = useMemo(() =>
    Array.from({ length: 5 }).map((_, i) => ({ week: `W+${i}`, risk: Math.max(5, Math.min(100, Math.round(randomBetween(20 + i * 10, 80 + i * 5, 0)))) })),
  );
  const currentRisk = trendData.slice(-1)[0]?.risk ?? 35;
  const level: RiskLevel = currentRisk < 25 ? "low" : currentRisk < 50 ? "medium" : currentRisk < 75 ? "high" : "critical";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>{t.riskScore}</CardTitle>
          <CardDescription>{t.outbreakPrediction}</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis />
              <ReTooltip />
              <Area dataKey="risk" stroke="#ef4444" fill="#ef444422" />
              <Area dataKey="confidence" stroke="#3b82f6" fill="#3b82f622" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.earlyWarning}</CardTitle>
          <CardDescription>{t.confidence}: {modelConfidence}%</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded border ${riskColor(level)}`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              {severityIcon(level)}
              <span className="capitalize">{level}</span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Next 2-3 weeks: projected risk trend based on water quality deviations and seasonality.
            </div>
            <div className="mt-3">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={nextWeeks}>
                  <XAxis dataKey="week" />
                  <YAxis />
                  <ReTooltip />
                  <Bar dataKey="risk" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Alerts({ t, alerts, onAck }: { t: any; alerts: AlertItem[]; onAck: (id: string) => void }) {
  const [channel, setChannel] = useState<AlertItem["channel"] | "all">("all");

  const filtered = alerts.filter((a) => (channel === "all" ? true : a.channel === channel));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={channel} onValueChange={(v: any) => setChannel(v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Channel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="sms">{t.sms}</SelectItem>
            <SelectItem value="app">{t.app}</SelectItem>
            <SelectItem value="voice">{t.voice}</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => toast("Broadcast sent", { icon: <PhoneCall className="h-4 w-4" /> })}>
          <PhoneCall className="h-4 w-4 mr-2" /> {t.broadcast}
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t.history}</CardTitle>
          <CardDescription>Recent {filtered.length} alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filtered.length === 0 && <div className="text-sm text-muted-foreground">No alerts yet</div>}
            {filtered.map((a) => (
              <div key={a.id} className={`p-3 rounded border flex items-start gap-3 ${riskColor(a.severity)}`}>
                {severityIcon(a.severity)}
                <div className="flex-1">
                  <div className="font-medium text-sm">{a.title}</div>
                  <div className="text-xs opacity-80">{a.message}</div>
                  <div className="text-[11px] opacity-70">{new Date(a.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">{a.channel}</Badge>
                  {!a.acknowledged && (
                    <Button size="sm" variant="secondary" onClick={() => onAck(a.id)}>
                      {t.acknowledge}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Profiles({ t, sensors, communities }: { t: any; sensors: SensorReading[]; communities: Community[] }) {
  const [q, setQ] = useState("");
  const enriched = useMemo(() =>
    communities
      .map((c) => {
        const s = sensors.filter((x) => x.communityId === c.communityId);
        const online = s.filter((x) => x.status === "online").length;
        const latest = s[0];
        const waterOk = latest ? latest.parameters.turbidity <= 4 && latest.parameters.pH >= 6.5 && latest.parameters.pH <= 8.5 && latest.parameters.bacteria <= 100 : true;
        return { c, online, waterOk };
      })
      .filter(({ c }) => c.name.toLowerCase().includes(q.toLowerCase())),
  [communities, sensors, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input placeholder={`${t.search}...`} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {enriched.map(({ c, online, waterOk }) => (
          <Card key={c.communityId}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{c.name}</span>
                <Badge className={`capitalize ${riskColor(c.riskLevel)}`}>{c.riskLevel}</Badge>
              </CardTitle>
              <CardDescription>Population: {c.population}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Online sensors</span>
                  <span className="font-medium">{online}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last incident</span>
                  <span className="font-medium">{c.lastIncident}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Response rate</span>
                  <span className="font-medium">{c.responseRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Water quality</span>
                  <Badge variant={waterOk ? "secondary" : "destructive"}>{waterOk ? "Good" : "Attention"}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span>Health worker</span>
                  <span className="font-medium">{c.healthWorker}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Button size="sm" variant="secondary"><PhoneCall className="h-4 w-4 mr-1" />Contact</Button>
                  <Button size="sm" variant="ghost"><Globe className="h-4 w-4 mr-1" />Details</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Reports({ t }: { t: any }) {
  const data = useMemo(() => buildTrend("30d"), []);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Comparative Report</CardTitle>
          <CardDescription>Export-ready visuals</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis />
              <ReTooltip />
              <Bar dataKey="pH" fill="#22c55e" />
              <Bar dataKey="turbidity" fill="#f59e0b" />
              <Bar dataKey="bacteria" fill="#ef4444" />
              <Bar dataKey="temperature" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button>Generate PDF</Button>
        <Button variant="secondary">Export CSV</Button>
      </div>
    </div>
  );
}

function Settings({ t }: { t: any }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t.settings}</CardTitle>
          <CardDescription>System preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">Toggle dark mode and adjust font size using the header controls. Offline-ready indicators appear when sensors go offline.</div>
          <div className="text-sm">Cultural theme: Subtle blues/greens, orange/red for alerts. Accessible, mobile-friendly layout.</div>
        </CardContent>
      </Card>
    </div>
  );
}

// ------------------ Data generation ------------------

function buildTrend(range: "7d" | "30d") {
  const len = range === "7d" ? 14 : 30;
  return Array.from({ length: len }).map((_, i) => ({
    name: `${i + 1}`,
    pH: randomBetween(6.6, 8.3, 2),
    turbidity: randomBetween(0.2, 5.5, 1),
    bacteria: Math.round(randomBetween(5, 200, 0)),
    temperature: randomBetween(18, 32, 1),
    risk: Math.round(randomBetween(10, 85, 0)),
    confidence: Math.round(randomBetween(60, 95, 0)),
  }));
}