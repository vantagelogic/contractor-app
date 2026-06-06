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

const theme = {
  primary: "#1a3d2b",
  primaryDark: "#122b1e",
  accent: "#2d6a4f",
  accentLight: "#e8f5ee",
  gold: "#c8973a",
  danger: "#b83232",
  dangerLight: "#fdf0ee",
  warning: "#c47d1a",
  bg: "#f8f7f4",
  card: "#ffffff",
  border: "#e0ddd8",
  textPrimary: "#1a1a1a",
  textSecondary: "#5c5c5c",
  textLight: "#9a9a9a",
  sidebarWidth: "220px",
};

const font = {
  heading: "Georgia, 'Times New Roman', serif",
  body: "'Segoe UI', system-ui, -apple-system, Arial, sans-serif",
};

const isMobile = () => window.innerWidth < 768;

const styles = {
  container: { maxWidth: "580px", margin: "0 auto", padding: "20px 16px 100px", fontFamily: font.body, backgroundColor: theme.bg, minHeight: "100vh" },
  title: { fontSize: "22px", fontWeight: "700", color: theme.primary, marginBottom: "4px", fontFamily: font.heading },
  subtitle: { fontSize: "13px", color: theme.textSecondary, marginBottom: "20px" },
  form: { display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontSize: "11px", fontWeight: "700", color: theme.textSecondary, marginTop: "12px", textTransform: "uppercase", letterSpacing: "0.6px" },
  input: { padding: "11px 14px", fontSize: "15px", borderRadius: "6px", border: `1.5px solid ${theme.border}`, width: "100%", boxSizing: "border-box", backgroundColor: "white", outline: "none", fontFamily: font.body },
  textarea: { padding: "11px 14px", fontSize: "15px", borderRadius: "6px", border: `1.5px solid ${theme.border}`, width: "100%", boxSizing: "border-box", minHeight: "80px", backgroundColor: "white", fontFamily: font.body },
  button: { marginTop: "14px", padding: "13px 20px", fontSize: "15px", backgroundColor: theme.primary, color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "700", fontFamily: font.body },
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

function PasswordInput({ placeholder, value, onChange, required }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input style={{...styles.input, paddingRight: "60px"}} type={show ? "text" : "password"} placeholder={placeholder || "Password"} value={value} onChange={onChange} required={required} />
      <button type="button" onClick={() => setShow(!show)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: theme.accent, fontWeight: "700", padding: 0 }}>
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

function VantageLogo({ size = 40, dark = false }) {
  const bg = dark ? "#1a3d2b" : "transparent";
  const textColor = dark ? "white" : "#1a3d2b";
  const subColor = dark ? "rgba(255,255,255,0.6)" : "#5c5c5c";
  const lineColor = "#c8973a";
  const scale = size / 40;

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", backgroundColor: bg, padding: dark ? "12px 20px" : "0", borderRadius: dark ? "6px" : "0" }}>
      <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: Math.round(16 * scale) + "px", fontWeight: "700", color: textColor, letterSpacing: Math.round(4 * scale) + "px", lineHeight: 1, whiteSpace: "nowrap" }}>
        VANTAGE
      </span>
      <div style={{ width: "100%", height: "1px", backgroundColor: lineColor, margin: "4px 0" }} />
      <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: Math.round(8 * scale) + "px", fontWeight: "400", color: subColor, letterSpacing: Math.round(5 * scale) + "px", lineHeight: 1, whiteSpace: "nowrap" }}>
        LOGIC
      </span>
    </div>
  );
}

function NavBar({ view, setView, role, onLogout }) {
  const [mobile, setMobile] = useState(isMobile());

  useEffect(() => {
    const handler = () => setMobile(isMobile());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const tabs = [
    { id: "timesheet", label: "Hours", icon: "⏱" },
    { id: "materials", label: "Materials", icon: "🔧" },
    { id: "mileage", label: "Mileage", icon: "🚗" },
    ...(role === "owner" || role === "admin" ? [
      { id: "dashboard", label: "Dashboard", icon: "📊" },
      { id: "admin", label: "Admin", icon: "⚙️" },
    ] : []),
  ];

  if (mobile) {
    return (
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: theme.primary, zIndex: 1000, display: "flex", justifyContent: "space-around", padding: "8px 0 10px", boxShadow: "0 -2px 12px rgba(0,0,0,0.2)" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "4px 10px", borderRadius: "8px", backgroundColor: view === tab.id ? "rgba(255,255,255,0.15)" : "transparent" }}>
            <span style={{ fontSize: "20px" }}>{tab.icon}</span>
            <span style={{ fontSize: "10px", color: view === tab.id ? "white" : "rgba(255,255,255,0.55)", fontWeight: view === tab.id ? "700" : "400" }}>{tab.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: theme.sidebarWidth, backgroundColor: theme.primary, display: "flex", flexDirection: "column", zIndex: 1000, boxShadow: "2px 0 16px rgba(0,0,0,0.15)" }}>
      <div style={{ padding: "28px 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <VantageLogo size={36} dark={true} />
      </div>
      <div style={{ flex: 1, padding: "12px" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "8px", border: "none", cursor: "pointer", marginBottom: "4px", backgroundColor: view === tab.id ? "rgba(255,255,255,0.15)" : "transparent", color: view === tab.id ? "white" : "rgba(255,255,255,0.6)", fontFamily: font.body, fontSize: "14px", fontWeight: view === tab.id ? "700" : "400", textAlign: "left" }}>
            <span style={{ fontSize: "18px" }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <div style={{ padding: "16px 12px 28px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button onClick={onLogout} style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "transparent", color: "rgba(255,255,255,0.75)", cursor: "pointer", fontFamily: font.body, fontSize: "13px", fontWeight: "600", textAlign: "center" }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: "10px", borderRadius: "8px", overflow: "hidden", border: `1px solid ${theme.border}` }}>
      <div onClick={() => setOpen(!open)} style={{ backgroundColor: theme.primary, color: "white", padding: "13px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "700", fontSize: "14px", fontFamily: font.body }}>
        <span>{title}</span>
        <span style={{ fontSize: "11px", opacity: 0.6 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && <div style={{ backgroundColor: "white", padding: "16px" }}>{children}</div>}
    </div>
  );
}

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
    <div style={{ backgroundColor: "white", borderRadius: "10px", padding: "18px", marginBottom: "16px", border: `2px solid ${theme.accent}`, boxShadow: "0 2px 12px rgba(45,106,79,0.12)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
        <div>
          <div style={{ fontWeight: "700", fontSize: "15px", color: theme.primary, fontFamily: font.heading }}>Get started</div>
          <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "2px" }}>Three steps to get your team running</div>
        </div>
        <button onClick={onDismiss} style={{ fontSize: "22px", color: theme.textLight, background: "none", border: "none", cursor: "pointer", lineHeight: 1, padding: "0 0 0 12px", fontWeight: "300" }}>×</button>
      </div>
      {steps.map((step, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "10px 0", borderBottom: i < steps.length - 1 ? `1px solid ${theme.border}` : "none" }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: step.done ? theme.accent : theme.border, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
            <span style={{ fontSize: "12px", color: "white", fontWeight: "700" }}>{step.done ? "✓" : i + 1}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: step.done ? theme.textSecondary : theme.textPrimary, textDecoration: step.done ? "line-through" : "none" }}>{step.label}</div>
            <div style={{ fontSize: "11px", color: theme.textLight, marginTop: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>{step.hint}</span>
              {step.copyable && (
                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(step.hint); }} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "4px", border: "none", cursor: "pointer", backgroundColor: theme.accent, color: "white", fontWeight: "700" }}>Copy</button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── LOGIN — uses regular fetch intentionally (401 = wrong password, not expired token)
function Login({ onLogin, onSignUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
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
    <div style={{ minHeight: "100vh", backgroundColor: theme.bg, display: "flex", fontFamily: font.body }}>
      <div style={{ display: "none", flex: 1, backgroundColor: theme.primary, flexDirection: "column", justifyContent: "center", padding: "60px", minHeight: "100vh" }} className="vl-login-panel">
        <VantageLogo size={52} color="white" textColor="white" />
        <div style={{ marginTop: "48px" }}>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "white", fontFamily: font.heading, lineHeight: 1.3, marginBottom: "16px" }}>Built for trades.<br />Built for the field.</div>
          <div style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>Real-time job costing, crew tracking, and profit visibility — purpose-built for how contractors actually work.</div>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "40px 36px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 24px rgba(26,61,43,0.08)", border: `1px solid ${theme.border}` }}>
          <div style={{ marginBottom: "32px" }}>
            <VantageLogo size={40} dark={false} />
          </div>
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@yourcompany.com" />
            <label style={styles.label}>Password</label>
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p style={{ color: theme.danger, fontSize: "13px", margin: "6px 0 0" }}>{error}</p>}
            <button style={{...styles.button, marginTop: "24px"}} type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <div style={{ textAlign: "center", marginTop: "24px", paddingTop: "20px", borderTop: `1px solid ${theme.border}` }}>
            <p style={{ fontSize: "13px", color: theme.textSecondary, margin: "0 0 12px" }}>No account yet?</p>
            <button onClick={onSignUp} style={{ fontSize: "14px", color: "white", background: theme.accent, border: "none", borderRadius: "6px", padding: "10px 28px", cursor: "pointer", fontWeight: "700", fontFamily: font.body }}>
              Start Free Trial
            </button>
          </div>
          <p style={{ textAlign: "center", fontSize: "11px", color: theme.textLight, marginTop: "16px" }}>Forgot your password? Contact your administrator.</p>
        </div>
      </div>
    </div>
  );
}

// ─── SIGN UP — uses regular fetch intentionally (401 = wrong password, not expired token)
function SignUp({ onLogin, onBack }) {
  const [form, setForm] = useState({ company_name: "", email: "", password: "", confirm_password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm_password) { setError("Passwords do not match"); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true); setError("");
    const params = new URLSearchParams({ company_name: form.company_name, email: form.email, password: form.password });
    const response = await fetch(`${API}/signup?${params}`, { method: "POST" });
    setLoading(false);
    if (response.ok) {
      const data = await response.json();
      onLogin(data.access_token, data.role, true);
    } else {
      const data = await response.json();
      setError(data.detail || "Sign up failed. Please try again.");
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font.body, padding: "24px" }}>
      <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "40px 36px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 24px rgba(26,61,43,0.08)", border: `1px solid ${theme.border}` }}>
        <div style={{ marginBottom: "28px" }}>
          <VantageLogo size={36} dark={false} />
        </div>
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "22px", fontWeight: "700", color: theme.primary, fontFamily: font.heading }}>Start Your Free Trial</div>
          <p style={{ fontSize: "13px", color: theme.textSecondary, margin: "6px 0 0" }}>30 days free — no credit card required</p>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Company Name</label>
          <input style={styles.input} placeholder="e.g. Johnson Electrical" value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} required />
          <label style={styles.label}>Your Email</label>
          <input style={styles.input} type="email" placeholder="you@yourcompany.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <label style={styles.label}>Password</label>
          <PasswordInput placeholder="At least 8 characters" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <label style={styles.label}>Confirm Password</label>
          <PasswordInput placeholder="Confirm your password" value={form.confirm_password} onChange={e => setForm({...form, confirm_password: e.target.value})} required />
          {error && <p style={{ color: theme.danger, fontSize: "13px", margin: "6px 0 0" }}>{error}</p>}
          <button style={{...styles.button, marginTop: "24px", backgroundColor: theme.accent}} type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Free Account"}
          </button>
        </form>
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button onClick={onBack} style={{ fontSize: "13px", color: theme.textSecondary, background: "none", border: "none", cursor: "pointer" }}>Already have an account? Sign in</button>
        </div>
      </div>
    </div>
  );
}

function TimesheetForm({ token }) {
  const [formData, setFormData] = useState({ employee_id: "", job_id: "", cost_code_id: "", shift_date: "", hours_worked: "", field_notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [costCodes, setCostCodes] = useState([]);
  const [linkedEmployeeId, setLinkedEmployeeId] = useState(null);
  const [linkedEmployeeName, setLinkedEmployeeName] = useState("");

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    apiFetch(`${API}/me`, { headers: h }).then(r => r.json()).then(data => {
      if (data.employee_id) {
        setLinkedEmployeeId(data.employee_id);
        setFormData(prev => ({ ...prev, employee_id: data.employee_id }));
      }
    });
    apiFetch(`${API}/employees`, { headers: h }).then(r => r.json()).then(setEmployees);
    apiFetch(`${API}/jobs`, { headers: h }).then(r => r.json()).then(data => setJobs(data.filter(j => j.status === "active")));
    apiFetch(`${API}/cost-codes`, { headers: h }).then(r => r.json()).then(setCostCodes);
  }, [token]);

  useEffect(() => {
    if (linkedEmployeeId && employees.length > 0) {
      const emp = employees.find(e => e.employee_id === linkedEmployeeId);
      if (emp) setLinkedEmployeeName(`${emp.first_name} ${emp.last_name}`);
    }
  }, [linkedEmployeeId, employees]);

  function handleChange(e) { setFormData({ ...formData, [e.target.name]: e.target.value }); }

  async function handleSubmit(e) {
    e.preventDefault();
    const response = await apiFetch(`${API}/timesheets?${new URLSearchParams(formData)}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: "center", marginTop: "80px" }}>
          <div style={{ width: "64px", height: "64px", backgroundColor: theme.accentLight, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "28px" }}>✓</div>
          <h2 style={{ fontSize: "22px", fontWeight: "700", color: theme.primary, fontFamily: font.heading, margin: "0 0 8px" }}>Hours logged.</h2>
          <p style={{ color: theme.textSecondary, fontSize: "14px", margin: "0 0 32px" }}>Entry saved successfully.</p>
          <button style={styles.button} onClick={() => setSubmitted(false)}>Log Another</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Log Hours</h1>
      <p style={styles.subtitle}>Field entry — Vantage Logic</p>
      <div style={{ backgroundColor: "white", borderRadius: "10px", padding: "20px", border: `1px solid ${theme.border}`, boxShadow: "0 1px 6px rgba(26,61,43,0.05)" }}>
        <form onSubmit={handleSubmit} style={styles.form}>
          {linkedEmployeeId ? (
            <div style={{ padding: "10px 14px", backgroundColor: theme.accentLight, borderRadius: "6px", border: `1px solid ${theme.accent}`, fontSize: "13px", fontWeight: "600", color: theme.accent, marginBottom: "4px" }}>
              Logging as {linkedEmployeeName || "your account"}
            </div>
          ) : (
            <>
              <label style={styles.label}>Employee</label>
              <select style={styles.input} name="employee_id" value={formData.employee_id} onChange={handleChange} required>
                <option value="">Select employee</option>
                {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
              </select>
            </>
          )}
          <label style={styles.label}>Job</label>
          <select style={styles.input} name="job_id" value={formData.job_id} onChange={handleChange} required>
            <option value="">Select job</option>
            {jobs.map(job => <option key={job.job_id} value={job.job_id}>{job.job_name}</option>)}
          </select>
          <label style={styles.label}>Cost Code</label>
          <select style={styles.input} name="cost_code_id" value={formData.cost_code_id} onChange={handleChange} required>
            <option value="">Select cost code</option>
            {costCodes.map(cc => <option key={cc.cost_code_id} value={cc.cost_code_id}>{cc.code} — {cc.description}</option>)}
          </select>
          <label style={styles.label}>Date</label>
          <input style={styles.input} name="shift_date" type="date" value={formData.shift_date} onChange={handleChange} required />
          <label style={styles.label}>Hours Worked</label>
          <input style={styles.input} name="hours_worked" type="number" step="0.5" placeholder="e.g. 8.5" value={formData.hours_worked} onChange={handleChange} required />
          <label style={styles.label}>Field Notes</label>
          <textarea style={styles.textarea} name="field_notes" placeholder="What did you work on today? (optional)" value={formData.field_notes} onChange={handleChange} />
          <button style={styles.button} type="submit">Submit Timesheet</button>
        </form>
      </div>
    </div>
  );
}

function MaterialsForm({ token }) {
  const [formData, setFormData] = useState({ job_id: "", employee_id: "", supplier: "", description: "", total_cost: "", purchase_date: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    apiFetch(`${API}/jobs`, { headers: h }).then(r => r.json()).then(data => setJobs(data.filter(j => j.status === "active")));
    apiFetch(`${API}/employees`, { headers: h }).then(r => r.json()).then(setEmployees);
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    const response = await apiFetch(`${API}/materials?${new URLSearchParams(formData)}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: "center", marginTop: "80px" }}>
          <div style={{ width: "64px", height: "64px", backgroundColor: theme.accentLight, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "28px" }}>✓</div>
          <h2 style={{ fontSize: "22px", fontWeight: "700", color: theme.primary, fontFamily: font.heading, margin: "0 0 8px" }}>Materials logged.</h2>
          <p style={{ color: theme.textSecondary, fontSize: "14px", margin: "0 0 32px" }}>Purchase recorded successfully.</p>
          <button style={styles.button} onClick={() => setSubmitted(false)}>Log Another</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Log Materials</h1>
      <p style={styles.subtitle}>Record a material purchase</p>
      <div style={{ backgroundColor: "white", borderRadius: "10px", padding: "20px", border: `1px solid ${theme.border}`, boxShadow: "0 1px 6px rgba(26,61,43,0.05)" }}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Job</label>
          <select style={styles.input} value={formData.job_id} onChange={e => setFormData({...formData, job_id: e.target.value})} required>
            <option value="">Select job</option>
            {jobs.map(job => <option key={job.job_id} value={job.job_id}>{job.job_name}</option>)}
          </select>
          <label style={styles.label}>Purchased By</label>
          <select style={styles.input} value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})}>
            <option value="">Select employee</option>
            {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
          </select>
          <label style={styles.label}>Supplier</label>
          <input style={styles.input} placeholder="e.g. Home Depot" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
          <label style={styles.label}>Description</label>
          <input style={styles.input} placeholder="e.g. Copper fittings" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
          <label style={styles.label}>Total Amount ($)</label>
          <input style={styles.input} type="number" step="0.01" placeholder="0.00" value={formData.total_cost} onChange={e => setFormData({...formData, total_cost: e.target.value})} required />
          <label style={styles.label}>Purchase Date</label>
          <input style={styles.input} type="date" value={formData.purchase_date} onChange={e => setFormData({...formData, purchase_date: e.target.value})} required />
          <label style={styles.label}>Notes (optional)</label>
          <textarea style={styles.textarea} placeholder="Any additional notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          <button style={styles.button} type="submit">Log Materials</button>
        </form>
      </div>
    </div>
  );
}

function MileageForm({ token }) {
  const [formData, setFormData] = useState({ job_id: "", employee_id: "", trip_date: "", km_driven: "", purpose: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [linkedEmployeeId, setLinkedEmployeeId] = useState(null);
  const [linkedEmployeeName, setLinkedEmployeeName] = useState("");
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    apiFetch(`${API}/me`, { headers: h }).then(r => r.json()).then(data => {
      if (data.employee_id) {
        setLinkedEmployeeId(data.employee_id);
        setFormData(prev => ({ ...prev, employee_id: data.employee_id }));
      }
    });
    apiFetch(`${API}/jobs`, { headers: h }).then(r => r.json()).then(data => setJobs(data.filter(j => j.status === "active")));
    apiFetch(`${API}/employees`, { headers: h }).then(r => r.json()).then(emps => {
      setEmployees(emps);
    });
  }, [token]);

  useEffect(() => {
    if (linkedEmployeeId && employees.length > 0) {
      const emp = employees.find(e => e.employee_id === linkedEmployeeId);
      if (emp) setLinkedEmployeeName(`${emp.first_name} ${emp.last_name}`);
    }
  }, [linkedEmployeeId, employees]);

  function handleChange(e) { setFormData({ ...formData, [e.target.name]: e.target.value }); }

  async function handleSubmit(e) {
    e.preventDefault();
    const response = await apiFetch(`${API}/mileage?${new URLSearchParams(formData)}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: "center", marginTop: "80px" }}>
          <div style={{ width: "64px", height: "64px", backgroundColor: theme.accentLight, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "28px" }}>✓</div>
          <h2 style={{ fontSize: "22px", fontWeight: "700", color: theme.primary, fontFamily: font.heading, margin: "0 0 8px" }}>Mileage logged.</h2>
          <p style={{ color: theme.textSecondary, fontSize: "14px", margin: "0 0 32px" }}>Trip recorded successfully.</p>
          <button style={styles.button} onClick={() => setSubmitted(false)}>Log Another</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Log Mileage</h1>
      <p style={styles.subtitle}>Record a trip for a job</p>
      <div style={{ backgroundColor: "white", borderRadius: "10px", padding: "20px", border: `1px solid ${theme.border}`, boxShadow: "0 1px 6px rgba(26,61,43,0.05)" }}>
        <form onSubmit={handleSubmit} style={styles.form}>
          {linkedEmployeeId ? (
            <div style={{ padding: "10px 14px", backgroundColor: theme.accentLight, borderRadius: "6px", border: `1px solid ${theme.accent}`, fontSize: "13px", fontWeight: "600", color: theme.accent, marginBottom: "4px" }}>
              Logging as {linkedEmployeeName || "your account"}
            </div>
          ) : (
            <>
              <label style={styles.label}>Employee</label>
              <select style={styles.input} name="employee_id" value={formData.employee_id} onChange={handleChange} required>
                <option value="">Select employee</option>
                {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
              </select>
            </>
          )}
          <label style={styles.label}>Job</label>
          <select style={styles.input} name="job_id" value={formData.job_id} onChange={handleChange} required>
            <option value="">Select job</option>
            {jobs.map(job => <option key={job.job_id} value={job.job_id}>{job.job_name}</option>)}
          </select>
          <label style={styles.label}>Date</label>
          <input style={styles.input} name="trip_date" type="date" value={formData.trip_date} onChange={handleChange} required />
          <label style={styles.label}>KM Driven</label>
          <input style={styles.input} name="km_driven" type="number" step="0.1" placeholder="e.g. 45.5" value={formData.km_driven} onChange={handleChange} required />
          <label style={styles.label}>Purpose (optional)</label>
          <input style={styles.input} name="purpose" placeholder="e.g. Site visit, Supply run" value={formData.purpose} onChange={handleChange} />
          <label style={styles.label}>Notes (optional)</label>
          <textarea style={styles.textarea} name="notes" placeholder="Any additional notes" value={formData.notes} onChange={handleChange} />
          <button style={styles.button} type="submit">Log Mileage</button>
        </form>
      </div>
    </div>
  );
}

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
  const [empForm, setEmpForm] = useState({ first_name: "", last_name: "", role: "", hourly_rate: "", burden_rate: "" });
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
    if (res.ok) { showMsg("Employee added."); setEmpForm({ first_name: "", last_name: "", role: "", hourly_rate: "", burden_rate: "" }); refresh(); }
    else showMsg("Error adding employee.");
  }

  async function updateEmployee() {
    const res = await apiFetch(`${API}/employees/${editingEmp.employee_id}?${new URLSearchParams(empForm)}`, { method: "PATCH", headers });
    if (res.ok) { showMsg("Employee updated."); setEditingEmp(null); setEmpForm({ first_name: "", last_name: "", role: "", hourly_rate: "", burden_rate: "" }); refresh(); }
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

  function startEditEmp(emp) { setEditingEmp(emp); setEmpForm({ first_name: emp.first_name, last_name: emp.last_name, role: emp.role || "", hourly_rate: emp.hourly_rate || "", burden_rate: emp.burden_rate || "" }); }
  function startEditJob(job) { setEditingJob(job); setJobForm({ job_name: job.job_name, city: job.city || "", contract_value: job.contract_value || "", budgeted_hours: job.budgeted_hours || "" }); }
  function startEditCc(cc) { setEditingCc(cc); setCcForm({ code: cc.code, description: cc.description, category: cc.category || "" }); }

  const activeEmps = employees.filter(e => e.active);
  const inactiveEmps = employees.filter(e => !e.active);
  const activeJobs = jobs.filter(j => j.status === "active");
  const completedJobs = jobs.filter(j => j.status === "completed");
  const inactiveJobs = jobs.filter(j => j.status === "inactive");

  const Btn = ({ label, bg, color, onClick }) => (
    <button onClick={onClick} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "4px", border: "none", cursor: "pointer", backgroundColor: bg, color, fontWeight: "700", fontFamily: font.body, whiteSpace: "nowrap" }}>{label}</button>
  );

  const Row = ({ main, sub, actions }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", backgroundColor: theme.bg, borderRadius: "6px", marginBottom: "6px", border: `1px solid ${theme.border}`, gap: "8px" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: "600", fontSize: "13px", color: theme.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{main}</div>
        {sub && <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "2px" }}>{sub}</div>}
      </div>
      <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>{actions}</div>
    </div>
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Admin Panel</h1>
      <p style={styles.subtitle}>Manage your team, jobs, and access</p>
      {message && <div style={{ color: theme.accent, fontWeight: "600", marginBottom: "14px", backgroundColor: theme.accentLight, padding: "10px 14px", borderRadius: "6px", fontSize: "13px", border: `1px solid ${theme.accent}` }}>{message}</div>}

      <CollapsibleSection title="Employees">
        <p style={{ fontSize: "11px", fontWeight: "700", color: theme.textSecondary, marginBottom: "10px", marginTop: 0, textTransform: "uppercase", letterSpacing: "0.6px" }}>
          {editingEmp ? `Editing: ${editingEmp.first_name} ${editingEmp.last_name}` : "Add New Employee"}
        </p>
        {["first_name:First Name", "last_name:Last Name", "role:Role (e.g. Electrician)"].map(f => {
          const [key, ph] = f.split(":");
          return <input key={key} style={{...styles.input, marginBottom: "6px"}} placeholder={ph} value={empForm[key]} onChange={e => setEmpForm({...empForm, [key]: e.target.value})} />;
        })}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          <input style={styles.input} placeholder="Hourly Rate" type="number" value={empForm.hourly_rate} onChange={e => setEmpForm({...empForm, hourly_rate: e.target.value})} />
          <input style={styles.input} placeholder="Burden Rate" type="number" value={empForm.burden_rate} onChange={e => setEmpForm({...empForm, burden_rate: e.target.value})} />
        </div>
        {editingEmp ? (
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button style={{...styles.button, flex: 1, marginTop: 0}} onClick={updateEmployee}>Save Changes</button>
            <button style={{...styles.button, backgroundColor: "#888", flex: 1, marginTop: 0}} onClick={() => { setEditingEmp(null); setEmpForm({ first_name: "", last_name: "", role: "", hourly_rate: "", burden_rate: "" }); }}>Cancel</button>
          </div>
        ) : <button style={styles.button} onClick={addEmployee}>Add Employee</button>}

        {activeEmps.length > 0 && <div style={{ marginTop: "16px" }}>
          <p style={{ fontSize: "11px", color: theme.textSecondary, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "700" }}>Active</p>
          {activeEmps.map(emp => <Row key={emp.employee_id} main={`${emp.first_name} ${emp.last_name}`} sub={`${emp.role || "—"} · $${emp.hourly_rate}/hr · Burden $${emp.burden_rate}/hr`} actions={[<Btn key="e" label="Edit" bg={theme.accentLight} color={theme.accent} onClick={() => startEditEmp(emp)} />, <Btn key="a" label="Archive" bg={theme.dangerLight} color={theme.danger} onClick={() => toggleEmployee(emp)} />]} />)}
        </div>}
        {inactiveEmps.length > 0 && <div style={{ marginTop: "8px" }}>
          <button onClick={() => setShowInactiveEmp(!showInactiveEmp)} style={{ fontSize: "12px", color: theme.textSecondary, background: "none", border: "none", cursor: "pointer", padding: 0 }}>{showInactiveEmp ? "Hide" : "Show"} archived ({inactiveEmps.length})</button>
          {showInactiveEmp && inactiveEmps.map(emp => <Row key={emp.employee_id} main={`${emp.first_name} ${emp.last_name}`} actions={[<Btn key="r" label="Restore" bg={theme.accentLight} color={theme.accent} onClick={() => toggleEmployee(emp)} />]} />)}
        </div>}
      </CollapsibleSection>

      <CollapsibleSection title="Jobs">
        <p style={{ fontSize: "11px", fontWeight: "700", color: theme.textSecondary, marginBottom: "10px", marginTop: 0, textTransform: "uppercase", letterSpacing: "0.6px" }}>
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
          <p style={{ fontSize: "11px", color: theme.textSecondary, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "700" }}>Active</p>
          {activeJobs.map(job => <Row key={job.job_id} main={job.job_name} sub={`${job.city || ""}${job.contract_value ? ` · $${fmt(job.contract_value)}` : ""}${job.budgeted_hours ? ` · ${job.budgeted_hours}h` : ""}`} actions={[<Btn key="e" label="Edit" bg={theme.accentLight} color={theme.accent} onClick={() => startEditJob(job)} />, <Btn key="c" label="Complete" bg="#e8f5ee" color={theme.accent} onClick={() => setJobStatus(job, "completed")} />, <Btn key="a" label="Archive" bg={theme.dangerLight} color={theme.danger} onClick={() => setJobStatus(job, "inactive")} />]} />)}
        </div>}
        {completedJobs.length > 0 && <div style={{ marginTop: "8px" }}>
          <p style={{ fontSize: "11px", color: theme.accent, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "700" }}>Completed</p>
          {completedJobs.map(job => <Row key={job.job_id} main={job.job_name} actions={[<Btn key="r" label="Reactivate" bg={theme.accentLight} color={theme.accent} onClick={() => setJobStatus(job, "active")} />]} />)}
        </div>}
        {inactiveJobs.length > 0 && <div style={{ marginTop: "8px" }}>
          <button onClick={() => setShowInactiveJob(!showInactiveJob)} style={{ fontSize: "12px", color: theme.textSecondary, background: "none", border: "none", cursor: "pointer", padding: 0 }}>{showInactiveJob ? "Hide" : "Show"} archived ({inactiveJobs.length})</button>
          {showInactiveJob && inactiveJobs.map(job => <Row key={job.job_id} main={job.job_name} actions={[<Btn key="r" label="Restore" bg={theme.accentLight} color={theme.accent} onClick={() => setJobStatus(job, "active")} />]} />)}
        </div>}
      </CollapsibleSection>

      <CollapsibleSection title="Cost Codes">
        <p style={{ fontSize: "11px", fontWeight: "700", color: theme.textSecondary, marginBottom: "10px", marginTop: 0, textTransform: "uppercase", letterSpacing: "0.6px" }}>
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
          <p style={{ fontSize: "11px", color: theme.textSecondary, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "700" }}>Current</p>
          {costCodes.map(cc => <Row key={cc.cost_code_id} main={`${cc.code} — ${cc.description}`} sub={cc.category} actions={[<Btn key="e" label="Edit" bg={theme.accentLight} color={theme.accent} onClick={() => startEditCc(cc)} />]} />)}
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
        {loginError && <p style={{ color: theme.danger, fontSize: "13px", margin: "0 0 8px" }}>{loginError}</p>}
        <select style={{...styles.input, marginBottom: "6px"}} value={loginForm.employee_role} onChange={e => setLoginForm({...loginForm, employee_role: e.target.value})}>
          <option value="crew">Crew</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
        <button style={{...styles.button, backgroundColor: theme.accent}} onClick={createLogin}>Create Login</button>
      </CollapsibleSection>
    </div>
  );
}

function Dashboard({ token }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [details, setDetails] = useState({});
  const [filter, setFilter] = useState("active");
  const [timeFilter, setTimeFilter] = useState("all");

  useEffect(() => {
    apiFetch(`${API}/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => { setJobs(data); setLoading(false); });
  }, [token]);

  const filtered = jobs.filter(j => {
    const statusMatch = filter === "all" || j.status === filter;
    return statusMatch;
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

  return (
    <div style={{ fontFamily: font.body, backgroundColor: theme.bg, minHeight: "100vh", paddingBottom: "80px" }}>
      <div style={{ background: `linear-gradient(135deg, ${theme.primaryDark} 0%, ${theme.primary} 60%, ${theme.accent} 100%)`, padding: "28px 20px 32px", color: "white" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ marginBottom: "20px" }}>
            <VantageLogo size={32} dark={true} />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 4px", fontFamily: font.heading }}>Project Overview</h1>
          <p style={{ fontSize: "13px", opacity: 0.6, margin: "0 0 20px" }}>Live job profitability</p>
          <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
            {["active", "completed", "all"].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "5px 14px", borderRadius: "20px", border: filter === f ? "none" : "1px solid rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "12px", fontWeight: "700", backgroundColor: filter === f ? "white" : "transparent", color: filter === f ? theme.primary : "white", fontFamily: font.body }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "18px", flexWrap: "wrap" }}>
            {[["all", "All Time"], ["week", "This Week"], ["month", "This Month"]].map(([val, label]) => (
              <button key={val} onClick={() => setTimeFilter(val)} style={{ padding: "4px 12px", borderRadius: "20px", border: timeFilter === val ? "none" : "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontSize: "11px", fontWeight: "600", backgroundColor: timeFilter === val ? theme.gold : "transparent", color: "white", fontFamily: font.body }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            {statCards.map((item, i) => (
              <div key={i} style={{ backgroundColor: item.highlight ? (item.positive ? "rgba(45,106,79,0.9)" : "rgba(184,50,50,0.9)") : "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", borderRadius: "10px", padding: "14px 10px", textAlign: "center", border: item.highlight ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: "15px", fontWeight: "700", letterSpacing: "-0.3px" }}>{item.value}</div>
                <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.6px" }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px", maxWidth: "900px", margin: "0 auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", marginTop: "60px", color: theme.textSecondary }}>Loading...</div>
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
            <div key={job.job_id} onClick={() => toggleJob(job.job_id)} style={{ backgroundColor: "white", borderRadius: "10px", marginBottom: "12px", overflow: "hidden", boxShadow: "0 1px 6px rgba(26,61,43,0.07)", border: `1px solid ${theme.border}`, borderLeft: `4px solid ${barColor}`, cursor: "pointer" }}>
              <div style={{ padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "15px", color: theme.primary, fontFamily: font.heading }}>{job.job_name}</div>
                    <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
                      {job.city && <span>{job.city}</span>}
                      {job.city && <span style={{ opacity: 0.4 }}>·</span>}
                      <span style={{ backgroundColor: job.status === "active" ? theme.accentLight : job.status === "completed" ? "#e8f5ee" : "#f5f5f5", color: job.status === "active" || job.status === "completed" ? theme.accent : "#888", padding: "1px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" }}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {hasBudget && job.margin !== null && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "17px", fontWeight: "700", color: over ? theme.danger : theme.accent, fontFamily: font.heading }}>
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
                    <div key={label} style={{ backgroundColor: theme.bg, borderRadius: "6px", padding: "9px 8px", textAlign: "center", border: `1px solid ${theme.border}` }}>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: theme.primary }}>${fmt(val)}</div>
                      <div style={{ fontSize: "10px", color: theme.textSecondary, marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</div>
                    </div>
                  ))}
                </div>
                {job.budgeted_hours > 0 && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: theme.textSecondary, marginBottom: "5px" }}>
                      <span>{job.total_hours}h of {job.budgeted_hours}h budgeted</span>
                      <span style={{ color: overHours ? theme.danger : tight ? theme.warning : theme.textSecondary, fontWeight: "700" }}>{pct.toFixed(0)}%</span>
                    </div>
                    <div style={{ backgroundColor: theme.border, borderRadius: "3px", height: "5px" }}>
                      <div style={{ width: `${pct}%`, height: "5px", borderRadius: "3px", backgroundColor: barColor, transition: "width 0.3s" }} />
                    </div>
                  </div>
                )}
                {(over || overHours) && (
                  <div style={{ marginTop: "10px", padding: "8px 12px", backgroundColor: "#fdf0ee", borderRadius: "6px", border: `1px solid ${theme.danger}`, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px" }}>⚠️</span>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: theme.danger }}>
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
                <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${theme.border}` }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: theme.textSecondary, marginBottom: "10px", paddingTop: "14px", textTransform: "uppercase", letterSpacing: "0.6px" }}>Timesheet Entries</div>
                  {details[job.job_id] ? (
                    details[job.job_id].timesheets.length === 0
                      ? <p style={{ fontSize: "12px", color: theme.textSecondary, margin: 0 }}>No entries yet.</p>
                      : details[job.job_id].timesheets.map((t, i) => (
                        <div key={i} style={{ marginBottom: "6px", padding: "8px 10px", backgroundColor: theme.bg, borderRadius: "6px", border: `1px solid ${theme.border}` }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", fontSize: "12px", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontWeight: "600", color: theme.textPrimary }}>{t.employee_name}</span>
                            <span style={{ color: theme.textSecondary, whiteSpace: "nowrap" }}>{t.shift_date}</span>
                            <span style={{ fontWeight: "700", color: theme.primary, whiteSpace: "nowrap", minWidth: "32px", textAlign: "right" }}>{t.hours_worked}h</span>
                          </div>
                          {t.field_notes && t.field_notes.toLowerCase() !== "yes" && t.field_notes.toLowerCase() !== "no" && (
                            <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "4px", fontStyle: "italic" }}>{t.field_notes}</div>
                          )}
                        </div>
                      ))
                  ) : <p style={{ fontSize: "12px", color: theme.textSecondary }}>Loading...</p>}
                  {details[job.job_id]?.materials?.length > 0 && (
                    <div style={{ marginTop: "14px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: theme.textSecondary, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.6px" }}>Materials</div>
                      {details[job.job_id].materials.map((m, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", fontSize: "12px", color: theme.textPrimary, padding: "6px 0", borderBottom: `1px solid ${theme.border}`, alignItems: "center", gap: "12px" }}>
                          <span style={{ fontWeight: "600" }}>{m.supplier || "Unknown"}</span>
                          <span style={{ color: theme.textSecondary, whiteSpace: "nowrap" }}>{m.description}</span>
                          <span style={{ fontWeight: "700", color: theme.gold, whiteSpace: "nowrap", textAlign: "right" }}>${fmt(m.total_cost)}</span>
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
    </div>
  );
}

export default function App() {
  const stored = getStoredAuth();
  const [token, setToken] = useState(stored.token);
  const [role, setRole] = useState(stored.role);
  const [view, setView] = useState("timesheet");
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
    setView("timesheet");
    if (newUser) setShowOnboarding(true);
  }

  function handleLogout() {
    setStoredAuth(null, null);
    setToken(null);
    setRole(null);
    setView("timesheet");
    setShowSignUp(false);
    setShowOnboarding(false);
  }

  if (!token) {
    if (showSignUp) return <SignUp onLogin={handleLogin} onBack={() => setShowSignUp(false)} />;
    return <Login onLogin={handleLogin} onSignUp={() => setShowSignUp(true)} />;
  }

  const sidebarOffset = !mobile ? theme.sidebarWidth : "0px";

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: "100vh" }}>
      <NavBar view={view} setView={setView} role={role} onLogout={handleLogout} />
      <div style={{ marginLeft: sidebarOffset, transition: "margin-left 0.2s" }}>
        {showOnboarding && (role === "owner" || role === "admin") && view === "timesheet" && (
          <div style={{ maxWidth: "580px", margin: "0 auto", padding: "16px 16px 0" }}>
            <OnboardingChecklist token={token} onDismiss={() => setShowOnboarding(false)} />
          </div>
        )}
        {view === "timesheet" && <TimesheetForm token={token} />}
        {view === "materials" && <MaterialsForm token={token} />}
        {view === "mileage" && <MileageForm token={token} />}
        {view === "dashboard" && <Dashboard token={token} />}
        {view === "admin" && <AdminScreen token={token} />}
        {mobile && (
          <div style={{ padding: "8px 16px 90px", textAlign: "center" }}>
            <button onClick={handleLogout} style={{ fontSize: "13px", color: "white", background: theme.danger, border: "none", borderRadius: "6px", padding: "9px 24px", cursor: "pointer", fontWeight: "700", fontFamily: font.body }}>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}