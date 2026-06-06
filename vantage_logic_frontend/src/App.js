import { useState, useEffect } from "react";

const API = "https://contractor-api-pi7o.onrender.com";

const theme = {
  primary: "#1a3d2b",
  primaryHover: "#2d6a4f",
  accent: "#2d6a4f",
  accentLight: "#e8f5ee",
  gold: "#E8A020",
  danger: "#c0392b",
  dangerLight: "#fdf0ee",
  warning: "#d68910",
  bg: "#f8f7f4",
  bgDark: "#1a3d2b",
  card: "#ffffff",
  border: "#e0ddd8",
  textPrimary: "#1a1a1a",
  textSecondary: "#5a5a5a",
  textLight: "#9a9a9a",
  navBg: "#1a3d2b",
  sidebarWidth: "220px",
};

const font = {
  heading: "Georgia, 'Times New Roman', serif",
  body: "'Segoe UI', system-ui, -apple-system, Arial, sans-serif",
};

const styles = {
  container: {
    maxWidth: "560px",
    margin: "0 auto",
    padding: "20px 16px 100px",
    fontFamily: font.body,
    backgroundColor: theme.bg,
    minHeight: "100vh",
  },
  title: { fontSize: "22px", fontWeight: "700", color: theme.primary, marginBottom: "4px", fontFamily: font.heading },
  subtitle: { fontSize: "13px", color: theme.textSecondary, marginBottom: "20px" },
  form: { display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontSize: "12px", fontWeight: "600", color: theme.textSecondary, marginTop: "10px", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { padding: "11px 14px", fontSize: "15px", borderRadius: "6px", border: `1.5px solid ${theme.border}`, width: "100%", boxSizing: "border-box", backgroundColor: "white", outline: "none", fontFamily: font.body, transition: "border-color 0.2s" },
  textarea: { padding: "11px 14px", fontSize: "15px", borderRadius: "6px", border: `1.5px solid ${theme.border}`, width: "100%", boxSizing: "border-box", minHeight: "80px", backgroundColor: "white", fontFamily: font.body },
  button: { marginTop: "14px", padding: "13px 20px", fontSize: "15px", backgroundColor: theme.primary, color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "700", fontFamily: font.body, letterSpacing: "0.3px" },
  card: { backgroundColor: "white", borderRadius: "10px", padding: "16px", marginBottom: "12px", boxShadow: "0 1px 6px rgba(26,61,43,0.07)", border: `1px solid ${theme.border}` },
  success: { color: theme.accent, textAlign: "center", marginTop: "40px", fontSize: "20px", fontWeight: "700", fontFamily: font.heading },
};

function fmt(n) {
  return Number(n || 0).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getStoredAuth() {
  try {
    return { token: localStorage.getItem("vl_token"), role: localStorage.getItem("vl_role") };
  } catch { return { token: null, role: null }; }
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
      <button type="button" onClick={() => setShow(!show)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: theme.accent, fontWeight: "700", padding: 0, fontFamily: font.body }}>
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

// ─── NAVIGATION ──────────────────────────────────────────────
function NavBar({ view, setView, role, onLogout }) {
  const tabs = [
    { id: "timesheet", label: "Hours", icon: "⏱" },
    { id: "materials", label: "Materials", icon: "🔧" },
    ...(role === "owner" || role === "admin" ? [
      { id: "dashboard", label: "Dashboard", icon: "📊" },
      { id: "admin", label: "Admin", icon: "⚙️" },
    ] : []),
  ];

  return (
    <>
      {/* Desktop: left sidebar */}
      <style>{`
        @media (min-width: 768px) {
          .vl-bottom-nav { display: none !important; }
          .vl-sidebar { display: flex !important; }
          .vl-main-content { margin-left: ${theme.sidebarWidth} !important; }
        }
        @media (max-width: 767px) {
          .vl-bottom-nav { display: flex !important; }
          .vl-sidebar { display: none !important; }
          .vl-main-content { margin-left: 0 !important; }
        }
      `}</style>

      {/* Sidebar for desktop */}
      <div className="vl-sidebar" style={{ display: "none", position: "fixed", top: 0, left: 0, bottom: 0, width: theme.sidebarWidth, backgroundColor: theme.navBg, flexDirection: "column", zIndex: 1000, boxShadow: "2px 0 12px rgba(0,0,0,0.15)" }}>
        <div style={{ padding: "24px 20px 20px" }}>
          <div style={{ fontSize: "18px", fontWeight: "700", color: "white", fontFamily: font.heading, letterSpacing: "0.3px" }}>Vantage Logic</div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "3px" }}>Field Management</div>
        </div>
        <div style={{ flex: 1, padding: "8px 12px" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "8px", border: "none", cursor: "pointer", marginBottom: "4px", backgroundColor: view === tab.id ? "rgba(255,255,255,0.15)" : "transparent", color: view === tab.id ? "white" : "rgba(255,255,255,0.6)", fontFamily: font.body, fontSize: "14px", fontWeight: view === tab.id ? "700" : "400", textAlign: "left", transition: "all 0.15s" }}>
              <span style={{ fontSize: "18px" }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div style={{ padding: "16px 12px 24px" }}>
          <button onClick={onLogout} style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "transparent", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontFamily: font.body, fontSize: "13px", fontWeight: "600", textAlign: "left" }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Bottom nav for mobile */}
      <div className="vl-bottom-nav" style={{ display: "none", position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: theme.navBg, zIndex: 1000, justifyContent: "space-around", padding: "8px 0 10px", boxShadow: "0 -2px 10px rgba(0,0,0,0.15)" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "4px 12px", borderRadius: "8px", backgroundColor: view === tab.id ? "rgba(255,255,255,0.15)" : "transparent" }}>
            <span style={{ fontSize: "20px" }}>{tab.icon}</span>
            <span style={{ fontSize: "10px", color: view === tab.id ? "white" : "rgba(255,255,255,0.55)", fontWeight: view === tab.id ? "700" : "400" }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

// ─── COLLAPSIBLE SECTION ──────────────────────────────────────
function CollapsibleSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: "10px", borderRadius: "8px", overflow: "hidden", border: `1px solid ${theme.border}` }}>
      <div onClick={() => setOpen(!open)} style={{ backgroundColor: theme.primary, color: "white", padding: "13px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "700", fontSize: "14px", fontFamily: font.body }}>
        <span>{title}</span>
        <span style={{ fontSize: "11px", opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && <div style={{ backgroundColor: "white", padding: "16px" }}>{children}</div>}
    </div>
  );
}

// ─── ONBOARDING CHECKLIST ─────────────────────────────────────
function OnboardingChecklist({ token, onDismiss }) {
  const [hasJob, setHasJob] = useState(false);
  const [hasEmployee, setHasEmployee] = useState(false);

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    fetch(`${API}/jobs`, { headers: h }).then(r => r.json()).then(data => setHasJob(data.length > 0));
    fetch(`${API}/employees`, { headers: h }).then(r => r.json()).then(data => setHasEmployee(data.length > 0));
  }, [token]);

  const steps = [
    { label: "Add your first job", done: hasJob, hint: "Go to Admin → Jobs" },
    { label: "Add your first employee", done: hasEmployee, hint: "Go to Admin → Employees" },
    { label: "Share the app link with your crew", done: false, hint: window.location.origin, copyable: true },
  ];

  return (
    <div style={{ backgroundColor: "white", borderRadius: "10px", padding: "16px", marginBottom: "16px", border: `2px solid ${theme.accent}`, boxShadow: "0 2px 8px rgba(45,106,79,0.12)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
        <div>
          <div style={{ fontWeight: "700", fontSize: "15px", color: theme.primary, fontFamily: font.heading }}>Get started</div>
          <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "2px" }}>Three steps to get your team running</div>
        </div>
        <button onClick={onDismiss} style={{ fontSize: "18px", color: theme.textLight, background: "none", border: "none", cursor: "pointer", lineHeight: 1, padding: "0 0 0 8px" }}>×</button>
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

// ─── LOGIN ────────────────────────────────────────────────────
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
    <div style={{ minHeight: "100vh", backgroundColor: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font.body }}>
      <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "40px 36px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 24px rgba(26,61,43,0.1)", margin: "24px", border: `1px solid ${theme.border}` }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "28px", fontWeight: "700", color: theme.primary, fontFamily: font.heading, letterSpacing: "-0.5px" }}>Vantage Logic</div>
          <div style={{ fontSize: "13px", color: theme.textSecondary, marginTop: "6px" }}>Field Management for Trades</div>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@yourcompany.com" />
          <label style={styles.label}>Password</label>
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p style={{ color: theme.danger, fontSize: "13px", margin: "6px 0 0" }}>{error}</p>}
          <button style={{...styles.button, marginTop: "24px", backgroundColor: theme.primary}} type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div style={{ textAlign: "center", marginTop: "24px", paddingTop: "20px", borderTop: `1px solid ${theme.border}` }}>
          <p style={{ fontSize: "13px", color: theme.textSecondary, margin: "0 0 10px" }}>No account yet?</p>
          <button onClick={onSignUp} style={{ fontSize: "14px", color: "white", background: theme.accent, border: "none", borderRadius: "6px", padding: "10px 24px", cursor: "pointer", fontWeight: "700", fontFamily: font.body }}>
            Start Free Trial
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: "11px", color: theme.textLight, marginTop: "16px" }}>Forgot your password? Contact your administrator.</p>
      </div>
    </div>
  );
}

// ─── SIGN UP ──────────────────────────────────────────────────
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
    <div style={{ minHeight: "100vh", backgroundColor: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font.body }}>
      <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "40px 36px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 24px rgba(26,61,43,0.1)", margin: "24px", border: `1px solid ${theme.border}` }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "24px", fontWeight: "700", color: theme.primary, fontFamily: font.heading }}>Start Your Free Trial</div>
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

// ─── TIMESHEET FORM ───────────────────────────────────────────
function TimesheetForm({ token }) {
  const [formData, setFormData] = useState({ employee_id: "", job_id: "", cost_code_id: "", shift_date: "", hours_worked: "", field_notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [costCodes, setCostCodes] = useState([]);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${API}/employees`, { headers }).then(r => r.json()).then(setEmployees);
    fetch(`${API}/jobs`, { headers }).then(r => r.json()).then(data => setJobs(data.filter(j => j.status === "active")));
    fetch(`${API}/cost-codes`, { headers }).then(r => r.json()).then(setCostCodes);
  }, [token]);

  function handleChange(e) { setFormData({ ...formData, [e.target.name]: e.target.value }); }

  async function handleSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams(formData);
    const response = await fetch(`${API}/timesheets?${params}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: "center", marginTop: "60px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
          <h2 style={{ ...styles.success }}>Hours logged.</h2>
          <p style={{ color: theme.textSecondary, fontSize: "14px" }}>Entry saved successfully.</p>
          <button style={{...styles.button, marginTop: "24px"}} onClick={() => setSubmitted(false)}>Log Another</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Log Hours</h1>
      <p style={styles.subtitle}>Field entry — Vantage Logic</p>
      <div style={{ backgroundColor: "white", borderRadius: "10px", padding: "20px", border: `1px solid ${theme.border}`, boxShadow: "0 1px 6px rgba(26,61,43,0.06)" }}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Employee</label>
          <select style={styles.input} name="employee_id" value={formData.employee_id} onChange={handleChange} required>
            <option value="">Select employee</option>
            {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
          </select>
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
          <textarea style={styles.textarea} name="field_notes" placeholder="What did you work on today?" value={formData.field_notes} onChange={handleChange} />
          <button style={styles.button} type="submit">Submit Timesheet</button>
        </form>
      </div>
    </div>
  );
}

// ─── MATERIALS FORM ───────────────────────────────────────────
function MaterialsForm({ token }) {
  const [formData, setFormData] = useState({ job_id: "", employee_id: "", supplier: "", description: "", total_cost: "", purchase_date: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${API}/jobs`, { headers }).then(r => r.json()).then(data => setJobs(data.filter(j => j.status === "active")));
    fetch(`${API}/employees`, { headers }).then(r => r.json()).then(setEmployees);
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams(formData);
    const response = await fetch(`${API}/materials?${params}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: "center", marginTop: "60px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
          <h2 style={{ ...styles.success }}>Materials logged.</h2>
          <p style={{ color: theme.textSecondary, fontSize: "14px" }}>Purchase recorded successfully.</p>
          <button style={{...styles.button, marginTop: "24px"}} onClick={() => setSubmitted(false)}>Log Another</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Log Materials</h1>
      <p style={styles.subtitle}>Record a material purchase</p>
      <div style={{ backgroundColor: "white", borderRadius: "10px", padding: "20px", border: `1px solid ${theme.border}`, boxShadow: "0 1px 6px rgba(26,61,43,0.06)" }}>
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

// ─── ADMIN SCREEN ─────────────────────────────────────────────
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
  const [loginForm, setLoginForm] = useState({ email: "", password: "", confirm_password: "", employee_role: "crew" });
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    fetch(`${API}/me`, { headers: h }).then(r => r.json()).then(data => setCompanyId(data.company_id));
    fetch(`${API}/employees/all`, { headers: h }).then(r => r.json()).then(setEmployees);
    fetch(`${API}/jobs`, { headers: h }).then(r => r.json()).then(setJobs);
    fetch(`${API}/cost-codes`, { headers: h }).then(r => r.json()).then(setCostCodes);
  }, [token]);

  function refresh() {
    fetch(`${API}/employees/all`, { headers }).then(r => r.json()).then(setEmployees);
    fetch(`${API}/jobs`, { headers }).then(r => r.json()).then(setJobs);
    fetch(`${API}/cost-codes`, { headers }).then(r => r.json()).then(setCostCodes);
  }

  function showMessage(msg) { setMessage(msg); setTimeout(() => setMessage(""), 3000); }

  async function addEmployee() {
    const res = await fetch(`${API}/employees?${new URLSearchParams(empForm)}`, { method: "POST", headers });
    if (res.ok) { showMessage("Employee added."); setEmpForm({ first_name: "", last_name: "", role: "", hourly_rate: "", burden_rate: "" }); refresh(); }
    else showMessage("Error adding employee.");
  }

  async function updateEmployee() {
    const res = await fetch(`${API}/employees/${editingEmp.employee_id}?${new URLSearchParams(empForm)}`, { method: "PATCH", headers });
    if (res.ok) { showMessage("Employee updated."); setEditingEmp(null); setEmpForm({ first_name: "", last_name: "", role: "", hourly_rate: "", burden_rate: "" }); refresh(); }
    else showMessage("Error updating employee.");
  }

  async function addJob() {
    const res = await fetch(`${API}/jobs?${new URLSearchParams(jobForm)}`, { method: "POST", headers });
    if (res.ok) { showMessage("Job added."); setJobForm({ job_name: "", city: "", contract_value: "", budgeted_hours: "" }); refresh(); }
    else showMessage("Error adding job.");
  }

  async function updateJob() {
    const res = await fetch(`${API}/jobs/${editingJob.job_id}?${new URLSearchParams(jobForm)}`, { method: "PATCH", headers });
    if (res.ok) { showMessage("Job updated."); setEditingJob(null); setJobForm({ job_name: "", city: "", contract_value: "", budgeted_hours: "" }); refresh(); }
    else showMessage("Error updating job.");
  }

  async function addCostCode() {
    const res = await fetch(`${API}/cost-codes?${new URLSearchParams(ccForm)}`, { method: "POST", headers });
    if (res.ok) { showMessage("Cost code added."); setCcForm({ code: "", description: "", category: "" }); refresh(); }
    else showMessage("Error adding cost code.");
  }

  async function updateCostCode() {
    const res = await fetch(`${API}/cost-codes/${editingCc.cost_code_id}?${new URLSearchParams(ccForm)}`, { method: "PATCH", headers });
    if (res.ok) { showMessage("Cost code updated."); setEditingCc(null); setCcForm({ code: "", description: "", category: "" }); refresh(); }
    else showMessage("Error updating cost code.");
  }

  async function createLogin() {
    if (!companyId) return;
    if (loginForm.password !== loginForm.confirm_password) { setLoginError("Passwords do not match"); return; }
    setLoginError("");
    const res = await fetch(`${API}/users?${new URLSearchParams({ company_id: companyId, email: loginForm.email, password: loginForm.password, role: loginForm.employee_role })}`, { method: "POST" });
    if (res.ok) { showMessage(`Login created for ${loginForm.email}`); setLoginForm({ email: "", password: "", confirm_password: "", employee_role: "crew" }); }
    else { const d = await res.json(); showMessage(`Error: ${d.detail}`); }
  }

  async function toggleEmployee(emp) {
    const endpoint = emp.active ? "deactivate" : "activate";
    const res = await fetch(`${API}/employees/${emp.employee_id}/${endpoint}`, { method: "PATCH", headers });
    if (res.ok) { showMessage(`${emp.first_name} ${emp.active ? "archived" : "restored"}.`); refresh(); }
  }

  async function setJobStatus(job, status) {
    const res = await fetch(`${API}/jobs/${job.job_id}/status?status=${status}`, { method: "PATCH", headers });
    if (res.ok) { showMessage(`${job.job_name} marked as ${status}.`); refresh(); }
  }

  function startEditEmp(emp) { setEditingEmp(emp); setEmpForm({ first_name: emp.first_name, last_name: emp.last_name, role: emp.role || "", hourly_rate: emp.hourly_rate || "", burden_rate: emp.burden_rate || "" }); }
  function startEditJob(job) { setEditingJob(job); setJobForm({ job_name: job.job_name, city: job.city || "", contract_value: job.contract_value || "", budgeted_hours: job.budgeted_hours || "" }); }
  function startEditCc(cc) { setEditingCc(cc); setCcForm({ code: cc.code, description: cc.description, category: cc.category || "" }); }

  const activeEmps = employees.filter(e => e.active);
  const inactiveEmps = employees.filter(e => !e.active);
  const activeJobs = jobs.filter(j => j.status === "active");
  const completedJobs = jobs.filter(j => j.status === "completed");
  const inactiveJobs = jobs.filter(j => j.status === "inactive");

  const tag = (bg, color) => ({ fontSize: "11px", padding: "3px 10px", borderRadius: "4px", border: "none", cursor: "pointer", backgroundColor: bg, color: color, fontWeight: "700", fontFamily: font.body });

  const ItemRow = ({ left, right }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", backgroundColor: theme.bg, borderRadius: "6px", marginBottom: "6px", border: `1px solid ${theme.border}` }}>
      {left}
      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>{right}</div>
    </div>
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Admin Panel</h1>
      <p style={styles.subtitle}>Manage your team, jobs, and access</p>
      {message && <div style={{ color: theme.accent, fontWeight: "600", marginBottom: "14px", backgroundColor: theme.accentLight, padding: "10px 14px", borderRadius: "6px", fontSize: "13px", border: `1px solid ${theme.accent}` }}>{message}</div>}

      <CollapsibleSection title="Employees">
        <p style={{ fontSize: "12px", fontWeight: "700", color: theme.textSecondary, marginBottom: "10px", marginTop: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {editingEmp ? `Editing: ${editingEmp.first_name} ${editingEmp.last_name}` : "Add New Employee"}
        </p>
        <input style={styles.input} placeholder="First Name" value={empForm.first_name} onChange={e => setEmpForm({...empForm, first_name: e.target.value})} />
        <input style={{...styles.input, marginTop: "6px"}} placeholder="Last Name" value={empForm.last_name} onChange={e => setEmpForm({...empForm, last_name: e.target.value})} />
        <input style={{...styles.input, marginTop: "6px"}} placeholder="Role (e.g. Electrician)" value={empForm.role} onChange={e => setEmpForm({...empForm, role: e.target.value})} />
        <input style={{...styles.input, marginTop: "6px"}} placeholder="Hourly Rate" type="number" value={empForm.hourly_rate} onChange={e => setEmpForm({...empForm, hourly_rate: e.target.value})} />
        <input style={{...styles.input, marginTop: "6px"}} placeholder="Burden Rate" type="number" value={empForm.burden_rate} onChange={e => setEmpForm({...empForm, burden_rate: e.target.value})} />
        {editingEmp ? (
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button style={{...styles.button, flex: 1, marginTop: 0}} onClick={updateEmployee}>Save Changes</button>
            <button style={{...styles.button, backgroundColor: "#888", flex: 1, marginTop: 0}} onClick={() => { setEditingEmp(null); setEmpForm({ first_name: "", last_name: "", role: "", hourly_rate: "", burden_rate: "" }); }}>Cancel</button>
          </div>
        ) : <button style={styles.button} onClick={addEmployee}>Add Employee</button>}

        {activeEmps.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <p style={{ fontSize: "11px", color: theme.textSecondary, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Active</p>
            {activeEmps.map(emp => (
              <ItemRow key={emp.employee_id}
                left={<div><div style={{ fontWeight: "600", fontSize: "13px", color: theme.textPrimary }}>{emp.first_name} {emp.last_name}</div><div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "2px" }}>{emp.role} · ${emp.hourly_rate}/hr · Burden ${emp.burden_rate}/hr</div></div>}
                right={[
                  <button key="edit" onClick={() => startEditEmp(emp)} style={tag(theme.accentLight, theme.accent)}>Edit</button>,
                  <button key="arch" onClick={() => toggleEmployee(emp)} style={tag(theme.dangerLight, theme.danger)}>Archive</button>
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
              <ItemRow key={emp.employee_id}
                left={<span style={{ fontWeight: "600", fontSize: "13px", color: theme.textSecondary }}>{emp.first_name} {emp.last_name}</span>}
                right={[<button key="res" onClick={() => toggleEmployee(emp)} style={tag(theme.accentLight, theme.accent)}>Restore</button>]}
              />
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Jobs">
        <p style={{ fontSize: "12px", fontWeight: "700", color: theme.textSecondary, marginBottom: "10px", marginTop: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {editingJob ? `Editing: ${editingJob.job_name}` : "Add New Job"}
        </p>
        <input style={styles.input} placeholder="Job Name" value={jobForm.job_name} onChange={e => setJobForm({...jobForm, job_name: e.target.value})} />
        <input style={{...styles.input, marginTop: "6px"}} placeholder="City" value={jobForm.city} onChange={e => setJobForm({...jobForm, city: e.target.value})} />
        <input style={{...styles.input, marginTop: "6px"}} placeholder="Contract Value (optional)" type="number" value={jobForm.contract_value} onChange={e => setJobForm({...jobForm, contract_value: e.target.value})} />
        <input style={{...styles.input, marginTop: "6px"}} placeholder="Budgeted Hours (optional)" type="number" value={jobForm.budgeted_hours} onChange={e => setJobForm({...jobForm, budgeted_hours: e.target.value})} />
        {editingJob ? (
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button style={{...styles.button, flex: 1, marginTop: 0}} onClick={updateJob}>Save Changes</button>
            <button style={{...styles.button, backgroundColor: "#888", flex: 1, marginTop: 0}} onClick={() => { setEditingJob(null); setJobForm({ job_name: "", city: "", contract_value: "", budgeted_hours: "" }); }}>Cancel</button>
          </div>
        ) : <button style={styles.button} onClick={addJob}>Add Job</button>}

        {activeJobs.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <p style={{ fontSize: "11px", color: theme.textSecondary, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Active</p>
            {activeJobs.map(job => (
              <ItemRow key={job.job_id}
                left={<div><div style={{ fontWeight: "600", fontSize: "13px", color: theme.textPrimary }}>{job.job_name}</div><div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "2px" }}>{job.city}{job.contract_value ? ` · $${fmt(job.contract_value)}` : ""}{job.budgeted_hours ? ` · ${job.budgeted_hours}h` : ""}</div></div>}
                right={[
                  <button key="edit" onClick={() => startEditJob(job)} style={tag(theme.accentLight, theme.accent)}>Edit</button>,
                  <button key="comp" onClick={() => setJobStatus(job, "completed")} style={tag("#e8f5ee", theme.accent)}>Complete</button>,
                  <button key="arch" onClick={() => setJobStatus(job, "inactive")} style={tag(theme.dangerLight, theme.danger)}>Archive</button>
                ]}
              />
            ))}
          </div>
        )}
        {completedJobs.length > 0 && (
          <div style={{ marginTop: "8px" }}>
            <p style={{ fontSize: "11px", color: theme.accent, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Completed</p>
            {completedJobs.map(job => (
              <ItemRow key={job.job_id}
                left={<span style={{ fontWeight: "600", fontSize: "13px", color: theme.accent }}>{job.job_name}</span>}
                right={[<button key="react" onClick={() => setJobStatus(job, "active")} style={tag(theme.accentLight, theme.accent)}>Reactivate</button>]}
              />
            ))}
          </div>
        )}
        {inactiveJobs.length > 0 && (
          <div style={{ marginTop: "8px" }}>
            <button onClick={() => setShowInactiveJob(!showInactiveJob)} style={{ fontSize: "12px", color: theme.textSecondary, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {showInactiveJob ? "Hide" : "Show"} archived ({inactiveJobs.length})
            </button>
            {showInactiveJob && inactiveJobs.map(job => (
              <ItemRow key={job.job_id}
                left={<span style={{ fontWeight: "600", fontSize: "13px", color: theme.textSecondary }}>{job.job_name}</span>}
                right={[<button key="res" onClick={() => setJobStatus(job, "active")} style={tag(theme.accentLight, theme.accent)}>Restore</button>]}
              />
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Cost Codes">
        <p style={{ fontSize: "12px", fontWeight: "700", color: theme.textSecondary, marginBottom: "10px", marginTop: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {editingCc ? `Editing: ${editingCc.code}` : "Add New Cost Code"}
        </p>
        <input style={styles.input} placeholder="Code (e.g. 001)" value={ccForm.code} onChange={e => setCcForm({...ccForm, code: e.target.value})} />
        <input style={{...styles.input, marginTop: "6px"}} placeholder="Description" value={ccForm.description} onChange={e => setCcForm({...ccForm, description: e.target.value})} />
        <input style={{...styles.input, marginTop: "6px"}} placeholder="Category (e.g. Labour)" value={ccForm.category} onChange={e => setCcForm({...ccForm, category: e.target.value})} />
        {editingCc ? (
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button style={{...styles.button, flex: 1, marginTop: 0}} onClick={updateCostCode}>Save Changes</button>
            <button style={{...styles.button, backgroundColor: "#888", flex: 1, marginTop: 0}} onClick={() => { setEditingCc(null); setCcForm({ code: "", description: "", category: "" }); }}>Cancel</button>
          </div>
        ) : <button style={styles.button} onClick={addCostCode}>Add Cost Code</button>}
        {costCodes.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <p style={{ fontSize: "11px", color: theme.textSecondary, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Current</p>
            {costCodes.map(cc => (
              <ItemRow key={cc.cost_code_id}
                left={<div><span style={{ fontWeight: "600", fontSize: "13px" }}>{cc.code}</span><span style={{ color: theme.textSecondary, fontSize: "12px", marginLeft: "8px" }}>{cc.description}</span>{cc.category && <span style={{ fontSize: "11px", color: theme.textLight, marginLeft: "6px" }}>· {cc.category}</span>}</div>}
                right={[<button key="edit" onClick={() => startEditCc(cc)} style={tag(theme.accentLight, theme.accent)}>Edit</button>]}
              />
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Create Crew Login">
        <p style={{ fontSize: "13px", color: theme.textSecondary, marginTop: 0, marginBottom: "12px" }}>Give a crew member access to the app</p>
        <input style={styles.input} placeholder="Email" type="email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
        <div style={{ marginTop: "6px" }}><PasswordInput placeholder="Password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} /></div>
        <div style={{ marginTop: "6px" }}><PasswordInput placeholder="Confirm Password" value={loginForm.confirm_password} onChange={e => setLoginForm({...loginForm, confirm_password: e.target.value})} /></div>
        {loginError && <p style={{ color: theme.danger, fontSize: "13px", margin: "6px 0 0" }}>{loginError}</p>}
        <select style={{...styles.input, marginTop: "6px"}} value={loginForm.employee_role} onChange={e => setLoginForm({...loginForm, employee_role: e.target.value})}>
          <option value="crew">Crew</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
        <button style={{...styles.button, backgroundColor: theme.accent}} onClick={createLogin}>Create Login</button>
      </CollapsibleSection>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────
function Dashboard({ token }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [details, setDetails] = useState({});
  const [filter, setFilter] = useState("active");

  useEffect(() => {
    fetch(`${API}/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setJobs(data); setLoading(false); });
  }, [token]);

  const filteredJobs = filter === "all" ? jobs : jobs.filter(j => j.status === filter);
  const totalHours = filteredJobs.reduce((sum, j) => sum + j.total_hours, 0);
  const totalLabour = filteredJobs.reduce((sum, j) => sum + j.labour_cost, 0);
  const totalMaterials = filteredJobs.reduce((sum, j) => sum + j.materials_cost, 0);
  const totalRevenue = filteredJobs.reduce((sum, j) => sum + j.contract_value, 0);
  const totalCost = filteredJobs.reduce((sum, j) => sum + j.total_cost, 0);
  const totalMargin = totalRevenue - totalCost;

  async function toggleJob(job_id) {
    const isOpen = expanded[job_id];
    setExpanded({...expanded, [job_id]: !isOpen});
    if (!isOpen && !details[job_id]) {
      const headers = { Authorization: `Bearer ${token}` };
      const [tsRes, matRes] = await Promise.all([
        fetch(`${API}/jobs/${job_id}/timesheets`, { headers }),
        fetch(`${API}/jobs/${job_id}/materials`, { headers })
      ]);
      setDetails({...details, [job_id]: { timesheets: await tsRes.json(), materials: await matRes.json() }});
    }
  }

  return (
    <div style={{ fontFamily: font.body, backgroundColor: theme.bg, minHeight: "100vh", paddingBottom: "80px" }}>
      <div style={{ backgroundColor: theme.primary, padding: "24px 20px 28px", color: "white" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ fontSize: "11px", opacity: 0.6, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>Vantage Logic</div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 2px", fontFamily: font.heading }}>Burn Rate Scoreboard</h1>
          <p style={{ fontSize: "13px", opacity: 0.65, margin: "0 0 18px" }}>Live job profitability</p>
          <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
            {["active", "completed", "all"].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "5px 14px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700", backgroundColor: filter === f ? "white" : "rgba(255,255,255,0.15)", color: filter === f ? theme.primary : "white", fontFamily: font.body }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            {[
              { label: "Total Hours", value: totalHours.toFixed(1) },
              { label: "Labour", value: `$${fmt(totalLabour)}` },
              { label: "Materials", value: `$${fmt(totalMaterials)}` },
              { label: "Contract", value: `$${fmt(totalRevenue)}` },
              { label: "Total Cost", value: `$${fmt(totalCost)}` },
              { label: "Margin", value: `$${fmt(totalMargin)}`, highlight: true, positive: totalMargin >= 0 },
            ].map((item, i) => (
              <div key={i} style={{ backgroundColor: item.highlight ? (item.positive ? "#2d6a4f" : "#a93226") : "rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px 10px", textAlign: "center", border: item.highlight ? "none" : "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: "15px", fontWeight: "700" }}>{item.value}</div>
                <div style={{ fontSize: "10px", opacity: 0.75, marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px", maxWidth: "900px", margin: "0 auto" }}>
        {loading ? (
          <p style={{ color: theme.textSecondary, textAlign: "center", marginTop: "48px" }}>Loading...</p>
        ) : filteredJobs.length === 0 ? (
          <p style={{ color: theme.textSecondary, textAlign: "center", marginTop: "48px" }}>No {filter} jobs.</p>
        ) : (
          filteredJobs.map(job => {
            const hasBudget = job.contract_value > 0;
            const hoursPercent = job.budgeted_hours > 0 ? Math.min((job.total_hours / job.budgeted_hours) * 100, 100) : 0;
            const isOverBudget = job.margin !== null && job.margin < 0;
            const isTight = hoursPercent > 70 && hoursPercent <= 90;
            const isOver = hoursPercent > 90;
            const borderColor = job.status === "completed" ? theme.accent : isOverBudget || isOver ? theme.danger : isTight ? theme.warning : theme.accent;
            const isExpanded = expanded[job.job_id];

            return (
              <div key={job.job_id} style={{ backgroundColor: "white", borderRadius: "10px", marginBottom: "10px", overflow: "hidden", boxShadow: "0 1px 6px rgba(26,61,43,0.07)", cursor: "pointer", border: `1px solid ${theme.border}`, borderLeft: `4px solid ${borderColor}` }} onClick={() => toggleJob(job.job_id)}>
                <div style={{ padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "15px", color: theme.primary, fontFamily: font.heading }}>{job.job_name}</div>
                      <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "3px" }}>
                        {job.city && `${job.city} · `}
                        <span style={{ backgroundColor: job.status === "active" || job.status === "completed" ? theme.accentLight : "#f5f5f5", color: job.status === "active" || job.status === "completed" ? theme.accent : "#666", padding: "1px 7px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {hasBudget && job.margin !== null && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "17px", fontWeight: "700", color: isOverBudget ? theme.danger : theme.accent }}>
                            {isOverBudget ? "-" : ""}${fmt(Math.abs(job.margin))}
                          </div>
                          <div style={{ fontSize: "11px", color: theme.textSecondary }}>
                            {isOverBudget ? "over budget" : `${job.margin_percent}% margin`}
                          </div>
                        </div>
                      )}
                      <div style={{ fontSize: "12px", color: theme.textLight }}>{isExpanded ? "▲" : "▼"}</div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                    {[
                      { label: "Labour", value: `$${fmt(job.labour_cost)}` },
                      { label: "Materials", value: `$${fmt(job.materials_cost)}` },
                      { label: "Total Cost", value: `$${fmt(job.total_cost)}` },
                    ].map((item, i) => (
                      <div key={i} style={{ backgroundColor: theme.bg, borderRadius: "6px", padding: "9px 8px", textAlign: "center", border: `1px solid ${theme.border}` }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: theme.primary }}>{item.value}</div>
                        <div style={{ fontSize: "10px", color: theme.textSecondary, marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.4px" }}>{item.label}</div>
                      </div>
                    ))}
                  </div>

                  {job.budgeted_hours > 0 && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: theme.textSecondary, marginBottom: "5px" }}>
                        <span>{job.total_hours}h of {job.budgeted_hours}h budgeted</span>
                        <span style={{ color: isOver ? theme.danger : isTight ? theme.warning : theme.textSecondary, fontWeight: "700" }}>{hoursPercent.toFixed(0)}%</span>
                      </div>
                      <div style={{ backgroundColor: theme.border, borderRadius: "3px", height: "5px" }}>
                        <div style={{ width: `${hoursPercent}%`, height: "5px", borderRadius: "3px", backgroundColor: isOver ? theme.danger : isTight ? theme.warning : theme.accent }} />
                      </div>
                    </div>
                  )}

                  {hasBudget && (
                    <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", fontSize: "12px", color: theme.textSecondary }}>
                      <span>Contract: ${fmt(job.contract_value)}</span>
                      {job.overtime_hours > 0 && <span style={{ color: theme.warning }}>OT: {job.overtime_hours}h</span>}
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: theme.textSecondary, marginBottom: "10px", paddingTop: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Timesheet Entries</div>
                    {details[job.job_id] ? (
                      details[job.job_id].timesheets.length === 0 ? (
                        <p style={{ fontSize: "12px", color: theme.textSecondary }}>No entries yet.</p>
                      ) : (
                        details[job.job_id].timesheets.map((t, i) => (
                          <div key={i} style={{ marginBottom: "6px", padding: "8px 10px", backgroundColor: theme.bg, borderRadius: "6px", border: `1px solid ${theme.border}` }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", fontSize: "12px", color: theme.textPrimary, alignItems: "center" }}>
                              <span style={{ fontWeight: "600" }}>{t.employee_name}</span>
                              <span style={{ color: theme.textSecondary, textAlign: "center" }}>{t.shift_date}</span>
                              <span style={{ fontWeight: "700", color: theme.primary, textAlign: "right" }}>{t.hours_worked}h</span>
                            </div>
                            {t.field_notes && <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "4px", fontStyle: "italic" }}>{t.field_notes}</div>}
                          </div>
                        ))
                      )
                    ) : <p style={{ fontSize: "12px", color: theme.textSecondary }}>Loading...</p>}

                    {details[job.job_id] && details[job.job_id].materials.length > 0 && (
                      <div style={{ marginTop: "14px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: theme.textSecondary, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Materials</div>
                        {details[job.job_id].materials.map((m, i) => (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", fontSize: "12px", color: theme.textPrimary, padding: "6px 0", borderBottom: `1px solid ${theme.border}`, alignItems: "center" }}>
                            <span style={{ fontWeight: "600" }}>{m.supplier || "Unknown"}</span>
                            <span style={{ color: theme.textSecondary, textAlign: "center" }}>{m.description}</span>
                            <span style={{ fontWeight: "700", color: theme.warning, textAlign: "right" }}>${fmt(m.total_cost)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────
export default function App() {
  const stored = getStoredAuth();
  const [token, setToken] = useState(stored.token);
  const [role, setRole] = useState(stored.role);
  const [view, setView] = useState("timesheet");
  const [showSignUp, setShowSignUp] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

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

  return (
    <div className="vl-main-content" style={{ backgroundColor: theme.bg, minHeight: "100vh" }}>
      <NavBar view={view} setView={setView} role={role} onLogout={handleLogout} />
      <div>
        {showOnboarding && (role === "owner" || role === "admin") && view === "timesheet" && (
          <div style={{ maxWidth: "560px", margin: "0 auto", padding: "16px 16px 0" }}>
            <OnboardingChecklist token={token} onDismiss={() => setShowOnboarding(false)} />
          </div>
        )}
        {view === "timesheet" && <TimesheetForm token={token} />}
        {view === "materials" && <MaterialsForm token={token} />}
        {view === "dashboard" && <Dashboard token={token} />}
        {view === "admin" && <AdminScreen token={token} />}
      </div>
      <div className="vl-bottom-nav" style={{ padding: "12px 16px 90px", textAlign: "center" }}>
        <button onClick={handleLogout} style={{ fontSize: "13px", color: "white", background: theme.danger, border: "none", borderRadius: "6px", padding: "8px 20px", cursor: "pointer", fontWeight: "600", fontFamily: font.body }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}