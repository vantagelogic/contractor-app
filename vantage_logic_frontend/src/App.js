import { useState, useEffect, useRef } from "react";

const API =
  process.env.REACT_APP_API_URL ??
  (process.env.NODE_ENV === "development" ? "" : "https://contractor-api-pi7o.onrender.com");

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
  bg: "#f6f5f1",
  card: "#ffffff",
  border: "#e7e4dd",
  borderStrong: "#d4cfc6",
  textPrimary: "#16110d",
  textSecondary: "#5c5853",
  textLight: "#9a958d",
  sidebarWidth: "248px",
  shadowSm: "0 1px 3px rgba(26,61,43,0.05), 0 1px 2px rgba(26,61,43,0.04)",
  shadowMd: "0 4px 14px rgba(26,61,43,0.08), 0 2px 6px rgba(26,61,43,0.04)",
  shadowLg: "0 10px 32px rgba(26,61,43,0.12), 0 4px 12px rgba(26,61,43,0.06)",
};

const font = {
  body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  display: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};

const isMobile = () => window.innerWidth < 768;

const styles = {
  container: { maxWidth: "640px", margin: "0 auto", padding: "24px 18px 110px", fontFamily: font.body, backgroundColor: theme.bg, minHeight: "100vh" },
  containerCrew: { maxWidth: "960px", margin: "0 auto", padding: "24px 18px 110px", fontFamily: font.body, backgroundColor: theme.bg, minHeight: "100vh" },
  containerWide: { maxWidth: "1120px", margin: "0 auto", padding: "24px 24px 110px", fontFamily: font.body, backgroundColor: theme.bg, minHeight: "100vh" },
  title: { fontSize: "27px", fontWeight: "800", color: theme.primary, marginBottom: "5px", fontFamily: font.display, letterSpacing: "-0.7px", lineHeight: 1.15 },
  subtitle: { fontSize: "14px", color: theme.textSecondary, marginBottom: "24px", lineHeight: 1.4 },
  form: { display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontSize: "11px", fontWeight: "600", color: theme.textSecondary, marginTop: "14px", textTransform: "uppercase", letterSpacing: "0.7px" },
  input: { padding: "13px 14px", fontSize: "15px", borderRadius: "10px", border: `1.5px solid ${theme.border}`, width: "100%", boxSizing: "border-box", backgroundColor: "#fdfdfc", outline: "none", fontFamily: font.body, transition: "border-color 0.15s, box-shadow 0.15s" },
  inputError: { padding: "13px 14px", fontSize: "15px", borderRadius: "8px", border: `1.5px solid ${theme.danger}`, width: "100%", boxSizing: "border-box", backgroundColor: theme.dangerLight, outline: "none", fontFamily: font.body },
  textarea: { padding: "13px 14px", fontSize: "15px", borderRadius: "8px", border: `1.5px solid ${theme.border}`, width: "100%", boxSizing: "border-box", minHeight: "84px", backgroundColor: "white", fontFamily: font.body, resize: "vertical" },
  button: { marginTop: "18px", padding: "14px 22px", fontSize: "15px", backgroundColor: theme.primary, color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontFamily: font.body, transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)", minHeight: "48px", boxShadow: "0 2px 8px rgba(26,61,43,0.18)", letterSpacing: "0.1px" },
  card: { backgroundColor: "white", borderRadius: "14px", padding: "22px", border: `1px solid ${theme.border}`, boxShadow: "0 1px 3px rgba(26,61,43,0.05), 0 1px 2px rgba(26,61,43,0.04)" },
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
  const subColor = dark ? "rgba(212,162,58,0.95)" : theme.gold;
  const iconBg = dark
    ? "linear-gradient(145deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.07) 100%)"
    : `linear-gradient(145deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: Math.round(10 * scale) + "px", margin: centered ? "0 auto" : "0" }}>
      <div style={{ width: Math.round(30 * scale) + "px", height: Math.round(30 * scale) + "px", borderRadius: Math.round(8 * scale) + "px", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: dark ? "inset 0 1px 0 rgba(255,255,255,0.18)" : `inset 0 1px 0 rgba(255,255,255,0.14), 0 1px 3px rgba(15,40,24,0.3)`, border: dark ? "1px solid rgba(255,255,255,0.14)" : "none", boxSizing: "border-box" }}>
        <svg width={Math.round(18 * scale)} height={Math.round(18 * scale)} viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="3.6" r="1.5" fill={theme.gold}/>
          <path d="M3 13.6 L9 6.4 L15 13.6" stroke={theme.gold} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6.1 13.6 L9 10.1 L11.9 13.6" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
        </svg>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: Math.round(15 * scale) + "px", fontWeight: "800", color: textColor, letterSpacing: "-0.2px", lineHeight: 1, whiteSpace: "nowrap" }}>
          VANTAGE
        </span>
        <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: Math.round(7 * scale) + "px", fontWeight: "600", color: subColor, letterSpacing: Math.round(4 * scale) + "px", lineHeight: 1, whiteSpace: "nowrap", marginTop: Math.round(3 * scale) + "px", paddingLeft: "1px" }}>
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
function IconInventory() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>; }
function IconRequests() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>; }
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

// ─── HELP CHAT WIDGET ─────────────────────────────────────────
function HelpChat({ token, role }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I'm your VantageLogic assistant. Ask me anything about using the app." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { from: "user", text: msg }]);
    setLoading(true);
    try {
      const res = await apiFetch(`${API}/help-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: msg, role: role || "crew" })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { from: "bot", text: data.reply || "Sorry, something went wrong." }]);
    } catch {
      setMessages(prev => [...prev, { from: "bot", text: "Sorry, I couldn't reach the server. Try again." }]);
    }
    setLoading(false);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ position: "fixed", bottom: "80px", right: "16px", zIndex: 1100, width: "50px", height: "50px", borderRadius: "50%", backgroundColor: theme.primary, border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(26,61,43,0.35)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "22px" }}
        title="Help"
      >
        {open ? "×" : "?"}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{ position: "fixed", bottom: "140px", right: "16px", zIndex: 1100, width: "320px", maxWidth: "calc(100vw - 32px)", backgroundColor: "white", borderRadius: "16px", boxShadow: "0 8px 40px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column", overflow: "hidden", border: `1px solid ${theme.border}`, animation: "vlFadeUp 0.25s ease both" }}>
          {/* Header */}
          <div style={{ backgroundColor: theme.primary, padding: "14px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>?</div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "white" }}>VantageLogic Help</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)" }}>Ask me anything about the app</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", maxHeight: "320px", minHeight: "160px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "80%", backgroundColor: m.from === "user" ? theme.primary : theme.bg, color: m.from === "user" ? "white" : theme.textPrimary, borderRadius: m.from === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", padding: "9px 13px", fontSize: "13px", lineHeight: 1.55, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ backgroundColor: theme.bg, borderRadius: "14px 14px 14px 4px", padding: "10px 14px", display: "flex", gap: "4px", alignItems: "center" }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: theme.textLight, animation: `vlPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: `1px solid ${theme.border}`, display: "flex", gap: "8px" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask a question..."
              style={{ flex: 1, padding: "9px 12px", borderRadius: "8px", border: `1.5px solid ${theme.border}`, fontSize: "13px", fontFamily: font.body, outline: "none" }}
            />
            <button onClick={send} disabled={!input.trim() || loading} style={{ padding: "9px 14px", borderRadius: "8px", border: "none", backgroundColor: theme.primary, color: "white", cursor: "pointer", fontSize: "13px", fontWeight: "600", fontFamily: font.body, opacity: !input.trim() || loading ? 0.5 : 1 }}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
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

  const logViews = ["log", "timesheet", "materials", "mileage"];
  const isTabActive = (tabId) => tabId === "log" ? logViews.includes(view) : view === tabId;

  const tabs = isCrew
    ? [
        { id: "home", label: "Home", Icon: IconHome },
        { id: "log", label: "Log", Icon: IconMaterials },
        { id: "crew_requests", label: "Requests", Icon: IconRequests },
        { id: "settings", label: "Settings", Icon: IconAdmin },
      ]
    : [
        { id: "schedule", label: "Schedule", Icon: IconSchedule },
        { id: "dashboard", label: "Dashboard", Icon: IconDashboard },
        { id: "inventory", label: "Inventory", Icon: IconInventory },
        { id: "requests", label: "Requests", Icon: IconRequests },
        { id: "admin", label: "Setup", Icon: IconAdmin },
      ];

  // When crew is inside a log sub-view, show a context-aware nav
  const logContextTabs = [
    { id: "home",      label: "Home",      Icon: IconHome },
    { id: "timesheet", label: "Hours",     Icon: IconHours },
    { id: "materials", label: "Materials", Icon: IconMaterials },
    { id: "mileage",   label: "Mileage",   Icon: IconMileage },
  ];

  if (mobile) {
    const mobileTabs = (isCrew && logViews.includes(view)) ? logContextTabs : tabs;
    const mobileIsActive = (tabId) => view === tabId;
    return (
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: theme.primaryDark, zIndex: 1000, display: "flex", justifyContent: "space-around", padding: "12px 0 14px", boxShadow: "0 -1px 0 rgba(255,255,255,0.08), 0 -8px 28px rgba(0,0,0,0.28)", paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}>
        {mobileTabs.map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "6px 10px", borderRadius: "8px", minWidth: "48px", minHeight: "48px" }}>
            <span style={{ color: mobileIsActive(tab.id) ? "white" : "rgba(255,255,255,0.4)", display: "flex" }}><tab.Icon /></span>
            <span style={{ fontSize: "10px", color: mobileIsActive(tab.id) ? "white" : "rgba(255,255,255,0.4)", fontWeight: mobileIsActive(tab.id) ? "600" : "400", letterSpacing: "0.3px" }}>{tab.label}</span>
            {mobileIsActive(tab.id) && <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: theme.gold }} />}
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
          <button key={tab.id} onClick={() => setView(tab.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "7px", border: "none", cursor: "pointer", marginBottom: "3px", backgroundColor: isTabActive(tab.id) ? "rgba(255,255,255,0.12)" : "transparent", color: isTabActive(tab.id) ? "white" : "rgba(255,255,255,0.52)", fontFamily: font.body, fontSize: "13.5px", fontWeight: isTabActive(tab.id) ? "600" : "450", textAlign: "left", transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)" }}>
            <span style={{ display: "flex", flexShrink: 0 }}><tab.Icon /></span>
            <span>{tab.label}</span>
            {isTabActive(tab.id) && <div style={{ marginLeft: "auto", width: "3px", height: "16px", borderRadius: "2px", backgroundColor: theme.gold }} />}
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
// ─── ONBOARDING WELCOME MODAL ──────────────────────────────────
function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      bg: "linear-gradient(145deg, #0f2818 0%, #1a3d2b 100%)",
      icon: <VantageLogo size={52} dark={true} centered={true} />,
      label: null,
      title: "Welcome to VantageLogic",
      body: "Your job costing and crew tracking platform is ready. This quick guide covers the 3 things you need to start tracking your first job.",
      tip: null,
    },
    {
      bg: "linear-gradient(145deg, #1a3d2b 0%, #2d6a4f 100%)",
      icon: (
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
      label: "Step 1 of 3",
      title: "Create Your First Job",
      body: "Jobs are the foundation of everything. Every hour logged, material purchased, and mile driven is tracked against a job. Add a contract value and budget to see your profitability in real time.",
      tip: "Even if you don't have a final contract value yet — add an estimate. You can update it anytime.",
    },
    {
      bg: "linear-gradient(145deg, #7c5518 0%, #c8973a 100%)",
      icon: (
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      label: "Step 2 of 3",
      title: "Add Your Crew",
      body: "Add each employee with their hourly rate. This is what makes your labour cost calculations accurate. You can also add subcontractors — they show up in schedules and timesheets.",
      tip: "Add at least one employee before scheduling shifts or tracking hours.",
    },
    {
      bg: "linear-gradient(145deg, #1e3565 0%, #2563eb 100%)",
      icon: (
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
          <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3"/>
        </svg>
      ),
      label: "Step 3 of 3",
      title: "Get Your Crew In the App",
      body: "Create logins for your crew so they can log hours, materials, and mileage from their phones. They only see their own assignments — nothing sensitive.",
      tip: `Share this link with your crew:\n${window.location.origin}\nThey sign up, and you approve their access from Setup → Crew Access.`,
    },
  ];

  const cur = steps[step];
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(8,18,12,0.88)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(6px)" }}>
      <div style={{ backgroundColor: "white", borderRadius: "22px", maxWidth: "460px", width: "100%", overflow: "hidden", boxShadow: "0 32px 100px rgba(0,0,0,0.55)", animation: "vlFadeUp 0.35s cubic-bezier(0.4,0,0.2,1) both" }}>

        {/* Coloured header */}
        <div style={{ background: cur.bg, padding: "36px 28px 28px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", transition: "background 0.4s ease" }}>
          <button onClick={onClose} style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: "30px", height: "30px", color: "white", cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, backdropFilter: "blur(4px)" }}>×</button>

          <div style={{ width: "84px", height: "84px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "18px" }}>
            {cur.icon}
          </div>

          {cur.label && (
            <div style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>{cur.label}</div>
          )}

          {/* Progress dots */}
          <div style={{ display: "flex", gap: "6px", marginTop: cur.label ? 0 : "8px" }}>
            {steps.map((_, i) => (
              <div key={i} style={{ height: "6px", borderRadius: "3px", backgroundColor: i === step ? "white" : "rgba(255,255,255,0.32)", width: i === step ? "22px" : "6px", transition: "all 0.35s ease", cursor: "pointer" }} onClick={() => setStep(i)} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "26px 28px 28px" }}>
          <h2 style={{ margin: "0 0 10px", fontSize: "21px", fontWeight: "800", color: theme.primary, fontFamily: font.display, letterSpacing: "-0.4px", lineHeight: 1.2 }}>{cur.title}</h2>
          <p style={{ margin: "0 0 16px", fontSize: "14px", color: theme.textSecondary, lineHeight: 1.68 }}>{cur.body}</p>

          {cur.tip && (
            <div style={{ backgroundColor: "#fefce8", border: "1.5px solid #fde68a", borderRadius: "10px", padding: "12px 14px", marginBottom: "20px" }}>
              {cur.tip.split("\n").map((line, i) => (
                <p key={i} style={{ margin: i === 0 ? 0 : "5px 0 0", fontSize: "12.5px", color: "#92400e", lineHeight: 1.55, fontWeight: "500" }}>{line}</p>
              ))}
            </div>
          )}

          <button
            onClick={() => { if (isLast) { onClose(); } else { setStep(s => s + 1); } }}
            style={{ ...styles.button, marginTop: 0, width: "100%", padding: "14px", fontSize: "15px", borderRadius: "12px", fontWeight: "700" }}
          >
            {isFirst ? "Get Started →" : isLast ? "Got it — Let's go!" : "Next →"}
          </button>

          <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "12px" }}>
            {!isFirst && (
              <button onClick={() => setStep(s => s - 1)} style={{ fontSize: "13px", color: theme.textLight, background: "none", border: "none", cursor: "pointer", fontFamily: font.body, padding: "4px 8px" }}>← Back</button>
            )}
            {!isLast && (
              <button onClick={onClose} style={{ fontSize: "13px", color: theme.textLight, background: "none", border: "none", cursor: "pointer", fontFamily: font.body, padding: "4px 8px" }}>Skip for now</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ONBOARDING CHECKLIST ──────────────────────────────────────
function OnboardingChecklist({ token, onDismiss, onNavigate }) {
  const [hasJob, setHasJob] = useState(false);
  const [hasEmployee, setHasEmployee] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    apiFetch(`${API}/jobs`, { headers: h }).then(r => r.json()).then(data => setHasJob(Array.isArray(data) && data.length > 0)).catch(() => {});
    apiFetch(`${API}/employees`, { headers: h }).then(r => r.json()).then(data => setHasEmployee(Array.isArray(data) && data.length > 0)).catch(() => {});
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const steps = [
    {
      label: "Create your first job",
      desc: "Add a job with a budget and contract value",
      done: hasJob,
      view: "admin",
      color: "#2d6a4f",
    },
    {
      label: "Add crew members",
      desc: "Add employees with hourly rates for accurate job costing",
      done: hasEmployee,
      view: "admin",
      color: "#c8973a",
    },
    {
      label: "Give crew app access",
      desc: "Share your app link so crew can log time from their phones",
      done: false,
      copyLink: window.location.origin,
      color: "#2563eb",
    },
  ];

  const doneCount = steps.filter(s => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <div style={{ backgroundColor: "white", borderRadius: "14px", padding: "20px 22px 16px", marginBottom: "20px", border: `1.5px solid ${theme.accent}`, boxShadow: "0 2px 16px rgba(45,106,79,0.1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div>
          <div style={{ fontWeight: "700", fontSize: "15px", color: theme.primary, fontFamily: font.display, letterSpacing: "-0.2px" }}>Getting started</div>
          <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "2px" }}>
            {doneCount === steps.length ? "You're all set! 🎉" : `${doneCount} of ${steps.length} steps complete`}
          </div>
        </div>
        <button onClick={onDismiss} style={{ fontSize: "22px", color: theme.textLight, background: "none", border: "none", cursor: "pointer", padding: "0 0 2px 14px", lineHeight: 1, fontWeight: "300" }}>×</button>
      </div>

      {/* Progress bar */}
      <div style={{ backgroundColor: theme.border, borderRadius: "4px", height: "5px", marginBottom: "16px", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: "4px", backgroundColor: theme.accent, width: `${pct}%`, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
      </div>

      {steps.map((step, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: i < steps.length - 1 ? `1px solid ${theme.border}` : "none" }}>
          <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: step.done ? step.color : "transparent", border: step.done ? "none" : `2px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {step.done && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: step.done ? "500" : "600", color: step.done ? theme.textSecondary : theme.textPrimary, textDecoration: step.done ? "line-through" : "none" }}>{step.label}</div>
            <div style={{ fontSize: "11px", color: theme.textLight, marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{step.desc}</div>
          </div>
          {!step.done && (
            step.copyLink ? (
              <button
                onClick={() => { navigator.clipboard.writeText(step.copyLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                style={{ fontSize: "11px", padding: "5px 11px", borderRadius: "6px", border: "none", cursor: "pointer", backgroundColor: theme.accentLight, color: theme.accent, fontWeight: "700", flexShrink: 0, fontFamily: font.body, whiteSpace: "nowrap" }}
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            ) : (
              <button
                onClick={() => onNavigate && onNavigate(step.view)}
                style={{ fontSize: "11px", padding: "5px 11px", borderRadius: "6px", border: "none", cursor: "pointer", backgroundColor: theme.accentLight, color: theme.accent, fontWeight: "700", flexShrink: 0, fontFamily: font.body, whiteSpace: "nowrap" }}
              >
                Go →
              </button>
            )
          )}
          {step.done && (
            <span style={{ fontSize: "11px", color: step.color, fontWeight: "700", flexShrink: 0 }}>Done</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────
function Login({ onLogin, onSignUp, onForgot }) {
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
      const data = await response.json().catch(() => ({}));
      setError(data.detail || "Incorrect email or password");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(120% 80% at 50% 0%, ${theme.primary} 0%, ${theme.primaryDark} 55%, #0a1c11 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: font.body, padding: "32px 20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-30%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(200,151,58,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ marginBottom: "34px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", animation: "vlFadeUp 0.5s ease both" }}>
        <VantageLogo size={66} dark={true} centered={true} />
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.62)", marginTop: "20px", textAlign: "center", maxWidth: "330px", lineHeight: 1.55 }}>
          Real-time job costing, crew tracking, and profit visibility built for trades.
        </p>
      </div>

      <div style={{ backgroundColor: "white", borderRadius: "16px", width: "100%", maxWidth: "404px", boxShadow: "0 24px 60px rgba(0,0,0,0.32), 0 8px 24px rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", position: "relative", animation: "vlFadeUp 0.5s ease 0.08s both" }}>
        <div style={{ height: "3px", background: `linear-gradient(90deg, ${theme.gold} 0%, #e0b75e 50%, ${theme.gold} 100%)` }} />
        <div style={{ padding: "34px 32px" }}>
          <h1 style={{ fontSize: "23px", fontWeight: "800", color: theme.primary, fontFamily: font.display, margin: "0 0 6px", letterSpacing: "-0.5px" }}>Sign in</h1>
          <p style={{ fontSize: "13px", color: theme.textSecondary, margin: "0 0 26px" }}>Welcome back to Vantage Logic</p>

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
            <button onClick={onSignUp} type="button" style={{ width: "100%", fontSize: "14px", color: theme.accent, background: "white", border: `1.5px solid ${theme.accent}`, borderRadius: "10px", padding: "12px", cursor: "pointer", fontWeight: "600", fontFamily: font.body, minHeight: "44px", transition: "all 0.15s" }}>
              Create an Account
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: "16px" }}><button onClick={onForgot} type="button" style={{ fontSize: "12px", color: theme.textSecondary, background: "none", border: "none", cursor: "pointer", fontWeight: "500", textDecoration: "underline" }}>Forgot your password?</button></div>
        </div>
      </div>

      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "28px", textAlign: "center", position: "relative" }}>
        © 2026 Vantage Logic
      </p>
    </div>
  );
}

// ─── SIGN UP ──────────────────────────────────────────────────
function SignUp({ onCheckEmail, onBack }) {
  const [form, setForm] = useState({ first_name: "", last_name: "", company_name: "", email: "", password: "", confirm_password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

  function validate() {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "First name is required";
    if (!form.last_name.trim()) e.last_name = "Last name is required";
    if (!form.company_name.trim()) e.company_name = "Company name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Please enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirm_password) e.confirm_password = "Passwords do not match";
    if (!termsAgreed) e.terms = "You must agree to the Terms of Service to continue";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const params = new URLSearchParams({ first_name: form.first_name, last_name: form.last_name, company_name: form.company_name, email: form.email, password: form.password });
    const response = await fetch(`${API}/signup?${params}`, { method: "POST" });
    setLoading(false);
    if (response.ok) {
      onCheckEmail(form.email);
    } else {
      const data = await response.json();
      setErrors({ general: data.detail || "Sign up failed. Please try again." });
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(120% 80% at 50% 0%, ${theme.primary} 0%, ${theme.primaryDark} 55%, #0a1c11 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: font.body, padding: "32px 20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-30%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(200,151,58,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ marginBottom: "30px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", animation: "vlFadeUp 0.5s ease both" }}>
        <VantageLogo size={58} dark={true} centered={true} />
      </div>

      <div style={{ backgroundColor: "white", borderRadius: "16px", width: "100%", maxWidth: "404px", boxShadow: "0 24px 60px rgba(0,0,0,0.32), 0 8px 24px rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", position: "relative", animation: "vlFadeUp 0.5s ease 0.08s both" }}>
        <div style={{ height: "3px", background: `linear-gradient(90deg, ${theme.gold} 0%, #e0b75e 50%, ${theme.gold} 100%)` }} />
        <div style={{ padding: "34px 32px" }}>
        <h1 style={{ fontSize: "23px", fontWeight: "800", color: theme.primary, fontFamily: font.display, margin: "0 0 6px", letterSpacing: "-0.5px" }}>Start your free trial</h1>
        <p style={{ fontSize: "13px", color: theme.textSecondary, margin: "0 0 24px" }}>14 days free. No credit card required.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={styles.label}>First Name</label>
              <input style={errors.first_name ? styles.inputError : styles.input} placeholder="John" value={form.first_name} onChange={e => { setForm({...form, first_name: e.target.value}); setErrors({...errors, first_name: ""}); }} />
              {errors.first_name && <p style={styles.errorMsg}>{errors.first_name}</p>}
            </div>
            <div>
              <label style={styles.label}>Last Name</label>
              <input style={errors.last_name ? styles.inputError : styles.input} placeholder="Smith" value={form.last_name} onChange={e => { setForm({...form, last_name: e.target.value}); setErrors({...errors, last_name: ""}); }} />
              {errors.last_name && <p style={styles.errorMsg}>{errors.last_name}</p>}
            </div>
          </div>

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

          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginTop: "18px", padding: "14px", backgroundColor: theme.bg, borderRadius: "10px", border: errors.terms ? `1.5px solid ${theme.danger}` : `1px solid ${theme.border}` }}>
            <input
              type="checkbox"
              id="terms-agree"
              checked={termsAgreed}
              onChange={e => { setTermsAgreed(e.target.checked); setErrors(prev => ({...prev, terms: ""})); }}
              style={{ marginTop: "2px", width: "16px", height: "16px", flexShrink: 0, accentColor: theme.primary, cursor: "pointer" }}
            />
            <label htmlFor="terms-agree" style={{ fontSize: "12px", color: theme.textSecondary, lineHeight: 1.55, cursor: "pointer" }}>
              I have read and agree to the{" "}
              <a href="https://vantagelogic.ca/terms" target="_blank" rel="noopener noreferrer" style={{ color: theme.primary, fontWeight: "600", textDecoration: "underline" }}>Terms of Service</a>
              {" "}and{" "}
              <a href="https://vantagelogic.ca/privacy" target="_blank" rel="noopener noreferrer" style={{ color: theme.primary, fontWeight: "600", textDecoration: "underline" }}>Privacy Policy</a>.
            </label>
          </div>
          {errors.terms && <p style={styles.errorMsg}>{errors.terms}</p>}

          <button style={{...styles.button, marginTop: "16px", backgroundColor: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"}} type="submit" disabled={loading}>
            {loading ? <><Spinner /> Creating account...</> : "Create Free Account"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button onClick={onBack} type="button" style={{ fontSize: "13px", color: theme.textSecondary, background: "none", border: "none", cursor: "pointer", fontWeight: "500" }}>Already have an account? Sign in</button>
        </div>
        </div>
      </div>
    </div>
  );
}

// ─── AUTH SHELL (shared chrome for auth screens) ───────────────
function AuthShell({ children, subtitle }) {
  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(120% 80% at 50% 0%, ${theme.primary} 0%, ${theme.primaryDark} 55%, #0a1c11 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: font.body, padding: "32px 20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-30%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(200,151,58,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ marginBottom: "30px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", animation: "vlFadeUp 0.5s ease both" }}>
        <VantageLogo size={58} dark={true} centered={true} />
        {subtitle && <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.62)", marginTop: "20px", textAlign: "center", maxWidth: "330px", lineHeight: 1.55 }}>{subtitle}</p>}
      </div>
      <div style={{ backgroundColor: "white", borderRadius: "16px", width: "100%", maxWidth: "404px", boxShadow: "0 24px 60px rgba(0,0,0,0.32), 0 8px 24px rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", position: "relative", animation: "vlFadeUp 0.5s ease 0.08s both" }}>
        <div style={{ height: "3px", background: `linear-gradient(90deg, ${theme.gold} 0%, #e0b75e 50%, ${theme.gold} 100%)` }} />
        <div style={{ padding: "34px 32px" }}>{children}</div>
      </div>
      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "28px", textAlign: "center", position: "relative" }}>© 2026 Vantage Logic</p>
    </div>
  );
}

// ─── CHECK YOUR EMAIL ───────────────────────────────────────────
function CheckEmail({ email, onBack }) {
  return (
    <AuthShell>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: theme.accentLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        </div>
        <h1 style={{ fontSize: "21px", fontWeight: "800", color: theme.primary, fontFamily: font.display, margin: "0 0 8px", letterSpacing: "-0.5px" }}>Check your email</h1>
        <p style={{ fontSize: "14px", color: theme.textSecondary, lineHeight: 1.6, margin: "0 0 6px" }}>
          We sent a verification link to
        </p>
        <p style={{ fontSize: "14px", fontWeight: "700", color: theme.primary, margin: "0 0 20px" }}>{email}</p>
        <p style={{ fontSize: "13px", color: theme.textSecondary, lineHeight: 1.6, margin: "0 0 24px" }}>
          Click the link in that email to verify your account and sign in. If you don't see it, check your spam folder.
        </p>
        <button onClick={onBack} type="button" style={{ width: "100%", fontSize: "14px", color: theme.accent, background: "white", border: `1.5px solid ${theme.accent}`, borderRadius: "10px", padding: "12px", cursor: "pointer", fontWeight: "600", fontFamily: font.body, minHeight: "44px" }}>
          Back to Sign In
        </button>
      </div>
    </AuthShell>
  );
}

// ─── VERIFYING EMAIL (handles ?verify=token) ───────────────────
function VerifyEmail({ token, onVerified, onBack }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    apiFetch(`${API}/verify-email?token=${encodeURIComponent(token)}`)
      .then(async r => {
        const data = await r.json();
        if (r.ok) {
          setStatus("success");
          setTimeout(() => onVerified(data.access_token, data.role), 1100);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthShell>
      <div style={{ textAlign: "center", padding: "10px 0" }}>
        {status === "loading" && (
          <>
            <div style={{ marginBottom: "16px" }}><Spinner size={28} color={theme.primary} /></div>
            <p style={{ fontSize: "14px", color: theme.textSecondary }}>Verifying your email...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: theme.accentLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h1 style={{ fontSize: "21px", fontWeight: "800", color: theme.primary, fontFamily: font.display, margin: "0 0 8px" }}>Email verified</h1>
            <p style={{ fontSize: "14px", color: theme.textSecondary }}>Signing you in...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: theme.dangerLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={theme.danger} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <h1 style={{ fontSize: "21px", fontWeight: "800", color: theme.primary, fontFamily: font.display, margin: "0 0 8px" }}>Link expired or invalid</h1>
            <p style={{ fontSize: "14px", color: theme.textSecondary, lineHeight: 1.6, marginBottom: "20px" }}>This verification link is no longer valid. Try signing in, or sign up again.</p>
            <button onClick={onBack} type="button" style={{ width: "100%", fontSize: "14px", color: theme.accent, background: "white", border: `1.5px solid ${theme.accent}`, borderRadius: "10px", padding: "12px", cursor: "pointer", fontWeight: "600", fontFamily: font.body, minHeight: "44px" }}>
              Back to Sign In
            </button>
          </>
        )}
      </div>
    </AuthShell>
  );
}

// ─── FORGOT PASSWORD ────────────────────────────────────────────
function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const params = new URLSearchParams({ email });
    await apiFetch(`${API}/forgot-password?${params}`, { method: "POST" });
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: theme.accentLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <h1 style={{ fontSize: "21px", fontWeight: "800", color: theme.primary, fontFamily: font.display, margin: "0 0 8px" }}>Check your email</h1>
          <p style={{ fontSize: "13px", color: theme.textSecondary, lineHeight: 1.6, marginBottom: "24px" }}>
            If an account exists for <strong>{email}</strong>, a reset link is on its way. It expires in 1 hour.
          </p>
          <button onClick={onBack} type="button" style={{ width: "100%", fontSize: "14px", color: theme.accent, background: "white", border: `1.5px solid ${theme.accent}`, borderRadius: "10px", padding: "12px", cursor: "pointer", fontWeight: "600", fontFamily: font.body, minHeight: "44px" }}>
            Back to Sign In
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 style={{ fontSize: "23px", fontWeight: "800", color: theme.primary, fontFamily: font.display, margin: "0 0 6px", letterSpacing: "-0.5px" }}>Reset your password</h1>
      <p style={{ fontSize: "13px", color: theme.textSecondary, margin: "0 0 26px" }}>Enter your email and we'll send you a reset link.</p>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>Email</label>
        <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@yourcompany.com" />
        <button style={{...styles.button, marginTop: "24px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"}} type="submit" disabled={loading}>
          {loading ? <><Spinner /> Sending...</> : "Send Reset Link"}
        </button>
      </form>
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button onClick={onBack} type="button" style={{ fontSize: "13px", color: theme.textSecondary, background: "none", border: "none", cursor: "pointer", fontWeight: "500" }}>Back to Sign In</button>
      </div>
    </AuthShell>
  );
}

// ─── RESET PASSWORD (handles ?reset=token) ─────────────────────
function ResetPassword({ token, onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password || password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setError("");
    setLoading(true);
    const params = new URLSearchParams({ token, new_password: password });
    const res = await apiFetch(`${API}/reset-password?${params}`, { method: "POST" });
    setLoading(false);
    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.detail || "This reset link is invalid or has expired.");
    }
  }

  if (done) {
    return (
      <AuthShell>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: theme.accentLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h1 style={{ fontSize: "21px", fontWeight: "800", color: theme.primary, fontFamily: font.display, margin: "0 0 8px" }}>Password updated</h1>
          <p style={{ fontSize: "13px", color: theme.textSecondary, marginBottom: "24px" }}>You can now sign in with your new password.</p>
          <button onClick={onDone} type="button" style={{ ...styles.button, marginTop: 0, width: "100%" }}>Go to Sign In</button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 style={{ fontSize: "23px", fontWeight: "800", color: theme.primary, fontFamily: font.display, margin: "0 0 6px", letterSpacing: "-0.5px" }}>Set a new password</h1>
      <p style={{ fontSize: "13px", color: theme.textSecondary, margin: "0 0 26px" }}>Choose a new password for your account.</p>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>New Password</label>
        <PasswordInput placeholder="At least 8 characters" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} error={!!error} />
        <label style={styles.label}>Confirm Password</label>
        <PasswordInput placeholder="Confirm new password" value={confirm} onChange={e => { setConfirm(e.target.value); setError(""); }} error={!!error} />
        {error && <p style={{...styles.errorMsg, marginTop: "10px"}}>{error}</p>}
        <button style={{...styles.button, marginTop: "24px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"}} type="submit" disabled={loading}>
          {loading ? <><Spinner /> Saving...</> : "Update Password"}
        </button>
      </form>
    </AuthShell>
  );
}

// ─── SHARED INNER COMPONENTS ─────────────────────────────────
function StatCard({ label, value, unit, sublabel }) {
  return (
    <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "18px 16px", border: `1px solid ${theme.border}`, boxShadow: "0 1px 3px rgba(26,61,43,0.04)" }}>
      <div style={{ fontSize: "11px", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: "600", marginBottom: "8px" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
        <div style={{ fontSize: "26px", fontWeight: "700", color: theme.primary, fontFamily: font.display, letterSpacing: "-0.5px" }}>{value}</div>
        {unit && <div style={{ fontSize: "13px", color: theme.textSecondary, fontWeight: "500" }}>{unit}</div>}
      </div>
      {sublabel && <div style={{ fontSize: "11px", color: theme.textLight, marginTop: "4px" }}>{sublabel}</div>}
    </div>
  );
}

function QuickActionBtn({ label, icon: IconComponent, color, onClick }) {
  return (
    <button onClick={onClick} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "18px 12px", borderRadius: "12px", border: `1px solid ${theme.border}`, backgroundColor: "white", cursor: "pointer", fontFamily: font.body, color: theme.textPrimary, transition: "all 0.15s", minHeight: "92px", boxShadow: "0 1px 3px rgba(26,61,43,0.04)" }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>{IconComponent ? IconComponent() : null}</div>
      <span style={{ fontSize: "12px", fontWeight: "600" }}>{label}</span>
    </button>
  );
}

function Btn({ label, bg, color, onClick }) {
  return <button onClick={onClick} style={{ fontSize: "11px", padding: "5px 11px", borderRadius: "5px", border: "none", cursor: "pointer", backgroundColor: bg, color, fontWeight: "600", fontFamily: font.body, whiteSpace: "nowrap", minHeight: "28px" }}>{label}</button>;
}

function Row({ main, sub, actions }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 13px", backgroundColor: theme.bg, borderRadius: "7px", marginBottom: "6px", border: `1px solid ${theme.border}`, gap: "8px" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: "600", fontSize: "13px", color: theme.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{main}</div>
        {sub && <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "2px" }}>{sub}</div>}
      </div>
      <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>{actions}</div>
    </div>
  );
}

// ─── CREW HOME (personalized stats) ───────────────────────────
function CrewHome({ token, setView, setVoicePrefill = null, readonly = false }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState([]);
  const [schedWeek, setSchedWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split("T")[0]);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [voiceResult, setVoiceResult] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [costCodes, setCostCodes] = useState([]);
  const [voiceSupported] = useState(() => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window));

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      apiFetch(`${API}/me/stats`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/my-schedule`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/my-jobs`, { headers: h }).then(r => r.json()).catch(() => []),
      apiFetch(`${API}/cost-codes`, { headers: h }).then(r => r.json()).catch(() => []),
    ]).then(([statsData, schedData, jobsData, ccData]) => {
      setStats(statsData);
      setSchedule(Array.isArray(schedData) ? schedData : []);
      setJobs(Array.isArray(jobsData) ? jobsData.filter(j => j.status === "active") : []);
      setCostCodes(Array.isArray(ccData) ? ccData : []);
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

  /* StatCard and QuickActionBtn moved to module scope */

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


  return (
    <div style={styles.containerCrew} className="vl-screen">
      {/* Greeting */}
      <div style={{ marginBottom: "26px" }}>
        <h1 style={styles.title}>{greeting}{firstName ? `, ${firstName}` : ""}</h1>
        <p style={styles.subtitle}>{today}</p>
      </div>

      <div className="vl-home-grid">
        <div>
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
          <QuickActionBtn label="Hours" icon={IconHours} color={readonly ? theme.textLight : theme.primary} onClick={() => !readonly && setView("timesheet")} />
          <QuickActionBtn label="Materials" icon={IconMaterials} color={readonly ? theme.textLight : theme.gold} onClick={() => !readonly && setView("materials")} />
          <QuickActionBtn label="Mileage" icon={IconMileage} color={readonly ? theme.textLight : theme.accent} onClick={() => !readonly && setView("mileage")} />
        </div>
      </div>

      {/* Voice Entry */}
      {voiceSupported && !readonly && (
        <div style={{ marginBottom: "22px" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>Voice Log</div>
          <div style={{ ...styles.card, padding: "16px", background: voiceListening ? `linear-gradient(135deg, ${theme.primary} 0%, #0d3d2e 100%)` : "white", transition: "background 0.3s" }}>
            {voiceResult ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: theme.primary }}>
                    {voiceResult.type === "timesheet" ? "Hours Entry" : voiceResult.type === "material" ? "Material Entry" : voiceResult.type === "mileage" ? "Mileage Entry" : "Request"}
                  </div>
                  <button onClick={() => { setVoiceResult(null); setVoiceTranscript(""); setVoiceError(""); }} style={{ fontSize: "12px", color: theme.textSecondary, background: "none", border: `1px solid ${theme.border}`, borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontFamily: font.body }}>Redo</button>
                </div>
                <div style={{ backgroundColor: theme.bg, borderRadius: "10px", padding: "12px 14px", marginBottom: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {voiceResult.type === "timesheet" && <>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "12px", color: theme.textSecondary }}>Hours</span><span style={{ fontSize: "13px", fontWeight: "700", color: theme.primary }}>{voiceResult.hours || "?"}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "12px", color: theme.textSecondary }}>Job</span><span style={{ fontSize: "13px", fontWeight: "600", color: theme.textPrimary }}>{voiceResult._matchedJobName || voiceResult.job_name || "?"}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "12px", color: theme.textSecondary }}>Cost Code</span><span style={{ fontSize: "13px", fontWeight: "600", color: theme.textPrimary }}>{voiceResult._matchedCCLabel || voiceResult.cost_code || "?"}</span></div>
                    {voiceResult.cost_code_confidence === "low" && (
                      <div style={{ marginTop: "4px" }}>
                        <label style={{ fontSize: "11px", color: theme.warning, fontWeight: "600", display: "block", marginBottom: "4px" }}>Cost code unclear — pick one:</label>
                        <select style={{ ...styles.input, marginTop: 0, fontSize: "13px" }} value={voiceResult._matchedCCId || ""} onChange={e => {
                          const cc = costCodes.find(c => String(c.cost_code_id) === e.target.value);
                          setVoiceResult(prev => ({ ...prev, _matchedCCId: e.target.value, _matchedCCLabel: cc ? `${cc.code} ${cc.description}` : "" }));
                        }}>
                          <option value="">Select cost code</option>
                          {costCodes.map(cc => <option key={cc.cost_code_id} value={cc.cost_code_id}>{cc.code} {cc.description}</option>)}
                        </select>
                      </div>
                    )}
                    {voiceResult.notes && <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}><span style={{ fontSize: "12px", color: theme.textSecondary, flexShrink: 0 }}>Notes</span><span style={{ fontSize: "12px", color: theme.textPrimary, textAlign: "right" }}>{voiceResult.notes}</span></div>}
                  </>}
                  {voiceResult.type === "material" && <>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "12px", color: theme.textSecondary }}>Item</span><span style={{ fontSize: "13px", fontWeight: "600", color: theme.textPrimary }}>{voiceResult.description || "?"}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "12px", color: theme.textSecondary }}>Job</span><span style={{ fontSize: "13px", fontWeight: "600", color: theme.textPrimary }}>{voiceResult._matchedJobName || voiceResult.job_name || "?"}</span></div>
                    {voiceResult.amount > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "12px", color: theme.textSecondary }}>Amount</span><span style={{ fontSize: "13px", fontWeight: "700", color: theme.primary }}>${voiceResult.amount}</span></div>}
                    {voiceResult.notes && <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}><span style={{ fontSize: "12px", color: theme.textSecondary, flexShrink: 0 }}>Notes</span><span style={{ fontSize: "12px", color: theme.textPrimary, textAlign: "right" }}>{voiceResult.notes}</span></div>}
                  </>}
                  {voiceResult.type === "mileage" && <>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "12px", color: theme.textSecondary }}>KM</span><span style={{ fontSize: "13px", fontWeight: "700", color: theme.primary }}>{voiceResult.km || "?"}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "12px", color: theme.textSecondary }}>Job</span><span style={{ fontSize: "13px", fontWeight: "600", color: theme.textPrimary }}>{voiceResult._matchedJobName || voiceResult.job_name || "?"}</span></div>
                    {voiceResult.notes && <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}><span style={{ fontSize: "12px", color: theme.textSecondary, flexShrink: 0 }}>Notes</span><span style={{ fontSize: "12px", color: theme.textPrimary, textAlign: "right" }}>{voiceResult.notes}</span></div>}
                  </>}
                  {voiceResult.type === "request" && <>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "12px", color: theme.textSecondary }}>Type</span><span style={{ fontSize: "13px", fontWeight: "600", color: theme.textPrimary }}>{voiceResult.request_type || "Other"}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "12px", color: theme.textSecondary }}>Job</span><span style={{ fontSize: "13px", fontWeight: "600", color: theme.textPrimary }}>{voiceResult._matchedJobName || voiceResult.job_name || "?"}</span></div>
                    {(voiceResult.description || voiceResult.notes) && <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}><span style={{ fontSize: "12px", color: theme.textSecondary, flexShrink: 0 }}>Details</span><span style={{ fontSize: "12px", color: theme.textPrimary, textAlign: "right" }}>{voiceResult.description || voiceResult.notes}</span></div>}
                  </>}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => {
                    const type = voiceResult.type;
                    if (setVoicePrefill) setVoicePrefill(voiceResult);
                    if (type === "timesheet") setView("timesheet");
                    else if (type === "material") setView("materials");
                    else if (type === "mileage") setView("mileage");
                    else if (type === "request") setView("requests");
                    if (window._setVoicePrefill) window._setVoicePrefill(voiceResult);
                    setVoiceResult(null);
                  }} style={{ flex: 1, ...styles.button, marginTop: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    Review and Submit
                  </button>
                </div>
                <p style={{ fontSize: "11px", color: theme.textSecondary, textAlign: "center", marginTop: "10px", marginBottom: 0 }}>Review the entry on the next screen before it saves</p>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <button
                  type="button"
                  onPointerDown={() => {
                    setVoiceError("");
                    setVoiceTranscript("");
                    setVoiceResult(null);
                    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
                    const recognition = new SR();
                    recognition.lang = "en-CA";
                    recognition.continuous = false;
                    recognition.interimResults = true;
                    window._crewVoiceRecognition = recognition;
                    window._crewVoiceTranscript = "";
                    recognition.onresult = (e) => {
                      const t = Array.from(e.results).map(r => r[0].transcript).join("");
                      setVoiceTranscript(t);
                      window._crewVoiceTranscript = t;
                    };
                    recognition.onerror = (e) => {
                      setVoiceListening(false);
                      setVoiceError(e.error === "not-allowed" ? "Microphone access denied. Check your browser settings." : "Could not hear clearly. Try again.");
                    };
                    recognition.onend = async () => {
                      setVoiceListening(false);
                      const transcript = window._crewVoiceTranscript;
                      if (!transcript || transcript.trim().length < 3) {
                        setVoiceError("Nothing captured. Hold the button and speak clearly.");
                        return;
                      }
                      setVoiceProcessing(true);
                      try {
                        const res = await apiFetch(`${API}/voice/parse-entry`, {
                          method: "POST",
                          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                          body: JSON.stringify({ transcript })
                        });
                        const data = await res.json();
                        if (data.success) {
                          const matchedJob = jobs.find(j => {
                            const jn = j.job_name.toLowerCase();
                            const hint = (data.job_name || "").toLowerCase();
                            return hint && (jn.includes(hint) || hint.includes(jn) || jn.split(" ").some(w => w.length > 3 && hint.includes(w)));
                          });
                          const matchedCC = costCodes.find(c => {
                            const ccStr = `${c.code} ${c.description}`.toLowerCase();
                            const hint = (data.cost_code || "").toLowerCase();
                            return hint && (ccStr.includes(hint) || hint.includes(c.code.toLowerCase()) || hint.split(" ").some(w => w.length > 3 && ccStr.includes(w)));
                          });
                          setVoiceResult({
                            ...data,
                            _matchedJobId: matchedJob ? String(matchedJob.job_id) : "",
                            _matchedJobName: matchedJob ? matchedJob.job_name : (data.job_name || ""),
                            _matchedCCId: matchedCC ? String(matchedCC.cost_code_id) : "",
                            _matchedCCLabel: matchedCC ? `${matchedCC.code} ${matchedCC.description}` : (data.cost_code || ""),
                          });
                        } else {
                          setVoiceError(data.message || "Could not parse. Try again.");
                        }
                      } catch {
                        setVoiceError("Something went wrong. Try again.");
                      }
                      setVoiceProcessing(false);
                      setVoiceTranscript("");
                    };
                    setVoiceListening(true);
                    recognition.start();
                  }}
                  onPointerUp={() => { if (window._crewVoiceRecognition) window._crewVoiceRecognition.stop(); }}
                  onPointerLeave={() => { if (window._crewVoiceRecognition && voiceListening) window._crewVoiceRecognition.stop(); }}
                  style={{ width: "60px", height: "60px", borderRadius: "50%", border: "none", backgroundColor: voiceListening ? "rgba(255,255,255,0.2)" : theme.accentLight, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s", boxShadow: voiceListening ? "0 0 0 10px rgba(255,255,255,0.12)" : "none" }}
                >
                  {voiceProcessing ? (
                    <Spinner size={24} color={voiceListening ? "white" : theme.primary} />
                  ) : (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={voiceListening ? "white" : theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/>
                      <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                  )}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {voiceListening ? (
                    <>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "white", marginBottom: "3px" }}>Listening... release when done</div>
                      {voiceTranscript && <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.75)", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{voiceTranscript}</div>}
                    </>
                  ) : voiceProcessing ? (
                    <div style={{ fontSize: "14px", fontWeight: "600", color: theme.primary }}>Reading your entry...</div>
                  ) : voiceError ? (
                    <div style={{ fontSize: "13px", color: theme.danger, fontWeight: "500" }}>{voiceError}</div>
                  ) : (
                    <>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: theme.primary, marginBottom: "2px" }}>Log by voice</div>
                      <div style={{ fontSize: "12px", color: theme.textSecondary, lineHeight: 1.4 }}>Hold and speak. Works for hours, materials, mileage, or requests.</div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

        </div>

        <div>
      {/* This Month + All Time */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.8px" }}>My Schedule</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={() => { setSchedWeek(w => w - 1); setSelectedDay(null); }} style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontSize: "13px", color: theme.textSecondary, fontFamily: font.body }}>&#8249;</button>
            <span style={{ fontSize: "12px", color: theme.textSecondary, fontWeight: "500", minWidth: "120px", textAlign: "center" }}>
              {(() => { const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1 + schedWeek * 7); return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" }); })()}
              {" to "}
              {(() => { const d = new Date(); d.setDate(d.getDate() - d.getDay() + 7 + schedWeek * 7); return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" }); })()}
            </span>
            <button onClick={() => { setSchedWeek(w => w + 1); setSelectedDay(null); }} style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontSize: "13px", color: theme.textSecondary, fontFamily: font.body }}>&#8250;</button>
          </div>
        </div>

        {/* 7-day strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "16px" }}>
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            const day = d.getDay();
            d.setDate(d.getDate() - day + 1 + i + schedWeek * 7);
            const dateStr = d.toISOString().split("T")[0];
            const isToday = dateStr === new Date().toISOString().split("T")[0];
            const daySchedules = schedule.filter(s => s.scheduled_date === dateStr);
            const hasWork = daySchedules.length > 0;
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <div style={{ fontSize: "10px", fontWeight: "600", color: isToday ? theme.gold : theme.textLight, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {d.toLocaleDateString("en-CA", { weekday: "short" }).slice(0, 1)}
                </div>
                <div onClick={() => setSelectedDay(selectedDay === dateStr ? null : dateStr)} style={{ width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", backgroundColor: selectedDay === dateStr ? theme.primary : isToday && selectedDay !== dateStr ? "transparent" : hasWork ? theme.accentLight : "transparent", border: selectedDay === dateStr ? `2px solid ${theme.primary}` : isToday ? `2px solid ${theme.primary}` : hasWork ? `1.5px solid ${theme.accent}` : `1.5px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                  <span style={{ fontSize: "12px", fontWeight: isToday || hasWork || selectedDay === dateStr ? "700" : "400", color: selectedDay === dateStr ? "white" : isToday ? theme.primary : hasWork ? theme.accent : theme.textLight }}>
                    {d.getDate()}
                  </span>
                </div>
                {hasWork && <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: theme.gold }} />}
              </div>
            );
          })}
        </div>

        {/* Assignment cards for the week */}
        {(() => {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          const day = d.getDay();
          const monday = new Date(d);
          monday.setDate(d.getDate() - day + 1 + schedWeek * 7);
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          const weekSchedules = schedule.filter(s => {
            const sd = new Date(s.scheduled_date + "T00:00:00");
            if (selectedDay) return s.scheduled_date === selectedDay;
            return sd >= monday && sd <= sunday;
          });
          if (weekSchedules.length === 0) return (
            <div style={{ ...styles.card, textAlign: "center", padding: "20px", backgroundColor: theme.bg }}>
              <p style={{ fontSize: "13px", color: theme.textLight, margin: 0 }}>{selectedDay ? "No assignments on this day" : "No assignments this week"}</p>
            </div>
          );
          return (
            <div style={{ ...styles.card, padding: "0" }}>
              {weekSchedules.map((s, i) => {
                const date = new Date(s.scheduled_date + "T00:00:00");
                const isToday = s.scheduled_date === new Date().toISOString().split("T")[0];
                const isTomorrow = s.scheduled_date === new Date(Date.now() + 86400000).toISOString().split("T")[0];
                const dayLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : date.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
                return (
                  <div key={s.schedule_id} style={{ padding: "13px 16px", borderBottom: i < weekSchedules.length - 1 ? `1px solid ${theme.border}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: theme.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.job_name}</div>
                      <div style={{ fontSize: "12px", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ color: isToday ? theme.gold : theme.textSecondary, fontWeight: isToday ? "600" : "400" }}>{dayLabel}</span>
                        {isToday && <span style={{ backgroundColor: theme.gold, color: "white", padding: "1px 6px", borderRadius: "8px", fontSize: "10px", fontWeight: "700" }}>TODAY</span>}
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
          );
        })()}
      </div>

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
        </div>
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
  const [deleting, setDeleting] = useState(null);
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

  async function deleteEntry(id) {
    if (!window.confirm("Delete this entry? This cannot be undone.")) return;
    setDeleting(id);
    const path = type === "timesheet" ? "timesheets" : type === "material" ? "materials" : "mileage";
    const res = await apiFetch(`${API}/${path}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setDeleting(null);
    if (res.ok) {
      setMessage("Entry deleted.");
      setTimeout(() => setMessage(""), 3000);
      fetchEntries();
    } else {
      setMessage("Could not delete. Please try again.");
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
                  <button onClick={() => deleteEntry(id)} disabled={deleting === id} style={{ fontSize: "11px", padding: "5px 10px", borderRadius: "5px", border: "none", cursor: "pointer", backgroundColor: theme.dangerLight, color: theme.danger, fontWeight: "600", fontFamily: font.body }}>
                    {deleting === id ? "..." : "Delete"}
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
function LogBackButton({ setView }) {
  if (!setView) return null;
  return (
    <button type="button" onClick={() => setView("log")} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: theme.textSecondary, background: "none", border: "none", cursor: "pointer", padding: "0 0 12px", fontWeight: "600", fontFamily: font.body }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      Back to Log
    </button>
  );
}

function TimesheetForm({ token, readonly = false, voicePrefill = null, onPrefillConsumed = null, setView = null }) {
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
  const [scheduleToLog, setScheduleToLog] = useState([]);
  const [dismissedSchedule, setDismissedSchedule] = useState([]);

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      apiFetch(`${API}/me`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/employees`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/my-jobs`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/cost-codes`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/my-schedule-to-log`, { headers: h }).then(r => r.json()).catch(() => []),
    ]).then(([me, emps, jobs, ccs, schedToLog]) => {
      if (me.employee_id) {
        setLinkedEmployeeId(me.employee_id);
        setFormData(prev => ({ ...prev, employee_id: me.employee_id }));
        setScheduleToLog(Array.isArray(schedToLog) ? schedToLog.filter(s => !s.already_logged) : []);
      }
      setEmployees(emps);
      setJobs(jobs.filter(j => j.status === "active"));
      setCostCodes(ccs);
      setLoading(false);
    });
  }, [token]);

  useEffect(() => {
    if (!voicePrefill || voicePrefill.type !== "timesheet") return;
    const today = new Date().toISOString().split("T")[0];
    setFormData(prev => ({
      ...prev,
      hours_worked: voicePrefill.hours ? String(voicePrefill.hours) : prev.hours_worked,
      job_id: voicePrefill._matchedJobId || prev.job_id,
      cost_code_id: voicePrefill._matchedCCId || prev.cost_code_id,
      field_notes: voicePrefill.notes || prev.field_notes,
      shift_date: today,
    }));
    if (onPrefillConsumed) onPrefillConsumed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voicePrefill]);

  useEffect(() => {
    if (linkedEmployeeId && employees.length > 0) {
      const emp = employees.find(e => e.employee_id === linkedEmployeeId);
      if (emp) setLinkedEmployeeName(`${emp.first_name} ${emp.last_name}`);
    }
  }, [linkedEmployeeId, employees]);

  useEffect(() => {
    if (!voicePrefill || voicePrefill.type !== "timesheet") return;
    setFormData(prev => ({
      ...prev,
      hours_worked: voicePrefill.hours ? String(voicePrefill.hours) : prev.hours_worked,
      job_id: voicePrefill._matchedJobId || prev.job_id,
      cost_code_id: voicePrefill._matchedCCId || prev.cost_code_id,
      field_notes: voicePrefill.notes || prev.field_notes,
    }));
    if (onPrefillConsumed) onPrefillConsumed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voicePrefill]);

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
      <LogBackButton setView={setView} />
      <h1 style={styles.title}>Log Hours</h1>
      <p style={styles.subtitle}>Record your time on a job</p>
      {linkedEmployeeId && scheduleToLog.filter(s => !dismissedSchedule.includes(s.schedule_id)).length > 0 && (
        <div style={{ marginBottom: "18px" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Scheduled Work to Log
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {scheduleToLog.filter(s => !dismissedSchedule.includes(s.schedule_id)).map(s => {
              const d = new Date(s.scheduled_date + "T00:00:00");
              const isToday = s.scheduled_date === new Date().toISOString().split("T")[0];
              const dayLabel = isToday ? "Today" : d.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
              return (
                <div key={s.schedule_id} style={{ backgroundColor: "white", border: `1.5px solid ${theme.gold}`, borderRadius: "12px", padding: "14px 16px", boxShadow: "0 1px 4px rgba(200,151,58,0.12)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: theme.primary, fontFamily: font.display }}>{s.job_name}</div>
                      <div style={{ fontSize: "12px", marginTop: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ color: isToday ? theme.gold : theme.textSecondary, fontWeight: isToday ? "600" : "400" }}>{dayLabel}</span>
                        <span style={{ color: theme.textLight }}>·</span>
                        <span style={{ color: theme.textSecondary }}>{s.scheduled_hours}h scheduled</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button type="button" onClick={() => {
                      setFormData(prev => ({ ...prev, job_id: String(s.job_id), cost_code_id: s.cost_code_id ? String(s.cost_code_id) : prev.cost_code_id, shift_date: s.scheduled_date, hours_worked: String(s.scheduled_hours) }));
                      setDismissedSchedule(prev => [...prev, s.schedule_id]);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }} style={{ flex: 1, padding: "11px", borderRadius: "8px", border: "none", cursor: "pointer", backgroundColor: theme.primary, color: "white", fontWeight: "600", fontFamily: font.body, fontSize: "13px", minHeight: "44px" }}>
                      Fill This In
                    </button>
                    <button type="button" onClick={() => setDismissedSchedule(prev => [...prev, s.schedule_id])} style={{ padding: "11px 16px", borderRadius: "8px", border: `1px solid ${theme.border}`, cursor: "pointer", backgroundColor: "white", color: theme.textSecondary, fontWeight: "500", fontFamily: font.body, fontSize: "13px", minHeight: "44px" }}>
                      Ignore
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
function MaterialsForm({ token, readonly = false, voicePrefill = null, onPrefillConsumed = null, setView = null }) {
  const [formData, setFormData] = useState({ job_id: "", employee_id: "", supplier: "", description: "", total_cost: "", purchase_date: new Date().toISOString().split("T")[0], notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [linkedEmployeeId, setLinkedEmployeeId] = useState(null);
  const [linkedEmployeeName, setLinkedEmployeeName] = useState("");
  const [employees, setEmployees] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [matTab, setMatTab] = useState("store");
  const [invForm, setInvForm] = useState({ job_id: "", inventory_id: "", quantity_requested: "", description: "" });
  const [invErrors, setInvErrors] = useState({});
  const [invSubmitting, setInvSubmitting] = useState(false);
  const [scanJob, setScanJob] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [scanItems, setScanItems] = useState([]);
  const [savingItems, setSavingItems] = useState(false);

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      apiFetch(`${API}/me`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/my-jobs`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/employees`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/inventory`, { headers: h }).then(r => r.json()).catch(() => []),
    ]).then(([me, jobList, emps, inv]) => {
      if (me.employee_id) {
        setLinkedEmployeeId(me.employee_id);
        setFormData(prev => ({ ...prev, employee_id: me.employee_id }));
      }
      setJobs(jobList.filter(j => j.status === "active"));
      setEmployees(emps);
      setInventory(Array.isArray(inv) ? inv : []);
      setLoading(false);
    });
  }, [token]);

  useEffect(() => {
    if (!voicePrefill || voicePrefill.type !== "material") return;
    const today = new Date().toISOString().split("T")[0];
    setFormData(prev => ({
      ...prev,
      job_id: voicePrefill._matchedJobId || prev.job_id,
      description: voicePrefill.description || prev.description,
      total_cost: voicePrefill.amount ? String(voicePrefill.amount) : prev.total_cost,
      purchase_date: today,
      notes: voicePrefill.notes || prev.notes,
    }));
    if (onPrefillConsumed) onPrefillConsumed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voicePrefill]);

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
      <LogBackButton setView={setView} />
      <h1 style={styles.title}>Log Materials</h1>
      <p style={styles.subtitle}>Record a material purchase or inventory pull</p>

      <div style={{ display: "flex", backgroundColor: theme.bg, borderRadius: "10px", padding: "3px", gap: "3px", marginBottom: "16px", border: `1px solid ${theme.border}` }}>
        {[["store", "Store Bought"], ["scan", "Scan Receipt"], ["inventory", "From Inventory"]].map(([id, label]) => (
          <button key={id} type="button" onClick={() => { setMatTab(id); setScanResult(null); setScanError(""); }} style={{ flex: 1, padding: "10px", borderRadius: "7px", border: matTab === id ? `1px solid ${theme.border}` : "none", backgroundColor: matTab === id ? "white" : "transparent", color: matTab === id ? theme.primary : theme.textSecondary, fontFamily: font.body, fontSize: "12px", fontWeight: matTab === id ? "600" : "400", cursor: "pointer" }}>
            {label}
          </button>
        ))}
      </div>

      {matTab === "scan" ? (
        <div style={styles.card}>
          {scanning ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ marginBottom: "16px" }}><Spinner size={32} color={theme.primary} /></div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: theme.primary, fontFamily: font.display }}>Reading your receipt</div>
              <div style={{ fontSize: "13px", color: theme.textSecondary, marginTop: "6px" }}>This takes a few seconds</div>
            </div>
          ) : !scanResult ? (
            <>
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "17px", fontWeight: "700", color: theme.primary, fontFamily: font.display, marginBottom: "4px" }}>Scan a Receipt</div>
                <p style={{ fontSize: "13px", color: theme.textSecondary, lineHeight: 1.55, margin: 0 }}>Take a photo and we'll read the line items for you.</p>
              </div>

              <label style={styles.label}>Which job is this for?</label>
              <select style={{ ...styles.input, marginBottom: "20px", fontSize: "15px" }} value={scanJob} onChange={e => { setScanJob(e.target.value); setScanError(""); }}>
                <option value="">Select a job</option>
                {jobs.map(j => <option key={j.job_id} value={j.job_id}>{j.job_name}</option>)}
              </select>

              <input
                type="file"
                accept="image/*"
                capture="environment"
                id="receipt-input"
                style={{ display: "none" }}
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (!scanJob) { setScanError("Select a job first."); return; }
                  setScanError("");
                  setScanning(true);
                  setScanResult(null);
                  try {
                    const base64 = await new Promise((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(reader.result.split(",")[1]);
                      reader.onerror = reject;
                      reader.readAsDataURL(file);
                    });
                    const params = new URLSearchParams({ job_id: scanJob });
                    const res = await apiFetch(`${API}/receipts/parse?${params}`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                      body: JSON.stringify({ image_base64: base64 })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setScanResult(data);
                      const skipWords = ["deposit", "tax", "hst", "gst", "pst", "subtotal", "total", "change", "cash", "visa", "mastercard", "debit", "credit", "fee", "surcharge", "tip", "gratuity", "balance", "payment", "tender", "refund", "return"];
                      const filtered = data.items.filter(item => {
                        const desc = (item.description || "").toLowerCase();
                        return !skipWords.some(w => desc.includes(w));
                      });
                      setScanItems(filtered.map((item, i) => ({ ...item, id: i, include: true })));
                    } else {
                      setScanError(data.message || "Could not read the receipt. Try again in better lighting.");
                    }
                  } catch {
                    setScanError("Something went wrong. Please try again.");
                  }
                  setScanning(false);
                  e.target.value = "";
                }}
              />

              {scanError && (
                <div style={{ backgroundColor: theme.dangerLight, border: `1px solid ${theme.danger}`, borderRadius: "8px", padding: "10px 14px", marginBottom: "14px" }}>
                  <p style={{ fontSize: "13px", color: theme.danger, margin: 0, fontWeight: "600" }}>{scanError}</p>
                </div>
              )}

              {scanJob ? (
                <label htmlFor="receipt-input" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "18px 20px", backgroundColor: theme.primary, color: "white", borderRadius: "12px", cursor: "pointer", fontSize: "16px", fontWeight: "700", fontFamily: font.body }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  Take Receipt Photo
                </label>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "32px 20px", backgroundColor: theme.bg, borderRadius: "12px", border: `1.5px dashed ${theme.border}` }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.textLight} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  <span style={{ fontSize: "13px", color: theme.textLight, fontFamily: font.body, textAlign: "center", lineHeight: 1.5 }}>Select a job above, then tap here to photograph your receipt</span>
                </div>
              )}

              <p style={{ fontSize: "12px", color: theme.textLight, textAlign: "center", marginTop: "12px", marginBottom: 0 }}>Best results in good lighting with the receipt flat</p>
            </>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "17px", fontWeight: "700", color: theme.primary, fontFamily: font.display }}>{scanResult.vendor || "Receipt scanned"}</div>
                  <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "3px" }}>
                    {jobs.find(j => String(j.job_id) === scanJob)?.job_name || ""}
                  </div>
                </div>
                <button onClick={() => { setScanResult(null); setScanItems([]); setScanError(""); }} style={{ fontSize: "12px", color: theme.accent, background: "none", border: `1px solid ${theme.accent}`, borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontWeight: "600", fontFamily: font.body, whiteSpace: "nowrap", flexShrink: 0, marginLeft: "12px" }}>Retake</button>
              </div>

              <div style={{ backgroundColor: theme.accentLight, border: `1px solid ${theme.accent}`, borderRadius: "8px", padding: "10px 14px", marginBottom: "16px" }}>
                <p style={{ fontSize: "12px", color: theme.accent, margin: 0, fontWeight: "600" }}>Review each item before saving. Uncheck anything that should not be logged as a material.</p>
              </div>

              {scanItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "28px 20px", backgroundColor: theme.bg, borderRadius: "12px", marginBottom: "14px" }}>
                  <p style={{ fontSize: "14px", color: theme.textSecondary, margin: "0 0 14px", lineHeight: 1.55 }}>No material items found after filtering tax and payment lines.</p>
                  <button onClick={() => { setScanResult(null); setScanItems([]); }} style={{ fontSize: "13px", color: theme.accent, background: "none", border: `1px solid ${theme.accent}`, borderRadius: "8px", padding: "8px 18px", cursor: "pointer", fontWeight: "600", fontFamily: font.body }}>Try Again</button>
                </div>
              ) : (
                <div style={{ borderRadius: "10px", border: `1px solid ${theme.border}`, overflow: "hidden", marginBottom: "14px" }}>
                  {scanItems.map((item, i) => (
                    <div key={item.id} style={{ backgroundColor: item.include ? "white" : theme.bg, borderBottom: i < scanItems.length - 1 ? `1px solid ${theme.border}` : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px" }}>
                        <input
                          type="checkbox"
                          checked={item.include}
                          onChange={e => setScanItems(prev => prev.map((x, j) => j === i ? { ...x, include: e.target.checked } : x))}
                          style={{ width: "18px", height: "18px", flexShrink: 0, accentColor: theme.primary, cursor: "pointer" }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "14px", fontWeight: "600", color: item.include ? theme.textPrimary : theme.textLight, textDecoration: item.include ? "none" : "line-through", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.description}</div>
                          {item.include && (
                            <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "2px" }}>qty {item.quantity}</div>
                          )}
                        </div>
                        <div style={{ fontSize: "16px", fontWeight: "700", color: item.include ? theme.primary : theme.textLight, flexShrink: 0 }}>${parseFloat(item.line_total || 0).toFixed(2)}</div>
                      </div>
                      {item.include && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", padding: "0 16px 14px 46px" }}>
                          <input
                            value={item.description}
                            onChange={e => setScanItems(prev => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                            style={{ ...styles.input, marginTop: 0, fontSize: "13px" }}
                            placeholder="Edit description"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={item.line_total}
                            onChange={e => setScanItems(prev => prev.map((x, j) => j === i ? { ...x, line_total: e.target.value } : x))}
                            style={{ ...styles.input, marginTop: 0, width: "80px", fontSize: "13px", textAlign: "right" }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", backgroundColor: theme.bg, borderTop: `1px solid ${theme.border}` }}>
                    <span style={{ fontSize: "13px", color: theme.textSecondary, fontWeight: "500" }}>
                      {scanItems.filter(x => x.include).length} item{scanItems.filter(x => x.include).length !== 1 ? "s" : ""} selected
                    </span>
                    <span style={{ fontSize: "16px", fontWeight: "800", color: theme.primary }}>
                      ${scanItems.filter(x => x.include).reduce((s, x) => s + parseFloat(x.line_total || 0), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {scanError && (
                <div style={{ backgroundColor: theme.dangerLight, border: `1px solid ${theme.danger}`, borderRadius: "8px", padding: "10px 14px", marginBottom: "14px" }}>
                  <p style={{ fontSize: "13px", color: theme.danger, margin: 0, fontWeight: "600" }}>{scanError}</p>
                </div>
              )}

              {scanItems.filter(x => x.include).length > 0 && (
                <button
                  disabled={savingItems}
                  onClick={async () => {
                    const toSave = scanItems.filter(x => x.include);
                    setSavingItems(true);
                    setScanError("");
                    const h = { Authorization: `Bearer ${token}` };
                    const today = new Date().toISOString().split("T")[0];
                    let failed = 0;
                    for (const item of toSave) {
                      const params = new URLSearchParams({
                        job_id: scanJob,
                        description: item.description,
                        total_cost: item.line_total,
                        purchase_date: today,
                      });
                      if (scanResult.vendor) params.append("supplier", scanResult.vendor);
                      if (linkedEmployeeId) params.append("purchased_by", linkedEmployeeId);
                      const res = await apiFetch(`${API}/materials?${params}`, { method: "POST", headers: h });
                      if (!res.ok) failed++;
                    }
                    setSavingItems(false);
                    if (failed === 0) {
                      setScanResult(null);
                      setScanItems([]);
                      setScanJob("");
                      setMatTab("store");
                      setSubmitted(true);
                    } else {
                      setScanError(`${failed} item${failed !== 1 ? "s" : ""} failed to save. Please try again.`);
                    }
                  }}
                  style={{ ...styles.button, marginTop: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: savingItems ? 0.75 : 1 }}
                >
                  {savingItems ? <><Spinner /> Saving...</> : `Save ${scanItems.filter(x => x.include).length} Item${scanItems.filter(x => x.include).length !== 1 ? "s" : ""}`}
                </button>
              )}
            </>
          )}
        </div>
      ) : matTab === "inventory" ? (
        <div style={styles.card}>
          <div style={{ fontSize: "14px", fontWeight: "700", color: theme.primary, marginBottom: "14px" }}>Pull from Inventory</div>
          {linkedEmployeeId && <IdentityBadge name={linkedEmployeeName} />}
          <label style={styles.label}>Job</label>
          <select style={invErrors.job_id ? styles.inputError : styles.input} value={invForm.job_id} onChange={e => { setInvForm({...invForm, job_id: e.target.value}); setInvErrors({...invErrors, job_id: ""}); }}>
            <option value="">Select job</option>
            {jobs.map(j => <option key={j.job_id} value={j.job_id}>{j.job_name}</option>)}
          </select>
          {invErrors.job_id && <p style={styles.errorMsg}>{invErrors.job_id}</p>}
          <label style={styles.label}>Item</label>
          <select style={invErrors.inventory_id ? styles.inputError : styles.input} value={invForm.inventory_id} onChange={e => { setInvForm({...invForm, inventory_id: e.target.value}); setInvErrors({...invErrors, inventory_id: ""}); }}>
            <option value="">Select item</option>
            {inventory.map(i => <option key={i.inventory_id} value={i.inventory_id}>{i.name} ({parseFloat(i.quantity || 0)} {i.unit} available)</option>)}
          </select>
          {invErrors.inventory_id && <p style={styles.errorMsg}>{invErrors.inventory_id}</p>}
          <label style={styles.label}>Quantity Needed</label>
          <input style={invErrors.quantity_requested ? styles.inputError : styles.input} type="number" step="0.01" placeholder="0" value={invForm.quantity_requested} onChange={e => { setInvForm({...invForm, quantity_requested: e.target.value}); setInvErrors({...invErrors, quantity_requested: ""}); }} />
          {invErrors.quantity_requested && <p style={styles.errorMsg}>{invErrors.quantity_requested}</p>}
          <label style={styles.label}>Notes (optional)</label>
          <textarea style={styles.textarea} placeholder="What is this for?" value={invForm.description} onChange={e => setInvForm({...invForm, description: e.target.value})} />
          <button style={{ ...styles.button, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }} type="button" onClick={async () => {
            const e = {};
            if (!invForm.job_id) e.job_id = "Select a job";
            if (!invForm.inventory_id) e.inventory_id = "Select an item";
            if (!invForm.quantity_requested || parseFloat(invForm.quantity_requested) <= 0) e.quantity_requested = "Enter quantity";
            setInvErrors(e);
            if (Object.keys(e).length > 0) return;
            setInvSubmitting(true);
            const params = new URLSearchParams({ job_id: invForm.job_id, request_type: "Inventory Pull", inventory_id: invForm.inventory_id, quantity_requested: invForm.quantity_requested });
            if (invForm.description) params.append("description", invForm.description);
            const res = await apiFetch(`${API}/requests?${params}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
            setInvSubmitting(false);
            if (res.ok) { setInvForm({ job_id: "", inventory_id: "", quantity_requested: "", description: "" }); setMatTab("store"); }
          }} disabled={invSubmitting}>
            {invSubmitting ? <><Spinner /> Submitting...</> : "Request from Inventory"}
          </button>
          <p style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "10px", textAlign: "center" }}>Your request will be sent to the admin for approval.</p>
        </div>
      ) : (
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
      )}
      <EntryHistory token={token} type="material" linkedEmployeeId={linkedEmployeeId} jobs={jobs} employees={employees} costCodes={[]} />
    </div>
  );
}

// ─── MILEAGE ──────────────────────────────────────────────────
function MileageForm({ token, readonly = false, voicePrefill = null, onPrefillConsumed = null, setView = null }) {
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
    if (!voicePrefill || voicePrefill.type !== "mileage") return;
    const today = new Date().toISOString().split("T")[0];
    setFormData(prev => ({
      ...prev,
      job_id: voicePrefill._matchedJobId || prev.job_id,
      km_driven: voicePrefill.km ? String(voicePrefill.km) : prev.km_driven,
      trip_date: today,
      purpose: voicePrefill.notes || prev.purpose,
    }));
    if (onPrefillConsumed) onPrefillConsumed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voicePrefill]);

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
      <LogBackButton setView={setView} />
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
function UserManagement({ token, activeEmps, refreshSignal }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editEmpId, setEditEmpId] = useState("");
  const [message, setMessage] = useState("");

  function loadUsers() {
    setLoading(true);
    apiFetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => { setUsers(data); setLoading(false); setLoaded(true); });
  }

  useEffect(() => { if (refreshSignal > 0) loadUsers(); }, [refreshSignal]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div style={{ marginTop: "18px", paddingTop: "18px", borderTop: `1px solid ${theme.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: "700", color: theme.primary }}>Existing Logins</div>
          <p style={{ fontSize: "12px", color: theme.textSecondary, margin: "2px 0 0" }}>See who has access and which crew member they're linked to.</p>
        </div>
        <button onClick={loadUsers} style={{ fontSize: "12px", padding: "7px 14px", borderRadius: "7px", border: `1px solid ${theme.accent}`, cursor: "pointer", backgroundColor: "white", color: theme.accent, fontWeight: "600", fontFamily: font.body, whiteSpace: "nowrap", flexShrink: 0 }}>
          {loaded ? "Refresh" : "Show Logins"}
        </button>
      </div>
      {loading && <p style={{ fontSize: "13px", color: theme.textSecondary }}>Loading...</p>}
      {message && <div style={{ color: theme.accent, fontWeight: "600", marginBottom: "10px", backgroundColor: theme.accentLight, padding: "9px 12px", borderRadius: "7px", fontSize: "13px" }}>{message}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {users.map(u => (
        <div key={u.user_id} style={{ padding: "12px 13px", backgroundColor: theme.bg, borderRadius: "8px", border: `1px solid ${theme.border}` }}>
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
      </div>
    </div>
  );
}

// ─── INVENTORY SCREEN ─────────────────────────────────────────
function InventoryScreen({ token, readonly = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", unit: "each", quantity: "", purchase_price: "", charge_out_price: "", notes: "" });
  const [editForm, setEditForm] = useState({});
  const [errors, setErrors] = useState({});

  const UNITS = ["each", "box", "roll", "litre", "kg", "metre", "sheet", "bag", "pail", "tube"];

  function showMsg(msg) { setMessage(msg); setTimeout(() => setMessage(""), 3000); }

  function loadItems() {
    apiFetch(`${API}/inventory`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => { setItems(Array.isArray(data) ? data : []); setLoading(false); });
  }

  useEffect(() => { loadItems(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.unit) e.unit = "Unit is required";
    if (form.quantity !== "" && parseFloat(form.quantity) < 0) e.quantity = "Cannot be negative";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleAdd() {
    if (!validate()) return;
    setSubmitting(true);
    const params = new URLSearchParams({ name: form.name, unit: form.unit });
    if (form.quantity) params.append("quantity", form.quantity);
    if (form.purchase_price) params.append("purchase_price", form.purchase_price);
    if (form.charge_out_price) params.append("charge_out_price", form.charge_out_price);
    if (form.notes) params.append("notes", form.notes);
    const res = await apiFetch(`${API}/inventory?${params}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    setSubmitting(false);
    if (res.ok) { showMsg("Item added."); setForm({ name: "", unit: "each", quantity: "", purchase_price: "", charge_out_price: "", notes: "" }); setShowForm(false); loadItems(); }
    else showMsg("Failed to add item.");
  }

  async function handleUpdate(id) {
    const params = new URLSearchParams();
    if (editForm.name) params.append("name", editForm.name);
    if (editForm.unit) params.append("unit", editForm.unit);
    if (editForm.quantity !== "") params.append("quantity", editForm.quantity);
    if (editForm.purchase_price !== "") params.append("purchase_price", editForm.purchase_price);
    if (editForm.charge_out_price !== "") params.append("charge_out_price", editForm.charge_out_price);
    const res = await apiFetch(`${API}/inventory/${id}?${params}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { showMsg("Item updated."); setEditingId(null); loadItems(); }
    else showMsg("Failed to update.");
  }

  async function handleRemove(id, name) {
    if (!window.confirm(`Remove ${name} from inventory?`)) return;
    const res = await apiFetch(`${API}/inventory/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { showMsg("Item removed."); loadItems(); }
  }

  const totalValue = items.reduce((s, i) => s + (parseFloat(i.quantity || 0) * parseFloat(i.purchase_price || 0)), 0);
  const totalChargeOut = items.reduce((s, i) => s + (parseFloat(i.quantity || 0) * parseFloat(i.charge_out_price || 0)), 0);

  return (
    <div style={styles.containerWide}>
      <h1 style={styles.title}>Inventory</h1>
      <p style={styles.subtitle}>Track materials and supplies on hand</p>

      {message && <div style={{ color: theme.accent, fontWeight: "600", marginBottom: "14px", backgroundColor: theme.accentLight, padding: "11px 14px", borderRadius: "8px", fontSize: "13px", border: `1px solid ${theme.accent}` }}>{message}</div>}

      {items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
          <div style={{ ...styles.card, padding: "16px 18px" }}>
            <div style={{ fontSize: "11px", fontWeight: "600", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>Stock Value</div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: theme.primary, fontFamily: font.display }}>${fmt(totalValue)}</div>
            <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "2px" }}>at purchase price</div>
          </div>
          <div style={{ ...styles.card, padding: "16px 18px" }}>
            <div style={{ fontSize: "11px", fontWeight: "600", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>Charge-Out Value</div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: theme.accent, fontFamily: font.display }}>${fmt(totalChargeOut)}</div>
            <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "2px" }}>billable to clients</div>
          </div>
        </div>
      )}

      {!showForm ? (
        <button onClick={() => setShowForm(true)} style={{ ...styles.button, marginTop: 0, marginBottom: "16px", backgroundColor: theme.accent, width: "100%" }}>
          + Add Item
        </button>
      ) : (
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <button onClick={() => setShowForm(false)} style={{ ...styles.button, marginTop: 0, flex: 1, backgroundColor: "#888" }}>Cancel</button>
        </div>
      )}

      {showForm && (
        <div style={{ ...styles.card, marginBottom: "20px" }}>
          <div style={{ fontSize: "14px", fontWeight: "700", color: theme.primary, marginBottom: "14px" }}>New Inventory Item</div>
          <label style={styles.label}>Item Name</label>
          <input style={errors.name ? styles.inputError : styles.input} placeholder="e.g. 2x4 Lumber, Drywall Screws" value={form.name} onChange={e => { setForm({...form, name: e.target.value}); setErrors({...errors, name: ""}); }} />
          {errors.name && <p style={styles.errorMsg}>{errors.name}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={styles.label}>Unit</label>
              <select style={styles.input} value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Qty on Hand</label>
              <input style={styles.input} type="number" step="0.01" placeholder="0" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
            </div>
            <div>
              <label style={styles.label}>Purchase Price</label>
              <input style={styles.input} type="number" step="0.01" placeholder="$0.00" value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} />
            </div>
            <div>
              <label style={styles.label}>Charge-Out Price</label>
              <input style={styles.input} type="number" step="0.01" placeholder="$0.00" value={form.charge_out_price} onChange={e => setForm({...form, charge_out_price: e.target.value})} />
            </div>
          </div>
          <label style={styles.label}>Notes (optional)</label>
          <textarea style={styles.textarea} placeholder="Location, specs, supplier..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={{ ...styles.button, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }} onClick={handleAdd} disabled={submitting}>
              {submitting ? <><Spinner /> Adding...</> : "Add to Inventory"}
            </button>
            <button style={{ ...styles.button, flex: 1, backgroundColor: "#888" }} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div>{[1,2,3].map(i => <div key={i} style={{ marginBottom: "10px" }}><Skeleton width="100%" height="80px" radius="10px" /></div>)}</div>
      ) : items.length === 0 ? (
        <div style={{ ...styles.card, textAlign: "center", padding: "32px 22px" }}>
          <p style={{ fontSize: "14px", color: theme.textSecondary, margin: "0 0 16px" }}>No inventory items yet.</p>
          <button onClick={() => setShowForm(true)} style={{ ...styles.button, marginTop: 0, backgroundColor: theme.accent, padding: "11px 24px", display: "inline-block", width: "auto" }}>Add First Item</button>
        </div>
      ) : (
        <div style={{ ...styles.card, padding: "0" }}>
          {items.map((item, i) => {
            const isEditing = editingId === item.inventory_id;
            const margin = item.charge_out_price && item.purchase_price ? ((parseFloat(item.charge_out_price) - parseFloat(item.purchase_price)) / parseFloat(item.charge_out_price) * 100).toFixed(0) : null;
            const lowStock = parseFloat(item.quantity || 0) <= 2;
            return (
              <div key={item.inventory_id} style={{ borderBottom: i < items.length - 1 ? `1px solid ${theme.border}` : "none" }}>
                {!isEditing ? (
                  <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                        <div style={{ fontSize: "14px", fontWeight: "600", color: theme.textPrimary }}>{item.name}</div>
                        {lowStock && <span style={{ fontSize: "10px", backgroundColor: theme.dangerLight, color: theme.danger, padding: "2px 7px", borderRadius: "10px", fontWeight: "600" }}>Low Stock</span>}
                      </div>
                      <div style={{ fontSize: "12px", color: theme.textSecondary, display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: "700", color: parseFloat(item.quantity || 0) === 0 ? theme.danger : theme.primary }}>{parseFloat(item.quantity || 0)} {item.unit}</span>
                        {item.purchase_price && <span>Cost: ${fmt(item.purchase_price)}</span>}
                        {item.charge_out_price && <span style={{ color: theme.accent }}>Bill: ${fmt(item.charge_out_price)}</span>}
                        {margin && <span style={{ color: theme.gold }}>Margin: {margin}%</span>}
                      </div>
                      {item.notes && <div style={{ fontSize: "11px", color: theme.textLight, marginTop: "3px", fontStyle: "italic" }}>{item.notes}</div>}
                    </div>
                    <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                      <button onClick={() => { setEditingId(item.inventory_id); setEditForm({ name: item.name, unit: item.unit, quantity: String(item.quantity || 0), purchase_price: String(item.purchase_price || ""), charge_out_price: String(item.charge_out_price || "") }); }} style={{ fontSize: "11px", padding: "5px 10px", borderRadius: "5px", border: "none", cursor: "pointer", backgroundColor: theme.accentLight, color: theme.accent, fontWeight: "600", fontFamily: font.body }}>Edit</button>
                      <button onClick={() => handleRemove(item.inventory_id, item.name)} style={{ fontSize: "11px", padding: "5px 10px", borderRadius: "5px", border: "none", cursor: "pointer", backgroundColor: theme.dangerLight, color: theme.danger, fontWeight: "600", fontFamily: font.body }}>Remove</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "14px 16px", backgroundColor: theme.bg }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                      <div><label style={styles.label}>Name</label><input style={{...styles.input, marginTop: "4px"}} value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></div>
                      <div><label style={styles.label}>Unit</label><select style={{...styles.input, marginTop: "4px"}} value={editForm.unit} onChange={e => setEditForm({...editForm, unit: e.target.value})}>{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                      <div><label style={styles.label}>Qty on Hand</label><input style={{...styles.input, marginTop: "4px"}} type="number" step="0.01" value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: e.target.value})} /></div>
                      <div><label style={styles.label}>Purchase Price</label><input style={{...styles.input, marginTop: "4px"}} type="number" step="0.01" value={editForm.purchase_price} onChange={e => setEditForm({...editForm, purchase_price: e.target.value})} /></div>
                      <div><label style={styles.label}>Charge-Out Price</label><input style={{...styles.input, marginTop: "4px"}} type="number" step="0.01" value={editForm.charge_out_price} onChange={e => setEditForm({...editForm, charge_out_price: e.target.value})} /></div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => handleUpdate(item.inventory_id)} style={{ ...styles.button, marginTop: 0, flex: 1, padding: "11px" }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{ ...styles.button, marginTop: 0, flex: 1, padding: "11px", backgroundColor: "#888" }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TIME AGO HELPER ──────────────────────────────────────────
function timeAgo(dateStr) {
  const then = new Date(dateStr.replace(" ", "T"));
  if (isNaN(then.getTime())) return "";
  const secs = Math.floor((Date.now() - then.getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

// ─── REQUEST THREAD (shared chat) ─────────────────────────────
function RequestThread({ token, requestId, onActivity }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  function load() {
    apiFetch(`${API}/requests/${requestId}/comments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => { setComments(Array.isArray(data) ? data : []); setLoading(false); });
  }

  useEffect(() => { load(); }, [requestId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function send() {
    const msg = draft.trim();
    if (!msg) return;
    setSending(true);
    const params = new URLSearchParams({ message: msg });
    const res = await apiFetch(`${API}/requests/${requestId}/comments?${params}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    setSending(false);
    if (res.ok) { setDraft(""); load(); if (onActivity) onActivity(); }
  }

  return (
    <div style={{ marginTop: "12px", paddingTop: "14px", borderTop: `1px solid ${theme.border}` }}>
      <div style={{ fontSize: "11px", fontWeight: "600", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "7px" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Discussion{comments.length > 0 ? ` (${comments.length})` : ""}
      </div>
      {loading ? (
        <div style={{ fontSize: "12px", color: theme.textLight, padding: "4px 0" }}>Loading...</div>
      ) : comments.length === 0 ? (
        <div style={{ fontSize: "12px", color: theme.textLight, padding: "4px 0 10px", fontStyle: "italic" }}>No messages yet. Start the conversation below.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px", maxHeight: "320px", overflowY: "auto", paddingRight: "2px" }}>
          {comments.map(c => (
            <div key={c.comment_id} style={{ display: "flex", flexDirection: "column", alignItems: c.is_mine ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "82%", backgroundColor: c.is_mine ? theme.primary : "white", color: c.is_mine ? "white" : theme.textPrimary, padding: "9px 13px", borderRadius: c.is_mine ? "13px 13px 4px 13px" : "13px 13px 13px 4px", border: c.is_mine ? "none" : `1px solid ${theme.border}`, boxShadow: theme.shadowSm }}>
                {!c.is_mine && (
                  <div style={{ fontSize: "10px", fontWeight: "700", color: c.role === "crew" ? theme.gold : theme.accent, marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    {c.author}{c.role === "owner" || c.role === "admin" ? " · Admin" : ""}
                  </div>
                )}
                <div style={{ fontSize: "13.5px", lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{c.message}</div>
              </div>
              <div style={{ fontSize: "10px", color: theme.textLight, marginTop: "3px", padding: "0 4px" }}>{timeAgo(c.created_at)}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Write a message..."
          rows={1}
          style={{ flex: 1, padding: "10px 13px", fontSize: "14px", borderRadius: "10px", border: `1.5px solid ${theme.border}`, fontFamily: font.body, resize: "none", outline: "none", backgroundColor: "#fdfdfc", minHeight: "42px", maxHeight: "120px", boxSizing: "border-box" }}
        />
        <button onClick={send} disabled={sending || !draft.trim()} style={{ flexShrink: 0, width: "42px", height: "42px", borderRadius: "10px", border: "none", cursor: draft.trim() ? "pointer" : "not-allowed", backgroundColor: draft.trim() ? theme.primary : theme.border, color: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: draft.trim() ? "0 2px 8px rgba(26,61,43,0.18)" : "none", transition: "all 0.15s" }}>
          {sending ? <Spinner size={15} /> : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
        </button>
      </div>
    </div>
  );
}

// ─── REQUESTS SCREEN (OWNER) ───────────────────────────────────
function RequestsScreen({ token, readonly = false }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [denyingId, setDenyingId] = useState(null);
  const [denialReason, setDenialReason] = useState("");
  const [openThread, setOpenThread] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [viewedMap, setViewedMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem("vl_req_viewed") || "{}"); } catch { return {}; }
  });

  function markViewed(id, activity) {
    const updated = { ...viewedMap, [id]: activity };
    setViewedMap(updated);
    try { localStorage.setItem("vl_req_viewed", JSON.stringify(updated)); } catch {}
  }

  function hasUnread(req) {
    if (!req.comment_count) return false;
    const last = viewedMap[req.request_id];
    if (!last) return true;
    return req.last_activity_at > last;
  }

  function showMsg(msg) { setMessage(msg); setTimeout(() => setMessage(""), 3000); }

  function loadRequests() {
    apiFetch(`${API}/requests`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => { setRequests(Array.isArray(data) ? data : []); setLoading(false); });
  }

  useEffect(() => { loadRequests(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function approve(id) {
    const res = await apiFetch(`${API}/requests/${id}/approve`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { showMsg("Approved."); loadRequests(); }
    else { const d = await res.json(); showMsg(d.detail || "Failed."); }
  }

  async function acknowledge(id) {
    const res = await apiFetch(`${API}/requests/${id}/acknowledge`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { showMsg("Acknowledged."); loadRequests(); }
    else showMsg("Failed.");
  }

  async function deny(id) {
    const params = new URLSearchParams();
    if (denialReason) params.append("denial_reason", denialReason);
    const res = await apiFetch(`${API}/requests/${id}/deny?${params}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { showMsg("Denied."); setDenyingId(null); setDenialReason(""); loadRequests(); }
    else showMsg("Failed.");
  }

  async function saveEdit(id) {
    const params = new URLSearchParams({ description: editDraft });
    const res = await apiFetch(`${API}/requests/${id}/edit?${params}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { setEditingId(null); loadRequests(); }
    else showMsg("Failed to save.");
  }

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const unreadCount = requests.filter(r => hasUnread(r)).length;
  const filtered = requests.filter(r => filter === "all" ? true : r.status === filter);

  const byJob = {};
  filtered.forEach(r => {
    if (!byJob[r.job_name]) byJob[r.job_name] = [];
    byJob[r.job_name].push(r);
  });

  const needsApproval = (type) => ["Additional Materials", "Inventory Pull", "Scope Change"].includes(type);

  const statusStyle = (s) => ({
    color: s === "approved" ? theme.accent : s === "denied" ? theme.danger : s === "acknowledged" ? theme.primary : theme.gold,
    bg: s === "approved" ? theme.accentLight : s === "denied" ? theme.dangerLight : s === "acknowledged" ? theme.accentLight : theme.goldLight,
  });

  return (
    <div style={styles.containerWide}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
        <h1 style={styles.title}>Requests</h1>
        <div style={{ display: "flex", gap: "6px" }}>
          {pendingCount > 0 && <span style={{ backgroundColor: theme.gold, color: "white", fontSize: "11px", fontWeight: "700", padding: "3px 9px", borderRadius: "10px" }}>{pendingCount} pending</span>}
          {unreadCount > 0 && <span style={{ backgroundColor: theme.danger, color: "white", fontSize: "11px", fontWeight: "700", padding: "3px 9px", borderRadius: "10px" }}>{unreadCount} unread</span>}
        </div>
      </div>
      <p style={styles.subtitle}>Review and respond to crew requests</p>

      {message && <div style={{ backgroundColor: theme.accentLight, color: theme.accent, padding: "10px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", marginBottom: "14px", border: `1px solid ${theme.accent}` }}>{message}</div>}

      <div style={{ display: "flex", gap: "6px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[["all", "All"], ["pending", "Pending"], ["approved", "Approved"], ["acknowledged", "Acknowledged"], ["denied", "Denied"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{ padding: "6px 13px", borderRadius: "20px", border: `1.5px solid ${filter === val ? theme.primary : theme.border}`, backgroundColor: filter === val ? theme.primary : "white", color: filter === val ? "white" : theme.textSecondary, fontFamily: font.body, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
            {label}{val === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div>{[1,2,3].map(i => <div key={i} style={{ marginBottom: "10px" }}><Skeleton width="100%" height="90px" radius="10px" /></div>)}</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...styles.card, textAlign: "center", padding: "32px" }}>
          <p style={{ fontSize: "13px", color: theme.textSecondary, margin: 0 }}>No {filter === "all" ? "" : filter} requests.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {Object.entries(byJob).map(([jobName, jobReqs]) => (
            <div key={jobName}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", paddingBottom: "8px", borderBottom: `1px solid ${theme.border}` }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                <span style={{ fontSize: "13px", fontWeight: "700", color: theme.primary }}>{jobName}</span>
                <span style={{ fontSize: "11px", color: theme.textLight }}>({jobReqs.length} request{jobReqs.length !== 1 ? "s" : ""})</span>
              </div>
              <div className="vl-grid2">
                {jobReqs.map(req => {
                  const unread = hasUnread(req);
                  const isOpen = openThread === req.request_id;
                  const ss = statusStyle(req.status);
                  const isEditing = editingId === req.request_id;
                  return (
                    <div key={req.request_id} style={{ backgroundColor: "white", borderRadius: "12px", border: `1px solid ${unread ? theme.gold : theme.border}`, boxShadow: unread ? `0 2px 12px rgba(200,151,58,0.15)` : theme.shadowSm, overflow: "hidden" }}>
                      {/* Card header */}
                      <div style={{ padding: "14px 16px 12px", borderBottom: isOpen ? `1px solid ${theme.border}` : "none" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "14px", fontWeight: "700", color: theme.primary, fontFamily: font.display }}>{req.request_type}</span>
                              <span style={{ fontSize: "10px", fontWeight: "700", backgroundColor: ss.bg, color: ss.color, padding: "2px 8px", borderRadius: "8px", textTransform: "uppercase", letterSpacing: "0.3px" }}>{req.status}</span>
                              {unread && <span style={{ fontSize: "10px", fontWeight: "700", backgroundColor: theme.gold, color: "white", padding: "2px 8px", borderRadius: "8px" }}>NEW</span>}
                            </div>
                            <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "3px" }}>
                              From <strong>{req.employee_name}</strong> · {timeAgo(req.created_at)}
                            </div>
                          </div>
                          {req.status === "pending" && (
                            <button onClick={() => { setEditingId(isEditing ? null : req.request_id); setEditDraft(req.description || ""); }} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", border: `1px solid ${theme.border}`, backgroundColor: "white", color: theme.textSecondary, cursor: "pointer", fontFamily: font.body, fontWeight: "600", flexShrink: 0, marginLeft: "8px" }}>
                              {isEditing ? "Cancel" : "Edit"}
                            </button>
                          )}
                        </div>

                        {isEditing ? (
                          <div style={{ marginTop: "8px" }}>
                            <textarea style={{ ...styles.textarea, minHeight: "60px", marginBottom: "8px" }} value={editDraft} onChange={e => setEditDraft(e.target.value)} />
                            <button onClick={() => saveEdit(req.request_id)} style={{ ...styles.button, marginTop: 0, padding: "9px 18px", fontSize: "13px" }}>Save Changes</button>
                          </div>
                        ) : (
                          req.description && <p style={{ fontSize: "13px", color: theme.textPrimary, margin: "8px 0 0", lineHeight: 1.55 }}>{req.description}</p>
                        )}

                        {req.inventory_item && <div style={{ fontSize: "12px", color: theme.accent, backgroundColor: theme.accentLight, padding: "6px 10px", borderRadius: "7px", marginTop: "8px", fontWeight: "600" }}>Stock request: {req.quantity_requested} {req.inventory_unit} of {req.inventory_item}</div>}
                        {req.denial_reason && <div style={{ fontSize: "12px", color: theme.danger, backgroundColor: theme.dangerLight, padding: "6px 10px", borderRadius: "7px", marginTop: "8px" }}>Denial reason: {req.denial_reason}</div>}

                        {req.participants && req.participants.length > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "10px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "10px", color: theme.textLight, fontWeight: "600" }}>ON THIS JOB:</span>
                            {req.participants.map((p, i) => (
                              <span key={i} style={{ fontSize: "11px", color: theme.textSecondary, backgroundColor: theme.bg, padding: "2px 8px", borderRadius: "8px", border: `1px solid ${theme.border}` }}>{p}</span>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        {req.status === "pending" && !denyingId && (
                          <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                            {needsApproval(req.request_type) && (
                              <button onClick={() => approve(req.request_id)} style={{ flex: 1, padding: "9px", borderRadius: "8px", border: "none", cursor: "pointer", backgroundColor: theme.accent, color: "white", fontWeight: "600", fontFamily: font.body, fontSize: "13px", minHeight: "40px" }}>Approve</button>
                            )}
                            <button onClick={() => acknowledge(req.request_id)} style={{ flex: 1, padding: "9px", borderRadius: "8px", border: `1.5px solid ${theme.primary}`, cursor: "pointer", backgroundColor: "white", color: theme.primary, fontWeight: "600", fontFamily: font.body, fontSize: "13px", minHeight: "40px" }}>Acknowledge</button>
                            <button onClick={() => setDenyingId(req.request_id)} style={{ flex: 1, padding: "9px", borderRadius: "8px", border: "none", cursor: "pointer", backgroundColor: theme.dangerLight, color: theme.danger, fontWeight: "600", fontFamily: font.body, fontSize: "13px", minHeight: "40px" }}>Deny</button>
                          </div>
                        )}
                        {denyingId === req.request_id && (
                          <div style={{ marginTop: "10px" }}>
                            <textarea style={{ ...styles.textarea, minHeight: "56px", marginBottom: "8px" }} placeholder="Reason for denial (optional)" value={denialReason} onChange={e => setDenialReason(e.target.value)} />
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button onClick={() => deny(req.request_id)} style={{ ...styles.button, marginTop: 0, flex: 1, padding: "10px", backgroundColor: theme.danger }}>Confirm Deny</button>
                              <button onClick={() => { setDenyingId(null); setDenialReason(""); }} style={{ ...styles.button, marginTop: 0, flex: 1, padding: "10px", backgroundColor: "#888" }}>Cancel</button>
                            </div>
                          </div>
                        )}

                        {/* Discussion toggle */}
                        <button onClick={() => {
                          const next = isOpen ? null : req.request_id;
                          setOpenThread(next);
                          if (next) markViewed(req.request_id, req.last_activity_at);
                        }} style={{ marginTop: "10px", width: "100%", padding: "9px", borderRadius: "8px", border: `1.5px solid ${unread && !isOpen ? theme.gold : theme.border}`, cursor: "pointer", backgroundColor: unread && !isOpen ? theme.goldLight : theme.bg, color: unread && !isOpen ? theme.gold : theme.textSecondary, fontFamily: font.body, fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          {isOpen ? "Hide discussion" : req.comment_count > 0 ? `Discussion (${req.comment_count} message${req.comment_count !== 1 ? "s" : ""})` : "Start discussion"}
                          {unread && !isOpen && <span style={{ fontSize: "10px", backgroundColor: theme.gold, color: "white", padding: "1px 6px", borderRadius: "6px", fontWeight: "700" }}>NEW</span>}
                        </button>
                      </div>

                      {/* Thread */}
                      {isOpen && (
                        <div style={{ padding: "0 16px 16px", backgroundColor: "#fafaf8" }}>
                          <RequestThread token={token} requestId={req.request_id} onActivity={() => { loadRequests(); markViewed(req.request_id, new Date().toISOString()); }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CREW REQUESTS SCREEN ──────────────────────────────────────
function CrewRequestsScreen({ token, readonly = false }) {
  const [requests, setRequests] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ job_id: "", request_type: "Additional Materials", description: "", inventory_id: "", quantity_requested: "" });
  const [errors, setErrors] = useState({});
  const [openThread, setOpenThread] = useState(null);
  const [tab, setTab] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [viewedMap, setViewedMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem("vl_req_viewed") || "{}"); } catch { return {}; }
  });

  function markViewed(id, activity) {
    const updated = { ...viewedMap, [id]: activity };
    setViewedMap(updated);
    try { localStorage.setItem("vl_req_viewed", JSON.stringify(updated)); } catch {}
  }

  function hasUnread(req) {
    if (!req.comment_count) return false;
    const last = viewedMap[req.request_id];
    if (!last) return true;
    return req.last_activity_at > last;
  }

  const REQUEST_TYPES = ["Additional Materials", "Inventory Pull", "Scope Change", "Equipment Issue", "Safety Concern", "Other"];

  function showMsg(msg) { setMessage(msg); setTimeout(() => setMessage(""), 3000); }

  function loadAll() {
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      apiFetch(`${API}/requests`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/inventory`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/my-jobs`, { headers: h }).then(r => r.json()),
    ]).then(([reqs, inv, jobList]) => {
      setRequests(Array.isArray(reqs) ? reqs : []);
      setInventory(Array.isArray(inv) ? inv : []);
      setJobs(Array.isArray(jobList) ? jobList : []);
      setLoading(false);
    });
  }

  useEffect(() => { loadAll(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  function validate() {
    const e = {};
    if (!form.job_id) e.job_id = "Select a job";
    if (form.request_type === "Inventory Pull" && !form.inventory_id) e.inventory_id = "Select an item";
    if (form.request_type === "Inventory Pull" && (!form.quantity_requested || parseFloat(form.quantity_requested) <= 0)) e.quantity_requested = "Enter quantity";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    const params = new URLSearchParams({ job_id: form.job_id, request_type: form.request_type });
    if (form.description) params.append("description", form.description);
    if (form.request_type === "Inventory Pull" && form.inventory_id) {
      params.append("inventory_id", form.inventory_id);
      params.append("quantity_requested", form.quantity_requested);
    }
    const res = await apiFetch(`${API}/requests?${params}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    setSubmitting(false);
    if (res.ok) {
      showMsg("Request submitted.");
      setForm({ job_id: "", request_type: "Additional Materials", description: "", inventory_id: "", quantity_requested: "" });
      setShowForm(false);
      loadAll();
    } else {
      showMsg("Failed to submit.");
    }
  }

  async function saveEdit(id) {
    const params = new URLSearchParams({ description: editDraft });
    const res = await apiFetch(`${API}/requests/${id}/edit?${params}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { setEditingId(null); loadAll(); }
    else showMsg("Failed to save.");
  }

  const myRequests = requests.filter(r => r.is_mine);
  const teamRequests = requests.filter(r => !r.is_mine);
  const displayRequests = tab === "mine" ? myRequests : tab === "team" ? teamRequests : requests;
  const unreadCount = requests.filter(r => hasUnread(r)).length;

  const byJob = {};
  displayRequests.forEach(r => {
    if (!byJob[r.job_name]) byJob[r.job_name] = [];
    byJob[r.job_name].push(r);
  });

  const statusStyle = (s) => ({
    color: s === "approved" ? theme.accent : s === "denied" ? theme.danger : s === "acknowledged" ? theme.primary : theme.gold,
    bg: s === "approved" ? theme.accentLight : s === "denied" ? theme.dangerLight : s === "acknowledged" ? theme.accentLight : theme.goldLight,
  });

  return (
    <div style={styles.container}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
        <h1 style={styles.title}>Requests</h1>
        {unreadCount > 0 && <span style={{ backgroundColor: theme.danger, color: "white", fontSize: "11px", fontWeight: "700", padding: "3px 9px", borderRadius: "10px" }}>{unreadCount} new</span>}
      </div>
      <p style={styles.subtitle}>Job site requests and team discussion</p>

      {message && <div style={{ backgroundColor: theme.accentLight, color: theme.accent, padding: "10px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", marginBottom: "14px", border: `1px solid ${theme.accent}` }}>{message}</div>}

      {!showForm ? (
        <button onClick={() => !readonly && setShowForm(true)} disabled={readonly} style={{ ...styles.button, marginTop: 0, marginBottom: "16px", backgroundColor: readonly ? theme.textLight : theme.accent, width: "100%", opacity: readonly ? 0.6 : 1 }}>
          {readonly ? "Submissions paused" : "+ New Request"}
        </button>
      ) : (
        <div style={{ ...styles.card, marginBottom: "20px" }}>
          <div style={{ fontSize: "14px", fontWeight: "700", color: theme.primary, marginBottom: "14px" }}>New Request</div>
          <label style={styles.label}>Job</label>
          <select style={errors.job_id ? styles.inputError : styles.input} value={form.job_id} onChange={e => { setForm({...form, job_id: e.target.value}); setErrors({...errors, job_id: ""}); }}>
            <option value="">Select job</option>
            {jobs.map(j => <option key={j.job_id} value={j.job_id}>{j.job_name}</option>)}
          </select>
          {errors.job_id && <p style={styles.errorMsg}>{errors.job_id}</p>}
          <label style={styles.label}>Type</label>
          <select style={styles.input} value={form.request_type} onChange={e => setForm({...form, request_type: e.target.value, inventory_id: "", quantity_requested: ""})}>
            {REQUEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {form.request_type === "Inventory Pull" && (
            <>
              <label style={styles.label}>Item</label>
              <select style={errors.inventory_id ? styles.inputError : styles.input} value={form.inventory_id} onChange={e => { setForm({...form, inventory_id: e.target.value}); setErrors({...errors, inventory_id: ""}); }}>
                <option value="">Select item</option>
                {inventory.map(i => <option key={i.inventory_id} value={i.inventory_id}>{i.name} ({parseFloat(i.quantity || 0)} {i.unit} available)</option>)}
              </select>
              {errors.inventory_id && <p style={styles.errorMsg}>{errors.inventory_id}</p>}
              <label style={styles.label}>Quantity</label>
              <input style={errors.quantity_requested ? styles.inputError : styles.input} type="number" step="0.01" placeholder="0" value={form.quantity_requested} onChange={e => { setForm({...form, quantity_requested: e.target.value}); setErrors({...errors, quantity_requested: ""}); }} />
              {errors.quantity_requested && <p style={styles.errorMsg}>{errors.quantity_requested}</p>}
            </>
          )}
          <label style={styles.label}>Details</label>
          <textarea style={styles.textarea} placeholder="What do you need or what happened?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={{ ...styles.button, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }} onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><Spinner /> Submitting...</> : "Submit"}
            </button>
            <button style={{ ...styles.button, flex: 1, backgroundColor: "#888" }} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", backgroundColor: theme.bg, borderRadius: "10px", padding: "3px", gap: "3px", marginBottom: "18px", border: `1px solid ${theme.border}` }}>
        {[["all", `All (${requests.length})`], ["mine", `Mine (${myRequests.length})`], ["team", `Team (${teamRequests.length})`]].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} style={{ flex: 1, padding: "9px", borderRadius: "7px", border: tab === id ? `1px solid ${theme.border}` : "none", backgroundColor: tab === id ? "white" : "transparent", color: tab === id ? theme.primary : theme.textSecondary, fontFamily: font.body, fontSize: "12px", fontWeight: tab === id ? "600" : "400", cursor: "pointer" }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div>{[1,2].map(i => <div key={i} style={{ marginBottom: "10px" }}><Skeleton width="100%" height="80px" radius="10px" /></div>)}</div>
      ) : displayRequests.length === 0 ? (
        <div style={{ ...styles.card, textAlign: "center", padding: "32px" }}>
          <p style={{ fontSize: "13px", color: theme.textSecondary, margin: 0 }}>
            {tab === "team" ? "No team requests on your jobs yet." : "No requests yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {Object.entries(byJob).map(([jobName, jobReqs]) => (
            <div key={jobName}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", paddingBottom: "8px", borderBottom: `1px solid ${theme.border}` }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                <span style={{ fontSize: "13px", fontWeight: "700", color: theme.primary }}>{jobName}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {jobReqs.map(req => {
                  const unread = hasUnread(req);
                  const isOpen = openThread === req.request_id;
                  const ss = statusStyle(req.status);
                  const isEditing = editingId === req.request_id;
                  const canEdit = req.is_mine && req.status === "pending";
                  return (
                    <div key={req.request_id} style={{ backgroundColor: "white", borderRadius: "12px", border: `1px solid ${unread ? theme.gold : theme.border}`, boxShadow: unread ? `0 2px 12px rgba(200,151,58,0.15)` : theme.shadowSm, overflow: "hidden" }}>
                      <div style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "14px", fontWeight: "700", color: theme.primary, fontFamily: font.display }}>{req.request_type}</span>
                              <span style={{ fontSize: "10px", fontWeight: "700", backgroundColor: ss.bg, color: ss.color, padding: "2px 8px", borderRadius: "8px", textTransform: "uppercase" }}>{req.status}</span>
                              {!req.is_mine && <span style={{ fontSize: "10px", color: theme.textSecondary, backgroundColor: theme.bg, padding: "2px 8px", borderRadius: "8px", border: `1px solid ${theme.border}` }}>by {req.employee_name}</span>}
                              {unread && <span style={{ fontSize: "10px", fontWeight: "700", backgroundColor: theme.gold, color: "white", padding: "2px 8px", borderRadius: "8px" }}>NEW</span>}
                            </div>
                            <div style={{ fontSize: "11px", color: theme.textLight, marginTop: "3px" }}>{timeAgo(req.last_activity_at)}</div>
                          </div>
                          {canEdit && (
                            <button onClick={() => { setEditingId(isEditing ? null : req.request_id); setEditDraft(req.description || ""); }} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", border: `1px solid ${theme.border}`, backgroundColor: "white", color: theme.textSecondary, cursor: "pointer", fontFamily: font.body, fontWeight: "600", flexShrink: 0, marginLeft: "8px" }}>
                              {isEditing ? "Cancel" : "Edit"}
                            </button>
                          )}
                        </div>

                        {isEditing ? (
                          <div style={{ marginTop: "8px" }}>
                            <textarea style={{ ...styles.textarea, minHeight: "60px", marginBottom: "8px" }} value={editDraft} onChange={e => setEditDraft(e.target.value)} />
                            <button onClick={() => saveEdit(req.request_id)} style={{ ...styles.button, marginTop: 0, padding: "9px 18px", fontSize: "13px" }}>Save</button>
                          </div>
                        ) : (
                          req.description && <p style={{ fontSize: "13px", color: theme.textPrimary, margin: "6px 0 0", lineHeight: 1.55 }}>{req.description}</p>
                        )}

                        {req.inventory_item && <div style={{ fontSize: "12px", color: theme.accent, backgroundColor: theme.accentLight, padding: "6px 10px", borderRadius: "7px", marginTop: "8px", fontWeight: "600" }}>{req.quantity_requested} {req.inventory_unit} of {req.inventory_item}</div>}
                        {req.denial_reason && <div style={{ fontSize: "12px", color: theme.danger, backgroundColor: theme.dangerLight, padding: "6px 10px", borderRadius: "7px", marginTop: "8px" }}>Reason: {req.denial_reason}</div>}

                        <button onClick={() => {
                          const next = isOpen ? null : req.request_id;
                          setOpenThread(next);
                          if (next) markViewed(req.request_id, req.last_activity_at);
                        }} style={{ marginTop: "10px", width: "100%", padding: "9px", borderRadius: "8px", border: `1.5px solid ${unread && !isOpen ? theme.gold : theme.border}`, cursor: "pointer", backgroundColor: unread && !isOpen ? theme.goldLight : theme.bg, color: unread && !isOpen ? theme.gold : theme.textSecondary, fontFamily: font.body, fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          {isOpen ? "Hide discussion" : req.comment_count > 0 ? `Discussion (${req.comment_count})` : "Add a note"}
                          {unread && !isOpen && <span style={{ fontSize: "10px", backgroundColor: theme.gold, color: "white", padding: "1px 6px", borderRadius: "6px", fontWeight: "700" }}>NEW</span>}
                        </button>
                      </div>
                      {isOpen && (
                        <div style={{ borderTop: `1px solid ${theme.border}`, padding: "0 16px 16px", backgroundColor: "#fafaf8" }}>
                          <RequestThread token={token} requestId={req.request_id} onActivity={() => { loadAll(); markViewed(req.request_id, new Date().toISOString()); }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SCHEDULE SCREEN ──────────────────────────────────────────
function ScheduleScreen({ token, readonly = false }) {
  const [tab, setTab] = useState("calendar");
  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [costCodes, setCostCodes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [form, setForm] = useState({
    employee_id: "", job_id: "", cost_code_id: "", scheduled_date: new Date().toISOString().split("T")[0], scheduled_hours: "8", notes: "", color: ""
  });
  const [errors, setErrors] = useState({});
  const [jobFilter, setJobFilter] = useState("all");

  // ── Drag & drop
  const [dragItem, setDragItem] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null);

  // ── Shift templates (stored on the API so they sync across all devices)
  const TEMPLATE_COLORS = ["#1a3d2b", "#2d6a4f", "#c8973a", "#b83232", "#2563eb", "#7c3aed", "#0891b2", "#059669"];
  const [templates, setTemplates] = useState([]);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({ name: "", job_id: "", cost_code_id: "", hours: "8", color: "#1a3d2b", notes: "" });

  useEffect(() => {
    apiFetch(`${API}/shift-templates`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setTemplates(data); })
      .catch(() => {});
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function deleteTemplate(templateId) {
    await apiFetch(`${API}/shift-templates/${templateId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setTemplates(prev => prev.filter(t => t.template_id !== templateId));
  }
  function startEditTemplate(tpl) {
    setEditingTemplate(tpl.template_id);
    setTemplateForm({ name: tpl.name, job_id: String(tpl.job_id), cost_code_id: String(tpl.cost_code_id), hours: String(tpl.hours), color: tpl.color || "#1a3d2b", notes: tpl.notes || "" });
    setShowTemplateForm(true);
  }
  async function handleSaveTemplate() {
    if (!templateForm.name || !templateForm.job_id || !templateForm.cost_code_id) return;
    const h = { Authorization: `Bearer ${token}` };
    const params = new URLSearchParams({ name: templateForm.name, job_id: templateForm.job_id, cost_code_id: templateForm.cost_code_id, hours: templateForm.hours, color: templateForm.color, notes: templateForm.notes || "" });
    if (editingTemplate) {
      const res = await apiFetch(`${API}/shift-templates/${editingTemplate}?${params}`, { method: "PATCH", headers: h });
      if (res.ok) {
        const updated = await res.json();
        setTemplates(prev => prev.map(t => t.template_id === editingTemplate ? updated : t));
      }
    } else {
      const res = await apiFetch(`${API}/shift-templates?${params}`, { method: "POST", headers: h });
      if (res.ok) {
        const created = await res.json();
        setTemplates(prev => [...prev, created]);
      }
    }
    setTemplateForm({ name: "", job_id: "", cost_code_id: "", hours: "8", color: "#1a3d2b", notes: "" });
    setShowTemplateForm(false); setEditingTemplate(null);
  }

  function showMsg(msg) { setMessage(msg); setTimeout(() => setMessage(""), 3000); }

  function getWeekDays(offset) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dow = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dow + (dow === 0 ? -6 : 1) + offset * 7);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }

  const days = getWeekDays(weekOffset);
  const todayStr = new Date().toISOString().split("T")[0];
  const weekLabel = `${days[0].toLocaleDateString("en-CA", { month: "short", day: "numeric" })} to ${days[6].toLocaleDateString("en-CA", { month: "short", day: "numeric" })}`;

  function loadData() {
    setLoading(true);
    const h = { Authorization: `Bearer ${token}` };
    const start = days[0].toISOString().split("T")[0];
    const end = days[6].toISOString().split("T")[0];
    Promise.all([
      apiFetch(`${API}/employees`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/jobs`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/cost-codes`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/schedules?start_date=${start}&end_date=${end}`, { headers: h }).then(r => r.json()),
    ]).then(([emps, jobList, ccs, sched]) => {
      setEmployees(emps.filter(e => e.active));
      setJobs(jobList.filter(j => j.status === "active"));
      setCostCodes(ccs);
      setSchedules(Array.isArray(sched) ? sched : []);
      setLoading(false);
    });
  }

  useEffect(() => { loadData(); }, [weekOffset, token]); // eslint-disable-line react-hooks/exhaustive-deps

  function validate() {
    const e = {};
    if (!form.employee_id) e.employee_id = "Select an employee";
    if (!form.job_id) e.job_id = "Select a job";
    if (!form.cost_code_id) e.cost_code_id = "Select a cost code";
    if (!form.scheduled_date) e.scheduled_date = "Date is required";
    if (!form.scheduled_hours || parseFloat(form.scheduled_hours) <= 0) e.scheduled_hours = "Enter hours";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleAdd() {
    if (!validate()) return;
    setSubmitting(true);
    const params = new URLSearchParams({
      employee_id: form.employee_id,
      job_id: form.job_id,
      cost_code_id: form.cost_code_id,
      scheduled_date: form.scheduled_date,
      scheduled_hours: form.scheduled_hours,
    });
    if (form.notes) params.append("notes", form.notes);
    if (form.color) params.append("color", form.color);
    const res = await apiFetch(`${API}/schedules?${params}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    setSubmitting(false);
    if (res.ok) {
      showMsg("Assignment added.");
      setForm(f => ({ ...f, employee_id: "", job_id: "", cost_code_id: "", notes: "", color: "" }));
      setErrors({});
      setTab("view");
      loadData();
    } else {
      showMsg("Failed to add. Please try again.");
    }
  }

  async function handleDelete(scheduleId) {
    if (!window.confirm("Remove this shift?")) return;
    const res = await apiFetch(`${API}/schedules/${scheduleId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { showMsg("Removed."); loadData(); }
  }

  function quickAdd(dateStr, empId = "") {
    setForm(f => ({ ...f, scheduled_date: dateStr, employee_id: empId !== "" ? empId : f.employee_id }));
    setErrors({});
    setTab("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function dropOnCell(employeeId, dateStr) {
    if (!dragItem || readonly) return;
    const h = { Authorization: `Bearer ${token}` };
    if (dragItem.type === "template") {
      const tpl = dragItem.data;
      if (!tpl.job_id || !tpl.cost_code_id) { showMsg("Template is missing job or cost code."); return; }
      const params = new URLSearchParams({ employee_id: employeeId, job_id: tpl.job_id, cost_code_id: tpl.cost_code_id, scheduled_date: dateStr, scheduled_hours: tpl.hours });
      if (tpl.notes) params.append("notes", tpl.notes);
      if (tpl.color) params.append("color", tpl.color);
      const res = await apiFetch(`${API}/schedules?${params}`, { method: "POST", headers: h });
      if (res.ok) { showMsg("Shift added."); loadData(); } else showMsg("Failed to add shift.");
    } else if (dragItem.type === "assignment") {
      const s = dragItem.data;
      if (String(s.employee_id) === String(employeeId) && s.scheduled_date === dateStr) return;
      const params = new URLSearchParams({ employee_id: employeeId, job_id: s.job_id, cost_code_id: s.cost_code_id, scheduled_date: dateStr, scheduled_hours: s.scheduled_hours });
      if (s.notes) params.append("notes", s.notes);
      if (s.color) params.append("color", s.color);
      await apiFetch(`${API}/schedules/${s.schedule_id}`, { method: "DELETE", headers: h });
      const res = await apiFetch(`${API}/schedules?${params}`, { method: "POST", headers: h });
      if (res.ok) { showMsg("Shift moved."); loadData(); } else showMsg("Failed to move shift.");
    }
    setDragItem(null); setDragOverCell(null);
  }

  // Job → color mapping
  const JOB_PALETTE = ["#1a3d2b", "#c8973a", "#2563eb", "#b83232", "#7c3aed", "#0891b2", "#059669", "#ea580c"];
  const jobColors = {};
  jobs.forEach((j, i) => { jobColors[j.job_id] = JOB_PALETTE[i % JOB_PALETTE.length]; });

  const filteredSchedules = jobFilter === "all" ? schedules : schedules.filter(s => String(s.job_id) === jobFilter);
  const byDate = {};
  filteredSchedules.forEach(s => {
    if (!byDate[s.scheduled_date]) byDate[s.scheduled_date] = [];
    byDate[s.scheduled_date].push(s);
  });
  const weekHours = filteredSchedules.reduce((s, x) => s + Number(x.scheduled_hours || 0), 0);
  const tabBtnStyle = (id) => ({ padding: "9px 18px", borderRadius: "7px", border: tab === id ? `1px solid ${theme.border}` : "none", backgroundColor: tab === id ? "white" : "transparent", color: tab === id ? theme.primary : theme.textSecondary, fontFamily: font.body, fontSize: "13px", fontWeight: tab === id ? "600" : "400", cursor: "pointer", transition: "all 0.15s", boxShadow: tab === id ? theme.shadowSm : "none", whiteSpace: "nowrap" });

  return (
    <div style={{ padding: "24px 28px 110px", fontFamily: font.body, backgroundColor: theme.bg, minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1 style={{ ...styles.title, marginBottom: "3px" }}>Schedule</h1>
          <p style={{ ...styles.subtitle, marginBottom: 0 }}>Drag shift templates onto your crew to schedule the week</p>
        </div>
        <div style={{ display: "inline-flex", backgroundColor: theme.bg, borderRadius: "10px", padding: "3px", gap: "3px", border: `1px solid ${theme.border}`, boxShadow: theme.shadowSm, flexShrink: 0 }}>
          <button onClick={() => setTab("calendar")} style={tabBtnStyle("calendar")}>Calendar</button>
          <button onClick={() => setTab("add")} style={tabBtnStyle("add")}>Add Shift</button>
          <button onClick={() => setTab("templates")} style={tabBtnStyle("templates")}>Templates</button>
        </div>
      </div>

      {message && <div style={{ color: theme.accent, fontWeight: "600", marginBottom: "14px", backgroundColor: theme.accentLight, padding: "11px 14px", borderRadius: "8px", fontSize: "13px", border: `1px solid ${theme.accent}` }}>{message}</div>}

      {/* ── CALENDAR TAB ── */}
      {tab === "calendar" && (
        <>
          {/* Week nav */}
          <div style={{ backgroundColor: "white", borderRadius: "12px", border: `1px solid ${theme.border}`, padding: "12px 16px", marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", boxShadow: theme.shadowSm }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button onClick={() => setWeekOffset(w => w - 1)} style={{ padding: "6px 13px", borderRadius: "8px", border: `1px solid ${theme.border}`, backgroundColor: theme.bg, cursor: "pointer", fontFamily: font.body, fontSize: "16px", color: theme.textPrimary, fontWeight: "700", lineHeight: 1, minHeight: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
              <div style={{ textAlign: "center", minWidth: "180px" }}>
                <div style={{ fontSize: "14px", fontWeight: "700", color: theme.primary, letterSpacing: "-0.2px" }}>{weekLabel}</div>
                <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "2px" }}>
                  {weekHours > 0 ? <span style={{ color: theme.accent, fontWeight: "600" }}>{weekHours}h scheduled</span> : "Nothing scheduled"}
                  {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} style={{ fontSize: "11px", color: theme.gold, background: "none", border: "none", cursor: "pointer", fontWeight: "700", marginLeft: "8px", padding: 0 }}>This week</button>}
                </div>
              </div>
              <button onClick={() => setWeekOffset(w => w + 1)} style={{ padding: "6px 13px", borderRadius: "8px", border: `1px solid ${theme.border}`, backgroundColor: theme.bg, cursor: "pointer", fontFamily: font.body, fontSize: "16px", color: theme.textPrimary, fontWeight: "700", lineHeight: 1, minHeight: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: theme.textLight, fontWeight: "500", marginRight: "2px" }}>Filter:</span>
              <button onClick={() => setJobFilter("all")} style={{ padding: "5px 12px", borderRadius: "20px", border: `1.5px solid ${jobFilter === "all" ? theme.primary : theme.border}`, backgroundColor: jobFilter === "all" ? theme.primary : "white", color: jobFilter === "all" ? "white" : theme.textSecondary, fontFamily: font.body, fontSize: "11px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s" }}>All jobs</button>
              {jobs.map(j => <button key={j.job_id} onClick={() => setJobFilter(String(j.job_id))} style={{ padding: "5px 12px", borderRadius: "20px", border: `1.5px solid ${jobFilter === String(j.job_id) ? jobColors[j.job_id] : theme.border}`, backgroundColor: jobFilter === String(j.job_id) ? jobColors[j.job_id] : "white", color: jobFilter === String(j.job_id) ? "white" : theme.textSecondary, fontFamily: font.body, fontSize: "11px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s" }}>{j.job_name}</button>)}
            </div>
          </div>

          {!isMobile() && templates.length > 0 && (
            <div style={{ fontSize: "12px", color: theme.textLight, marginBottom: "10px" }}>
              💡 Drag a template onto a cell to schedule a shift. Drag an existing shift chip to move it.
            </div>
          )}

          {loading ? <div style={{ textAlign: "center", padding: "40px", color: theme.textLight }}>Loading…</div> : isMobile() ? (
            /* ── MOBILE: vertical day cards ── */
            <div>
              {days.map(day => {
                const ds = day.toISOString().split("T")[0];
                const dayShifts = byDate[ds] || [];
                const isToday = ds === todayStr;
                const dayTotal = dayShifts.reduce((s, x) => s + Number(x.scheduled_hours || 0), 0);
                return (
                  <div key={ds} style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "6px", padding: "0 2px" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                        <span style={{ fontSize: "10px", fontWeight: "700", color: isToday ? theme.gold : theme.textLight, letterSpacing: "0.8px", textTransform: "uppercase" }}>{day.toLocaleDateString("en-CA", { weekday: "short" })}</span>
                        <span style={{ fontSize: "16px", fontWeight: "700", color: isToday ? theme.gold : theme.primary }}>{day.getDate()}</span>
                        {isToday && <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: theme.gold, alignSelf: "center" }} />}
                      </div>
                      {dayTotal > 0 && <span style={{ fontSize: "10px", fontWeight: "700", color: theme.textSecondary }}>{dayTotal}h</span>}
                    </div>
                    {dayShifts.map(s => {
                      const color = s.color || jobColors[s.job_id] || theme.primary;
                      return (
                        <div key={s.schedule_id} style={{ backgroundColor: "white", borderRadius: "10px", padding: "10px 12px", marginBottom: "6px", border: `1.5px solid ${theme.border}`, boxShadow: theme.shadowSm, borderLeft: `4px solid ${color}` }}>
                          <div style={{ fontSize: "13px", fontWeight: "600", color: theme.textPrimary }}>{s.employee_name}</div>
                          <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "2px" }}>{s.job_name}</div>
                          {s.notes && <div style={{ fontSize: "10px", color: theme.textLight, marginTop: "2px", fontStyle: "italic" }}>{s.notes}</div>}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "7px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "700", color: theme.accent, backgroundColor: theme.accentLight, padding: "2px 8px", borderRadius: "8px" }}>{s.scheduled_hours}h</span>
                            {!readonly && <button onClick={() => handleDelete(s.schedule_id)} style={{ fontSize: "11px", color: theme.danger, fontWeight: "600", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: font.body }}>Remove</button>}
                          </div>
                        </div>
                      );
                    })}
                    {!readonly && (
                      <button onClick={() => quickAdd(ds)} style={{ width: "100%", padding: dayShifts.length === 0 ? "16px 8px" : "7px", borderRadius: "10px", border: `1.5px dashed ${theme.borderStrong}`, backgroundColor: "transparent", color: theme.textLight, cursor: "pointer", fontFamily: font.body, fontSize: "12px", fontWeight: "600" }}>+ Add</button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── DESKTOP: drag-and-drop grid ── */
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>

              {/* Template sidebar */}
              {templates.length > 0 && (
                <div style={{ width: "176px", flexShrink: 0 }}>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: "10px", paddingBottom: "8px", borderBottom: `1px solid ${theme.border}` }}>Shift Templates</div>
                  {templates.map(tpl => {
                    const job = jobs.find(j => String(j.job_id) === String(tpl.job_id));
                    const cc = costCodes.find(c => String(c.cost_code_id) === String(tpl.cost_code_id));
                    return (
                      <div
                        key={tpl.template_id}
                        draggable={!readonly}
                        onDragStart={() => setDragItem({ type: "template", data: tpl })}
                        onDragEnd={() => { setDragItem(null); setDragOverCell(null); }}
                        style={{ backgroundColor: tpl.color || theme.primary, color: "white", borderRadius: "8px", padding: "10px 12px", marginBottom: "7px", cursor: readonly ? "default" : "grab", userSelect: "none", opacity: dragItem?.data?.template_id === tpl.template_id ? 0.45 : 1, boxShadow: theme.shadowSm, transition: "opacity 0.15s", lineHeight: 1.3 }}
                      >
                        <div style={{ fontWeight: "700", fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tpl.name}</div>
                        <div style={{ fontSize: "10px", opacity: 0.88, marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job?.job_name || "?"}</div>
                        <div style={{ fontSize: "10px", opacity: 0.75 }}>{cc?.code || "?"} · {tpl.hours}h</div>
                      </div>
                    );
                  })}
                  {!readonly && <button onClick={() => { setTab("templates"); setShowTemplateForm(true); setEditingTemplate(null); setTemplateForm({ name: "", job_id: "", cost_code_id: "", hours: "8", color: "#1a3d2b", notes: "" }); }} style={{ width: "100%", padding: "7px", borderRadius: "8px", border: `1.5px dashed ${theme.border}`, backgroundColor: "transparent", color: theme.textSecondary, cursor: "pointer", fontSize: "11px", fontWeight: "600", fontFamily: font.body }}>+ Template</button>}
                </div>
              )}

              {/* Calendar grid */}
              <div style={{ flex: 1, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <div style={{ minWidth: "600px" }}>
                  {/* Day header row */}
                  <div style={{ display: "grid", gridTemplateColumns: "160px repeat(7, 1fr)", gap: "4px", marginBottom: "4px" }}>
                    <div />
                    {days.map(d => {
                      const ds = d.toISOString().split("T")[0];
                      const isToday = ds === todayStr;
                      return (
                        <div key={ds} style={{ textAlign: "center", padding: "6px 2px 8px" }}>
                          <div style={{ fontSize: "10px", fontWeight: "700", color: isToday ? theme.accent : theme.textLight, textTransform: "uppercase", letterSpacing: "0.6px" }}>
                            {d.toLocaleDateString("en-CA", { weekday: "short" })}
                          </div>
                          <div style={{ fontSize: "14px", fontWeight: isToday ? "800" : "600", color: isToday ? "white" : theme.textPrimary, width: "30px", height: "30px", borderRadius: "50%", backgroundColor: isToday ? theme.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", margin: "3px auto 0" }}>
                            {d.getDate()}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Employee rows */}
                  {employees.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: theme.textLight, fontSize: "13px" }}>No active crew. Add employees in Setup first.</div>
                  ) : employees.map(emp => {
                    const empHours = filteredSchedules.filter(s => s.employee_id === emp.employee_id).reduce((sum, s) => sum + Number(s.scheduled_hours || 0), 0);
                    return (
                      <div key={emp.employee_id} style={{ display: "grid", gridTemplateColumns: "160px repeat(7, 1fr)", gap: "4px", marginBottom: "4px" }}>
                        <div style={{ padding: "6px 10px 6px 4px", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "80px", borderRight: `1px solid ${theme.border}` }}>
                          <div style={{ fontSize: "12px", fontWeight: "700", color: theme.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.first_name} {emp.last_name}</div>
                          <div style={{ fontSize: "10px", color: empHours > 0 ? theme.accent : theme.textLight, marginTop: "2px", fontWeight: empHours > 0 ? "600" : "400" }}>{emp.role || "Crew"}{empHours > 0 ? ` · ${empHours}h` : ""}</div>
                        </div>
                        {days.map(d => {
                          const ds = d.toISOString().split("T")[0];
                          const cellKey = `${emp.employee_id}-${ds}`;
                          const isDragOver = dragOverCell === cellKey;
                          const isToday = ds === todayStr;
                          const cellShifts = (byDate[ds] || []).filter(s => s.employee_id === emp.employee_id);
                          return (
                            <div
                              key={ds}
                              onDragOver={e => { e.preventDefault(); if (dragItem) setDragOverCell(cellKey); }}
                              onDragEnter={e => { e.preventDefault(); if (dragItem) setDragOverCell(cellKey); }}
                              onDragLeave={() => setDragOverCell(prev => prev === cellKey ? null : prev)}
                              onDrop={e => { e.preventDefault(); dropOnCell(emp.employee_id, ds); }}
                              style={{ minHeight: "80px", borderRadius: "6px", padding: "4px", backgroundColor: isDragOver ? theme.accentLight : isToday ? "#f0faf3" : "#fafaf8", border: isDragOver ? `2px solid ${theme.accent}` : isToday ? `1.5px solid rgba(45,106,79,0.2)` : `1px solid ${theme.border}`, transition: "background-color 0.1s, border-color 0.1s", position: "relative" }}
                            >
                              {cellShifts.map(s => {
                                const color = s.color || jobColors[s.job_id] || theme.primary;
                                const job = jobs.find(j => j.job_id === s.job_id);
                                return (
                                  <div
                                    key={s.schedule_id}
                                    draggable={!readonly}
                                    onDragStart={e => { e.stopPropagation(); setDragItem({ type: "assignment", data: s }); }}
                                    onDragEnd={() => { setDragItem(null); setDragOverCell(null); }}
                                    title={`${emp.first_name} · ${job?.job_name} · ${s.scheduled_hours}h${s.notes ? "\n" + s.notes : ""}`}
                                    style={{ backgroundColor: color, color: "white", borderRadius: "5px", padding: "5px 7px", marginBottom: "3px", fontSize: "11px", cursor: readonly ? "default" : "grab", userSelect: "none", opacity: dragItem?.data?.schedule_id === s.schedule_id ? 0.4 : 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "3px", boxShadow: "0 1px 3px rgba(0,0,0,0.18)", lineHeight: 1.3 }}
                                  >
                                    <div>
                                      <div style={{ fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "10.5px" }}>{job?.job_name || "?"}</div>
                                      <div style={{ opacity: 0.85, fontSize: "9.5px", marginTop: "1px" }}>{s.scheduled_hours}h</div>
                                    </div>
                                    {!readonly && <button onClick={e => { e.stopPropagation(); handleDelete(s.schedule_id); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.75)", cursor: "pointer", fontSize: "12px", lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>}
                                  </div>
                                );
                              })}
                              {!readonly && (
                                <button onClick={() => quickAdd(ds, String(emp.employee_id))} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", background: "none", border: "none", cursor: "pointer", color: theme.textLight, fontSize: "14px", padding: "2px 0", opacity: cellShifts.length === 0 ? 0.4 : 0.2, lineHeight: 1 }}>+</button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  {/* No-template hint */}
                  {templates.length === 0 && !readonly && employees.length > 0 && (
                    <div style={{ textAlign: "center", padding: "12px 16px", marginTop: "14px", borderRadius: "10px", backgroundColor: theme.goldLight, border: `1px solid ${theme.gold}`, fontSize: "12px", color: theme.warning }}>
                      <strong>Tip:</strong> Create a Shift Template to enable drag-and-drop.{" "}
                      <button onClick={() => setTab("templates")} style={{ color: theme.accent, fontWeight: "700", background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontFamily: font.body, textDecoration: "underline", padding: 0 }}>Create your first template →</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ADD SHIFT TAB ── */}
      {tab === "add" && (
        <div style={{ maxWidth: "800px" }}>
          {/* Template quick-fill picker */}
          {templates.length > 0 && (
            <div style={{ ...styles.card, marginBottom: "14px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: theme.primary, marginBottom: "10px" }}>Use a template</div>
              <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
                {templates.map(tpl => {
                  const tplJob = jobs.find(j => String(j.job_id) === String(tpl.job_id));
                  const tplCc = costCodes.find(c => String(c.cost_code_id) === String(tpl.cost_code_id));
                  return (
                    <button
                      key={tpl.template_id}
                      onClick={() => setForm(f => ({ ...f, job_id: String(tpl.job_id), cost_code_id: String(tpl.cost_code_id), scheduled_hours: String(tpl.hours), notes: tpl.notes || f.notes, color: tpl.color || "" }))}
                      style={{ flexShrink: 0, backgroundColor: tpl.color || theme.primary, color: "white", borderRadius: "10px", padding: "10px 14px", border: "none", cursor: "pointer", textAlign: "left", minWidth: "130px", maxWidth: "160px" }}
                    >
                      <div style={{ fontWeight: "700", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tpl.name}</div>
                      <div style={{ fontSize: "10px", opacity: 0.9, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tplJob?.job_name || "?"}</div>
                      <div style={{ fontSize: "10px", opacity: 0.75 }}>{tplCc?.code || "?"} · {tpl.hours}h</div>
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: "11px", color: theme.textLight, marginTop: "8px" }}>Tap a template to pre-fill the form below</div>
            </div>
          )}
          <div style={styles.card}>
          <div style={{ fontSize: "14px", fontWeight: "600", color: theme.primary, marginBottom: "14px", fontFamily: font.display }}>New Shift</div>
          <label style={styles.label}>Employee</label>
          <select style={errors.employee_id ? styles.inputError : styles.input} value={form.employee_id} onChange={e => { setForm({...form, employee_id: e.target.value}); setErrors({...errors, employee_id: ""}); }}>
            <option value="">Select employee</option>
            {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
          </select>
          {errors.employee_id && <p style={styles.errorMsg}>{errors.employee_id}</p>}
          <label style={styles.label}>Job</label>
          <select style={errors.job_id ? styles.inputError : styles.input} value={form.job_id} onChange={e => { setForm({...form, job_id: e.target.value}); setErrors({...errors, job_id: ""}); }}>
            <option value="">Select job</option>
            {jobs.map(job => <option key={job.job_id} value={job.job_id}>{job.job_name}</option>)}
          </select>
          {errors.job_id && <p style={styles.errorMsg}>{errors.job_id}</p>}
          <label style={styles.label}>Cost Code</label>
          <select style={errors.cost_code_id ? styles.inputError : styles.input} value={form.cost_code_id} onChange={e => { setForm({...form, cost_code_id: e.target.value}); setErrors({...errors, cost_code_id: ""}); }}>
            <option value="">Select cost code</option>
            {costCodes.map(cc => <option key={cc.cost_code_id} value={cc.cost_code_id}>{cc.code} {cc.description}</option>)}
          </select>
          {errors.cost_code_id && <p style={styles.errorMsg}>{errors.cost_code_id}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={styles.label}>Date</label>
              <input style={errors.scheduled_date ? styles.inputError : styles.input} type="date" value={form.scheduled_date} onChange={e => { setForm({...form, scheduled_date: e.target.value}); setErrors({...errors, scheduled_date: ""}); }} />
              {errors.scheduled_date && <p style={styles.errorMsg}>{errors.scheduled_date}</p>}
            </div>
            <div>
              <label style={styles.label}>Hours</label>
              <input style={errors.scheduled_hours ? styles.inputError : styles.input} type="number" step="0.5" placeholder="8" value={form.scheduled_hours} onChange={e => { setForm({...form, scheduled_hours: e.target.value}); setErrors({...errors, scheduled_hours: ""}); }} />
              {errors.scheduled_hours && <p style={styles.errorMsg}>{errors.scheduled_hours}</p>}
            </div>
          </div>
          <label style={styles.label}>Notes (optional)</label>
          <textarea style={styles.textarea} placeholder="Any details for the crew member" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          <button style={{ ...styles.button, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }} onClick={handleAdd} disabled={submitting || readonly}>
            {submitting ? <><Spinner /> Adding...</> : "Add Shift"}
          </button>
          <button onClick={() => setTab("calendar")} style={{ width: "100%", marginTop: "10px", padding: "12px", borderRadius: "8px", border: `1px solid ${theme.border}`, backgroundColor: "transparent", color: theme.textSecondary, cursor: "pointer", fontFamily: font.body, fontSize: "13px", fontWeight: "500" }}>
            ← Back to Calendar
          </button>
          </div>
        </div>
      )}

      {/* ── TEMPLATES TAB ── */}
      {tab === "templates" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "15px", fontWeight: "700", color: theme.primary }}>Shift Templates</div>
              <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "2px" }}>Drag these from the Calendar view onto any crew member to schedule a shift.</div>
            </div>
            {!showTemplateForm && !readonly && (
              <button onClick={() => { setShowTemplateForm(true); setEditingTemplate(null); setTemplateForm({ name: "", job_id: "", cost_code_id: "", hours: "8", color: "#1a3d2b", notes: "" }); }} style={{ ...styles.button, marginTop: 0, padding: "10px 16px", fontSize: "13px" }}>+ New Template</button>
            )}
          </div>

          {showTemplateForm && (
            <div style={{ ...styles.card, marginBottom: "16px", border: `1.5px solid ${theme.gold}` }}>
              <div style={{ fontSize: "14px", fontWeight: "700", color: theme.primary, marginBottom: "14px" }}>{editingTemplate ? "Edit Template" : "New Template"}</div>
              <label style={styles.label}>Template Name</label>
              <input style={styles.input} value={templateForm.name} onChange={e => setTemplateForm({...templateForm, name: e.target.value})} placeholder='e.g. "8h Framing – Smith House"' />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={styles.label}>Job</label>
                  <select style={styles.input} value={templateForm.job_id} onChange={e => setTemplateForm({...templateForm, job_id: e.target.value})}>
                    <option value="">Select job</option>
                    {jobs.map(j => <option key={j.job_id} value={j.job_id}>{j.job_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Cost Code</label>
                  <select style={styles.input} value={templateForm.cost_code_id} onChange={e => setTemplateForm({...templateForm, cost_code_id: e.target.value})}>
                    <option value="">Select cost code</option>
                    {costCodes.map(cc => <option key={cc.cost_code_id} value={cc.cost_code_id}>{cc.code} {cc.description}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Default Hours</label>
                  <input style={styles.input} type="number" min="0.5" max="24" step="0.5" value={templateForm.hours} onChange={e => setTemplateForm({...templateForm, hours: e.target.value})} />
                </div>
                <div>
                  <label style={styles.label}>Notes (optional)</label>
                  <input style={styles.input} value={templateForm.notes} onChange={e => setTemplateForm({...templateForm, notes: e.target.value})} placeholder="e.g. Bring scaffold tools" />
                </div>
              </div>
              <div style={{ marginTop: "12px" }}>
                <label style={styles.label}>Color</label>
                <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
                  {TEMPLATE_COLORS.map(c => (
                    <button key={c} onClick={() => setTemplateForm({...templateForm, color: c})} style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: c, border: templateForm.color === c ? "3px solid white" : "none", boxShadow: templateForm.color === c ? `0 0 0 2.5px ${c}` : "none", cursor: "pointer", padding: 0, flexShrink: 0 }} />
                  ))}
                </div>
              </div>
              {templateForm.name && (
                <div style={{ marginTop: "14px" }}>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Preview</div>
                  <div style={{ display: "inline-block", backgroundColor: templateForm.color, color: "white", borderRadius: "8px", padding: "9px 12px", minWidth: "130px" }}>
                    <div style={{ fontWeight: "700", fontSize: "12px" }}>{templateForm.name}</div>
                    <div style={{ fontSize: "10px", opacity: 0.88, marginTop: "1px" }}>{jobs.find(j => String(j.job_id) === String(templateForm.job_id))?.job_name || "Job"}</div>
                    <div style={{ fontSize: "10px", opacity: 0.75 }}>{costCodes.find(c => String(c.cost_code_id) === String(templateForm.cost_code_id))?.code || "CC"} · {templateForm.hours}h</div>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                <button onClick={handleSaveTemplate} disabled={!templateForm.name || !templateForm.job_id || !templateForm.cost_code_id} style={{ ...styles.button, marginTop: 0, flex: 1, padding: "12px" }}>{editingTemplate ? "Save Changes" : "Save Template"}</button>
                <button onClick={() => { setShowTemplateForm(false); setEditingTemplate(null); }} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: `1px solid ${theme.border}`, backgroundColor: "white", color: theme.textSecondary, cursor: "pointer", fontFamily: font.body, fontSize: "13px", fontWeight: "500" }}>Cancel</button>
              </div>
            </div>
          )}

          {templates.length === 0 && !showTemplateForm && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: theme.textLight, backgroundColor: "white", borderRadius: "12px", border: `1px dashed ${theme.border}` }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>📋</div>
              <div style={{ fontWeight: "600", color: theme.textPrimary, marginBottom: "6px" }}>No templates yet</div>
              <div style={{ fontSize: "13px" }}>Create a template for a common shift — like "8h Framing on Smith Job" — then drag it onto the calendar grid.</div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
            {templates.map(tpl => {
              const job = jobs.find(j => String(j.job_id) === String(tpl.job_id));
              const cc = costCodes.find(c => String(c.cost_code_id) === String(tpl.cost_code_id));
              return (
                <div key={tpl.template_id} style={{ backgroundColor: "white", borderRadius: "12px", border: `1px solid ${theme.border}`, overflow: "hidden", boxShadow: theme.shadowSm }}>
                  <div style={{ backgroundColor: tpl.color || theme.primary, color: "white", padding: "14px 16px" }}>
                    <div style={{ fontWeight: "700", fontSize: "14px" }}>{tpl.name}</div>
                    <div style={{ fontSize: "11px", opacity: 0.88, marginTop: "2px" }}>{job?.job_name || "Unknown job"}</div>
                    <div style={{ fontSize: "11px", opacity: 0.75 }}>{cc ? `${cc.code} ${cc.description}` : "Unknown cost code"} · {tpl.hours}h</div>
                    {tpl.notes && <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "2px", fontStyle: "italic" }}>{tpl.notes}</div>}
                  </div>
                  {!readonly && (
                    <div style={{ display: "flex", padding: "8px 14px", gap: "14px" }}>
                      <button onClick={() => startEditTemplate(tpl)} style={{ fontSize: "12px", color: theme.accent, fontWeight: "600", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: font.body }}>Edit</button>
                      <button onClick={() => deleteTemplate(tpl.template_id)} style={{ fontSize: "12px", color: theme.danger, fontWeight: "600", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: font.body }}>Delete</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────
// ─── JOB SETUP FLOW ─────────────────────────────────────────────
function JobSetupFlow({ token, employees, costCodes, onDone, onCancel }) {
  const [step, setStep] = useState(1); // 1=job details, 2=assign crew, 3=done
  const [jobForm, setJobForm] = useState({ job_name: "", job_code: "", city: "", contract_value: "", budgeted_hours: "" });
  const [createdJob, setCreatedJob] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [schedAssignments, setSchedAssignments] = useState([{ employee_id: "", cost_code_id: "", scheduled_date: new Date().toISOString().split("T")[0], scheduled_hours: "8" }]);

  const headers = { Authorization: `Bearer ${token}` };

  async function createJob() {
    if (!jobForm.job_name.trim()) { setError("Job name is required"); return; }
    setSaving(true); setError("");
    const res = await apiFetch(`${API}/jobs?${new URLSearchParams(jobForm)}`, { method: "POST", headers });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setCreatedJob(data);
      setStep(2);
    } else {
      setError("Failed to create job. Please try again.");
    }
  }

  async function assignCrew() {
    setSaving(true);
    const valid = schedAssignments.filter(a => a.employee_id && a.cost_code_id && a.scheduled_date);
    for (const a of valid) {
      await apiFetch(`${API}/schedules?${new URLSearchParams({ ...a, job_id: createdJob.job_id })}`, { method: "POST", headers });
    }
    setSaving(false);
    setStep(3);
  }

  const steps = [
    { n: 1, label: "Job Details" },
    { n: 2, label: "Assign Crew" },
    { n: 3, label: "Done" }
  ];

  return (
    <div style={{ ...styles.card, maxWidth: "640px", padding: "28px" }}>
      {/* Stepper */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "28px" }}>
        {steps.map((s, i) => (
          <div key={s.n} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : 0 }}>
            <div style={{ display: "flex", flex: "none", flexDirection: "column", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: step >= s.n ? theme.primary : theme.border, color: step >= s.n ? "white" : theme.textLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", transition: "all 0.2s" }}>
                {step > s.n ? "✓" : s.n}
              </div>
              <span style={{ fontSize: "10px", fontWeight: "600", color: step >= s.n ? theme.primary : theme.textLight, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1, height: "2px", backgroundColor: step > s.n ? theme.primary : theme.border, margin: "0 8px", marginBottom: "18px", transition: "background 0.2s" }} />}
          </div>
        ))}
      </div>

      {/* Step 1: Job Details */}
      {step === 1 && (
        <>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: theme.primary, margin: "0 0 18px", fontFamily: font.display }}>New Job</h3>
          <label style={styles.label}>Job Name *</label>
          <input style={styles.input} placeholder="e.g. Johnson Basement Reno" value={jobForm.job_name} onChange={e => { setJobForm({...jobForm, job_name: e.target.value}); setError(""); }} />
          <label style={styles.label}>Job Code (optional)</label>
          <input style={styles.input} placeholder="e.g. JB-2024-047" value={jobForm.job_code} onChange={e => setJobForm({...jobForm, job_code: e.target.value})} />
          <label style={styles.label}>City</label>
          <input style={styles.input} placeholder="e.g. Burnaby" value={jobForm.city} onChange={e => setJobForm({...jobForm, city: e.target.value})} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={styles.label}>Contract Value ($)</label>
              <input style={styles.input} type="number" placeholder="0.00" value={jobForm.contract_value} onChange={e => setJobForm({...jobForm, contract_value: e.target.value})} />
            </div>
            <div>
              <label style={styles.label}>Budgeted Hours</label>
              <input style={styles.input} type="number" placeholder="0" value={jobForm.budgeted_hours} onChange={e => setJobForm({...jobForm, budgeted_hours: e.target.value})} />
            </div>
          </div>
          {error && <p style={styles.errorMsg}>{error}</p>}
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button onClick={createJob} disabled={saving} style={{ ...styles.button, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {saving ? <><Spinner /> Creating...</> : "Create Job →"}
            </button>
            <button onClick={onCancel} style={{ ...styles.button, flex: 0, padding: "12px 18px", backgroundColor: "#888" }}>Cancel</button>
          </div>
        </>
      )}

      {/* Step 2: Assign Crew */}
      {step === 2 && createdJob && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <div style={{ backgroundColor: theme.accentLight, color: theme.accent, padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "700" }}>✓ Created</div>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: theme.primary, margin: 0, fontFamily: font.display }}>{createdJob.job_name}</h3>
          </div>
          <p style={{ fontSize: "13px", color: theme.textSecondary, marginBottom: "16px" }}>Assign crew to this job. You can always add more from the Schedule screen later.</p>
          {schedAssignments.map((a, idx) => (
            <div key={idx} style={{ backgroundColor: theme.bg, borderRadius: "10px", padding: "14px", marginBottom: "10px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: theme.textSecondary }}>Assignment {idx + 1}</span>
                {schedAssignments.length > 1 && <button onClick={() => setSchedAssignments(prev => prev.filter((_, i) => i !== idx))} style={{ fontSize: "11px", color: theme.danger, background: "none", border: "none", cursor: "pointer", fontFamily: font.body }}>Remove</button>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={styles.label}>Employee</label>
                  <select style={styles.input} value={a.employee_id} onChange={e => setSchedAssignments(prev => prev.map((x, i) => i === idx ? {...x, employee_id: e.target.value} : x))}>
                    <option value="">Select</option>
                    {employees.filter(emp => emp.active).map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Cost Code</label>
                  <select style={styles.input} value={a.cost_code_id} onChange={e => setSchedAssignments(prev => prev.map((x, i) => i === idx ? {...x, cost_code_id: e.target.value} : x))}>
                    <option value="">Select</option>
                    {costCodes.map(cc => <option key={cc.cost_code_id} value={cc.cost_code_id}>{cc.code} {cc.description}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Date</label>
                  <input style={styles.input} type="date" value={a.scheduled_date} onChange={e => setSchedAssignments(prev => prev.map((x, i) => i === idx ? {...x, scheduled_date: e.target.value} : x))} />
                </div>
                <div>
                  <label style={styles.label}>Hours</label>
                  <input style={styles.input} type="number" step="0.5" value={a.scheduled_hours} onChange={e => setSchedAssignments(prev => prev.map((x, i) => i === idx ? {...x, scheduled_hours: e.target.value} : x))} />
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => setSchedAssignments(prev => [...prev, { employee_id: "", cost_code_id: "", scheduled_date: new Date().toISOString().split("T")[0], scheduled_hours: "8" }])} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1.5px dashed ${theme.border}`, backgroundColor: "transparent", color: theme.textSecondary, cursor: "pointer", fontFamily: font.body, fontSize: "13px", fontWeight: "600", marginBottom: "14px" }}>
            + Add Another
          </button>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={assignCrew} disabled={saving} style={{ ...styles.button, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {saving ? <><Spinner /> Saving...</> : "Assign Crew →"}
            </button>
            <button onClick={() => setStep(3)} style={{ ...styles.button, flex: 0, padding: "12px 16px", backgroundColor: theme.textLight, fontSize: "12px" }}>Skip</button>
          </div>
        </>
      )}

      {/* Step 3: Done */}
      {step === 3 && createdJob && (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "50%", backgroundColor: theme.accentLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: theme.primary, margin: "0 0 8px", fontFamily: font.display }}>{createdJob.job_name} is ready</h3>
          <p style={{ fontSize: "13px", color: theme.textSecondary, marginBottom: "24px", lineHeight: 1.6 }}>Job created and crew assigned. Your crew can start logging hours and you'll see it live on the dashboard.</p>
          <button onClick={onDone} style={{ ...styles.button, width: "100%", marginTop: 0 }}>Done</button>
        </div>
      )}
    </div>
  );
}

// ─── SETUP SECTION ──────────────────────────────────────────────
function SetupSection({ number, title, subtitle, complete, completeLabel, children }) {
  const [open, setOpen] = useState(!complete);
  return (
    <div style={{ marginBottom: "10px", borderRadius: "12px", border: `1.5px solid ${complete ? theme.accent : theme.border}`, overflow: "hidden", backgroundColor: "white" }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", backgroundColor: complete ? theme.accentLight : "white" }}>
        <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: complete ? theme.accent : theme.primary, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", flexShrink: 0 }}>
          {complete ? "✓" : number}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "15px", fontWeight: "700", color: theme.primary }}>{title}</div>
          {complete && completeLabel && (
            <div style={{ fontSize: "12px", color: theme.accent, fontWeight: "600", marginTop: "1px" }}>{completeLabel}</div>
          )}
        </div>
        <span style={{ fontSize: "11px", color: theme.textLight, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ padding: "16px", borderTop: `1px solid ${theme.border}` }}>
          {subtitle && <p style={{ fontSize: "13px", color: theme.textSecondary, marginTop: 0, marginBottom: "14px", lineHeight: 1.5 }}>{subtitle}</p>}
          {children}
        </div>
      )}
    </div>
  );
}

function AdminScreen({ token, readonly = false, subTier = null, crewCount = null, tierLimit = null, onPlanPicker = null, onSubRefresh = null }) {
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
  const [showJobFlow, setShowJobFlow] = useState(false);
  const [empForm, setEmpForm] = useState({ first_name: "", last_name: "", role: "", hourly_rate: "", burden_rate: "", worker_type: "employee" });
  const [jobForm, setJobForm] = useState({ job_name: "", job_code: "", city: "", contract_value: "", budgeted_hours: "" });
  const [ccForm, setCcForm] = useState({ code: "", description: "", category: "" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "", confirm_password: "", employee_role: "crew", employee_id: "" });
  const [loginError, setLoginError] = useState("");
  const [userRefresh, setUserRefresh] = useState(0);

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
    // Check tier limit before adding
    if (tierLimit !== null && crewCount !== null && crewCount >= tierLimit) {
      if (onPlanPicker) onPlanPicker();
      return;
    }
    const res = await apiFetch(`${API}/employees?${new URLSearchParams(empForm)}`, { method: "POST", headers });
    if (res.ok) {
      showMsg("Employee added.");
      setEmpForm({ first_name: "", last_name: "", role: "", hourly_rate: "", burden_rate: "", worker_type: "employee" });
      refresh();
      if (onSubRefresh) onSubRefresh();
    } else showMsg("Error adding employee.");
  }

  async function updateEmployee() {
    const res = await apiFetch(`${API}/employees/${editingEmp.employee_id}?${new URLSearchParams(empForm)}`, { method: "PATCH", headers });
    if (res.ok) { showMsg("Employee updated."); setEditingEmp(null); setEmpForm({ first_name: "", last_name: "", role: "", hourly_rate: "", burden_rate: "", worker_type: "employee" }); refresh(); }
    else showMsg("Error updating employee.");
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
    if (res.ok) { showMsg(`Login created for ${loginForm.email}`); setLoginForm({ email: "", password: "", confirm_password: "", employee_role: "crew", employee_id: "" }); setUserRefresh(n => n + 1); }
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
  function startEditJob(job) { setEditingJob(job); setJobForm({ job_name: job.job_name, job_code: job.job_code || "", city: job.city || "", contract_value: job.contract_value || "", budgeted_hours: job.budgeted_hours || "" }); }
  function startEditCc(cc) { setEditingCc(cc); setCcForm({ code: cc.code, description: cc.description, category: cc.category || "" }); }

  async function deleteCostCode(cc) {
    if (!window.confirm(`Delete cost code "${cc.code}"? This only works if it is not used on any job, timesheet, or material.`)) return;
    const res = await apiFetch(`${API}/cost-codes/${cc.cost_code_id}`, { method: "DELETE", headers });
    if (res.ok) {
      showMsg(`Cost code "${cc.code}" deleted.`);
      refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      showMsg(d.detail || "Could not delete this cost code.");
    }
  }

  const activeEmps = employees.filter(e => e.active);
  const inactiveEmps = employees.filter(e => !e.active);
  const activeJobs = jobs.filter(j => j.status === "active");
  const completedJobs = jobs.filter(j => j.status === "completed");
  const inactiveJobs = jobs.filter(j => j.status === "inactive");

  /* Btn and Row moved to module scope */

  return (
    <div style={{ ...styles.container, maxWidth: "720px" }}>
      <h1 style={styles.title}>Setup</h1>
      <p style={styles.subtitle}>Get your jobs and team ready to go</p>

      {message && <div style={{ color: theme.accent, fontWeight: "600", marginBottom: "14px", backgroundColor: theme.accentLight, padding: "11px 14px", borderRadius: "8px", fontSize: "13px", border: `1px solid ${theme.accent}` }}>{message}</div>}

      {showJobFlow ? (
        <JobSetupFlow
          token={token}
          employees={employees}
          costCodes={costCodes}
          onDone={() => { setShowJobFlow(false); refresh(); }}
          onCancel={() => setShowJobFlow(false)}
        />
      ) : (
        <>
          {/* ── STEP 1: JOBS ── */}
          <SetupSection
            number="1"
            title="Jobs"
            subtitle="Add a job and assign your crew. This is what powers the dashboard and tracks your margin."
            complete={activeJobs.length > 0}
            completeLabel={`${activeJobs.length} active job${activeJobs.length !== 1 ? "s" : ""}`}
          >
            {editingJob ? (
              <>
                <p style={{ fontSize: "12px", fontWeight: "600", color: theme.primary, marginBottom: "10px" }}>Editing: {editingJob.job_name}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "8px" }}>
                  <input style={styles.input} placeholder="Job Name" value={jobForm.job_name} onChange={e => setJobForm({...jobForm, job_name: e.target.value})} />
                  <input style={styles.input} placeholder="Job Code (optional)" value={jobForm.job_code || ""} onChange={e => setJobForm({...jobForm, job_code: e.target.value})} />
                  <input style={styles.input} placeholder="City" value={jobForm.city} onChange={e => setJobForm({...jobForm, city: e.target.value})} />
                  <input style={styles.input} placeholder="Contract Value $" type="number" value={jobForm.contract_value} onChange={e => setJobForm({...jobForm, contract_value: e.target.value})} />
                  <input style={styles.input} placeholder="Budgeted Hours" type="number" value={jobForm.budgeted_hours} onChange={e => setJobForm({...jobForm, budgeted_hours: e.target.value})} />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button style={{...styles.button, flex: 1, marginTop: 0}} onClick={updateJob}>Save Changes</button>
                  <button style={{...styles.button, backgroundColor: "#888", flex: 1, marginTop: 0}} onClick={() => { setEditingJob(null); setJobForm({ job_name: "", city: "", contract_value: "", budgeted_hours: "" }); }}>Cancel</button>
                </div>
              </>
            ) : (
              <button onClick={() => setShowJobFlow(true)} style={{ ...styles.button, backgroundColor: theme.accent, marginTop: 0, width: "100%" }}>
                + Add New Job
              </button>
            )}
            {activeJobs.length > 0 && (
              <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <p style={{ fontSize: "11px", color: theme.textSecondary, marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Active</p>
                {activeJobs.map(job => (
                  <Row key={job.job_id}
                    main={job.job_name}
                    sub={`${job.city || ""}${job.contract_value ? ` · $${fmt(job.contract_value)}` : ""}${job.budgeted_hours ? ` · ${job.budgeted_hours}h budgeted` : ""}`}
                    actions={[
                      <Btn key="e" label="Edit" bg={theme.accentLight} color={theme.accent} onClick={() => startEditJob(job)} />,
                      <Btn key="c" label="Complete" bg="#e8f5ee" color={theme.accent} onClick={() => setJobStatus(job, "completed")} />,
                      <Btn key="a" label="Archive" bg={theme.dangerLight} color={theme.danger} onClick={() => setJobStatus(job, "inactive")} />
                    ]}
                  />
                ))}
              </div>
            )}
            {completedJobs.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ fontSize: "11px", color: theme.accent, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Completed</p>
                {completedJobs.map(job => (
                  <Row key={job.job_id} main={job.job_name} actions={[<Btn key="r" label="Reactivate" bg={theme.accentLight} color={theme.accent} onClick={() => setJobStatus(job, "active")} />]} />
                ))}
              </div>
            )}
            {inactiveJobs.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <button onClick={() => setShowInactiveJob(!showInactiveJob)} style={{ fontSize: "12px", color: theme.textSecondary, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  {showInactiveJob ? "Hide" : "Show"} archived ({inactiveJobs.length})
                </button>
                {showInactiveJob && inactiveJobs.map(job => (
                  <Row key={job.job_id} main={job.job_name} actions={[<Btn key="r" label="Restore" bg={theme.accentLight} color={theme.accent} onClick={() => setJobStatus(job, "active")} />]} />
                ))}
              </div>
            )}
          </SetupSection>

          {/* ── STEP 2: CREW ── */}
          <SetupSection
            number="2"
            title="Your Crew"
            subtitle="Add each person who works on your jobs. Set their hourly rate so labour costs are accurate."
            complete={activeEmps.length > 0}
            completeLabel={`${activeEmps.length} crew member${activeEmps.length !== 1 ? "s" : ""} added`}
          >
            {editingEmp ? (
              <>
                <p style={{ fontSize: "12px", fontWeight: "600", color: theme.primary, marginBottom: "10px" }}>Editing: {editingEmp.first_name} {editingEmp.last_name}</p>
              </>
            ) : (
              <p style={{ fontSize: "12px", color: theme.textSecondary, marginBottom: "12px" }}>New crew member</p>
            )}
            {!editingEmp && subTier && crewCount !== null && tierLimit !== null && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: crewCount >= tierLimit ? theme.dangerLight : theme.accentLight, border: `1px solid ${crewCount >= tierLimit ? theme.danger : theme.accent}`, borderRadius: "8px", padding: "9px 14px", marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: crewCount >= tierLimit ? theme.danger : theme.accent }}>
                  {crewCount >= tierLimit ? `Plan limit reached (${crewCount}/${tierLimit} crew)` : `${crewCount} of ${tierLimit} crew slots used`}
                </span>
                {crewCount >= tierLimit && onPlanPicker && (
                  <button onClick={onPlanPicker} style={{ fontSize: "11px", fontWeight: "700", color: "white", backgroundColor: theme.danger, border: "none", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontFamily: font.body }}>Upgrade plan</button>
                )}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "6px" }}>
              <input style={styles.input} placeholder="First Name" value={empForm.first_name} onChange={e => setEmpForm({...empForm, first_name: e.target.value})} />
              <input style={styles.input} placeholder="Last Name" value={empForm.last_name} onChange={e => setEmpForm({...empForm, last_name: e.target.value})} />
              <input style={styles.input} placeholder="Trade / Role" value={empForm.role} onChange={e => setEmpForm({...empForm, role: e.target.value})} />
              <div />
              <input style={styles.input} placeholder="Hourly Rate $" type="number" value={empForm.hourly_rate} onChange={e => setEmpForm({...empForm, hourly_rate: e.target.value})} />
              <input style={styles.input} placeholder="Burden Rate $ (optional)" type="number" value={empForm.burden_rate} onChange={e => setEmpForm({...empForm, burden_rate: e.target.value})} />
            </div>
            <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
              {["employee", "contractor"].map(type => (
                <button key={type} type="button" onClick={() => setEmpForm({...empForm, worker_type: type})} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1.5px solid ${empForm.worker_type === type ? theme.primary : theme.border}`, backgroundColor: empForm.worker_type === type ? theme.accentLight : "white", color: empForm.worker_type === type ? theme.primary : theme.textSecondary, fontWeight: "600", fontSize: "13px", cursor: "pointer", fontFamily: font.body, textTransform: "capitalize" }}>{type}</button>
              ))}
            </div>
            {editingEmp ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <button style={{...styles.button, flex: 1, marginTop: 0}} onClick={updateEmployee}>Save Changes</button>
                <button style={{...styles.button, backgroundColor: "#888", flex: 1, marginTop: 0}} onClick={() => { setEditingEmp(null); setEmpForm({ first_name: "", last_name: "", role: "", hourly_rate: "", burden_rate: "", worker_type: "employee" }); }}>Cancel</button>
              </div>
            ) : (
              <button style={{...styles.button, marginTop: 0}} onClick={addEmployee}>Add to Crew</button>
            )}
            {activeEmps.length > 0 && (
              <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {activeEmps.map(emp => (
                  <Row key={emp.employee_id}
                    main={`${emp.first_name} ${emp.last_name}`}
                    sub={`${emp.worker_type === "contractor" ? "Contractor" : "Employee"} · ${emp.role || "No role"} · $${emp.hourly_rate || 0}/hr`}
                    actions={[
                      <Btn key="e" label="Edit" bg={theme.accentLight} color={theme.accent} onClick={() => startEditEmp(emp)} />,
                      <Btn key="a" label="Archive" bg={theme.dangerLight} color={theme.danger} onClick={() => toggleEmployee(emp)} />
                    ]}
                  />
                ))}
              </div>
            )}
            {inactiveEmps.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <button onClick={() => setShowInactiveEmp(!showInactiveEmp)} style={{ fontSize: "12px", color: theme.textSecondary, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  {showInactiveEmp ? "Hide" : "Show"} archived ({inactiveEmps.length})
                </button>
                {showInactiveEmp && inactiveEmps.map(emp => (
                  <Row key={emp.employee_id} main={`${emp.first_name} ${emp.last_name}`} actions={[<Btn key="r" label="Restore" bg={theme.accentLight} color={theme.accent} onClick={() => toggleEmployee(emp)} />]} />
                ))}
              </div>
            )}
          </SetupSection>

          {/* ── STEP 3: COST CODES ── */}
          <SetupSection
            number="3"
            title="Cost Codes"
            subtitle="How you break down work on a job (e.g. Framing, Electrical, Labour). Used for tracking where time and money go."
            complete={costCodes.length > 0}
            completeLabel={`${costCodes.length} code${costCodes.length !== 1 ? "s" : ""} set up`}
          >
            {editingCc ? (
              <>
                <p style={{ fontSize: "12px", fontWeight: "600", color: theme.primary, marginBottom: "10px" }}>Editing: {editingCc.code}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "6px" }}>
                  <input style={styles.input} placeholder="Code (e.g. LAB)" value={ccForm.code} onChange={e => setCcForm({...ccForm, code: e.target.value})} />
                  <input style={styles.input} placeholder="Category" value={ccForm.category} onChange={e => setCcForm({...ccForm, category: e.target.value})} />
                </div>
                <input style={{...styles.input, marginBottom: "8px"}} placeholder="Description (e.g. General Labour)" value={ccForm.description} onChange={e => setCcForm({...ccForm, description: e.target.value})} />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button style={{...styles.button, flex: 1, marginTop: 0}} onClick={updateCostCode}>Save</button>
                  <button style={{...styles.button, backgroundColor: "#888", flex: 1, marginTop: 0}} onClick={() => { setEditingCc(null); setCcForm({ code: "", description: "", category: "" }); }}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "6px" }}>
                  <input style={styles.input} placeholder="Code (e.g. LAB)" value={ccForm.code} onChange={e => setCcForm({...ccForm, code: e.target.value})} />
                  <input style={styles.input} placeholder="Category" value={ccForm.category} onChange={e => setCcForm({...ccForm, category: e.target.value})} />
                </div>
                <input style={{...styles.input, marginBottom: "8px"}} placeholder="Description (e.g. General Labour)" value={ccForm.description} onChange={e => setCcForm({...ccForm, description: e.target.value})} />
                <button style={{...styles.button, marginTop: 0}} onClick={addCostCode}>Add Cost Code</button>
              </>
            )}
            {costCodes.length > 0 && (
              <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {costCodes.map(cc => (
                  <Row key={cc.cost_code_id} main={`${cc.code}  ${cc.description}`} sub={cc.category} actions={[<Btn key="e" label="Edit" bg={theme.accentLight} color={theme.accent} onClick={() => startEditCc(cc)} />, <Btn key="d" label="Delete" bg={theme.dangerLight} color={theme.danger} onClick={() => deleteCostCode(cc)} />]} />
                ))}
              </div>
            )}
          </SetupSection>

          {/* ── STEP 4: CREW LOGINS ── */}
          <SetupSection
            number="4"
            title="Give Crew App Access"
            subtitle="Create a login for each crew member so they can log hours and materials from their phone."
            complete={true}
          >
            <p style={{ fontSize: "13px", color: theme.textSecondary, marginBottom: "12px" }}>Pick the crew member, set their email and password, and send them the link to app.vantagelogic.ca.</p>
            <select style={{...styles.input, marginBottom: "6px"}} value={loginForm.employee_id} onChange={e => setLoginForm({...loginForm, employee_id: e.target.value})}>
              <option value="">Link to crew member (optional)</option>
              {activeEmps.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
            </select>
            <input style={{...styles.input, marginBottom: "6px"}} placeholder="Their email address" type="email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
            <div style={{ marginBottom: "6px" }}><PasswordInput placeholder="Set a password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} /></div>
            <div style={{ marginBottom: "6px" }}><PasswordInput placeholder="Confirm password" value={loginForm.confirm_password} onChange={e => setLoginForm({...loginForm, confirm_password: e.target.value})} /></div>
            <select style={{...styles.input, marginBottom: "10px"}} value={loginForm.employee_role} onChange={e => setLoginForm({...loginForm, employee_role: e.target.value})}>
              <option value="crew">Crew (field logging only)</option>
              <option value="admin">Admin (full access)</option>
              <option value="owner">Owner (full access)</option>
            </select>
            {loginError && <p style={styles.errorMsg}>{loginError}</p>}
            <button style={{...styles.button, backgroundColor: theme.accent, marginTop: 0}} onClick={createLogin}>Create Login</button>
            <UserManagement token={token} activeEmps={activeEmps} refreshSignal={userRefresh} />
          </SetupSection>

                    {/* ── YOUR ACCOUNT ── */}
                    <SetupSection
            number="★"
            title="Your Account"
            subtitle="Update your name, company name, and password."
            complete={true}
          >
            <ProfileSettingsForm token={token} showCompany={true} />
          </SetupSection>
        </>
      )}
    </div>
  )
}

// ─── DASHBOARD ────────────────────────────────────────────────

// ─── EMP TIMESHEET GROUP (Dashboard) ───────────────────────────
function EmpTimesheetGroup({ empName, empData, token, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: "8px", border: `1px solid ${theme.border}`, borderRadius: "10px", overflow: "hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", cursor: "pointer", backgroundColor: open ? theme.green_tint || "#f4f8f6" : "white", transition: "background 0.15s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "50%", backgroundColor: theme.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "12px", fontWeight: "700", flexShrink: 0 }}>
            {empName.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: theme.textPrimary }}>{empName}</div>
            <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "1px" }}>{empData.entries.length} shift{empData.entries.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontSize: "18px", fontWeight: "800", color: theme.primary, fontFamily: "inherit" }}>{empData.total.toFixed(1)}<span style={{ fontSize: "11px", fontWeight: "500", color: theme.textSecondary }}>h</span></div>
          <span style={{ fontSize: "11px", color: theme.textLight }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${theme.border}`, padding: "8px" }}>
          {empData.entries.map((t, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", backgroundColor: i % 2 === 0 ? theme.bg : "white", borderRadius: "6px", marginBottom: "3px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "12px", color: theme.textPrimary, fontWeight: "500" }}>{t.shift_date}</div>
                {t.field_notes && t.field_notes.toLowerCase() !== "yes" && t.field_notes.toLowerCase() !== "no" && (
                  <div style={{ fontSize: "11px", color: theme.textSecondary, fontStyle: "italic", marginTop: "2px" }}>{t.field_notes}</div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: "700", color: theme.primary }}>{t.hours_worked} h</div>
                {token && onDelete && (
                  <button onClick={async (e) => {
                    e.stopPropagation();
                    if (!window.confirm("Delete this timesheet entry?")) return;
                    const res = await apiFetch(`${API}/timesheets/${t.timesheet_id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
                    if (res.ok) onDelete();
                  }} style={{ fontSize: "11px", color: theme.danger, background: "none", border: "none", cursor: "pointer", fontWeight: "600", fontFamily: font.body, padding: 0 }}>Delete</button>
                )}
              </div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderTop: `1px solid ${theme.border}`, marginTop: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total</span>
            <span style={{ fontSize: "14px", fontWeight: "800", color: theme.primary }}>{empData.total.toFixed(1)}h</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({ token, readonly = false }) {
  const [jobs, setJobs] = useState([]);
  const [mileage, setMileage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [details, setDetails] = useState({});
  const [filter, setFilter] = useState("all");
  const [coDraft, setCoDraft] = useState(null);
  const [savingCO, setSavingCO] = useState(false);

  function loadDashboard() {
    const h = { Authorization: `Bearer ${token}` };
    return Promise.all([
      apiFetch(`${API}/dashboard`, { headers: h }).then(r => r.json()),
      apiFetch(`${API}/mileage`, { headers: h }).then(r => r.json()),
    ]).then(([dashData, mileageData]) => {
      setJobs(Array.isArray(dashData) ? dashData : []);
      setMileage(Array.isArray(mileageData) ? mileageData : []);
      setLoading(false);
    });
  }

  useEffect(() => { loadDashboard(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = jobs.filter(j => filter === "all" || j.status === filter);
  const sorted = [...filtered].sort((a, b) => {
    const sa = a.status === "active" ? 0 : 1;
    const sb = b.status === "active" ? 0 : 1;
    if (sa !== sb) return sa - sb;
    const la = a.last_activity || "";
    const lb = b.last_activity || "";
    if (la !== lb) return lb.localeCompare(la);
    return (b.job_id || 0) - (a.job_id || 0);
  });

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
      const [tsR, matR, coR] = await Promise.all([
        apiFetch(`${API}/jobs/${job_id}/timesheets`, { headers: h }),
        apiFetch(`${API}/jobs/${job_id}/materials`, { headers: h }),
        apiFetch(`${API}/jobs/${job_id}/change-orders`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => [])
      ]);
      const tsData = await tsR.json();
      const matData = await matR.json();
      setDetails(prev => ({ ...prev, [job_id]: { timesheets: tsData, materials: matData, changeOrders: coR } }));
    }
  }

  async function submitChangeOrder(job_id) {
    if (!coDraft || !coDraft.description || !coDraft.description.trim()) { return; }
    if (!coDraft.amount || parseFloat(coDraft.amount) <= 0) { return; }
    setSavingCO(true);
    const params = new URLSearchParams({ description: coDraft.description.trim(), amount: coDraft.amount, order_type: coDraft.order_type || "addition" });
    const res = await apiFetch(`${API}/jobs/${job_id}/change-orders?${params}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    setSavingCO(false);
    if (res.ok) {
      const h = { Authorization: `Bearer ${token}` };
      const coR = await apiFetch(`${API}/jobs/${job_id}/change-orders`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []);
      setDetails(prev => ({ ...prev, [job_id]: { ...(prev[job_id] || {}), changeOrders: coR } }));
      setCoDraft(null);
      loadDashboard();
    }
  }

  function fmtHours(h) {
    const n = Number(h || 0);
    if (n === 0) return "0h";
    const whole = Math.floor(n);
    const frac = n - whole;
    if (frac === 0) return `${whole}h`;
    if (frac === 0.5) return `${whole}.5h`;
    return `${n.toFixed(1)}h`;
  }

  const statCards = [
    { label: "Total Hours", value: fmtHours(totals.hours) },
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
      <div style={{ background: `linear-gradient(150deg, ${theme.primaryDark} 0%, ${theme.primary} 55%, ${theme.accent} 115%)`, padding: "32px 22px 38px", color: "white", boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
          <div style={{ marginBottom: "22px" }}>
            <VantageLogo size={32} dark={true} />
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", margin: "0 0 4px", fontFamily: font.display, letterSpacing: "-0.5px" }}>Project Overview</h1>
          <p style={{ fontSize: "13px", opacity: 0.65, margin: "0 0 20px" }}>Live job profitability, most recent activity first</p>

          <div style={{ display: "flex", gap: "6px", marginBottom: "20px", flexWrap: "wrap" }}>
            {["all", "active", "completed"].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 15px", borderRadius: "20px", border: filter === f ? "none" : "1px solid rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "12px", fontWeight: "600", backgroundColor: filter === f ? "white" : "transparent", color: filter === f ? theme.primary : "white", fontFamily: font.body, minHeight: "32px" }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="vl-statgrid">
            {statCards.map((item, i) => (
              <div key={i} style={{ backgroundColor: item.highlight ? (item.positive ? "rgba(45,106,79,0.9)" : "rgba(184,50,50,0.9)") : "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", borderRadius: "11px", padding: "14px 10px", textAlign: "center", border: item.highlight ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: "15px", fontWeight: "700", letterSpacing: "-0.3px" }}>{item.value}</div>
                <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: "600" }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "18px", maxWidth: "1080px", margin: "0 auto" }}>
        {!loading && sorted.length > 0 && (() => {
          let onTrack = 0, watch = 0, overBudget = 0;
          sorted.forEach(j => {
            const c = j.contract_value || 0;
            const cPct = c > 0 ? (j.total_cost / c) * 100 : 0;
            const hPct = j.budgeted_hours > 0 ? (j.total_hours / j.budgeted_hours) * 100 : 0;
            const isOver = (j.margin !== null && j.margin < 0) || cPct > 100 || hPct > 100;
            const isTight = !isOver && ((cPct > 85) || (hPct > 90));
            if (isOver) overBudget++;
            else if (isTight) watch++;
            else onTrack++;
          });
          const pills = [
            { label: "On Track", count: onTrack, color: theme.accent, bg: theme.accentLight },
            { label: "Watch", count: watch, color: theme.warning, bg: theme.warningLight },
            { label: "Over Budget", count: overBudget, color: theme.danger, bg: theme.dangerLight },
          ].filter(p => p.count > 0);
          return (
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              {pills.map(p => (
                <div key={p.label} style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "white", border: `1px solid ${theme.border}`, borderRadius: "10px", padding: "8px 14px", flex: "1 1 auto", minWidth: "120px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: p.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "20px", fontWeight: "800", color: theme.primary }}>{p.count}</span>
                  <span style={{ fontSize: "12px", color: theme.textSecondary, fontWeight: "600" }}>{p.label}</span>
                </div>
              ))}
            </div>
          );
        })()}
        {loading ? (
          <div className="vl-jobgrid">
            {[1,2,3,4].map(i => <Skeleton key={i} width="100%" height="180px" radius="12px" />)}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ maxWidth: "520px", margin: "0 auto", paddingTop: "12px" }}>
            <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "32px 28px", border: `1px solid ${theme.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: theme.accentLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "18px" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: theme.primary, fontFamily: font.display, margin: "0 0 8px" }}>You're in. Let's get set up.</h2>
              <p style={{ fontSize: "14px", color: theme.textSecondary, lineHeight: 1.6, margin: "0 0 24px" }}>Your dashboard shows live job profitability as your crew logs time and materials. To get started, you need three things.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                {[
                  { num: "1", title: "Add a job", desc: "Create your first active job with a budget and contract value." },
                  { num: "2", title: "Add your crew", desc: "Add employees with their hourly rates so labour costs are accurate." },
                  { num: "3", title: "Give crew app access", desc: "Create logins so they can log hours and materials from their phones." },
                ].map(step => (
                  <div key={step.num} style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px", backgroundColor: theme.bg, borderRadius: "10px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: theme.primary, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", flexShrink: 0 }}>{step.num}</div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: theme.primary, marginBottom: "2px" }}>{step.title}</div>
                      <div style={{ fontSize: "12px", color: theme.textSecondary, lineHeight: 1.5 }}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => window._setView && window._setView("admin")} style={{ ...styles.button, marginTop: 0, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "15px" }}>
                Go to Setup
              </button>
              <p style={{ fontSize: "12px", color: theme.textLight, textAlign: "center", marginTop: "12px", marginBottom: 0 }}>Takes about 5 minutes to get your first job running</p>
            </div>
          </div>
        ) : (
        <div className="vl-jobgrid">
        {sorted.map(job => {
          const hasBudget = job.contract_value > 0;
          const contract = job.contract_value || 0;
          const costPct = contract > 0 ? (job.total_cost / contract) * 100 : 0;
          const labPct = contract > 0 ? Math.min((job.labour_cost / contract) * 100, 100) : 0;
          const matPct = contract > 0 ? Math.max(Math.min(((job.labour_cost + job.materials_cost) / contract) * 100, 100) - labPct, 0) : 0;
          const hoursPct = job.budgeted_hours > 0 ? (job.total_hours / job.budgeted_hours) * 100 : 0;
          const over = job.margin !== null && job.margin < 0;
          const overCost = costPct > 100;
          const overHours = hoursPct > 100;
          const tight = (costPct > 85 && costPct <= 100) || (hoursPct > 90 && hoursPct <= 100);
          const healthColor = over || overCost || overHours ? theme.danger : tight ? theme.warning : theme.accent;
          const isOpen = expanded[job.job_id];
          const det = details[job.job_id];

          return (
            <div key={job.job_id} style={{ backgroundColor: "white", borderRadius: "12px", overflow: "hidden", boxShadow: theme.shadowSm, border: `1px solid ${theme.border}`, borderLeft: `4px solid ${healthColor}` }}>
              <div onClick={() => toggleJob(job.job_id)} style={{ padding: "18px", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", gap: "10px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: "700", fontSize: "16px", color: theme.primary, fontFamily: font.display, letterSpacing: "-0.2px" }}>{job.job_name}</div>
                    <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "3px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      {job.city && <span>{job.city}</span>}
                      {job.city && <span style={{ opacity: 0.4 }}>·</span>}
                      <span style={{ backgroundColor: job.status === "active" ? theme.accentLight : "#f0efeb", color: job.status === "active" ? theme.accent : theme.textSecondary, padding: "2px 9px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" }}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                    {hasBudget && job.margin !== null && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-block", backgroundColor: over ? theme.dangerLight : theme.accentLight, color: over ? theme.danger : theme.accent, fontSize: "13px", fontWeight: "800", padding: "4px 11px", borderRadius: "14px", letterSpacing: "-0.2px" }}>
                          {over ? "OVER" : `${job.margin_percent}%`}
                        </div>
                        <div style={{ fontSize: "11px", color: over ? theme.danger : theme.textSecondary, marginTop: "4px", fontWeight: "600" }}>
                          {over ? "-" : ""}${fmt(Math.abs(job.margin))} margin
                        </div>
                      </div>
                    )}
                    <span style={{ fontSize: "11px", color: theme.textLight }}>{isOpen ? "\u25B2" : "\u25BC"}</span>
                  </div>
                </div>

                {hasBudget ? (
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: theme.textSecondary, marginBottom: "6px" }}>
                      <span>${fmt(job.total_cost)} spent of ${fmt(contract)}</span>
                      <span style={{ color: overCost ? theme.danger : tight ? theme.warning : theme.textSecondary, fontWeight: "700" }}>{costPct.toFixed(0)}%</span>
                    </div>
                    <div style={{ backgroundColor: theme.border, borderRadius: "4px", height: "8px", display: "flex", overflow: "hidden", border: overCost ? `1px solid ${theme.danger}` : "none" }}>
                      <div style={{ width: `${labPct}%`, backgroundColor: overCost ? theme.danger : theme.primary, transition: "width 0.3s" }} />
                      <div style={{ width: `${matPct}%`, backgroundColor: overCost ? theme.danger : theme.gold, transition: "width 0.3s" }} />
                    </div>
                    <div style={{ display: "flex", gap: "14px", marginTop: "6px", fontSize: "10.5px", color: theme.textSecondary }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: theme.primary, display: "inline-block" }} />Labour ${fmt(job.labour_cost)}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: theme.gold, display: "inline-block" }} />Materials ${fmt(job.materials_cost)}</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                    {[["Labour", job.labour_cost], ["Materials", job.materials_cost], ["Total Cost", job.total_cost]].map(([label, val]) => (
                      <div key={label} style={{ backgroundColor: theme.bg, borderRadius: "8px", padding: "10px 8px", textAlign: "center", border: `1px solid ${theme.border}` }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: theme.primary }}>${fmt(val)}</div>
                        <div style={{ fontSize: "10px", color: theme.textSecondary, marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>{label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {job.budgeted_hours > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ flex: 1, backgroundColor: theme.border, borderRadius: "2px", height: "4px" }}>
                      <div style={{ width: `${Math.min(hoursPct, 100)}%`, height: "4px", borderRadius: "2px", backgroundColor: overHours ? theme.danger : hoursPct > 90 ? theme.warning : theme.accent, transition: "width 0.3s" }} />
                    </div>
                    <span style={{ fontSize: "11px", color: overHours ? theme.danger : theme.textSecondary, fontWeight: "600", whiteSpace: "nowrap" }}>{fmtHours(job.total_hours)} of {fmtHours(job.budgeted_hours)}</span>
                  </div>
                )}

                {(over || overCost || overHours) && (
                  <div style={{ marginTop: "12px", padding: "10px 13px", backgroundColor: theme.dangerLight, borderRadius: "8px", border: `1px solid ${theme.danger}`, display: "flex", alignItems: "center", gap: "10px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.danger} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: theme.danger }}>
                      {overCost && overHours ? "Cost and hours exceeded" : overCost || over ? "Cost exceeds contract value" : "Hours exceeded budget"}
                    </span>
                  </div>
                )}
              </div>

              {isOpen && (
                <div onClick={e => e.stopPropagation()} style={{ padding: "0 18px 18px", borderTop: `1px solid ${theme.border}` }}>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "14px", marginBottom: "10px" }}>
                    <div style={{ fontSize: "11px", fontWeight: "600", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.6px" }}>Change Orders</div>
                    {(!coDraft || coDraft.jobId !== job.job_id) && (
                      <button onClick={() => setCoDraft({ jobId: job.job_id, description: "", amount: "", order_type: "addition" })} style={{ fontSize: "11px", color: theme.accent, fontWeight: "700", background: "none", border: "none", cursor: "pointer", fontFamily: font.body, padding: 0 }}>+ Add</button>
                    )}
                  </div>

                  {coDraft && coDraft.jobId === job.job_id && (
                    <div style={{ backgroundColor: theme.bg, borderRadius: "10px", padding: "12px", marginBottom: "10px", border: `1.5px solid ${theme.gold}` }}>
                      <input style={{ ...styles.input, marginBottom: "8px" }} placeholder="What changed? e.g. Client added second bathroom" value={coDraft.description} onChange={e => setCoDraft({ ...coDraft, description: e.target.value })} />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                        <input style={styles.input} type="number" step="0.01" placeholder="Amount $" value={coDraft.amount} onChange={e => setCoDraft({ ...coDraft, amount: e.target.value })} />
                        <select style={styles.input} value={coDraft.order_type} onChange={e => setCoDraft({ ...coDraft, order_type: e.target.value })}>
                          <option value="addition">Addition (+)</option>
                          <option value="deduction">Deduction (-)</option>
                        </select>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => submitChangeOrder(job.job_id)} disabled={savingCO} style={{ ...styles.button, marginTop: 0, flex: 1, padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                          {savingCO ? <><Spinner /> Saving...</> : "Save Change Order"}
                        </button>
                        <button onClick={() => setCoDraft(null)} style={{ ...styles.button, marginTop: 0, padding: "10px 16px", backgroundColor: "#888" }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {det ? (
                    (det.changeOrders || []).length === 0 && (!coDraft || coDraft.jobId !== job.job_id)
                      ? <p style={{ fontSize: "12px", color: theme.textLight, margin: "0 0 4px" }}>None yet. Contract adjustments will show here.</p>
                      : (det.changeOrders || []).map((co, i) => (
                        <div key={i} style={{ marginBottom: "6px", padding: "10px 13px", backgroundColor: theme.bg, borderRadius: "8px", border: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "13px", fontWeight: "600", color: theme.textPrimary }}>{co.description}</div>
                            <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "2px" }}>{co.created_at ? String(co.created_at).split("T")[0] : ""}</div>
                          </div>
                          <div style={{ fontSize: "14px", fontWeight: "700", color: co.order_type === "deduction" ? theme.danger : theme.accent, whiteSpace: "nowrap" }}>
                            {co.order_type === "deduction" ? "-" : "+"}${fmt(co.amount)}
                          </div>
                        </div>
                      ))
                  ) : <p style={{ fontSize: "12px", color: theme.textSecondary }}>Loading...</p>}

                  <div style={{ fontSize: "11px", fontWeight: "600", color: theme.textSecondary, marginTop: "16px", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.6px" }}>Hours by Person</div>
                  {det ? (
                    det.timesheets.length === 0
                      ? <p style={{ fontSize: "12px", color: theme.textLight, margin: 0 }}>No entries yet.</p>
                      : (() => {
                          const byEmp = {};
                          det.timesheets.forEach(t => {
                            if (!byEmp[t.employee_name]) byEmp[t.employee_name] = { entries: [], total: 0 };
                            byEmp[t.employee_name].entries.push(t);
                            byEmp[t.employee_name].total += Number(t.hours_worked || 0);
                          });
                          return Object.entries(byEmp).map(([empName, empData]) => (
                            <EmpTimesheetGroup key={empName} empName={empName} empData={empData} token={token} onDelete={() => toggleJob(job.job_id)} />
                          ));
                        })()
                  ) : <p style={{ fontSize: "12px", color: theme.textSecondary }}>Loading...</p>}

                  {det?.materials?.length > 0 && (
                    <div style={{ marginTop: "16px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "600", color: theme.textSecondary, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.6px" }}>Materials</div>
                      {det.materials.map((m, i) => (
                        <div key={i} style={{ marginBottom: "6px", padding: "11px 13px", backgroundColor: theme.bg, borderRadius: "8px", border: `1px solid ${theme.border}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "13px", fontWeight: "600", color: theme.textPrimary }}>{m.description}</div>
                              <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "2px" }}>{m.supplier || "Unknown supplier"} · {m.purchase_date}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                              <div style={{ fontSize: "15px", fontWeight: "700", color: theme.gold }}>${fmt(m.total_cost)}</div>
                              <button onClick={async () => {
                                if (!window.confirm("Delete this material entry?")) return;
                                const res = await apiFetch(`${API}/materials/${m.material_id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
                                if (res.ok) toggleJob(job.job_id);
                              }} style={{ fontSize: "11px", color: theme.danger, background: "none", border: "none", cursor: "pointer", fontWeight: "600", fontFamily: font.body, padding: 0 }}>Delete</button>
                            </div>
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
        </div>
        )}

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



// ─── PLAN PICKER ─────────────────────────────────────────────────
const TIERS = [
  { key: "starter", label: "Starter", crew: "1-5 crew", price: "$49", priceId: "price_1Tic7A8kfViKkfYDhUfTkCmq", limit: 5, color: theme.accent },
  { key: "growth", label: "Growth", crew: "6-15 crew", price: "$99", priceId: "price_1TiKLQ8kfViKkfYD51QPtE6f", limit: 15, color: theme.primary },
  { key: "pro", label: "Pro", crew: "16-30 crew", price: "$179", priceId: "price_1Tic8s8kfViKkfYDlSGRdOM2", limit: 30, color: theme.gold },
];

function PlanPicker({ token, currentTier, crewCount, onClose, onSuccess }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");

  async function selectPlan(tier) {
    setLoading(tier.key); setError("");
    try {
      const params = new URLSearchParams({ price_id: tier.priceId });
      const res = await apiFetch(`${API}/create-checkout-session?${params}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.checkout_url) { window.location.href = data.checkout_url; }
      else { setError(data.detail || "Something went wrong. Please try again."); setLoading(null); }
    } catch { setError("Something went wrong. Please try again."); setLoading(null); }
  }

  const activeCrew = crewCount || 0;

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={onClose}>
      <div style={{ backgroundColor: "white", borderRadius: "16px", width: "100%", maxWidth: "480px", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
        <div style={{ height: "3px", background: `linear-gradient(90deg, ${theme.gold} 0%, #e0b75e 50%, ${theme.gold} 100%)` }} />
        <div style={{ padding: "28px 28px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: theme.primary, fontFamily: font.display, margin: 0 }}>Choose your plan</h2>
              <p style={{ fontSize: "13px", color: theme.textSecondary, marginTop: "4px" }}>
                You currently have <strong style={{ color: theme.primary }}>{activeCrew} active crew member{activeCrew !== 1 ? "s" : ""}</strong>. Pick the plan that fits.
              </p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", color: theme.textLight, cursor: "pointer", padding: "0 0 0 10px", lineHeight: 1 }}>×</button>
          </div>

          {error && <div style={{ backgroundColor: theme.dangerLight, color: theme.danger, padding: "10px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", marginBottom: "14px" }}>{error}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
            {TIERS.map(tier => {
              const isCurrent = currentTier === tier.key;
              const tooSmall = activeCrew > tier.limit;
              const recommended = activeCrew <= tier.limit && (TIERS.findIndex(t => t.key === tier.key) === TIERS.findIndex(t => activeCrew <= t.limit));
              return (
                <div key={tier.key} style={{ border: `2px solid ${isCurrent ? tier.color : recommended ? tier.color : theme.border}`, borderRadius: "12px", padding: "16px 18px", opacity: tooSmall ? 0.45 : 1, backgroundColor: isCurrent ? `${tier.color}11` : "white", position: "relative" }}>
                  {recommended && !isCurrent && (
                    <div style={{ position: "absolute", top: "-10px", right: "14px", backgroundColor: tier.color, color: "white", fontSize: "10px", fontWeight: "700", padding: "2px 10px", borderRadius: "20px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Recommended</div>
                  )}
                  {isCurrent && (
                    <div style={{ position: "absolute", top: "-10px", right: "14px", backgroundColor: tier.color, color: "white", fontSize: "10px", fontWeight: "700", padding: "2px 10px", borderRadius: "20px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Current Plan</div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: theme.primary }}>{tier.label}</div>
                      <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "2px" }}>{tier.crew}</div>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: "12px" }}>
                      <div>
                        <span style={{ fontSize: "22px", fontWeight: "800", color: theme.primary, fontFamily: font.display }}>{tier.price}</span>
                        <span style={{ fontSize: "11px", color: theme.textSecondary }}>/mo</span>
                      </div>
                      {!isCurrent && !tooSmall && (
                        <button onClick={() => selectPlan(tier)} disabled={!!loading} style={{ padding: "9px 18px", borderRadius: "8px", border: "none", backgroundColor: tier.color, color: "white", fontSize: "13px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", fontFamily: font.body, display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", minHeight: "40px" }}>
                          {loading === tier.key ? <><Spinner /> Loading...</> : "Select"}
                        </button>
                      )}
                      {tooSmall && <span style={{ fontSize: "11px", color: theme.danger, fontWeight: "600" }}>Too small for your crew</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: "11px", color: theme.textLight, textAlign: "center", marginTop: "18px", lineHeight: 1.5 }}>
            Secure payment via Stripe. Cancel anytime. Need help? <a href="mailto:vantagelogic@outlook.com" style={{ color: theme.primary }}>Contact us</a>.
          </p>
        </div>
      </div>
    </div>
  );
}


// ─── LOG HUB ──────────────────────────────────────────────────
function LogHub({ setView }) {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Log Entry</h1>
      <p style={styles.subtitle}>What do you want to record?</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
        {[
          { id: "timesheet", label: "Hours", desc: "Log time worked on a job", icon: IconHours, color: theme.primary },
          { id: "materials", label: "Materials", desc: "Record a purchase or receipt scan", icon: IconMaterials, color: theme.gold },
          { id: "mileage", label: "Mileage", desc: "Log kilometres driven for a job", icon: IconMileage, color: theme.accent },
        ].map(item => (
          <button key={item.id} onClick={() => setView(item.id)} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "18px 20px", backgroundColor: "white", border: `1px solid ${theme.border}`, borderRadius: "14px", cursor: "pointer", textAlign: "left", width: "100%", fontFamily: font.body, transition: "all 0.15s" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: `${item.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: item.color }}><item.icon /></span>
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: theme.primary }}>{item.label}</div>
              <div style={{ fontSize: "13px", color: theme.textSecondary, marginTop: "2px" }}>{item.desc}</div>
            </div>
            <svg style={{ marginLeft: "auto", flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.textLight} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        ))}
      </div>
    </div>
  );
}


function ProfileSettingsForm({ token, role, showCompany = false }) {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", company_name: "" });
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [message, setMessage] = useState("");
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const hInner = { Authorization: `Bearer ${token}` };
    Promise.all([
      apiFetch(`${API}/me`, { headers: hInner }).then(r => r.json()),
      showCompany ? apiFetch(`${API}/companies`, { headers: hInner }).then(r => r.json()).catch(() => []) : Promise.resolve([]),
    ]).then(([me, companies]) => {
      const company = Array.isArray(companies) ? companies.find(c => c.company_id === me.company_id) : null;
      setForm({
        first_name: me.first_name || "",
        last_name: me.last_name || "",
        email: me.email || "",
        company_name: company?.company_name || "",
      });
      setLoading(false);
    });
  }, [token, showCompany]);

  async function saveProfile() {
    setSaving(true);
    setMessage("");
    const params = new URLSearchParams({ first_name: form.first_name, last_name: form.last_name });
    const res = await apiFetch(`${API}/me/update?${params}`, { method: "PATCH", headers: h });
    if (showCompany && form.company_name) {
      await apiFetch(`${API}/me/update-company?${new URLSearchParams({ company_name: form.company_name })}`, { method: "PATCH", headers: h }).catch(() => {});
    }
    setSaving(false);
    if (res.ok) { setMessage("Profile updated."); setTimeout(() => setMessage(""), 3000); }
    else setMessage("Could not save. Please try again.");
  }

  async function savePassword() {
    setPwError(""); setPwMessage("");
    if (!pwForm.current_password) { setPwError("Enter your current password."); return; }
    if (pwForm.new_password.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (pwForm.new_password !== pwForm.confirm_password) { setPwError("Passwords do not match."); return; }
    setSavingPw(true);
    const params = new URLSearchParams({ current_password: pwForm.current_password, new_password: pwForm.new_password });
    const res = await apiFetch(`${API}/me/change-password?${params}`, { method: "POST", headers: h });
    setSavingPw(false);
    if (res.ok) {
      setPwMessage("Password changed.");
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
      setTimeout(() => setPwMessage(""), 3000);
    } else {
      const d = await res.json().catch(() => ({}));
      setPwError(d.detail || "Could not change password.");
    }
  }

  if (loading) return <Skeleton width="100%" height="220px" radius="12px" />;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <label style={styles.label}>First Name</label>
          <input style={styles.input} value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} placeholder="First name" />
        </div>
        <div>
          <label style={styles.label}>Last Name</label>
          <input style={styles.input} value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} placeholder="Last name" />
        </div>
      </div>
      <label style={styles.label}>Email</label>
      <input style={{...styles.input, backgroundColor: theme.bg, color: theme.textSecondary}} value={form.email} disabled placeholder="Email" />
      <p style={{ fontSize: "11px", color: theme.textLight, marginTop: "4px" }}>Email cannot be changed. Contact support if needed.</p>
      {showCompany && (
        <>
          <label style={styles.label}>Company Name</label>
          <input style={styles.input} value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} placeholder="Your company name" />
        </>
      )}
      {message && <div style={{ color: theme.accent, fontSize: "13px", fontWeight: "600", marginTop: "8px", padding: "10px 14px", backgroundColor: theme.accentLight, borderRadius: "8px" }}>{message}</div>}
      <button onClick={saveProfile} disabled={saving} style={{ ...styles.button, marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
        {saving ? <><Spinner /> Saving...</> : "Save Profile"}
      </button>

      <div style={{ marginTop: "22px", paddingTop: "18px", borderTop: `1px solid ${theme.border}` }}>
        <div style={{ fontSize: "14px", fontWeight: "700", color: theme.primary, marginBottom: "12px", fontFamily: font.display }}>Change Password</div>
        <label style={styles.label}>Current Password</label>
        <PasswordInput value={pwForm.current_password} onChange={e => setPwForm({...pwForm, current_password: e.target.value})} placeholder="Your current password" />
        <label style={styles.label}>New Password</label>
        <PasswordInput value={pwForm.new_password} onChange={e => setPwForm({...pwForm, new_password: e.target.value})} placeholder="At least 8 characters" />
        <label style={styles.label}>Confirm New Password</label>
        <PasswordInput value={pwForm.confirm_password} onChange={e => setPwForm({...pwForm, confirm_password: e.target.value})} placeholder="Confirm new password" />
        {pwError && <p style={styles.errorMsg}>{pwError}</p>}
        {pwMessage && <div style={{ color: theme.accent, fontSize: "13px", fontWeight: "600", marginTop: "8px", padding: "10px 14px", backgroundColor: theme.accentLight, borderRadius: "8px" }}>{pwMessage}</div>}
        <button onClick={savePassword} disabled={savingPw} style={{ ...styles.button, marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          {savingPw ? <><Spinner /> Saving...</> : "Change Password"}
        </button>
      </div>
    </>
  );
}

function SettingsScreen({ token, role, onLogout }) {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Settings</h1>
      <p style={styles.subtitle}>Manage your account and preferences</p>

      <div style={styles.card}>
        <div style={{ fontSize: "15px", fontWeight: "700", color: theme.primary, marginBottom: "16px", fontFamily: font.display }}>Your Profile</div>
        <ProfileSettingsForm token={token} showCompany={false} />
      </div>

      <div style={{...styles.card, marginTop: "14px"}}>
        <div style={{ fontSize: "15px", fontWeight: "700", color: theme.primary, marginBottom: "8px", fontFamily: font.display }}>Account</div>
        <p style={{ fontSize: "13px", color: theme.textSecondary, marginBottom: "16px" }}>Sign out of your account on this device.</p>
        <button onClick={onLogout} style={{ ...styles.button, backgroundColor: theme.danger, marginTop: 0 }}>Sign Out</button>
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
      button:hover:not(:disabled) { opacity: 0.93; transform: translateY(-1px); }
      button:active:not(:disabled) { transform: translateY(0); }
      button:disabled { opacity: 0.55; cursor: not-allowed; }
      ::selection { background: rgba(45,106,79,0.15); }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-thumb { background: #d4cfc6; border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: #bcb6ab; }
      ::-webkit-scrollbar-track { background: transparent; }
      @keyframes vlspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes vlskeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      @keyframes vlFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes vlFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes vlScaleIn { from { opacity: 0; transform: scale(0.97) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      @keyframes vlPulse {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}
      .vl-screen { animation: vlFadeUp 0.34s cubic-bezier(0.22,1,0.36,1) both; }
      .vl-pop { animation: vlScaleIn 0.22s cubic-bezier(0.22,1,0.36,1) both; }
      .vl-grid2 { display: grid; grid-template-columns: 1fr; gap: 10px; align-items: start; }
      .vl-jobgrid { display: grid; grid-template-columns: 1fr; gap: 12px; align-items: start; }
      .vl-statgrid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
      @media (min-width: 1020px) {
        .vl-grid2 { grid-template-columns: 1fr 1fr; gap: 12px; }
        .vl-jobgrid { grid-template-columns: 1fr 1fr; gap: 14px; }
        .vl-statgrid { grid-template-columns: repeat(6, 1fr); }
      }
      .vl-week { display: grid; grid-template-columns: 1fr; gap: 16px; align-items: start; }
      .vl-home-grid { display: grid; grid-template-columns: 1fr; gap: 0; align-items: start; }
      @media (min-width: 900px) {
        .vl-home-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
      }
      @media (min-width: 1020px) {
        .vl-week { grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
  return null;
}

// ─── NOTIFICATION BELL ────────────────────────────────────────
function NotificationBell({ token, role, setView, mobile }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  function loadCount() {
    apiFetch(`${API}/notifications/unread-count`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setCount(d.count || 0)).catch(() => {});
  }

  function loadItems() {
    setLoading(true);
    apiFetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  }

  useEffect(() => {
    loadCount();
    const iv = setInterval(loadCount, 30000);
    return () => clearInterval(iv);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) loadItems();
  }

  async function markAllRead() {
    await apiFetch(`${API}/notifications/mark-read`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    setCount(0);
    loadItems();
  }

  function handleTap(n) {
    setOpen(false);
    if (count > 0) markAllRead();
    if (n.related_type === "request") setView(role === "crew" ? "crew_requests" : "requests");
    else if (n.related_type === "job") setView("dashboard");
    else if (n.related_type === "schedule") setView(role === "crew" ? "home" : "schedule");
  }

  const iconColor = (t) => t === "new_request" ? theme.gold : t === "new_comment" ? theme.accent : t === "change_order" ? theme.primary : t === "budget_warning" ? theme.danger : theme.textSecondary;

  return (
    <div style={{ position: "fixed", top: mobile ? "12px" : "20px", right: mobile ? "14px" : "26px", zIndex: 1100 }}>
      <button onClick={toggle} aria-label="Notifications" style={{ position: "relative", width: "42px", height: "42px", borderRadius: "12px", border: `1px solid ${theme.border}`, backgroundColor: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: theme.shadowMd }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={open ? theme.primary : theme.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        {count > 0 && (
          <span style={{ position: "absolute", top: "-5px", right: "-5px", minWidth: "19px", height: "19px", padding: "0 5px", borderRadius: "10px", backgroundColor: theme.danger, color: "white", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font.body, border: "2px solid white", boxSizing: "border-box" }}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: -1 }} />
          <div className="vl-pop" style={{ position: "absolute", top: "50px", right: 0, width: mobile ? "calc(100vw - 28px)" : "360px", maxWidth: "360px", backgroundColor: "white", borderRadius: "14px", border: `1px solid ${theme.border}`, boxShadow: theme.shadowLg, overflow: "hidden", transformOrigin: "top right" }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", fontWeight: "700", color: theme.primary, fontFamily: font.display }}>Notifications</span>
              {items.some(i => !i.read) && <button onClick={markAllRead} style={{ fontSize: "11px", color: theme.accent, fontWeight: "600", background: "none", border: "none", cursor: "pointer", fontFamily: font.body }}>Mark all read</button>}
            </div>
            <div style={{ maxHeight: "420px", overflowY: "auto" }}>
              {loading ? (
                <div style={{ padding: "24px", textAlign: "center", fontSize: "13px", color: theme.textLight }}>Loading...</div>
              ) : items.length === 0 ? (
                <div style={{ padding: "32px 24px", textAlign: "center" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={theme.textLight} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "8px" }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  <div style={{ fontSize: "13px", color: theme.textSecondary }}>You are all caught up.</div>
                </div>
              ) : (
                items.map(n => (
                  <div key={n.notification_id} onClick={() => handleTap(n)} style={{ padding: "13px 16px", borderBottom: `1px solid ${theme.border}`, cursor: "pointer", backgroundColor: n.read ? "white" : theme.accentLight, display: "flex", gap: "11px", alignItems: "flex-start", transition: "background 0.12s" }}>
                    <div style={{ flexShrink: 0, width: "32px", height: "32px", borderRadius: "9px", backgroundColor: "white", border: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: iconColor(n.type) }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: n.read ? "500" : "700", color: theme.textPrimary, marginBottom: "2px" }}>{n.title}</div>
                      {n.message && <div style={{ fontSize: "12px", color: theme.textSecondary, lineHeight: 1.4, marginBottom: "3px" }}>{n.message}</div>}
                      <div style={{ fontSize: "10.5px", color: theme.textLight }}>{timeAgo(n.created_at)}</div>
                    </div>
                    {!n.read && <span style={{ flexShrink: 0, width: "8px", height: "8px", borderRadius: "50%", backgroundColor: theme.danger, marginTop: "5px" }} />}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────
export default function App() {
  const stored = getStoredAuth();
  const [token, setToken] = useState(stored.token);
  const [role, setRole] = useState(stored.role);
  const [view, setViewRaw] = useState(() => {
    let saved = localStorage.getItem("vl_view");
    if (stored.role !== "crew" && saved === "settings") saved = "admin";
    const defaultView = stored.role === "crew" ? "home" : "dashboard";
    if (!saved) return defaultView;
    const crewViews = ["home", "log", "timesheet", "materials", "mileage", "crew_requests", "settings"];
    const ownerViews = ["schedule", "dashboard", "inventory", "requests", "admin"];
    const valid = stored.role === "crew" ? crewViews : ownerViews;
    return valid.includes(saved) ? saved : defaultView;
  });
  function setView(v) { setViewRaw(v); localStorage.setItem("vl_view", v); }
  useEffect(() => { window._setView = setView; return () => { delete window._setView; }; }, []);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Checklist persists in dashboard until explicitly dismissed (per browser)
  const [showChecklist, setShowChecklist] = useState(() => !localStorage.getItem("vl_checklist_done"));
  function dismissChecklist() { localStorage.setItem("vl_checklist_done", "1"); setShowChecklist(false); }
  const [mobile, setMobile] = useState(isMobile());

  // Parse one-time auth URL params (?verify=... or ?reset=...) once on load
  const [authScreen, setAuthScreen] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("verify")) return { type: "verify", token: params.get("verify") };
      if (params.get("reset")) return { type: "reset", token: params.get("reset") };
    } catch {}
    return null;
  });
  const [checkEmailAddr, setCheckEmailAddr] = useState(null);
  const [subStatus, setSubStatus] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(null);
  const [subTier, setSubTier] = useState(null);
  const [crewCount, setCrewCount] = useState(null);
  const [tierLimit, setTierLimit] = useState(null);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [voicePrefill, setVoicePrefill] = useState(null);
  useEffect(() => { window._setVoicePrefill = setVoicePrefill; return () => { delete window._setVoicePrefill; }; }, [setVoicePrefill]);
  const [paymentMsg, setPaymentMsg] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const p = params.get("payment");
      if (p) { const url = new URL(window.location.href); url.searchParams.delete("payment"); window.history.replaceState({}, "", url.toString()); }
      return p || null;
    } catch { return null; }
  });

  function clearAuthUrlParams() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("verify");
      url.searchParams.delete("reset");
      window.history.replaceState({}, "", url.toString());
    } catch {}
  }

  // Keep the view valid for the current role (prevents owners landing on crew pages after refresh)
  useEffect(() => {
    const crewViews = ["home", "log", "timesheet", "materials", "mileage", "crew_requests", "settings"];
    const ownerViews = ["schedule", "dashboard", "inventory", "requests", "admin"];
    if (role === "crew" && !crewViews.includes(view)) {
      setView("home");
    } else if ((role === "owner" || role === "admin") && !ownerViews.includes(view)) {
      setView("dashboard");
    }
  }, [role, view]);

  useEffect(() => {
    const handler = () => setMobile(isMobile());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    setLogoutHandler(handleLogout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogin(accessToken, userRole, newUser = false) {
    setStoredAuth(accessToken, userRole);
    setToken(accessToken);
    setRole(userRole);
    setView(userRole === "crew" ? "home" : "dashboard");
    if (newUser) setShowOnboarding(true);
    apiFetch(`${API}/subscription-status`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json()).then(data => {
        setSubStatus(data.status);
        setDaysRemaining(data.days_remaining);
        setSubTier(data.tier || null);
        setCrewCount(data.crew_count ?? null);
        setTierLimit(data.tier_limit ?? null);
      }).catch(() => {});
  }

  // Re-check subscription status on mount and when page regains focus
  useEffect(() => {
    if (!token) return;
    function checkSub() {
      apiFetch(`${API}/subscription-status`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(data => {
          setSubStatus(data.status);
          setDaysRemaining(data.days_remaining);
          setSubTier(data.tier || null);
          setCrewCount(data.crew_count ?? null);
          setTierLimit(data.tier_limit ?? null);
        }).catch(() => {});
    }
    checkSub();
    window.addEventListener("focus", checkSub);
    document.addEventListener("visibilitychange", checkSub);
    return () => { window.removeEventListener("focus", checkSub); document.removeEventListener("visibilitychange", checkSub); };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLogout() {
    setStoredAuth(null, null);
    setToken(null);
    setRole(null);
    setView("home");
    setShowSignUp(false);
    setShowOnboarding(false);
  }

  if (!token) {
    if (authScreen?.type === "verify") {
      return <><GlobalStyles /><VerifyEmail token={authScreen.token} onVerified={(t, r) => { clearAuthUrlParams(); setAuthScreen(null); handleLogin(t, r, true); }} onBack={() => { clearAuthUrlParams(); setAuthScreen(null); }} /></>;
    }
    if (authScreen?.type === "reset") {
      return <><GlobalStyles /><ResetPassword token={authScreen.token} onDone={() => { clearAuthUrlParams(); setAuthScreen(null); }} /></>;
    }
    if (authScreen?.type === "forgot") {
      return <><GlobalStyles /><ForgotPassword onBack={() => setAuthScreen(null)} /></>;
    }
    if (checkEmailAddr) {
      return <><GlobalStyles /><CheckEmail email={checkEmailAddr} onBack={() => { setCheckEmailAddr(null); setShowSignUp(false); }} /></>;
    }
    if (showSignUp) return <><GlobalStyles /><SignUp onCheckEmail={(email) => setCheckEmailAddr(email)} onBack={() => setShowSignUp(false)} /></>;
    return <><GlobalStyles /><Login onLogin={handleLogin} onSignUp={() => setShowSignUp(true)} onForgot={() => setAuthScreen({ type: "forgot" })} /></>;
  }

  const sidebarOffset = !mobile ? theme.sidebarWidth : "0px";

  return (
    <>
      <GlobalStyles />
      <div style={{ backgroundColor: theme.bg, minHeight: "100vh" }}>
        {paymentMsg === "success" && (
          <div style={{ backgroundColor: theme.accent, color: "white", padding: "12px 20px", textAlign: "center", fontSize: "14px", fontWeight: "600" }}>
            Payment successful. Welcome to Vantage Logic!
            <button onClick={() => setPaymentMsg(null)} style={{ marginLeft: "16px", background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "16px" }}>×</button>
          </div>
        )}
        {subStatus === "expired" && role === "owner" && (
          <div style={{ backgroundColor: theme.danger, color: "white", padding: "11px 20px", textAlign: "center", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
            <span>Your trial has ended. Your data is safe, subscribe to resume full access.</span>
            <button onClick={() => setShowPlanPicker(true)} style={{ backgroundColor: "white", color: theme.danger, border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Subscribe now</button>
          </div>
        )}
        {subStatus === "expired" && role === "crew" && (
          <div style={{ backgroundColor: theme.danger, color: "white", padding: "11px 20px", textAlign: "center", fontSize: "13px", fontWeight: "600" }}>
            This account is currently on hold. Contact your administrator for support.
          </div>
        )}
        {subStatus === "trial" && daysRemaining !== null && daysRemaining <= 7 && role === "owner" && (
          <div style={{ backgroundColor: theme.gold, color: "white", padding: "10px 20px", textAlign: "center", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            <span>{daysRemaining === 0 ? "Your trial ends today." : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left in your trial.`}</span>
            <button onClick={() => setShowPlanPicker(true)} style={{ backgroundColor: "white", color: theme.gold, border: "none", padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Subscribe now</button>
          </div>
        )}
        <NavBar view={view} setView={setView} role={role} onLogout={handleLogout} />
        {showPlanPicker && <PlanPicker token={token} currentTier={subTier} crewCount={crewCount} onClose={() => setShowPlanPicker(false)} onSuccess={() => { setShowPlanPicker(false); window.location.href = window.location.href.split("?")[0] + "?payment=success"; }} />}
        <NotificationBell token={token} role={role} setView={setView} mobile={mobile} />
        {token && <HelpChat token={token} role={role} />}

        {/* Full-screen onboarding walkthrough — shown once on first login */}
        {showOnboarding && (role === "owner" || role === "admin") && (
          <OnboardingModal onClose={() => setShowOnboarding(false)} />
        )}

        <div style={{ marginLeft: sidebarOffset, transition: "margin-left 0.2s" }}>
          <div key={view} className="vl-screen">
          {role === "crew" && view === "home" && <CrewHome token={token} setView={setView} setVoicePrefill={setVoicePrefill} readonly={subStatus === "expired"} />}
          {role === "crew" && view === "log" && <LogHub setView={setView} />}
          {role === "crew" && view === "timesheet" && <TimesheetForm token={token} voicePrefill={voicePrefill} onPrefillConsumed={() => setVoicePrefill(null)} readonly={subStatus === "expired"} setView={setView} />}
          {role === "crew" && view === "materials" && <MaterialsForm token={token} voicePrefill={voicePrefill} onPrefillConsumed={() => setVoicePrefill(null)} readonly={subStatus === "expired"} setView={setView} />}
          {role === "crew" && view === "mileage" && <MileageForm token={token} voicePrefill={voicePrefill} onPrefillConsumed={() => setVoicePrefill(null)} readonly={subStatus === "expired"} setView={setView} />}
          {role === "crew" && view === "crew_requests" && <CrewRequestsScreen token={token} readonly={subStatus === "expired"} />}
          {role === "crew" && view === "settings" && <SettingsScreen token={token} role={role} onLogout={handleLogout} />}
          {(role === "owner" || role === "admin") && view === "schedule" && <ScheduleScreen token={token} readonly={subStatus === "expired"} />}
          {(role === "owner" || role === "admin") && view === "dashboard" && (
            <>
              {showChecklist && (
                <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "18px 18px 0" }}>
                  <OnboardingChecklist token={token} onDismiss={dismissChecklist} onNavigate={(v) => { setView(v); }} />
                </div>
              )}
              <Dashboard token={token} readonly={subStatus === "expired"} />
            </>
          )}
          {(role === "owner" || role === "admin") && view === "inventory" && <InventoryScreen token={token} readonly={subStatus === "expired"} />}
          {(role === "owner" || role === "admin") && view === "requests" && <RequestsScreen token={token} readonly={subStatus === "expired"} />}
          {(role === "owner" || role === "admin") && view === "admin" && <AdminScreen token={token} readonly={subStatus === "expired"} subTier={subTier} crewCount={crewCount} tierLimit={tierLimit} onPlanPicker={() => setShowPlanPicker(true)} onSubRefresh={() => { apiFetch(`${API}/subscription-status`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(data => { setSubStatus(data.status); setSubTier(data.tier); setCrewCount(data.crew_count); setTierLimit(data.tier_limit); }); }} />}
          </div>
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