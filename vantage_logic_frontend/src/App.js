import { useState, useEffect } from "react";

const API = "https://contractor-api-pi7o.onrender.com";

let _logoutFn = null;
function setLogoutHandler(fn) { _logoutFn = fn; }

async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  if (response.status === 401) {
    if (_logoutFn) _logoutFn();
    return response;
  }
  return response;
}

// ─── THEME & FONTS ────────────────────────────────────────────
const theme = {
  primary: "#1a3d2b",
  primaryDark: "#0f2818",
  accent: "#2d6a4f",
  accentLight: "#e8f3ec",
  gold: "#c8973a",
  goldLight: "#fdf4e3",
  danger: "#b83232",
  dangerLight: "#fdf0ee",
  warning: "#c47d1a",
  warningLight: "#fdf4e3",
  bg: "#f7f6f3",
  card: "#ffffff",
  border: "#e6e3dd",
  borderStrong: "#d4cfc6",
  textPrimary: "#1a1a1a",
  textSecondary: "#5c5c5c",
  textLight: "#9a9a9a",
  sidebarWidth: "240px",
};

const font = {
  body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  display: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};

const isMobile = () => window.innerWidth < 768;

const styles = {
  container: { maxWidth: "640px", margin: "0 auto", padding: "24px 18px 110px", fontFamily: font.body, backgroundColor: theme.bg, minHeight: "100vh" },
  title: { fontSize: "26px", fontWeight: "700", color: theme.primary, marginBottom: "4px", fontFamily: font.display, letterSpacing: "-0.5px", lineHeight: 1.2 },
  subtitle: { fontSize: "14px", color: theme.textSecondary, marginBottom: "24px", lineHeight: 1.4 },
  form: { display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontSize: "11px", fontWeight: "600", color: theme.textSecondary, marginTop: "14px", textTransform: "uppercase", letterSpacing: "0.7px" },
  input: { padding: "13px 14px", fontSize: "15px", borderRadius: "8px", border: `1.5px solid ${theme.border}`, width: "100%", boxSizing: "border-box", backgroundColor: "white", outline: "none", fontFamily: font.body, transition: "border-color 0.15s, box-shadow 0.15s" },
  inputError: { padding: "13px 14px", fontSize: "15px", borderRadius: "8px", border: `1.5px solid ${theme.danger}`, width: "100%", boxSizing: "border-box", backgroundColor: theme.dangerLight, outline: "none", fontFamily: font.body },
  textarea: { padding: "13px 14px", fontSize: "15px", borderRadius: "8px", border: `1.5px solid ${theme.border}`, width: "100%", boxSizing: "border-box", minHeight: "84px", backgroundColor: "white", fontFamily: font.body, resize: "vertical" },
  button: { marginTop: "18px", padding: "14px 22px", fontSize: "15px", backgroundColor: theme.primary, color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontFamily: font.body, transition: "all 0.15s", minHeight: "48px" },
  card: { backgroundColor: "white", borderRadius: "12px", padding: "22px", border: `1px solid ${theme.border}`, boxShadow: "0 1px 3px rgba(26,61,43,0.04)" },
  errorMsg: { color: theme.danger, fontSize: "12px", marginTop: "4px", fontWeight: "500" },
};

function fmt(n) {
  return Number(n || 0).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getStoredAuth() {
  try { return { token: localStorage.getItem("vl_token"), role: localStorage.getItem("vl_role") }; }
  catch { return { token: null, role: null }; }
}

function setStoredAuth(token, role) {
  try {
    if (token) { localStorage.setItem("vl_token", token); localStorage.setItem("vl_role", role); }
    else { localStorage.removeItem("vl_token"); localStorage.removeItem("vl_role"); }
  } catch {}
}

// ─── PASSWORD INPUT ───────────────────────────────────────────
function PasswordInput({ placeholder, value, onChange, required, error }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input style={{...(error ? styles.inputError : styles.input), paddingRight: "60px"}} type={show ? "text" : "password"} placeholder={placeholder || "Password"} value={value} onChange={onChange} required={required} />
      <button type="button" onClick={() => setShow(!show)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: theme.accent, fontWeight: "600", padding: 0 }}>
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

// ─── IDENTITY BADGE ───────────────────────────────────────────
function IdentityBadge({ name }) {
  return (
    <div style={{ padding: "12px 14px", backgroundColor: theme.accentLight, borderRadius: "8px", border: `1px solid ${theme.accent}`, fontSize: "13px", fontWeight: "600", color: theme.accent, marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      Logging as {name || "your account"}
    </div>
  );
}

// ─── LOGO ─────────────────────────────────────────────────────
function VantageLogo({ size = 40, dark = false, centered = false }) {
  const scale = size / 40;
  const textColor = dark ? "white" : theme.primary;
  const subColor = dark ? "rgba(200,151,58,0.9)" : theme.gold;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: Math.round(10 * scale) + "px", margin: centered ? "0 auto" : "0" }}>
      {/* Icon mark */}
      <div style={{ width: Math.round(28 * scale) + "px", height: Math.round(28 * scale) + "px", borderRadius: Math.round(6 * scale) + "px", backgroundColor: dark ? "rgba(255,255,255,0.12)" : theme.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width={Math.round(16 * scale)} height={Math.round(16 * scale)} viewBox="0 0 16 16" fill="none">
          <path d="M2 12 L8 4 L14 12" stroke={theme.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 12 L8 7 L11 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
        </svg>
      </div>
      {/* Wordmark */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: Math.round(15 * scale) + "px", fontWeight: "800", color: textColor, letterSpacing: "-0.3px", lineHeight: 1, whiteSpace: "nowrap" }}>
          VANTAGE
        </span>
        <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: Math.round(7 * scale) + "px", fontWeight: "500", color: subColor, letterSpacing: Math.round(3.5 * scale) + "px", lineHeight: 1, whiteSpace: "nowrap", marginTop: "3px", paddingLeft: "1px" }}>
          LOGIC
        </span>
      </div>
    </div>
  );
}

// ─── NAV ICONS ────────────────────────────────────────────────
function IconHome() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function IconHours() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function IconMaterials() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>; }
function IconMileage() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>; }
function IconDashboard() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>; }
function IconSchedule() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function IconAdmin() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>; }

// ─── SPINNER ──────────────────────────────────────────────────
function Spinner({ size = 16, color = "white" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: "vlspin 0.8s linear infinite" }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeOpacity="0.25" strokeWidth="3" fill="none" />
      <path d="M12 2 a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ─── SKELETON ─────────────────────────────────────────────────
function Skeleton({ width = "100%", height = "16px", radius = "4px" }) {
  return <div style={{ width, height, borderRadius: radius, background: `linear-gradient(90deg, ${theme.border} 0%, ${theme.bg} 50%, ${theme.border} 100%)`, backgroundSize: "200% 100%", animation: "vlskeleton 1.5s ease-in-out infinite" }} />;
}

// ─── NAVIGATION ───────────────────────────────────────────────
function NavBar({ view, setView, role, onLogout }) {
  const [mobile, setMobile] = useState(isMobile());

  useEffect(() => {
    const handler = () => setMobile(isMobile());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const isCrew = role === "crew";

  const tabs = isCrew
    ? [
        { id: "home", label: "Home", Icon: IconHome },
        { id: "timesheet", label: "Hours", Icon: IconHours },
        { id: "materials", label: "Materials", Icon: IconMaterials },
        { id: "mileage", label: "Mileage", Icon: IconMileage },
      ]
    : [
        { id: "schedule", label: "Schedule", Icon: IconSchedule },
        { id: "dashboard", label: "Dashboard", Icon: IconDashboard },
        { id: "admin", label: "Admin", Icon: IconAdmin },
      ];

  if (mobile) {
    return (
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: theme.primaryDark, zIndex: 1000, display: "flex", justifyContent: "space-around", padding: "10px 0 14px", boxShadow: "0 -1px 0 rgba(255,255,255,0.06), 0 -4px 20px rgba(0,0,0,0.25)", paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "6px 10px", borderRadius: "8px", minWidth: "48px", minHeight: "48px" }}>
            <span style={{ color: view === tab.id ? "white" : "rgba(255,255,255,0.4)", display: "flex" }}><tab.Icon /></span>
            <span style={{ fontSize: "10px", color: view === tab.id ? "white" : "rgba(255,255,255,0.4)", fontWeight: view === tab.id ? "600" : "400", letterSpacing: "0.3px" }}>{tab.label}</span>
            {view === tab.id && <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: theme.gold }} />}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: theme.sidebarWidth, backgroundColor: theme.primaryDark, display: "flex", flexDirection: "column", zIndex: 1000, boxShadow: "1px 0 0 rgba(255,255,255,0.06)" }}>
      <div style={{ padding: "30px 22px 26px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <VantageLogo size={36} dark={true} />
      </div>
      <div style={{ flex: 1, padding: "18px 12px" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "7px", border: "none", cursor: "pointer", marginBottom: "3px", backgroundColor: view === tab.id ? "rgba(255,255,255,0.1)" : "transparent", color: view === tab.id ? "white" : "rgba(255,255,255,0.5)", fontFamily: font.body, fontSize: "13px", fontWeight: view === tab.id ? "600" : "400", textAlign: "left", transition: "all 0.15s" }}>
            <span style={{ display: "flex", flexShrink: 0 }}><tab.Icon /></span>
            <span>{tab.label}</span>
            {view === tab.id && <div style={{ marginLeft: "auto", width: "3px", height: "16px", borderRadius: "2px", backgroundColor: theme.gold }} />}
          </button>
        ))}
      </div>
      <div style={{ padding: "8px 12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <button onClick={onLogout} style={{ width: "100%", padding: "10px 14px", borderRadius: "7px", border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "transparent", color: "rgba(255,255,255,0.55)", cursor: "pointer", fontFamily: font.body, fontSize: "12px", fontWeight: "500", textAlign: "center", letterSpacing: "0.3px" }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── COLLAPSIBLE ──────────────────────────────────────────────
function CollapsibleSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: "10px", borderRadius: "10px", overflow: "hidden", border: `1px solid ${theme.border}` }}>
      <div onClick={() => setOpen(!open)} style={{ backgroundColor: theme.primary, color: "white", padding: "14px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "600", fontSize: "14px", fontFamily: font.body, minHeight: "48px" }}>
        <span>{title}</span>
        <span style={{ fontSize: "11px", opacity: 0.6 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && <div style={{ backgroundColor: "white", padding: "18px" }}>{children}</div>}
    </div>
  );
}

// ─── ONBOARDING ───────────────────────────────────────────────
function OnboardingChecklist({ token, onDismiss }) {
  const [hasJob, setHasJob] = useState(false);
  const [hasEmployee, setHasEmployee] = useState(false);

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    apiFetch(`${API}/jobs`, { headers: h }).then(r => r.json()).then(data => setHasJob(data.length > 0));
    apiFetch(`${API}/employees`, { headers: h }).then(r => r.json()).then(data => setHasEmployee(data.length > 0));
  }, [token]);

  const steps = [
    { label: "Add your first job", done: hasJob, hint: "Go to Admin → Jobs" },
    { label: "Add your first employee", done: hasEmployee, hint: "Go to Admin → Employees" },
    { label: "Share the app link with your crew", done: false, hint: window.location.origin, copyable: true },
  ];

  return (
    <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", marginBottom: "20px", border: `2px solid ${theme.accent}`, boxShadow: "0 2px 12px rgba(45,106,79,0.12)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
        <div>
          <div style={{ fontWeight: "700", fontSize: "16px", color: theme.primary, fontFamily: font.display, letterSpacing: "-0.3px" }}>Get started</div>
          <div style={{ fontSize: "13px", color: theme.textSecondary, marginTop: "3px" }}>Three steps to get your team running</div>
        </div>
        <button onClick={onDismiss} style={{ fontSize: "22px", color: theme.textLight, background: "none", border: "none", cursor: "pointer", lineHeight: 1, padding: "0 0 0 12px", fontWeight: "300" }}>×</button>
      </div>
      {steps.map((step, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "11px 0", borderBottom: i < steps.length - 1 ? `1px solid ${theme.border}` : "none" }}>
          <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: step.done ? theme.accent : theme.border, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
            <span style={{ fontSize: "12px", color: "white", fontWeight: "700" }}>{step.done ? "✓" : i + 1}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: step.done ? theme.textSecondary : theme.textPrimary, textDecoration: step.done ? "line-through" : "none" }}>{step.label}</div>
            <div style={{ fontSize: "11px", color: theme.textLight, marginTop: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>{step.hint}</span>
              {step.copyable && (
                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(step.hint); }} style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "4px", border: "none", cursor: "pointer", backgroundColor: theme.accent, color: "white", fontWeight: "600" }}>Copy</button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────
function Login({ onLogin, onSignUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError("Please enter your email and password"); return; }
    setError("");
    setLoading(true);
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);
    const response = await fetch(`${API}/login`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: formData });
    setLoading(false);
    if (response.ok) {
      const data = await response.json();
      onLogin(data.access_token, data.role);
    } else {
      setError("Incorrect email or password");
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: theme.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: font.body, padding: "32px 20px" }}>
      <div style={{ marginBottom: "36px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <VantageLogo size={64} dark={false} centered={true} />
        <p style={{ fontSize: "14px", color: theme.textSecondary, marginTop: "20px", textAlign: "center", maxWidth: "320px", lineHeight: 1.5 }}>
          Real-time job costing, crew tracking, and profit visibility built for trades.
        </p>
      </div>

      <div style={{ backgroundColor: "white", borderRadius: "14px", padding: "36px 32px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 24px rgba(26,61,43,0.08)", border: `1px solid ${theme.border}` }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: theme.primary, fontFamily: font.display, margin: "0 0 6px", letterSpacing: "-0.3px" }}>Sign in</h1>
        <p style={{ fontSize: "13px", color: theme.textSecondary, margin: "0 0 24px" }}>Welcome back to Vantage Logic</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input style={error && !email ? styles.inputError : styles.input} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="you@yourcompany.com" />
          <label style={styles.label}>Password</label>
          <PasswordInput value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} error={error && !password} />
          {error && <p style={{...styles.errorMsg, marginTop: "10px"}}>{error}</p>}
          <button style={{...styles.button, marginTop: "24px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"}} type="submit" disabled={loading}>
            {loading ? <><Spinner /> Signing in...</> : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: `1px solid ${theme.border}` }}>
          <p style={{ fontSize: "13px", color: theme.textSecondary, margin: "0 0 12px", textAlign: "center" }}>
            New to Vantage Logic?
          </p>
          <button onClick={onSignUp} type="button" style={{ width: "100%", fontSize: "14px", color: theme.accent, background: "white", border: `1.5px solid ${theme.accent}`, borderRadius: "8px", padding: "12px", cursor: "pointer", fontWeight: "600", fontFamily: font.body, minHeight: "44px" }}>
            Create an Account
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: "11px", color: theme.textLight, marginTop: "18px" }}>Forgot your password? Contact your administrator.</p>
      </div>

      <p style={{ fontSize: "11px", color: theme.textLight, marginTop: "28px", textAlign: "center" }}>
        © 2026 Vantage Logic
      </p>
    </div>
  );
}

// ─── SIGN UP ──────────────────────────────────────────────────
function SignUp({ onLogin, onBack }) {
  const [form, setForm] = useState({ company_name: "", email: "", password: "", confirm_password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!form.company_name.trim()) e.company_name = "Company name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Please enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirm_password) e.confirm_password = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const params = new URLSearchParams({ company_name: form.company_name, email: form.email, password: form.password });
    const response = await fetch(`${API}/signup?${params}`, { method: "POST" });
    setLoading(false);
    if (response.ok) {
      const data = await response.json();
      onLogin(data.access_token, data.role, true);
    } else {
      const data = await response.json();
      setErrors({ general: data.detail || "Sign up failed. Please try again." });
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: theme.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: font.body, padding: "32px 20px" }}>
      <div style={{ marginBottom: "32px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <VantageLogo size={56} dark={false} centered={true} />
      </div>

      <div style={{ backgroundColor: "white", borderRadius: "14px", padding: "36px 32px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 24px rgba(26,61,43,0.08)", border: `1px solid ${theme.border}` }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: theme.primary, fontFamily: font.display, margin: "0 0 6px", letterSpacing: "-0.3px" }}>Start your free trial</h1>
        <p style={{ fontSize: "13px", color: theme.textSecondary, margin: "0 0 24px" }}>30 days free. No credit card required.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Company Name</label>
          <input style={errors.company_name ? styles.inputError : styles.input} placeholder="e.g. Johnson Electrical" value={form.company_name} onChange={e => { setForm({...form, company_name: e.target.value}); setErrors({...errors, company_name: ""}); }} />
          {errors.company_name && <p style={styles.errorMsg}>{errors.company_name}</p>}

          <label style={styles.label}>Your Email</label>
          <input style={errors.email ? styles.inputError : styles.input} type="email" placeholder="you@yourcompany.com" value={form.email} onChange={e => { setForm({...form, email: e.target.value}); setErrors({...errors, email: ""}); }} />
          {errors.email && <p style={styles.errorMsg}>{errors.email}</p>}

          <label style={styles.label}>Password</label>
          <PasswordInput placeholder="At least 8 characters" value={form.password} onChange={e => { setForm({...form, password: e.target.value}); setErrors({...errors, password: ""}); }} error={errors.password} />
          {errors.password && <p style={styles.errorMsg}>{errors.password}</p>}

          <label style={styles.label}>Confirm Password</label>
          <PasswordInput placeholder="Confirm your password" value={form.confirm_password} onChange={e => { setForm({...form, confirm_password: e.target.value}); setErrors({...errors, confirm_password: ""}); }} error={errors.confirm_password} />
          {errors.confirm_password && <p style={styles.errorMsg}>{errors.confirm_password}</p>}

          {errors.general && <p style={{...styles.errorMsg, marginTop: "10px"}}>{errors.general}</p>}

          <button style={{...styles.button, marginTop: "24px", backgroundColor: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"}} type="submit" disabled={loading}>
            {loading ? <><Spinner /> Creating account...</> : "Create Free Account"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button onClick={onBack} type="button" style={{ fontSize: "13px", color: theme.textSecondary, background: "none", border: "none", cursor: "pointer", fontWeight: "500" }}>Already have an account? Sign in</button>
        </div>
      </div>
    </div>
  );
}

// ─── CREW HOME (personalized stats) ───────────────────────────
function CrewHome({ token, setView }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      apiFetch(`${API}/me/stats`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/my-schedule`, { headers: h }).then(r => r.json()),
    ]).then(([statsData, schedData]) => {
      setStats(statsData);
      setSchedule(Array.isArray(schedData) ? schedData : []);
      setLoading(false);
    });
  }, [token]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const today = new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" });
  const firstName = stats?.employee_name?.split(" ")[0] || "";

  const StatCard = ({ label, value, unit, sublabel }) => (
    <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "18px 16px", border: `1px solid ${theme.border}`, boxShadow: "0 1px 3px rgba(26,61,43,0.04)" }}>
      <div style={{ fontSize: "11px", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: "600", marginBottom: "8px" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
        <div style={{ fontSize: "26px", fontWeight: "700", color: theme.primary, fontFamily: font.display, letterSpacing: "-0.5px" }}>{value}</div>
        {unit && <div style={{ fontSize: "13px", color: theme.textSecondary, fontWeight: "500" }}>{unit}</div>}
      </div>
      {sublabel && <div style={{ fontSize: "11px", color: theme.textLight, marginTop: "4px" }}>{sublabel}</div>}
    </div>
  );

  const QuickActionBtn = ({ label, Icon, color, onClick }) => (
    <button onClick={onClick} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "18px 12px", borderRadius: "12px", border: `1px solid ${theme.border}`, backgroundColor: "white", cursor: "pointer", fontFamily: font.body, color: theme.textPrimary, transition: "all 0.15s", minHeight: "92px", boxShadow: "0 1px 3px rgba(26,61,43,0.04)" }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><Icon /></div>
      <span style={{ fontSize: "12px", fontWeight: "600" }}>{label}</span>
    </button>
  );

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ marginBottom: "24px" }}>
          <Skeleton width="60%" height="28px" />
          <div style={{ marginTop: "8px" }}><Skeleton width="40%" height="14px" /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
          {[1,2,3].map(i => <div key={i} style={{ height: "92px", borderRadius: "12px", background: theme.border, opacity: 0.4 }} />)}
        </div>
        <div style={{ marginTop: "20px" }}><Skeleton width="100%" height="220px" radius="12px" /></div>
      </div>
    );
  }

  if (!stats?.linked) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>{greeting}</h1>
        <p style={styles.subtitle}>{today}</p>
        <div style={{ ...styles.card, textAlign: "center", padding: "32px 22px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: theme.warningLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: theme.warning }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h3 style={{ fontSize: "16px", fontWeight: "600", color: theme.primary, margin: "0 0 6px", fontFamily: font.display }}>Account not linked</h3>
          <p style={{ fontSize: "13px", color: theme.textSecondary, margin: "0 0 18px", lineHeight: 1.5 }}>Ask your administrator to link your login to an employee record so we can track your hours and trips.</p>
          <button onClick={() => setView("timesheet")} style={{ ...styles.button, marginTop: 0 }}>Continue to Hours</button>
        </div>
      </div>
    );
  }

  const hasAnyData = stats.all_time.hours > 0 || stats.all_time.km > 0;

  return (
    <div style={styles.container}>
      {/* Greeting */}
      <div style={{ marginBottom: "26px" }}>
        <h1 style={styles.title}>{greeting}{firstName ? `, ${firstName}` : ""}</h1>
        <p style={styles.subtitle}>{today}</p>
      </div>

      {/* This Week */}
      <div style={{ marginBottom: "22px" }}>
        <div style={{ fontSize: "12px", fontWeight: "600", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>This Week</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
          <StatCard label="Hours" value={stats.week.hours} unit="h" />
          <StatCard label="Jobs" value={stats.week.jobs} />
          <StatCard label="KM Driven" value={stats.week.km} unit="km" />
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: "26px" }}>
        <div style={{ fontSize: "12px", fontWeight: "600", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>Quick Log</div>
        <div style={{ display: "flex", gap: "10px" }}>
          <QuickActionBtn label="Hours" Icon={IconHours} color={theme.primary} onClick={() => setView("timesheet")} />
          <QuickActionBtn label="Materials" Icon={IconMaterials} color={theme.gold} onClick={() => setView("materials")} />
          <QuickActionBtn label="Mileage" Icon={IconMileage} color={theme.accent} onClick={() => setView("mileage")} />
        </div>
      </div>

      {/* This Month + All Time */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "12px", fontWeight: "600", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>Lifetime Stats</div>
        <div style={{ ...styles.card, padding: "0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "16px 18px", borderBottom: `1px solid ${theme.border}` }}>
            <div>
              <div style={{ fontSize: "11px", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: "600", marginBottom: "6px" }}>This Month</div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: theme.primary, fontFamily: font.display }}>{stats.month.hours} <span style={{ fontSize: "12px", color: theme.textSecondary, fontWeight: "500" }}>hours</span></div>
              <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "2px" }}>{stats.month.km} km · {stats.month.jobs} jobs</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: "600", marginBottom: "6px" }}>All Time</div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: theme.primary, fontFamily: font.display }}>{stats.all_time.hours} <span style={{ fontSize: "12px", color: theme.textSecondary, fontWeight: "500" }}>hours</span></div>
              <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "2px" }}>{stats.all_time.km} km · {stats.all_time.jobs} jobs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Entries */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "12px", fontWeight: "600", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>My Schedule</div>
        {schedule.length === 0 ? (
          <div style={{ ...styles.card, textAlign: "center", padding: "28px 22px" }}>
            <p style={{ fontSize: "13px", color: theme.textSecondary, margin: 0 }}>No upcoming assignments. Check with your admin.</p>
          </div>
        ) : (
          <div style={{ ...styles.card, padding: "0" }}>
            {schedule.map((s, i) => {
              const date = new Date(s.scheduled_date + "T00:00:00");
              const isToday = s.scheduled_date === new Date().toISOString().split("T")[0];
              const isTomorrow = s.scheduled_date === new Date(Date.now() + 86400000).toISOString().split("T")[0];
              const dayLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : date.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
              return (
                <div key={s.schedule_id} style={{ padding: "14px 18px", borderBottom: i < schedule.length - 1 ? `1px solid ${theme.border}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: theme.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.job_name}</div>
                    <div style={{ fontSize: "12px", color: isToday ? theme.gold : theme.textSecondary, marginTop: "2px", fontWeight: isToday ? "600" : "400", display: "flex", alignItems: "center", gap: "6px" }}>
                      {dayLabel}
                      {isToday && <span style={{ backgroundColor: theme.gold, color: "white", padding: "1px 7px", borderRadius: "10px", fontSize: "10px", fontWeight: "700" }}>TODAY</span>}
                    </div>
                    {s.notes && <div style={{ fontSize: "11px", color: theme.textLight, marginTop: "3px", fontStyle: "italic" }}>{s.notes}</div>}
                  </div>
                  {s.scheduled_hours && (
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "17px", fontWeight: "700", color: theme.primary, fontFamily: font.display }}>{s.scheduled_hours}h</div>
                      <div style={{ fontSize: "10px", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>scheduled</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: "12px", fontWeight: "600", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>Recent Entries</div>
        {stats.recent_entries.length === 0 ? (
          <div style={{ ...styles.card, textAlign: "center", padding: "28px 22px" }}>
            <p style={{ fontSize: "13px", color: theme.textSecondary, margin: 0, lineHeight: 1.5 }}>{hasAnyData ? "No recent timesheets." : "No entries yet. Start by logging some hours."}</p>
          </div>
        ) : (
          <div style={{ ...styles.card, padding: "0" }}>
            {stats.recent_entries.map((e, i) => (
              <div key={i} style={{ padding: "14px 18px", borderBottom: i < stats.recent_entries.length - 1 ? `1px solid ${theme.border}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: theme.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.job_name}</div>
                  <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "2px" }}>{e.shift_date}</div>
                </div>
                <div style={{ fontSize: "17px", fontWeight: "700", color: theme.primary, fontFamily: font.display }}>{e.hours_worked}h</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// ─── ENTRY HISTORY ────────────────────────────────────────────
function EntryHistory({ token, type, linkedEmployeeId, jobs, employees, costCodes, onEditSaved }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const endpoint = type === "timesheet" ? "/timesheets" : type === "material" ? "/materials" : "/mileage";

  function fetchEntries() {
    return apiFetch(`${API}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        let filtered = data;
        if (linkedEmployeeId) {
          if (type === "timesheet") filtered = data.filter(e => e.employee_id === linkedEmployeeId);
          if (type === "material") filtered = data.filter(e => e.purchased_by === linkedEmployeeId);
          if (type === "mileage") filtered = data.filter(e => e.employee_id === linkedEmployeeId);
        }
        filtered.sort((a, b) => {
          const dateA = a.shift_date || a.purchase_date || a.trip_date || "";
          const dateB = b.shift_date || b.purchase_date || b.trip_date || "";
          return dateB.localeCompare(dateA);
        });
        setEntries(filtered.slice(0, 10));
        setLoading(false);
      });
  }

  useEffect(() => { fetchEntries(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startEdit(entry) {
    const id = entry.timesheet_id || entry.material_id || entry.mileage_id;
    setEditingId(id);
    if (type === "timesheet") setEditForm({ job_id: entry.job_id, cost_code_id: entry.cost_code_id, shift_date: entry.shift_date, hours_worked: entry.hours_worked, field_notes: entry.field_notes || "" });
    else if (type === "material") setEditForm({ job_id: entry.job_id, description: entry.description, supplier: entry.supplier || "", total_cost: entry.total_cost, purchase_date: entry.purchase_date, notes: entry.notes || "" });
    else setEditForm({ job_id: entry.job_id, trip_date: entry.trip_date, km_driven: entry.km_driven, purpose: entry.purpose || "", notes: entry.notes || "" });
  }

  async function saveEdit(id) {
    setSaving(true);
    const path = type === "timesheet" ? "timesheets" : type === "material" ? "materials" : "mileage";
    const res = await apiFetch(`${API}/${path}/${id}?${new URLSearchParams(editForm)}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    setSaving(false);
    if (res.ok) {
      setMessage("Entry updated.");
      setEditingId(null);
      setTimeout(() => setMessage(""), 3000);
      fetchEntries();
      if (onEditSaved) onEditSaved();
    } else {
      setMessage("Failed to update.");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  if (loading) return <div style={{ marginTop: "24px" }}><Skeleton width="100%" height="120px" radius="12px" /></div>;
  if (entries.length === 0) return null;

  return (
    <div style={{ marginTop: "28px" }}>
      <div style={{ fontSize: "12px", fontWeight: "600", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>Recent Entries</div>
      {message && <div style={{ color: theme.accent, fontWeight: "600", marginBottom: "10px", backgroundColor: theme.accentLight, padding: "9px 12px", borderRadius: "7px", fontSize: "13px" }}>{message}</div>}
      <div style={{ ...styles.card, padding: "0" }}>
        {entries.map((entry, i) => {
          const id = entry.timesheet_id || entry.material_id || entry.mileage_id;
          const isEditing = editingId === id;
          const date = entry.shift_date || entry.purchase_date || entry.trip_date;
          const jobName = (jobs.find(j => j.job_id === entry.job_id) || {}).job_name || "Unknown job";
          let mainLabel = type === "timesheet" ? jobName : type === "material" ? entry.description : jobName;
          let valueLabel = type === "timesheet" ? `${entry.hours_worked}h` : type === "material" ? `$${fmt(entry.total_cost)}` : `${entry.km_driven} km`;

          return (
            <div key={id} style={{ borderBottom: i < entries.length - 1 ? `1px solid ${theme.border}` : "none" }}>
              <div style={{ padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: theme.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{mainLabel}</div>
                  <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "2px" }}>{date}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                  <span style={{ fontSize: "15px", fontWeight: "700", color: theme.primary }}>{valueLabel}</span>
                  <button onClick={() => isEditing ? setEditingId(null) : startEdit(entry)} style={{ fontSize: "11px", padding: "5px 10px", borderRadius: "5px", border: "none", cursor: "pointer", backgroundColor: isEditing ? "#eee" : theme.accentLight, color: isEditing ? theme.textSecondary : theme.accent, fontWeight: "600", fontFamily: font.body }}>
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                </div>
              </div>
              {isEditing && (
                <div style={{ padding: "14px 16px", backgroundColor: theme.bg, borderTop: `1px solid ${theme.border}` }}>
                  {type === "timesheet" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                      <div><label style={styles.label}>Job</label><select style={{...styles.input, marginTop: "4px"}} value={editForm.job_id} onChange={e => setEditForm({...editForm, job_id: e.target.value})}>{jobs.map(j => <option key={j.job_id} value={j.job_id}>{j.job_name}</option>)}</select></div>
                      <div><label style={styles.label}>Hours</label><input style={{...styles.input, marginTop: "4px"}} type="number" step="0.5" value={editForm.hours_worked} onChange={e => setEditForm({...editForm, hours_worked: e.target.value})} /></div>
                      <div><label style={styles.label}>Date</label><input style={{...styles.input, marginTop: "4px"}} type="date" value={editForm.shift_date} onChange={e => setEditForm({...editForm, shift_date: e.target.value})} /></div>
                      <div><label style={styles.label}>Cost Code</label><select style={{...styles.input, marginTop: "4px"}} value={editForm.cost_code_id} onChange={e => setEditForm({...editForm, cost_code_id: e.target.value})}>{costCodes.map(cc => <option key={cc.cost_code_id} value={cc.cost_code_id}>{cc.code}</option>)}</select></div>
                    </div>
                  )}
                  {type === "material" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                      <div><label style={styles.label}>Job</label><select style={{...styles.input, marginTop: "4px"}} value={editForm.job_id} onChange={e => setEditForm({...editForm, job_id: e.target.value})}>{jobs.map(j => <option key={j.job_id} value={j.job_id}>{j.job_name}</option>)}</select></div>
                      <div><label style={styles.label}>Amount ($)</label><input style={{...styles.input, marginTop: "4px"}} type="number" step="0.01" value={editForm.total_cost} onChange={e => setEditForm({...editForm, total_cost: e.target.value})} /></div>
                      <div><label style={styles.label}>Description</label><input style={{...styles.input, marginTop: "4px"}} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} /></div>
                      <div><label style={styles.label}>Date</label><input style={{...styles.input, marginTop: "4px"}} type="date" value={editForm.purchase_date} onChange={e => setEditForm({...editForm, purchase_date: e.target.value})} /></div>
                    </div>
                  )}
                  {type === "mileage" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                      <div><label style={styles.label}>Job</label><select style={{...styles.input, marginTop: "4px"}} value={editForm.job_id} onChange={e => setEditForm({...editForm, job_id: e.target.value})}>{jobs.map(j => <option key={j.job_id} value={j.job_id}>{j.job_name}</option>)}</select></div>
                      <div><label style={styles.label}>KM Driven</label><input style={{...styles.input, marginTop: "4px"}} type="number" step="0.1" value={editForm.km_driven} onChange={e => setEditForm({...editForm, km_driven: e.target.value})} /></div>
                      <div><label style={styles.label}>Date</label><input style={{...styles.input, marginTop: "4px"}} type="date" value={editForm.trip_date} onChange={e => setEditForm({...editForm, trip_date: e.target.value})} /></div>
                      <div><label style={styles.label}>Purpose</label><input style={{...styles.input, marginTop: "4px"}} value={editForm.purpose} onChange={e => setEditForm({...editForm, purpose: e.target.value})} /></div>
                    </div>
                  )}
                  <button onClick={() => saveEdit(id)} style={{ ...styles.button, marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 20px" }} disabled={saving}>
                    {saving ? <><Spinner /> Saving...</> : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TIMESHEET ────────────────────────────────────────────────
function TimesheetForm({ token }) {
  const [formData, setFormData] = useState({ employee_id: "", job_id: "", cost_code_id: "", shift_date: new Date().toISOString().split("T")[0], hours_worked: "", field_notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [costCodes, setCostCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linkedEmployeeId, setLinkedEmployeeId] = useState(null);
  const [linkedEmployeeName, setLinkedEmployeeName] = useState("");

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      apiFetch(`${API}/me`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/employees`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/my-jobs`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/cost-codes`, { headers: h }).then(r => r.json()),
    ]).then(([me, emps, jobs, ccs]) => {
      if (me.employee_id) {
        setLinkedEmployeeId(me.employee_id);
        setFormData(prev => ({ ...prev, employee_id: me.employee_id }));
      }
      setEmployees(emps);
      setJobs(jobs.filter(j => j.status === "active"));
      setCostCodes(ccs);
      setLoading(false);
    });
  }, [token]);

  useEffect(() => {
    if (linkedEmployeeId && employees.length > 0) {
      const emp = employees.find(e => e.employee_id === linkedEmployeeId);
      if (emp) setLinkedEmployeeName(`${emp.first_name} ${emp.last_name}`);
    }
  }, [linkedEmployeeId, employees]);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  }

  function validate() {
    const e = {};
    if (!formData.employee_id) e.employee_id = "Please select an employee";
    if (!formData.job_id) e.job_id = "Please select a job";
    if (!formData.cost_code_id) e.cost_code_id = "Please select a cost code";
    if (!formData.shift_date) e.shift_date = "Date is required";
    if (!formData.hours_worked) e.hours_worked = "Hours are required";
    else if (parseFloat(formData.hours_worked) <= 0) e.hours_worked = "Must be greater than 0";
    else if (parseFloat(formData.hours_worked) > 24) e.hours_worked = "Hours can't exceed 24";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const response = await apiFetch(`${API}/timesheets?${new URLSearchParams(formData)}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    setSubmitting(false);
    if (response.ok) setSubmitted(true);
    else setErrors({ general: "Failed to submit. Please try again." });
  }

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: "center", marginTop: "80px" }}>
          <div style={{ width: "72px", height: "72px", backgroundColor: theme.accentLight, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: theme.primary, fontFamily: font.display, margin: "0 0 8px", letterSpacing: "-0.3px" }}>Hours logged</h2>
          <p style={{ color: theme.textSecondary, fontSize: "14px", margin: "0 0 32px" }}>Entry saved successfully.</p>
          <button style={styles.button} onClick={() => { setSubmitted(false); setFormData({ employee_id: linkedEmployeeId || "", job_id: "", cost_code_id: "", shift_date: new Date().toISOString().split("T")[0], hours_worked: "", field_notes: "" }); }}>Log Another</button>
        </div>
      </div>
    );
  }

  if (loading) return <div style={styles.container}><Skeleton width="40%" height="28px" /><div style={{marginTop:"12px"}}><Skeleton width="60%" height="14px" /></div><div style={{marginTop:"24px"}}><Skeleton width="100%" height="380px" radius="12px" /></div></div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Log Hours</h1>
      <p style={styles.subtitle}>Record your time on a job</p>
      <div style={styles.card}>
        <form onSubmit={handleSubmit} style={styles.form}>
          {linkedEmployeeId ? (
            <IdentityBadge name={linkedEmployeeName} />
          ) : (
            <>
              <label style={styles.label}>Employee</label>
              <select style={errors.employee_id ? styles.inputError : styles.input} name="employee_id" value={formData.employee_id} onChange={handleChange}>
                <option value="">Select employee</option>
                {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
              </select>
              {errors.employee_id && <p style={styles.errorMsg}>{errors.employee_id}</p>}
            </>
          )}

          <label style={styles.label}>Job</label>
          <select style={errors.job_id ? styles.inputError : styles.input} name="job_id" value={formData.job_id} onChange={handleChange}>
            <option value="">Select job</option>
            {jobs.map(job => <option key={job.job_id} value={job.job_id}>{job.job_name}</option>)}
          </select>
          {errors.job_id && <p style={styles.errorMsg}>{errors.job_id}</p>}

          <label style={styles.label}>Cost Code</label>
          <select style={errors.cost_code_id ? styles.inputError : styles.input} name="cost_code_id" value={formData.cost_code_id} onChange={handleChange}>
            <option value="">Select cost code</option>
            {costCodes.map(cc => <option key={cc.cost_code_id} value={cc.cost_code_id}>{cc.code} {cc.description}</option>)}
          </select>
          {errors.cost_code_id && <p style={styles.errorMsg}>{errors.cost_code_id}</p>}

          <label style={styles.label}>Date</label>
          <input style={errors.shift_date ? styles.inputError : styles.input} name="shift_date" type="date" value={formData.shift_date} onChange={handleChange} />
          {errors.shift_date && <p style={styles.errorMsg}>{errors.shift_date}</p>}

          <label style={styles.label}>Hours Worked</label>
          <input style={errors.hours_worked ? styles.inputError : styles.input} name="hours_worked" type="number" step="0.5" placeholder="e.g. 8.5" value={formData.hours_worked} onChange={handleChange} />
          {errors.hours_worked && <p style={styles.errorMsg}>{errors.hours_worked}</p>}

          <label style={styles.label}>Field Notes</label>
          <textarea style={styles.textarea} name="field_notes" placeholder="What did you work on today? (optional)" value={formData.field_notes} onChange={handleChange} />

          {errors.general && <p style={{...styles.errorMsg, marginTop: "10px"}}>{errors.general}</p>}

          <button style={{...styles.button, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"}} type="submit" disabled={submitting}>
            {submitting ? <><Spinner /> Submitting...</> : "Submit Timesheet"}
          </button>
        </form>
      </div>
      <EntryHistory token={token} type="timesheet" linkedEmployeeId={linkedEmployeeId} jobs={jobs} employees={employees} costCodes={costCodes} />
    </div>
  );
}

// ─── MATERIALS ────────────────────────────────────────────────
function MaterialsForm({ token }) {
  const [formData, setFormData] = useState({ job_id: "", employee_id: "", supplier: "", description: "", total_cost: "", purchase_date: new Date().toISOString().split("T")[0], notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [linkedEmployeeId, setLinkedEmployeeId] = useState(null);
  const [linkedEmployeeName, setLinkedEmployeeName] = useState("");
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      apiFetch(`${API}/me`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/my-jobs`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/employees`, { headers: h }).then(r => r.json()),
    ]).then(([me, jobs, emps]) => {
      if (me.employee_id) {
        setLinkedEmployeeId(me.employee_id);
        setFormData(prev => ({ ...prev, employee_id: me.employee_id }));
      }
      setJobs(jobs.filter(j => j.status === "active"));
      setEmployees(emps);
      setLoading(false);
    });
  }, [token]);

  useEffect(() => {
    if (linkedEmployeeId && employees.length > 0) {
      const emp = employees.find(e => e.employee_id === linkedEmployeeId);
      if (emp) setLinkedEmployeeName(`${emp.first_name} ${emp.last_name}`);
    }
  }, [linkedEmployeeId, employees]);

  function validate() {
    const e = {};
    if (!formData.job_id) e.job_id = "Please select a job";
    if (!formData.description) e.description = "Description is required";
    if (!formData.total_cost) e.total_cost = "Total amount is required";
    else if (parseFloat(formData.total_cost) <= 0) e.total_cost = "Must be greater than 0";
    if (!formData.purchase_date) e.purchase_date = "Purchase date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const params = {
      job_id: formData.job_id,
      description: formData.description,
      total_cost: formData.total_cost,
      purchase_date: formData.purchase_date,
    };
    if (formData.employee_id) params.purchased_by = formData.employee_id;
    if (formData.supplier) params.supplier = formData.supplier;
    if (formData.notes) params.notes = formData.notes;
    const response = await apiFetch(`${API}/materials?${new URLSearchParams(params)}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    setSubmitting(false);
    if (response.ok) setSubmitted(true);
    else setErrors({ general: "Failed to submit. Please try again." });
  }

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: "center", marginTop: "80px" }}>
          <div style={{ width: "72px", height: "72px", backgroundColor: theme.accentLight, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: theme.primary, fontFamily: font.display, margin: "0 0 8px", letterSpacing: "-0.3px" }}>Materials logged</h2>
          <p style={{ color: theme.textSecondary, fontSize: "14px", margin: "0 0 32px" }}>Purchase recorded successfully.</p>
          <button style={styles.button} onClick={() => { setSubmitted(false); setFormData({ job_id: "", employee_id: linkedEmployeeId || "", supplier: "", description: "", total_cost: "", purchase_date: new Date().toISOString().split("T")[0], notes: "" }); }}>Log Another</button>
        </div>
      </div>
    );
  }

  if (loading) return <div style={styles.container}><Skeleton width="40%" height="28px" /><div style={{marginTop:"12px"}}><Skeleton width="60%" height="14px" /></div><div style={{marginTop:"24px"}}><Skeleton width="100%" height="420px" radius="12px" /></div></div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Log Materials</h1>
      <p style={styles.subtitle}>Record a material purchase</p>
      <div style={styles.card}>
        <form onSubmit={handleSubmit} style={styles.form}>
          {linkedEmployeeId ? (
            <IdentityBadge name={linkedEmployeeName} />
          ) : (
            <>
              <label style={styles.label}>Purchased By</label>
              <select style={styles.input} value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})}>
                <option value="">Select employee</option>
                {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
              </select>
            </>
          )}

          <label style={styles.label}>Job</label>
          <select style={errors.job_id ? styles.inputError : styles.input} value={formData.job_id} onChange={e => { setFormData({...formData, job_id: e.target.value}); setErrors({...errors, job_id: ""}); }}>
            <option value="">Select job</option>
            {jobs.map(job => <option key={job.job_id} value={job.job_id}>{job.job_name}</option>)}
          </select>
          {errors.job_id && <p style={styles.errorMsg}>{errors.job_id}</p>}

          <label style={styles.label}>Supplier</label>
          <input style={styles.input} placeholder="e.g. Home Depot" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />

          <label style={styles.label}>Description</label>
          <input style={errors.description ? styles.inputError : styles.input} placeholder="e.g. Copper fittings" value={formData.description} onChange={e => { setFormData({...formData, description: e.target.value}); setErrors({...errors, description: ""}); }} />
          {errors.description && <p style={styles.errorMsg}>{errors.description}</p>}

          <label style={styles.label}>Total Amount ($)</label>
          <input style={errors.total_cost ? styles.inputError : styles.input} type="number" step="0.01" placeholder="0.00" value={formData.total_cost} onChange={e => { setFormData({...formData, total_cost: e.target.value}); setErrors({...errors, total_cost: ""}); }} />
          {errors.total_cost && <p style={styles.errorMsg}>{errors.total_cost}</p>}

          <label style={styles.label}>Purchase Date</label>
          <input style={errors.purchase_date ? styles.inputError : styles.input} type="date" value={formData.purchase_date} onChange={e => { setFormData({...formData, purchase_date: e.target.value}); setErrors({...errors, purchase_date: ""}); }} />
          {errors.purchase_date && <p style={styles.errorMsg}>{errors.purchase_date}</p>}

          <label style={styles.label}>Notes (optional)</label>
          <textarea style={styles.textarea} placeholder="Any additional notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />

          {errors.general && <p style={{...styles.errorMsg, marginTop: "10px"}}>{errors.general}</p>}

          <button style={{...styles.button, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"}} type="submit" disabled={submitting}>
            {submitting ? <><Spinner /> Submitting...</> : "Log Materials"}
          </button>
        </form>
      </div>
      <EntryHistory token={token} type="material" linkedEmployeeId={linkedEmployeeId} jobs={jobs} employees={employees} costCodes={[]} />
    </div>
  );
}

// ─── MILEAGE ──────────────────────────────────────────────────
function MileageForm({ token }) {
  const [formData, setFormData] = useState({ job_id: "", trip_date: new Date().toISOString().split("T")[0], km_driven: "", purpose: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [linkedEmployeeId, setLinkedEmployeeId] = useState(null);
  const [linkedEmployeeName, setLinkedEmployeeName] = useState("");
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      apiFetch(`${API}/me`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/my-jobs`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/employees`, { headers: h }).then(r => r.json()),
    ]).then(([me, jobs, emps]) => {
      if (me.employee_id) setLinkedEmployeeId(me.employee_id);
      setJobs(jobs.filter(j => j.status === "active"));
      setEmployees(emps);
      setLoading(false);
    });
  }, [token]);

  useEffect(() => {
    if (linkedEmployeeId && employees.length > 0) {
      const emp = employees.find(e => e.employee_id === linkedEmployeeId);
      if (emp) setLinkedEmployeeName(`${emp.first_name} ${emp.last_name}`);
    }
  }, [linkedEmployeeId, employees]);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  }

  function validate() {
    const e = {};
    const empId = linkedEmployeeId || parseInt(selectedEmployeeId);
    if (!empId) e.employee_id = "Please select an employee";
    if (!formData.job_id) e.job_id = "Please select a job";
    if (!formData.trip_date) e.trip_date = "Date is required";
    if (!formData.km_driven) e.km_driven = "KM is required";
    else if (parseFloat(formData.km_driven) <= 0) e.km_driven = "Must be greater than 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const empId = linkedEmployeeId || parseInt(selectedEmployeeId);
    const params = {
      job_id: parseInt(formData.job_id),
      employee_id: empId,
      trip_date: formData.trip_date,
      km_driven: parseFloat(formData.km_driven),
    };
    if (formData.purpose) params.purpose = formData.purpose;
    if (formData.notes) params.notes = formData.notes;
    const response = await apiFetch(`${API}/mileage?${new URLSearchParams(params)}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    setSubmitting(false);
    if (response.ok) setSubmitted(true);
    else setErrors({ general: "Failed to submit. Please try again." });
  }

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: "center", marginTop: "80px" }}>
          <div style={{ width: "72px", height: "72px", backgroundColor: theme.accentLight, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: theme.primary, fontFamily: font.display, margin: "0 0 8px", letterSpacing: "-0.3px" }}>Mileage logged</h2>
          <p style={{ color: theme.textSecondary, fontSize: "14px", margin: "0 0 32px" }}>Trip recorded successfully.</p>
          <button style={styles.button} onClick={() => { setSubmitted(false); setFormData({ job_id: "", trip_date: new Date().toISOString().split("T")[0], km_driven: "", purpose: "", notes: "" }); }}>Log Another</button>
        </div>
      </div>
    );
  }

  if (loading) return <div style={styles.container}><Skeleton width="40%" height="28px" /><div style={{marginTop:"12px"}}><Skeleton width="60%" height="14px" /></div><div style={{marginTop:"24px"}}><Skeleton width="100%" height="380px" radius="12px" /></div></div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Log Mileage</h1>
      <p style={styles.subtitle}>Record a trip for a job</p>
      <div style={styles.card}>
        <form onSubmit={handleSubmit} style={styles.form}>
          {linkedEmployeeId ? (
            <IdentityBadge name={linkedEmployeeName} />
          ) : (
            <>
              <label style={styles.label}>Employee</label>
              <select style={errors.employee_id ? styles.inputError : styles.input} value={selectedEmployeeId} onChange={e => { setSelectedEmployeeId(e.target.value); setErrors({...errors, employee_id: ""}); }}>
                <option value="">Select employee</option>
                {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
              </select>
              {errors.employee_id && <p style={styles.errorMsg}>{errors.employee_id}</p>}
            </>
          )}

          <label style={styles.label}>Job</label>
          <select style={errors.job_id ? styles.inputError : styles.input} name="job_id" value={formData.job_id} onChange={handleChange}>
            <option value="">Select job</option>
            {jobs.map(job => <option key={job.job_id} value={job.job_id}>{job.job_name}</option>)}
          </select>
          {errors.job_id && <p style={styles.errorMsg}>{errors.job_id}</p>}

          <label style={styles.label}>Date</label>
          <input style={errors.trip_date ? styles.inputError : styles.input} name="trip_date" type="date" value={formData.trip_date} onChange={handleChange} />
          {errors.trip_date && <p style={styles.errorMsg}>{errors.trip_date}</p>}

          <label style={styles.label}>KM Driven</label>
          <input style={errors.km_driven ? styles.inputError : styles.input} name="km_driven" type="number" step="0.1" placeholder="e.g. 45.5" value={formData.km_driven} onChange={handleChange} />
          {errors.km_driven && <p style={styles.errorMsg}>{errors.km_driven}</p>}

          <label style={styles.label}>Purpose (optional)</label>
          <input style={styles.input} name="purpose" placeholder="e.g. Site visit, Supply run" value={formData.purpose} onChange={handleChange} />

          <label style={styles.label}>Notes (optional)</label>
          <textarea style={styles.textarea} name="notes" placeholder="Any additional notes" value={formData.notes} onChange={handleChange} />

          {errors.general && <p style={{...styles.errorMsg, marginTop: "10px"}}>{errors.general}</p>}

          <button style={{...styles.button, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"}} type="submit" disabled={submitting}>
            {submitting ? <><Spinner /> Submitting...</> : "Log Mileage"}
          </button>
        </form>
      </div>
      <EntryHistory token={token} type="mileage" linkedEmployeeId={linkedEmployeeId} jobs={jobs} employees={employees} costCodes={[]} />
    </div>
  );
}

// ─── USER MANAGEMENT ─────────────────────────────────────────
function UserManagement({ token, activeEmps }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editEmpId, setEditEmpId] = useState("");
  const [message, setMessage] = useState("");

  function loadUsers() {
    setLoading(true);
    apiFetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => { setUsers(data); setLoading(false); });
  }

  function showMsg(msg) { setMessage(msg); setTimeout(() => setMessage(""), 3000); }

  async function saveLink(userId) {
    const empId = editEmpId ? parseInt(editEmpId) : 0;
    const res = await apiFetch(`${API}/users/${userId}?employee_id=${empId}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      showMsg("Account updated.");
      setEditingUser(null);
      setEditEmpId("");
      loadUsers();
    } else {
      showMsg("Error updating account.");
    }
  }

  async function deactivateUser(userId, email) {
    if (!window.confirm(`Deactivate ${email}? They will no longer be able to log in.`)) return;
    const res = await apiFetch(`${API}/users/${userId}/deactivate`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { showMsg(`${email} deactivated.`); loadUsers(); }
    else { const d = await res.json(); showMsg(d.detail || "Error deactivating account."); }
  }

  return (
    <CollapsibleSection title="Manage Logins">
      <p style={{ fontSize: "13px", color: theme.textSecondary, marginTop: 0, marginBottom: "14px" }}>
        See which employee is linked to each login and edit the link.
      </p>
      {users.length === 0 && !loading && (
        <button onClick={loadUsers} style={{ ...styles.button, marginTop: 0, backgroundColor: theme.accent }}>Load Accounts</button>
      )}
      {loading && <p style={{ fontSize: "13px", color: theme.textSecondary }}>Loading...</p>}
      {message && <div style={{ color: theme.accent, fontWeight: "600", marginBottom: "10px", backgroundColor: theme.accentLight, padding: "9px 12px", borderRadius: "7px", fontSize: "13px" }}>{message}</div>}
      {users.map(u => (
        <div key={u.user_id} style={{ padding: "12px 13px", backgroundColor: theme.bg, borderRadius: "8px", marginBottom: "6px", border: `1px solid ${theme.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: theme.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
              <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ backgroundColor: u.role === "owner" ? theme.goldLight : u.role === "admin" ? theme.accentLight : theme.bg, color: u.role === "owner" ? theme.gold : u.role === "admin" ? theme.accent : theme.textSecondary, padding: "1px 7px", borderRadius: "10px", border: `1px solid ${u.role === "owner" ? theme.gold : u.role === "admin" ? theme.accent : theme.border}`, fontWeight: "600", fontSize: "10px" }}>{u.role}</span>
                <span>·</span>
                <span style={{ color: u.employee_name ? theme.accent : theme.textLight, fontWeight: u.employee_name ? "600" : "400" }}>
                  {u.employee_name ? `Linked: ${u.employee_name}` : "Not linked"}
                </span>
              </div>
            </div>
            <button onClick={() => { setEditingUser(editingUser === u.user_id ? null : u.user_id); setEditEmpId(u.employee_id ? String(u.employee_id) : ""); }} style={{ fontSize: "11px", padding: "5px 11px", borderRadius: "5px", border: "none", cursor: "pointer", backgroundColor: theme.accentLight, color: theme.accent, fontWeight: "600", fontFamily: font.body, whiteSpace: "nowrap", flexShrink: 0 }}>
              {editingUser === u.user_id ? "Cancel" : "Edit"}
            </button>
            {u.role !== "owner" && (
              <button onClick={() => deactivateUser(u.user_id, u.email)} style={{ fontSize: "11px", padding: "5px 10px", borderRadius: "5px", border: "none", cursor: "pointer", backgroundColor: theme.dangerLight, color: theme.danger, fontWeight: "600", fontFamily: font.body, whiteSpace: "nowrap" }}>
                Remove
              </button>
            )}
          </div>
          {editingUser === u.user_id && (
            <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${theme.border}`, display: "flex", gap: "8px", alignItems: "center" }}>
              <select style={{...styles.input, marginTop: 0, flex: 1}} value={editEmpId} onChange={e => setEditEmpId(e.target.value)}>
                <option value="">No link</option>
                {activeEmps.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
              </select>
              <button onClick={() => saveLink(u.user_id)} style={{ padding: "12px 16px", borderRadius: "7px", border: "none", cursor: "pointer", backgroundColor: theme.primary, color: "white", fontWeight: "600", fontFamily: font.body, fontSize: "13px", whiteSpace: "nowrap", minHeight: "44px" }}>Save</button>
            </div>
          )}
        </div>
      ))}
    </CollapsibleSection>
  );
}

// ─── SCHEDULE SCREEN ──────────────────────────────────────────
function ScheduleScreen({ token }) {
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ employee_id: "", job_ids: [], scheduled_date: new Date().toISOString().split("T")[0], scheduled_hours: "8", notes: "" });
  const [errors, setErrors] = useState({});
  const [weekOffset, setWeekOffset] = useState(0);

  function showMsg(msg) { setMessage(msg); setTimeout(() => setMessage(""), 3000); }

  function getWeekRange(offset) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - day + (day === 0 ? -6 : 1) + offset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: monday, end: sunday };
  }

  const week = getWeekRange(weekOffset);
  const weekStr = `${week.start.toISOString().split("T")[0]}`;
  const weekEndStr = `${week.end.toISOString().split("T")[0]}`;

  function loadData() {
    setLoading(true);
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      apiFetch(`${API}/schedules?start_date=${weekStr}&end_date=${weekEndStr}`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/employees`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/jobs`, { headers: h }).then(r => r.json()),
    ]).then(([sched, emps, jobList]) => {
      setSchedules(sched);
      setEmployees(emps);
      setJobs(jobList.filter(j => j.status === "active"));
      setLoading(false);
    });
  }

  useEffect(() => { loadData(); }, [weekOffset, token]); // eslint-disable-line react-hooks/exhaustive-deps

  function validate() {
    const e = {};
    if (!form.employee_id) e.employee_id = "Select an employee";
    if (!form.job_ids.length) e.job_ids = "Select at least one job";
    if (!form.scheduled_date) e.scheduled_date = "Date is required";
    if (form.scheduled_hours && (parseFloat(form.scheduled_hours) <= 0 || parseFloat(form.scheduled_hours) > 24)) e.scheduled_hours = "Hours must be between 0 and 24";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    const promises = form.job_ids.map(jobId => {
      const params = { employee_id: parseInt(form.employee_id), job_id: parseInt(jobId), scheduled_date: form.scheduled_date };
      if (form.scheduled_hours) params.scheduled_hours = parseFloat(form.scheduled_hours);
      if (form.notes) params.notes = form.notes;
      return apiFetch(`${API}/schedules?${new URLSearchParams(params)}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    });
    const results = await Promise.all(promises);
    setSubmitting(false);
    const allOk = results.every(r => r.ok);
    if (allOk) {
      showMsg(`Scheduled ${form.job_ids.length} assignment${form.job_ids.length > 1 ? "s" : ""}.`);
      setForm({ employee_id: "", job_ids: [], scheduled_date: new Date().toISOString().split("T")[0], scheduled_hours: "8", notes: "" });
      setShowForm(false);
      loadData();
    } else {
      showMsg("Some assignments failed.");
    }
  }

  async function deleteSchedule(id) {
    if (!window.confirm("Remove this assignment?")) return;
    const res = await apiFetch(`${API}/schedules/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { showMsg("Assignment removed."); loadData(); }
    else showMsg("Failed to remove.");
  }

  function toggleJob(jobId) {
    const newIds = form.job_ids.includes(jobId)
      ? form.job_ids.filter(id => id !== jobId)
      : [...form.job_ids, jobId];
    setForm({ ...form, job_ids: newIds });
    setErrors({ ...errors, job_ids: "" });
  }

  const activeEmps = employees.filter(e => e.active);

  // Group schedules by date
  const byDate = {};
  schedules.forEach(s => {
    if (!byDate[s.scheduled_date]) byDate[s.scheduled_date] = [];
    byDate[s.scheduled_date].push(s);
  });

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(week.start);
    d.setDate(week.start.getDate() + i);
    days.push(d);
  }

  const weekLabel = `${week.start.toLocaleDateString("en-CA", { month: "short", day: "numeric" })} to ${week.end.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}`;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Schedule</h1>
      <p style={styles.subtitle}>Assign employees to jobs by date</p>

      {message && <div style={{ color: theme.accent, fontWeight: "600", marginBottom: "14px", backgroundColor: theme.accentLight, padding: "11px 14px", borderRadius: "8px", fontSize: "13px", border: `1px solid ${theme.accent}` }}>{message}</div>}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", gap: "8px" }}>
        <button onClick={() => setWeekOffset(weekOffset - 1)} style={{ padding: "10px 14px", borderRadius: "8px", border: `1px solid ${theme.border}`, backgroundColor: "white", cursor: "pointer", fontFamily: font.body, fontSize: "14px", color: theme.textPrimary, fontWeight: "600", minHeight: "44px" }}>Previous</button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "15px", fontWeight: "700", color: theme.primary, fontFamily: font.display }}>{weekLabel}</div>
          {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} style={{ fontSize: "11px", color: theme.accent, background: "none", border: "none", cursor: "pointer", marginTop: "2px", fontWeight: "600" }}>Back to this week</button>}
        </div>
        <button onClick={() => setWeekOffset(weekOffset + 1)} style={{ padding: "10px 14px", borderRadius: "8px", border: `1px solid ${theme.border}`, backgroundColor: "white", cursor: "pointer", fontFamily: font.body, fontSize: "14px", color: theme.textPrimary, fontWeight: "600", minHeight: "44px" }}>Next</button>
      </div>

      <button onClick={() => setShowForm(!showForm)} style={{ ...styles.button, marginTop: 0, marginBottom: "16px", backgroundColor: showForm ? "#888" : theme.accent, width: "100%" }}>
        {showForm ? "Cancel" : "+ New Assignment"}
      </button>

      {showForm && (
        <div style={{ ...styles.card, marginBottom: "20px" }}>
          <label style={styles.label}>Employee</label>
          <select style={errors.employee_id ? styles.inputError : styles.input} value={form.employee_id} onChange={e => { setForm({...form, employee_id: e.target.value}); setErrors({...errors, employee_id: ""}); }}>
            <option value="">Select employee</option>
            {activeEmps.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
          </select>
          {errors.employee_id && <p style={styles.errorMsg}>{errors.employee_id}</p>}

          <label style={styles.label}>Jobs (pick one or more)</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
            {jobs.map(job => (
              <button type="button" key={job.job_id} onClick={() => toggleJob(job.job_id)} style={{ padding: "10px 14px", borderRadius: "8px", border: `1.5px solid ${form.job_ids.includes(job.job_id) ? theme.primary : theme.border}`, backgroundColor: form.job_ids.includes(job.job_id) ? theme.accentLight : "white", color: form.job_ids.includes(job.job_id) ? theme.primary : theme.textPrimary, fontWeight: form.job_ids.includes(job.job_id) ? "600" : "400", fontSize: "13px", cursor: "pointer", fontFamily: font.body, textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{job.job_name}</span>
                {form.job_ids.includes(job.job_id) && <span style={{ color: theme.accent }}>✓</span>}
              </button>
            ))}
          </div>
          {errors.job_ids && <p style={styles.errorMsg}>{errors.job_ids}</p>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div>
              <label style={styles.label}>Date</label>
              <input style={errors.scheduled_date ? styles.inputError : styles.input} type="date" value={form.scheduled_date} onChange={e => { setForm({...form, scheduled_date: e.target.value}); setErrors({...errors, scheduled_date: ""}); }} />
            </div>
            <div>
              <label style={styles.label}>Hours</label>
              <input style={errors.scheduled_hours ? styles.inputError : styles.input} type="number" step="0.5" placeholder="8" value={form.scheduled_hours} onChange={e => { setForm({...form, scheduled_hours: e.target.value}); setErrors({...errors, scheduled_hours: ""}); }} />
            </div>
          </div>
          {errors.scheduled_date && <p style={styles.errorMsg}>{errors.scheduled_date}</p>}
          {errors.scheduled_hours && <p style={styles.errorMsg}>{errors.scheduled_hours}</p>}

          <label style={styles.label}>Notes (optional)</label>
          <textarea style={styles.textarea} placeholder="Any details for the crew" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />

          <button style={{...styles.button, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"}} onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><Spinner /> Scheduling...</> : `Schedule${form.job_ids.length > 1 ? ` ${form.job_ids.length} jobs` : ""}`}
          </button>
        </div>
      )}

      {loading ? (
        <div>{[1,2,3].map(i => <div key={i} style={{ marginBottom: "10px" }}><Skeleton width="100%" height="80px" radius="10px" /></div>)}</div>
      ) : schedules.length === 0 ? (
        <div style={{ ...styles.card, textAlign: "center", padding: "32px 22px" }}>
          <p style={{ fontSize: "13px", color: theme.textSecondary, margin: 0 }}>No assignments this week.</p>
        </div>
      ) : (
        <div>
          {days.map(day => {
            const dayStr = day.toISOString().split("T")[0];
            const daySchedules = byDate[dayStr] || [];
            if (daySchedules.length === 0) return null;
            const dayLabel = day.toLocaleDateString("en-CA", { weekday: "long", month: "short", day: "numeric" });
            const isToday = dayStr === new Date().toISOString().split("T")[0];
            return (
              <div key={dayStr} style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: isToday ? theme.gold : theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                  {dayLabel}
                  {isToday && <span style={{ backgroundColor: theme.gold, color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "10px" }}>TODAY</span>}
                </div>
                <div style={{ ...styles.card, padding: "0" }}>
                  {daySchedules.map((s, i) => (
                    <div key={s.schedule_id} style={{ padding: "13px 16px", borderBottom: i < daySchedules.length - 1 ? `1px solid ${theme.border}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: theme.textPrimary }}>{s.employee_name}</div>
                        <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "2px" }}>{s.job_name}{s.scheduled_hours ? ` · ${s.scheduled_hours}h` : ""}</div>
                        {s.notes && <div style={{ fontSize: "11px", color: theme.textLight, marginTop: "3px", fontStyle: "italic" }}>{s.notes}</div>}
                      </div>
                      <button onClick={() => deleteSchedule(s.schedule_id)} style={{ fontSize: "11px", padding: "5px 10px", borderRadius: "5px", border: "none", cursor: "pointer", backgroundColor: theme.dangerLight, color: theme.danger, fontWeight: "600", fontFamily: font.body, flexShrink: 0 }}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────
function AdminScreen({ token }) {
  const headers = { Authorization: `Bearer ${token}` };
  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [costCodes, setCostCodes] = useState([]);
  const [companyId, setCompanyId] = useState(null);
  const [message, setMessage] = useState("");
  const [editingEmp, setEditingEmp] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [editingCc, setEditingCc] = useState(null);
  const [showInactiveEmp, setShowInactiveEmp] = useState(false);
  const [showInactiveJob, setShowInactiveJob] = useState(false);
  const [empForm, setEmpForm] = useState({ first_name: "", last_name: "", role: "", hourly_rate: "", burden_rate: "", worker_type: "employee" });
  const [jobForm, setJobForm] = useState({ job_name: "", city: "", contract_value: "", budgeted_hours: "" });
  const [ccForm, setCcForm] = useState({ code: "", description: "", category: "" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "", confirm_password: "", employee_role: "crew", employee_id: "" });
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    apiFetch(`${API}/me`, { headers: h }).then(r => r.json()).then(d => setCompanyId(d.company_id));
    apiFetch(`${API}/employees/all`, { headers: h }).then(r => r.json()).then(setEmployees);
    apiFetch(`${API}/jobs`, { headers: h }).then(r => r.json()).then(setJobs);
    apiFetch(`${API}/cost-codes`, { headers: h }).then(r => r.json()).then(setCostCodes);
  }, [token]);

  function refresh() {
    apiFetch(`${API}/employees/all`, { headers }).then(r => r.json()).then(setEmployees);
    apiFetch(`${API}/jobs`, { headers }).then(r => r.json()).then(setJobs);
    apiFetch(`${API}/cost-codes`, { headers }).then(r => r.json()).then(setCostCodes);
  }

  function showMsg(msg) { setMessage(msg); setTimeout(() => setMessage(""), 3000); }

  async function addEmployee() {
    const res = await apiFetch(`${API}/employees?${new URLSearchParams(empForm)}`, { method: "POST", headers });
    if (res.ok) { showMsg("Employee added."); setEmpForm({ first_name: "", last_name: "", role: "", hourly_rate: "", burden_rate: "", worker_type: "employee" }); refresh(); }
    else showMsg("Error adding employee.");
  }

  async function updateEmployee() {
    const res = await apiFetch(`${API}/employees/${editingEmp.employee_id}?${new URLSearchParams(empForm)}`, { method: "PATCH", headers });
    if (res.ok) { showMsg("Employee updated."); setEditingEmp(null); setEmpForm({ first_name: "", last_name: "", role: "", hourly_rate: "", burden_rate: "", worker_type: "employee" }); refresh(); }
    else showMsg("Error updating employee.");
  }

  async function addJob() {
    const res = await apiFetch(`${API}/jobs?${new URLSearchParams(jobForm)}`, { method: "POST", headers });
    if (res.ok) { showMsg("Job added."); setJobForm({ job_name: "", city: "", contract_value: "", budgeted_hours: "" }); refresh(); }
    else showMsg("Error adding job.");
  }

  async function updateJob() {
    const res = await apiFetch(`${API}/jobs/${editingJob.job_id}?${new URLSearchParams(jobForm)}`, { method: "PATCH", headers });
    if (res.ok) { showMsg("Job updated."); setEditingJob(null); setJobForm({ job_name: "", city: "", contract_value: "", budgeted_hours: "" }); refresh(); }
    else showMsg("Error updating job.");
  }

  async function addCostCode() {
    const res = await apiFetch(`${API}/cost-codes?${new URLSearchParams(ccForm)}`, { method: "POST", headers });
    if (res.ok) { showMsg("Cost code added."); setCcForm({ code: "", description: "", category: "" }); refresh(); }
    else showMsg("Error adding cost code.");
  }

  async function updateCostCode() {
    const res = await apiFetch(`${API}/cost-codes/${editingCc.cost_code_id}?${new URLSearchParams(ccForm)}`, { method: "PATCH", headers });
    if (res.ok) { showMsg("Cost code updated."); setEditingCc(null); setCcForm({ code: "", description: "", category: "" }); refresh(); }
    else showMsg("Error updating cost code.");
  }

  async function createLogin() {
    if (!companyId) return;
    if (loginForm.password !== loginForm.confirm_password) { setLoginError("Passwords do not match"); return; }
    setLoginError("");
    const params = { company_id: companyId, email: loginForm.email, password: loginForm.password, role: loginForm.employee_role };
    if (loginForm.employee_id) params.employee_id = parseInt(loginForm.employee_id);
    const res = await apiFetch(`${API}/users?${new URLSearchParams(params)}`, { method: "POST" });
    if (res.ok) { showMsg(`Login created for ${loginForm.email}`); setLoginForm({ email: "", password: "", confirm_password: "", employee_role: "crew", employee_id: "" }); }
    else { const d = await res.json(); showMsg(`Error: ${d.detail}`); }
  }

  async function toggleEmployee(emp) {
    const endpoint = emp.active ? "deactivate" : "activate";
    const res = await apiFetch(`${API}/employees/${emp.employee_id}/${endpoint}`, { method: "PATCH", headers });
    if (res.ok) { showMsg(`${emp.first_name} ${emp.active ? "archived" : "restored"}.`); refresh(); }
  }

  async function setJobStatus(job, status) {
    const res = await apiFetch(`${API}/jobs/${job.job_id}/status?status=${status}`, { method: "PATCH", headers });
    if (res.ok) { showMsg(`${job.job_name} marked as ${status}.`); refresh(); }
  }

  function startEditEmp(emp) { setEditingEmp(emp); setEmpForm({ first_name: emp.first_name, last_name: emp.last_name, role: emp.role || "", hourly_rate: emp.hourly_rate || "", burden_rate: emp.burden_rate || "", worker_type: emp.worker_type || "employee" }); }
  function startEditJob(job) { setEditingJob(job); setJobForm({ job_name: job.job_name, city: job.city || "", contract_value: job.contract_value || "", budgeted_hours: job.budgeted_hours || "" }); }
  function startEditCc(cc) { setEditingCc(cc); setCcForm({ code: cc.code, description: cc.description, category: cc.category || "" }); }

  const activeEmps = employees.filter(e => e.active);
  const inactiveEmps = employees.filter(e => !e.active);
  const activeJobs = jobs.filter(j => j.status === "active");
  const completedJobs = jobs.filter(j => j.status === "completed");
  const inactiveJobs = jobs.filter(j => j.status === "inactive");

  const Btn = ({ label, bg, color, onClick }) => (
    <button onClick={onClick} style={{ fontSize: "11px", padding: "5px 11px", borderRadius: "5px", border: "none", cursor: "pointer", backgroundColor: bg, color, fontWeight: "600", fontFamily: font.body, whiteSpace: "nowrap", minHeight: "28px" }}>{label}</button>
  );

  const Row = ({ main, sub, actions }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 13px", backgroundColor: theme.bg, borderRadius: "7px", marginBottom: "6px", border: `1px solid ${theme.border}`, gap: "8px" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: "600", fontSize: "13px", color: theme.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{main}</div>
        {sub && <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "2px" }}>{sub}</div>}
      </div>
      <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>{actions}</div>
    </div>
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Admin</h1>
      <p style={styles.subtitle}>Manage your team, jobs, and access</p>
      {message && <div style={{ color: theme.accent, fontWeight: "600", marginBottom: "14px", backgroundColor: theme.accentLight, padding: "11px 14px", borderRadius: "8px", fontSize: "13px", border: `1px solid ${theme.accent}` }}>{message}</div>}

      <CollapsibleSection title="Employees">
        <p style={{ fontSize: "11px", fontWeight: "600", color: theme.textSecondary, marginBottom: "10px", marginTop: 0, textTransform: "uppercase", letterSpacing: "0.6px" }}>
          {editingEmp ? `Editing: ${editingEmp.first_name} ${editingEmp.last_name}` : "Add New Employee"}
        </p>
        {["first_name:First Name", "last_name:Last Name", "role:Role (e.g. Electrician)"].map(f => {
          const [key, ph] = f.split(":");
          return <input key={key} style={{...styles.input, marginBottom: "6px"}} placeholder={ph} value={empForm[key]} onChange={e => setEmpForm({...empForm, [key]: e.target.value})} />;
        })}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "6px" }}>
          <input style={styles.input} placeholder="Hourly Rate" type="number" value={empForm.hourly_rate} onChange={e => setEmpForm({...empForm, hourly_rate: e.target.value})} />
          <input style={styles.input} placeholder="Burden Rate" type="number" value={empForm.burden_rate} onChange={e => setEmpForm({...empForm, burden_rate: e.target.value})} />
        </div>
        <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
          <button type="button" onClick={() => setEmpForm({...empForm, worker_type: "employee"})} style={{ flex: 1, padding: "11px", borderRadius: "8px", border: `1.5px solid ${empForm.worker_type === "employee" ? theme.primary : theme.border}`, backgroundColor: empForm.worker_type === "employee" ? theme.accentLight : "white", color: empForm.worker_type === "employee" ? theme.primary : theme.textSecondary, fontWeight: "600", fontSize: "13px", cursor: "pointer", fontFamily: font.body }}>Employee</button>
          <button type="button" onClick={() => setEmpForm({...empForm, worker_type: "contractor"})} style={{ flex: 1, padding: "11px", borderRadius: "8px", border: `1.5px solid ${empForm.worker_type === "contractor" ? theme.primary : theme.border}`, backgroundColor: empForm.worker_type === "contractor" ? theme.accentLight : "white", color: empForm.worker_type === "contractor" ? theme.primary : theme.textSecondary, fontWeight: "600", fontSize: "13px", cursor: "pointer", fontFamily: font.body }}>Contractor</button>
        </div>
        {editingEmp ? (
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button style={{...styles.button, flex: 1, marginTop: 0}} onClick={updateEmployee}>Save Changes</button>
            <button style={{...styles.button, backgroundColor: "#888", flex: 1, marginTop: 0}} onClick={() => { setEditingEmp(null); setEmpForm({ first_name: "", last_name: "", role: "", hourly_rate: "", burden_rate: "", worker_type: "employee" }); }}>Cancel</button>
          </div>
        ) : <button style={styles.button} onClick={addEmployee}>Add Employee</button>}

        {activeEmps.length > 0 && <div style={{ marginTop: "16px" }}>
          <p style={{ fontSize: "11px", color: theme.textSecondary, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Active</p>
          {activeEmps.map(emp => <Row key={emp.employee_id} main={`${emp.first_name} ${emp.last_name}`} sub={`${emp.worker_type === "contractor" ? "Contractor" : "Employee"} · ${emp.role || "No role"} · $${emp.hourly_rate || 0}/hr${emp.worker_type !== "contractor" ? ` · Burden $${emp.burden_rate || 0}/hr` : ""}`} actions={[<Btn key="e" label="Edit" bg={theme.accentLight} color={theme.accent} onClick={() => startEditEmp(emp)} />, <Btn key="a" label="Archive" bg={theme.dangerLight} color={theme.danger} onClick={() => toggleEmployee(emp)} />]} />)}
        </div>}
        {inactiveEmps.length > 0 && <div style={{ marginTop: "8px" }}>
          <button onClick={() => setShowInactiveEmp(!showInactiveEmp)} style={{ fontSize: "12px", color: theme.textSecondary, background: "none", border: "none", cursor: "pointer", padding: 0 }}>{showInactiveEmp ? "Hide" : "Show"} archived ({inactiveEmps.length})</button>
          {showInactiveEmp && inactiveEmps.map(emp => <Row key={emp.employee_id} main={`${emp.first_name} ${emp.last_name}`} actions={[<Btn key="r" label="Restore" bg={theme.accentLight} color={theme.accent} onClick={() => toggleEmployee(emp)} />]} />)}
        </div>}
      </CollapsibleSection>

      <CollapsibleSection title="Jobs">
        <p style={{ fontSize: "11px", fontWeight: "600", color: theme.textSecondary, marginBottom: "10px", marginTop: 0, textTransform: "uppercase", letterSpacing: "0.6px" }}>
          {editingJob ? `Editing: ${editingJob.job_name}` : "Add New Job"}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "6px" }}>
          <input style={styles.input} placeholder="Job Name" value={jobForm.job_name} onChange={e => setJobForm({...jobForm, job_name: e.target.value})} />
          <input style={styles.input} placeholder="City" value={jobForm.city} onChange={e => setJobForm({...jobForm, city: e.target.value})} />
          <input style={styles.input} placeholder="Contract Value" type="number" value={jobForm.contract_value} onChange={e => setJobForm({...jobForm, contract_value: e.target.value})} />
          <input style={styles.input} placeholder="Budgeted Hours" type="number" value={jobForm.budgeted_hours} onChange={e => setJobForm({...jobForm, budgeted_hours: e.target.value})} />
        </div>
        {editingJob ? (
          <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
            <button style={{...styles.button, flex: 1, marginTop: 0}} onClick={updateJob}>Save Changes</button>
            <button style={{...styles.button, backgroundColor: "#888", flex: 1, marginTop: 0}} onClick={() => { setEditingJob(null); setJobForm({ job_name: "", city: "", contract_value: "", budgeted_hours: "" }); }}>Cancel</button>
          </div>
        ) : <button style={styles.button} onClick={addJob}>Add Job</button>}

        {activeJobs.length > 0 && <div style={{ marginTop: "16px" }}>
          <p style={{ fontSize: "11px", color: theme.textSecondary, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Active</p>
          {activeJobs.map(job => <Row key={job.job_id} main={job.job_name} sub={`${job.city || ""}${job.contract_value ? ` · $${fmt(job.contract_value)}` : ""}${job.budgeted_hours ? ` · ${job.budgeted_hours}h` : ""}`} actions={[<Btn key="e" label="Edit" bg={theme.accentLight} color={theme.accent} onClick={() => startEditJob(job)} />, <Btn key="c" label="Complete" bg="#e8f5ee" color={theme.accent} onClick={() => setJobStatus(job, "completed")} />, <Btn key="a" label="Archive" bg={theme.dangerLight} color={theme.danger} onClick={() => setJobStatus(job, "inactive")} />]} />)}
        </div>}
        {completedJobs.length > 0 && <div style={{ marginTop: "8px" }}>
          <p style={{ fontSize: "11px", color: theme.accent, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Completed</p>
          {completedJobs.map(job => <Row key={job.job_id} main={job.job_name} actions={[<Btn key="r" label="Reactivate" bg={theme.accentLight} color={theme.accent} onClick={() => setJobStatus(job, "active")} />]} />)}
        </div>}
        {inactiveJobs.length > 0 && <div style={{ marginTop: "8px" }}>
          <button onClick={() => setShowInactiveJob(!showInactiveJob)} style={{ fontSize: "12px", color: theme.textSecondary, background: "none", border: "none", cursor: "pointer", padding: 0 }}>{showInactiveJob ? "Hide" : "Show"} archived ({inactiveJobs.length})</button>
          {showInactiveJob && inactiveJobs.map(job => <Row key={job.job_id} main={job.job_name} actions={[<Btn key="r" label="Restore" bg={theme.accentLight} color={theme.accent} onClick={() => setJobStatus(job, "active")} />]} />)}
        </div>}
      </CollapsibleSection>

      <CollapsibleSection title="Cost Codes">
        <p style={{ fontSize: "11px", fontWeight: "600", color: theme.textSecondary, marginBottom: "10px", marginTop: 0, textTransform: "uppercase", letterSpacing: "0.6px" }}>
          {editingCc ? `Editing: ${editingCc.code}` : "Add New Cost Code"}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "6px" }}>
          <input style={styles.input} placeholder="Code (e.g. 001)" value={ccForm.code} onChange={e => setCcForm({...ccForm, code: e.target.value})} />
          <input style={styles.input} placeholder="Category" value={ccForm.category} onChange={e => setCcForm({...ccForm, category: e.target.value})} />
        </div>
        <input style={{...styles.input, marginBottom: "6px"}} placeholder="Description" value={ccForm.description} onChange={e => setCcForm({...ccForm, description: e.target.value})} />
        {editingCc ? (
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={{...styles.button, flex: 1, marginTop: 0}} onClick={updateCostCode}>Save Changes</button>
            <button style={{...styles.button, backgroundColor: "#888", flex: 1, marginTop: 0}} onClick={() => { setEditingCc(null); setCcForm({ code: "", description: "", category: "" }); }}>Cancel</button>
          </div>
        ) : <button style={styles.button} onClick={addCostCode}>Add Cost Code</button>}
        {costCodes.length > 0 && <div style={{ marginTop: "16px" }}>
          <p style={{ fontSize: "11px", color: theme.textSecondary, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Current</p>
          {costCodes.map(cc => <Row key={cc.cost_code_id} main={`${cc.code} ${cc.description}`} sub={cc.category} actions={[<Btn key="e" label="Edit" bg={theme.accentLight} color={theme.accent} onClick={() => startEditCc(cc)} />]} />)}
        </div>}
      </CollapsibleSection>

      <CollapsibleSection title="Create Crew Login">
        <p style={{ fontSize: "13px", color: theme.textSecondary, marginTop: 0, marginBottom: "12px" }}>Give a crew member access to the app</p>
        <select style={{...styles.input, marginBottom: "6px"}} value={loginForm.employee_id} onChange={e => setLoginForm({...loginForm, employee_id: e.target.value})}>
          <option value="">Link to employee (optional)</option>
          {activeEmps.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
        </select>
        <input style={{...styles.input, marginBottom: "6px"}} placeholder="Email" type="email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
        <div style={{ marginBottom: "6px" }}><PasswordInput placeholder="Password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} /></div>
        <div style={{ marginBottom: "6px" }}><PasswordInput placeholder="Confirm Password" value={loginForm.confirm_password} onChange={e => setLoginForm({...loginForm, confirm_password: e.target.value})} /></div>
        {loginError && <p style={styles.errorMsg}>{loginError}</p>}
        <select style={{...styles.input, marginBottom: "6px"}} value={loginForm.employee_role} onChange={e => setLoginForm({...loginForm, employee_role: e.target.value})}>
          <option value="crew">Crew</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
        <button style={{...styles.button, backgroundColor: theme.accent}} onClick={createLogin}>Create Login</button>
      </CollapsibleSection>

      <UserManagement token={token} activeEmps={activeEmps} />
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────
function Dashboard({ token }) {
  const [jobs, setJobs] = useState([]);
  const [mileage, setMileage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [details, setDetails] = useState({});
  const [filter, setFilter] = useState("active");
  const [timeFilter, setTimeFilter] = useState("all");

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      apiFetch(`${API}/dashboard`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/mileage`, { headers: h }).then(r => r.json()),
    ]).then(([dashData, mileageData]) => {
      setJobs(dashData);
      setMileage(mileageData);
      setLoading(false);
    });
  }, [token]);

  const filtered = jobs.filter(j => filter === "all" || j.status === filter);
  const totals = {
    hours: filtered.reduce((s, j) => s + j.total_hours, 0),
    labour: filtered.reduce((s, j) => s + j.labour_cost, 0),
    materials: filtered.reduce((s, j) => s + j.materials_cost, 0),
    revenue: filtered.reduce((s, j) => s + j.contract_value, 0),
    cost: filtered.reduce((s, j) => s + j.total_cost, 0),
  };
  totals.margin = totals.revenue - totals.cost;

  async function toggleJob(job_id) {
    const isOpen = expanded[job_id];
    setExpanded({...expanded, [job_id]: !isOpen});
    if (!isOpen && !details[job_id]) {
      const h = { Authorization: `Bearer ${token}` };
      const [tsR, matR] = await Promise.all([
        apiFetch(`${API}/jobs/${job_id}/timesheets`, { headers: h }),
        apiFetch(`${API}/jobs/${job_id}/materials`, { headers: h })
      ]);
      setDetails({...details, [job_id]: { timesheets: await tsR.json(), materials: await matR.json() }});
    }
  }

  const statCards = [
    { label: "Hours", value: totals.hours.toFixed(1) },
    { label: "Labour", value: `$${fmt(totals.labour)}` },
    { label: "Materials", value: `$${fmt(totals.materials)}` },
    { label: "Contract", value: `$${fmt(totals.revenue)}` },
    { label: "Cost", value: `$${fmt(totals.cost)}` },
    { label: "Margin", value: `$${fmt(totals.margin)}`, highlight: true, positive: totals.margin >= 0 },
  ];

  const totalKm = mileage.reduce((s, m) => s + Number(m.km_driven || 0), 0);

  return (
    <div style={{ fontFamily: font.body, backgroundColor: theme.bg, minHeight: "100vh", paddingBottom: "90px" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${theme.primaryDark} 0%, ${theme.primary} 60%, ${theme.accent} 100%)`, padding: "30px 22px 36px", color: "white" }}>
        <div style={{ maxWidth: "940px", margin: "0 auto" }}>
          <div style={{ marginBottom: "22px" }}>
            <VantageLogo size={32} dark={true} />
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", margin: "0 0 4px", fontFamily: font.display, letterSpacing: "-0.5px" }}>Project Overview</h1>
          <p style={{ fontSize: "13px", opacity: 0.65, margin: "0 0 22px" }}>Live job profitability</p>

          <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
            {["active", "completed", "all"].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 15px", borderRadius: "20px", border: filter === f ? "none" : "1px solid rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "12px", fontWeight: "600", backgroundColor: filter === f ? "white" : "transparent", color: filter === f ? theme.primary : "white", fontFamily: font.body, minHeight: "32px" }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "20px", flexWrap: "wrap" }}>
            {[["all", "All Time"], ["week", "This Week"], ["month", "This Month"]].map(([val, label]) => (
              <button key={val} onClick={() => setTimeFilter(val)} style={{ padding: "5px 13px", borderRadius: "20px", border: timeFilter === val ? "none" : "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontSize: "11px", fontWeight: "600", backgroundColor: timeFilter === val ? theme.gold : "transparent", color: "white", fontFamily: font.body }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            {statCards.map((item, i) => (
              <div key={i} style={{ backgroundColor: item.highlight ? (item.positive ? "rgba(45,106,79,0.9)" : "rgba(184,50,50,0.9)") : "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", borderRadius: "11px", padding: "14px 10px", textAlign: "center", border: item.highlight ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: "15px", fontWeight: "700", letterSpacing: "-0.3px" }}>{item.value}</div>
                <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: "600" }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "18px", maxWidth: "940px", margin: "0 auto" }}>
        {loading ? (
          <div>
            {[1,2,3].map(i => <div key={i} style={{ marginBottom: "12px" }}><Skeleton width="100%" height="140px" radius="12px" /></div>)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: "60px", color: theme.textSecondary }}>No {filter} jobs.</div>
        ) : filtered.map(job => {
          const hasBudget = job.contract_value > 0;
          const pct = job.budgeted_hours > 0 ? Math.min((job.total_hours / job.budgeted_hours) * 100, 100) : 0;
          const over = job.margin !== null && job.margin < 0;
          const tight = pct > 70 && pct <= 90;
          const overHours = pct > 90;
          const barColor = over || overHours ? theme.danger : tight ? theme.warning : theme.accent;
          const isOpen = expanded[job.job_id];

          return (
            <div key={job.job_id} onClick={() => toggleJob(job.job_id)} style={{ backgroundColor: "white", borderRadius: "12px", marginBottom: "12px", overflow: "hidden", boxShadow: "0 1px 4px rgba(26,61,43,0.06)", border: `1px solid ${theme.border}`, borderLeft: `4px solid ${barColor}`, cursor: "pointer" }}>
              <div style={{ padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "16px", color: theme.primary, fontFamily: font.display, letterSpacing: "-0.2px" }}>{job.job_name}</div>
                    <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
                      {job.city && <span>{job.city}</span>}
                      {job.city && <span style={{ opacity: 0.4 }}>·</span>}
                      <span style={{ backgroundColor: job.status === "active" ? theme.accentLight : job.status === "completed" ? "#e8f5ee" : "#f5f5f5", color: job.status === "active" || job.status === "completed" ? theme.accent : "#888", padding: "2px 9px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" }}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {hasBudget && job.margin !== null && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "18px", fontWeight: "700", color: over ? theme.danger : theme.accent, fontFamily: font.display, letterSpacing: "-0.3px" }}>
                          {over ? "-" : ""}${fmt(Math.abs(job.margin))}
                        </div>
                        <div style={{ fontSize: "11px", color: theme.textSecondary }}>{over ? "over budget" : `${job.margin_percent}% margin`}</div>
                      </div>
                    )}
                    <span style={{ fontSize: "11px", color: theme.textLight }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                  {[["Labour", job.labour_cost], ["Materials", job.materials_cost], ["Total Cost", job.total_cost]].map(([label, val]) => (
                    <div key={label} style={{ backgroundColor: theme.bg, borderRadius: "8px", padding: "10px 8px", textAlign: "center", border: `1px solid ${theme.border}` }}>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: theme.primary }}>${fmt(val)}</div>
                      <div style={{ fontSize: "10px", color: theme.textSecondary, marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>{label}</div>
                    </div>
                  ))}
                </div>

                {job.budgeted_hours > 0 && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: theme.textSecondary, marginBottom: "6px" }}>
                      <span>{job.total_hours}h of {job.budgeted_hours}h budgeted</span>
                      <span style={{ color: overHours ? theme.danger : tight ? theme.warning : theme.textSecondary, fontWeight: "700" }}>{pct.toFixed(0)}%</span>
                    </div>
                    <div style={{ backgroundColor: theme.border, borderRadius: "3px", height: "6px" }}>
                      <div style={{ width: `${pct}%`, height: "6px", borderRadius: "3px", backgroundColor: barColor, transition: "width 0.3s" }} />
                    </div>
                  </div>
                )}

                {(over || overHours) && (
                  <div style={{ marginTop: "12px", padding: "10px 13px", backgroundColor: theme.dangerLight, borderRadius: "8px", border: `1px solid ${theme.danger}`, display: "flex", alignItems: "center", gap: "10px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.danger} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: theme.danger }}>
                      {over && overHours ? "Hours and budget exceeded" : over ? "Cost exceeds contract value" : "Hours exceeded budget"}
                    </span>
                  </div>
                )}
                {hasBudget && (
                  <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${theme.border}`, fontSize: "12px", color: theme.textSecondary }}>
                    Contract: ${fmt(job.contract_value)}
                  </div>
                )}
              </div>

              {isOpen && (
                <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${theme.border}` }}>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: theme.textSecondary, marginBottom: "10px", paddingTop: "14px", textTransform: "uppercase", letterSpacing: "0.6px" }}>Timesheet Entries</div>
                  {details[job.job_id] ? (
                    details[job.job_id].timesheets.length === 0
                      ? <p style={{ fontSize: "12px", color: theme.textSecondary, margin: 0 }}>No entries yet.</p>
                      : details[job.job_id].timesheets.map((t, i) => (
                        <div key={i} style={{ marginBottom: "6px", padding: "11px 13px", backgroundColor: theme.bg, borderRadius: "8px", border: `1px solid ${theme.border}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: "600", color: theme.textPrimary }}>{t.employee_name}</div>
                              <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "2px" }}>{t.shift_date}</div>
                            </div>
                            <div style={{ fontSize: "15px", fontWeight: "700", color: theme.primary }}>{t.hours_worked}h</div>
                          </div>
                          {t.field_notes && t.field_notes.toLowerCase() !== "yes" && t.field_notes.toLowerCase() !== "no" && (
                            <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "6px", paddingTop: "6px", borderTop: `1px solid ${theme.border}`, fontStyle: "italic" }}>{t.field_notes}</div>
                          )}
                        </div>
                      ))
                  ) : <p style={{ fontSize: "12px", color: theme.textSecondary }}>Loading...</p>}

                  {details[job.job_id]?.materials?.length > 0 && (
                    <div style={{ marginTop: "16px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "600", color: theme.textSecondary, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.6px" }}>Materials</div>
                      {details[job.job_id].materials.map((m, i) => (
                        <div key={i} style={{ marginBottom: "6px", padding: "11px 13px", backgroundColor: theme.bg, borderRadius: "8px", border: `1px solid ${theme.border}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: "600", color: theme.textPrimary }}>{m.description}</div>
                              <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "2px" }}>{m.supplier || "Unknown supplier"} · {m.purchase_date}</div>
                            </div>
                            <div style={{ fontSize: "15px", fontWeight: "700", color: theme.gold }}>${fmt(m.total_cost)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!loading && mileage.length > 0 && (
          <div style={{ marginTop: "26px" }}>
            <CollapsibleSection title={`Mileage Log ${totalKm.toFixed(1)} km total`}>
              {mileage.map((m, i) => (
                <div key={i} style={{ marginBottom: "6px", padding: "11px 13px", backgroundColor: theme.bg, borderRadius: "8px", border: `1px solid ${theme.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: theme.textPrimary }}>{m.employee_name}</div>
                      <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "2px" }}>{m.job_name} · {m.trip_date}</div>
                      {m.purpose && <div style={{ fontSize: "11px", color: theme.textLight, marginTop: "2px", fontStyle: "italic" }}>{m.purpose}</div>}
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: theme.primary, whiteSpace: "nowrap" }}>{Number(m.km_driven).toFixed(1)} km</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: theme.textSecondary }}>{mileage.length} trip{mileage.length !== 1 ? "s" : ""}</span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: theme.primary }}>{totalKm.toFixed(1)} km</span>
              </div>
            </CollapsibleSection>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── GLOBAL STYLES INJECTION ──────────────────────────────────
function GlobalStyles() {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      * { -webkit-tap-highlight-color: transparent; }
      input, select, textarea, button { font-family: inherit; }
      input:focus, select:focus, textarea:focus { border-color: ${theme.accent} !important; box-shadow: 0 0 0 3px ${theme.accentLight} !important; }
      button:hover:not(:disabled) { opacity: 0.92; }
      button:disabled { opacity: 0.6; cursor: not-allowed; }
      @keyframes vlspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes vlskeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
  return null;
}

// ─── APP ROOT ─────────────────────────────────────────────────
export default function App() {
  const stored = getStoredAuth();
  const [token, setToken] = useState(stored.token);
  const [role, setRole] = useState(stored.role);
  const [view, setView] = useState("home");
  const [showSignUp, setShowSignUp] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mobile, setMobile] = useState(isMobile());

  useEffect(() => {
    const handler = () => setMobile(isMobile());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    setLogoutHandler(handleLogout);
  }, []);

  function handleLogin(accessToken, userRole, newUser = false) {
    setStoredAuth(accessToken, userRole);
    setToken(accessToken);
    setRole(userRole);
    setView(userRole === "crew" ? "home" : "schedule");
    if (newUser) setShowOnboarding(true);
  }

  function handleLogout() {
    setStoredAuth(null, null);
    setToken(null);
    setRole(null);
    setView("home");
    setShowSignUp(false);
    setShowOnboarding(false);
  }

  if (!token) {
    if (showSignUp) return <><GlobalStyles /><SignUp onLogin={handleLogin} onBack={() => setShowSignUp(false)} /></>;
    return <><GlobalStyles /><Login onLogin={handleLogin} onSignUp={() => setShowSignUp(true)} /></>;
  }

  const sidebarOffset = !mobile ? theme.sidebarWidth : "0px";

  return (
    <>
      <GlobalStyles />
      <div style={{ backgroundColor: theme.bg, minHeight: "100vh" }}>
        <NavBar view={view} setView={setView} role={role} onLogout={handleLogout} />
        <div style={{ marginLeft: sidebarOffset, transition: "margin-left 0.2s" }}>
          {showOnboarding && (role === "owner" || role === "admin") && view === "schedule" && (
            <div style={{ maxWidth: "640px", margin: "0 auto", padding: "18px 18px 0" }}>
              <OnboardingChecklist token={token} onDismiss={() => setShowOnboarding(false)} />
            </div>
          )}
          {view === "home" && <CrewHome token={token} setView={setView} />}
          {view === "timesheet" && <TimesheetForm token={token} />}
          {view === "materials" && <MaterialsForm token={token} />}
          {view === "mileage" && <MileageForm token={token} />}
          {view === "schedule" && <ScheduleScreen token={token} />}
          {view === "dashboard" && <Dashboard token={token} />}
          {view === "admin" && <AdminScreen token={token} />}
          {mobile && (
            <div style={{ padding: "8px 18px 100px", textAlign: "center" }}>
              <button onClick={handleLogout} style={{ fontSize: "13px", color: "white", background: theme.danger, border: "none", borderRadius: "7px", padding: "10px 26px", cursor: "pointer", fontWeight: "600", fontFamily: font.body, minHeight: "40px" }}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}