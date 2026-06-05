import { useState, useEffect } from "react";

const API = "https://contractor-api-pi7o.onrender.com";

const styles = {
  container: { maxWidth: "480px", margin: "0 auto", padding: "24px", paddingTop: "80px", fontFamily: "Arial, sans-serif", backgroundColor: "#f5f5f5", minHeight: "100vh" },
  title: { fontSize: "24px", fontWeight: "bold", color: "#1B3A5C", marginBottom: "4px" },
  subtitle: { fontSize: "14px", color: "#666", marginBottom: "24px" },
  form: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "14px", fontWeight: "bold", color: "#333", marginTop: "8px" },
  input: { padding: "12px", fontSize: "16px", borderRadius: "8px", border: "1px solid #ccc", width: "100%", boxSizing: "border-box" },
  textarea: { padding: "12px", fontSize: "16px", borderRadius: "8px", border: "1px solid #ccc", width: "100%", boxSizing: "border-box", minHeight: "80px" },
  button: { marginTop: "16px", padding: "14px", fontSize: "16px", backgroundColor: "#1B3A5C", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
  success: { color: "#2E6DA4", textAlign: "center", marginTop: "40px" },
  sectionTitle: { fontSize: "18px", fontWeight: "bold", color: "#1B3A5C", marginTop: "24px", marginBottom: "8px" },
};

function fmt(n) {
  return Number(n || 0).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PasswordInput({ placeholder, value, onChange, required }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        style={{...styles.input, paddingRight: "48px"}}
        type={show ? "text" : "password"}
        placeholder={placeholder || "Password"}
        value={value}
        onChange={onChange}
        required={required}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#888", padding: 0 }}
      >
        {show ? "🙈" : "👁"}
      </button>
    </div>
  );
}

function NavBar({ view, setView, role }) {
  const tabs = [
    { id: "timesheet", label: "Hours", icon: "⏱" },
    { id: "materials", label: "Materials", icon: "🔧" },
    ...(role === "owner" || role === "admin" ? [
      { id: "dashboard", label: "Dashboard", icon: "📊" },
      { id: "admin", label: "Admin", icon: "⚙️" },
    ] : []),
  ];

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, backgroundColor: "#1B3A5C", zIndex: 1000, display: "flex", justifyContent: "space-around", padding: "10px 0 8px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => setView(tab.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "4px 12px", borderRadius: "8px", backgroundColor: view === tab.id ? "rgba(255,255,255,0.15)" : "transparent" }}>
          <span style={{ fontSize: "20px" }}>{tab.icon}</span>
          <span style={{ fontSize: "11px", color: view === tab.id ? "white" : "rgba(255,255,255,0.6)", fontWeight: view === tab.id ? "bold" : "normal" }}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

function CollapsibleSection({ title, color, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: "10px", borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <div onClick={() => setOpen(!open)} style={{ backgroundColor: color || "#1B3A5C", color: "white", padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "bold", fontSize: "15px" }}>
        <span>{title}</span>
        <span>{open ? "▲" : "▼"}</span>
      </div>
      {open && <div style={{ backgroundColor: "white", padding: "16px" }}>{children}</div>}
    </div>
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);
    const response = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });
    if (response.ok) {
      const data = await response.json();
      onLogin(data.access_token, data.role);
    } else {
      setError("Incorrect email or password");
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Arial, sans-serif" }}>
      <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "420px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", margin: "24px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>📊</div>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#1B3A5C", margin: "0 0 4px" }}>Vantage Logic</h1>
          <p style={{ fontSize: "14px", color: "#888", margin: 0 }}>Field Management System</p>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" />
          <label style={styles.label}>Password</label>
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p style={{ color: "red", fontSize: "14px", margin: "4px 0" }}>{error}</p>}
          <button style={{...styles.button, marginTop: "24px"}} type="submit">Sign In</button>
        </form>
        <p style={{ textAlign: "center", fontSize: "12px", color: "#aaa", marginTop: "24px" }}>Forgot your password? Contact your administrator.</p>
      </div>
    </div>
  );
}

function MaterialsForm({ token }) {
  const [formData, setFormData] = useState({
    job_id: "", employee_id: "", supplier: "", description: "",
    total_cost: "", purchase_date: "", notes: ""
  });
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
    const response = await fetch(`${API}/materials?${params}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={styles.container}>
        <h2 style={styles.success}>Materials Logged!</h2>
        <button style={styles.button} onClick={() => setSubmitted(false)}>Log Another</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Log Materials</h1>
      <p style={styles.subtitle}>Record a material purchase</p>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>Job</label>
        <select style={styles.input} value={formData.job_id} onChange={e => setFormData({...formData, job_id: e.target.value})} required>
          <option value="">Select Job</option>
          {jobs.map(job => <option key={job.job_id} value={job.job_id}>{job.job_name}</option>)}
        </select>
        <label style={styles.label}>Purchased By</label>
        <select style={styles.input} value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})}>
          <option value="">Select Employee</option>
          {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
        </select>
        <label style={styles.label}>Supplier</label>
        <input style={styles.input} placeholder="e.g. Home Depot" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
        <label style={styles.label}>Description</label>
        <input style={styles.input} placeholder="e.g. Copper fittings" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
        <label style={styles.label}>Total Amount ($)</label>
        <input style={styles.input} type="number" step="0.01" placeholder="e.g. 245.50" value={formData.total_cost} onChange={e => setFormData({...formData, total_cost: e.target.value})} required />
        <label style={styles.label}>Purchase Date</label>
        <input style={styles.input} type="date" value={formData.purchase_date} onChange={e => setFormData({...formData, purchase_date: e.target.value})} required />
        <label style={styles.label}>Notes (optional)</label>
        <textarea style={styles.textarea} placeholder="Any additional notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
        <button style={styles.button} type="submit">Log Materials</button>
      </form>
    </div>
  );
}

function TimesheetForm({ token }) {
  const [formData, setFormData] = useState({
    employee_id: "", job_id: "", cost_code_id: "",
    shift_date: "", hours_worked: "", field_notes: ""
  });
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

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams(formData);
    const response = await fetch(`${API}/timesheets?${params}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={styles.container}>
        <h2 style={styles.success}>Timesheet Submitted!</h2>
        <button style={styles.button} onClick={() => setSubmitted(false)}>Submit Another</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Log Your Hours</h1>
      <p style={styles.subtitle}>Vantage Logic Field Entry</p>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>Employee</label>
        <select style={styles.input} name="employee_id" value={formData.employee_id} onChange={handleChange} required>
          <option value="">Select Employee</option>
          {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
        </select>
        <label style={styles.label}>Job</label>
        <select style={styles.input} name="job_id" value={formData.job_id} onChange={handleChange} required>
          <option value="">Select Job</option>
          {jobs.map(job => <option key={job.job_id} value={job.job_id}>{job.job_name}</option>)}
        </select>
        <label style={styles.label}>Cost Code</label>
        <select style={styles.input} name="cost_code_id" value={formData.cost_code_id} onChange={handleChange} required>
          <option value="">Select Cost Code</option>
          {costCodes.map(cc => <option key={cc.cost_code_id} value={cc.cost_code_id}>{cc.code} - {cc.description}</option>)}
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

  function showMessage(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  }

  async function addEmployee() {
    const params = new URLSearchParams(empForm);
    const res = await fetch(`${API}/employees?${params}`, { method: "POST", headers });
    if (res.ok) { showMessage("Employee added!"); setEmpForm({ first_name: "", last_name: "", role: "", hourly_rate: "", burden_rate: "" }); refresh(); }
    else showMessage("Error adding employee.");
  }

  async function updateEmployee() {
    const params = new URLSearchParams(empForm);
    const res = await fetch(`${API}/employees/${editingEmp.employee_id}?${params}`, { method: "PATCH", headers });
    if (res.ok) { showMessage("Employee updated!"); setEditingEmp(null); setEmpForm({ first_name: "", last_name: "", role: "", hourly_rate: "", burden_rate: "" }); refresh(); }
    else showMessage("Error updating employee.");
  }

  async function addJob() {
    const params = new URLSearchParams(jobForm);
    const res = await fetch(`${API}/jobs?${params}`, { method: "POST", headers });
    if (res.ok) { showMessage("Job added!"); setJobForm({ job_name: "", city: "", contract_value: "", budgeted_hours: "" }); refresh(); }
    else showMessage("Error adding job.");
  }

  async function updateJob() {
    const params = new URLSearchParams(jobForm);
    const res = await fetch(`${API}/jobs/${editingJob.job_id}?${params}`, { method: "PATCH", headers });
    if (res.ok) { showMessage("Job updated!"); setEditingJob(null); setJobForm({ job_name: "", city: "", contract_value: "", budgeted_hours: "" }); refresh(); }
    else showMessage("Error updating job.");
  }

  async function addCostCode() {
    const params = new URLSearchParams(ccForm);
    const res = await fetch(`${API}/cost-codes?${params}`, { method: "POST", headers });
    if (res.ok) { showMessage("Cost code added!"); setCcForm({ code: "", description: "", category: "" }); refresh(); }
    else showMessage("Error adding cost code.");
  }

  async function updateCostCode() {
    const params = new URLSearchParams(ccForm);
    const res = await fetch(`${API}/cost-codes/${editingCc.cost_code_id}?${params}`, { method: "PATCH", headers });
    if (res.ok) { showMessage("Cost code updated!"); setEditingCc(null); setCcForm({ code: "", description: "", category: "" }); refresh(); }
    else showMessage("Error updating cost code.");
  }

  async function createLogin() {
    if (!companyId) return;
    if (loginForm.password !== loginForm.confirm_password) {
      setLoginError("Passwords do not match");
      return;
    }
    setLoginError("");
    const params = new URLSearchParams({ company_id: companyId, email: loginForm.email, password: loginForm.password, role: loginForm.employee_role });
    const res = await fetch(`${API}/users?${params}`, { method: "POST" });
    if (res.ok) { showMessage(`Login created for ${loginForm.email}`); setLoginForm({ email: "", password: "", confirm_password: "", employee_role: "crew" }); }
    else { const d = await res.json(); showMessage(`Error: ${d.detail}`); }
  }

  async function toggleEmployee(emp) {
    const endpoint = emp.active ? "deactivate" : "activate";
    const res = await fetch(`${API}/employees/${emp.employee_id}/${endpoint}`, { method: "PATCH", headers });
    if (res.ok) { showMessage(`${emp.first_name} ${emp.active ? "deactivated" : "activated"}`); refresh(); }
  }

  async function setJobStatus(job, status) {
    const res = await fetch(`${API}/jobs/${job.job_id}/status?status=${status}`, { method: "PATCH", headers });
    if (res.ok) { showMessage(`${job.job_name} marked as ${status}`); refresh(); }
  }

  function startEditEmp(emp) {
    setEditingEmp(emp);
    setEmpForm({ first_name: emp.first_name, last_name: emp.last_name, role: emp.role || "", hourly_rate: emp.hourly_rate || "", burden_rate: emp.burden_rate || "" });
  }

  function startEditJob(job) {
    setEditingJob(job);
    setJobForm({ job_name: job.job_name, city: job.city || "", contract_value: job.contract_value || "", budgeted_hours: job.budgeted_hours || "" });
  }

  function startEditCc(cc) {
    setEditingCc(cc);
    setCcForm({ code: cc.code, description: cc.description, category: cc.category || "" });
  }

  const activeEmps = employees.filter(e => e.active);
  const inactiveEmps = employees.filter(e => !e.active);
  const activeJobs = jobs.filter(j => j.status === "active");
  const completedJobs = jobs.filter(j => j.status === "completed");
  const inactiveJobs = jobs.filter(j => j.status === "inactive");

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Admin Panel</h1>
      <p style={styles.subtitle}>Manage your team and jobs</p>
      {message && <p style={{ color: "#276749", fontWeight: "bold", marginBottom: "12px", backgroundColor: "#f0fff4", padding: "10px", borderRadius: "8px" }}>{message}</p>}

      <CollapsibleSection title="Employees" color="#1B3A5C">
        <p style={{ fontSize: "13px", fontWeight: "bold", color: "#333", marginBottom: "8px", marginTop: 0 }}>
          {editingEmp ? `Editing: ${editingEmp.first_name} ${editingEmp.last_name}` : "Add New Employee"}
        </p>
        <input style={styles.input} placeholder="First Name" value={empForm.first_name} onChange={e => setEmpForm({...empForm, first_name: e.target.value})} />
        <input style={styles.input} placeholder="Last Name" value={empForm.last_name} onChange={e => setEmpForm({...empForm, last_name: e.target.value})} />
        <input style={styles.input} placeholder="Role (e.g. Electrician)" value={empForm.role} onChange={e => setEmpForm({...empForm, role: e.target.value})} />
        <input style={styles.input} placeholder="Hourly Rate" type="number" value={empForm.hourly_rate} onChange={e => setEmpForm({...empForm, hourly_rate: e.target.value})} />
        <input style={styles.input} placeholder="Burden Rate" type="number" value={empForm.burden_rate} onChange={e => setEmpForm({...empForm, burden_rate: e.target.value})} />
        {editingEmp ? (
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={{...styles.button, flex: 1}} onClick={updateEmployee}>Save Changes</button>
            <button style={{...styles.button, backgroundColor: "#999", flex: 1}} onClick={() => { setEditingEmp(null); setEmpForm({ first_name: "", last_name: "", role: "", hourly_rate: "", burden_rate: "" }); }}>Cancel</button>
          </div>
        ) : (
          <button style={styles.button} onClick={addEmployee}>Add Employee</button>
        )}

        {activeEmps.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <p style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>Active Employees</p>
            {activeEmps.map(emp => (
              <div key={emp.employee_id} style={{ backgroundColor: "#f7f9fc", borderRadius: "8px", padding: "10px 12px", marginBottom: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontWeight: "500", fontSize: "13px" }}>{emp.first_name} {emp.last_name}</span>
                    <span style={{ color: "#888", fontSize: "12px", marginLeft: "8px" }}>{emp.role}</span>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => startEditEmp(emp)} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", border: "none", cursor: "pointer", backgroundColor: "#e8f0fe", color: "#2E6DA4", fontWeight: "bold" }}>Edit</button>
                    <button onClick={() => toggleEmployee(emp)} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", border: "none", cursor: "pointer", backgroundColor: "#fff5f5", color: "#e53e3e", fontWeight: "bold" }}>Archive</button>
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>${emp.hourly_rate}/hr · Burden: ${emp.burden_rate}/hr</div>
              </div>
            ))}
          </div>
        )}

        {inactiveEmps.length > 0 && (
          <div style={{ marginTop: "8px" }}>
            <button onClick={() => setShowInactiveEmp(!showInactiveEmp)} style={{ fontSize: "12px", color: "#888", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {showInactiveEmp ? "Hide" : "Show"} archived ({inactiveEmps.length})
            </button>
            {showInactiveEmp && inactiveEmps.map(emp => (
              <div key={emp.employee_id} style={{ backgroundColor: "#f7f7f7", borderRadius: "8px", padding: "10px 12px", marginBottom: "6px", marginTop: "6px", opacity: 0.7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "500", fontSize: "13px", color: "#888" }}>{emp.first_name} {emp.last_name}</span>
                  <button onClick={() => toggleEmployee(emp)} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", border: "none", cursor: "pointer", backgroundColor: "#f0fff4", color: "#276749", fontWeight: "bold" }}>Restore</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Jobs" color="#2E6DA4">
        <p style={{ fontSize: "13px", fontWeight: "bold", color: "#333", marginBottom: "8px", marginTop: 0 }}>
          {editingJob ? `Editing: ${editingJob.job_name}` : "Add New Job"}
        </p>
        <input style={styles.input} placeholder="Job Name" value={jobForm.job_name} onChange={e => setJobForm({...jobForm, job_name: e.target.value})} />
        <input style={styles.input} placeholder="City" value={jobForm.city} onChange={e => setJobForm({...jobForm, city: e.target.value})} />
        <input style={styles.input} placeholder="Contract Value (optional)" type="number" value={jobForm.contract_value} onChange={e => setJobForm({...jobForm, contract_value: e.target.value})} />
        <input style={styles.input} placeholder="Budgeted Hours (optional)" type="number" value={jobForm.budgeted_hours} onChange={e => setJobForm({...jobForm, budgeted_hours: e.target.value})} />
        {editingJob ? (
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={{...styles.button, flex: 1}} onClick={updateJob}>Save Changes</button>
            <button style={{...styles.button, backgroundColor: "#999", flex: 1}} onClick={() => { setEditingJob(null); setJobForm({ job_name: "", city: "", contract_value: "", budgeted_hours: "" }); }}>Cancel</button>
          </div>
        ) : (
          <button style={styles.button} onClick={addJob}>Add Job</button>
        )}

        {activeJobs.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <p style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>Active Jobs</p>
            {activeJobs.map(job => (
              <div key={job.job_id} style={{ backgroundColor: "#f7f9fc", borderRadius: "8px", padding: "10px 12px", marginBottom: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                  <div>
                    <span style={{ fontWeight: "500", fontSize: "13px" }}>{job.job_name}</span>
                    <span style={{ color: "#888", fontSize: "12px", marginLeft: "8px" }}>{job.city}</span>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => startEditJob(job)} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", border: "none", cursor: "pointer", backgroundColor: "#e8f0fe", color: "#2E6DA4", fontWeight: "bold" }}>Edit</button>
                    <button onClick={() => setJobStatus(job, "completed")} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", border: "none", cursor: "pointer", backgroundColor: "#ebf8f0", color: "#276749", fontWeight: "bold" }}>Complete</button>
                    <button onClick={() => setJobStatus(job, "inactive")} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", border: "none", cursor: "pointer", backgroundColor: "#fff5f5", color: "#e53e3e", fontWeight: "bold" }}>Archive</button>
                  </div>
                </div>
                {job.contract_value && <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>${fmt(job.contract_value)} contract · {job.budgeted_hours}h budgeted</div>}
              </div>
            ))}
          </div>
        )}

        {completedJobs.length > 0 && (
          <div style={{ marginTop: "8px" }}>
            <p style={{ fontSize: "12px", color: "#276749", marginBottom: "6px", fontWeight: "bold" }}>Completed ({completedJobs.length})</p>
            {completedJobs.map(job => (
              <div key={job.job_id} style={{ backgroundColor: "#f0fff4", borderRadius: "8px", padding: "10px 12px", marginBottom: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "500", fontSize: "13px", color: "#276749" }}>{job.job_name}</span>
                  <button onClick={() => setJobStatus(job, "active")} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", border: "none", cursor: "pointer", backgroundColor: "#e8f0fe", color: "#2E6DA4", fontWeight: "bold" }}>Reactivate</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {inactiveJobs.length > 0 && (
          <div style={{ marginTop: "8px" }}>
            <button onClick={() => setShowInactiveJob(!showInactiveJob)} style={{ fontSize: "12px", color: "#888", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {showInactiveJob ? "Hide" : "Show"} archived ({inactiveJobs.length})
            </button>
            {showInactiveJob && inactiveJobs.map(job => (
              <div key={job.job_id} style={{ backgroundColor: "#f7f7f7", borderRadius: "8px", padding: "10px 12px", marginBottom: "6px", marginTop: "6px", opacity: 0.7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "500", fontSize: "13px", color: "#888" }}>{job.job_name}</span>
                  <button onClick={() => setJobStatus(job, "active")} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", border: "none", cursor: "pointer", backgroundColor: "#f0fff4", color: "#276749", fontWeight: "bold" }}>Restore</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Cost Codes" color="#744210">
        <p style={{ fontSize: "13px", fontWeight: "bold", color: "#333", marginBottom: "8px", marginTop: 0 }}>
          {editingCc ? `Editing: ${editingCc.code}` : "Add New Cost Code"}
        </p>
        <input style={styles.input} placeholder="Code (e.g. 001)" value={ccForm.code} onChange={e => setCcForm({...ccForm, code: e.target.value})} />
        <input style={styles.input} placeholder="Description" value={ccForm.description} onChange={e => setCcForm({...ccForm, description: e.target.value})} />
        <input style={styles.input} placeholder="Category (e.g. Labour)" value={ccForm.category} onChange={e => setCcForm({...ccForm, category: e.target.value})} />
        {editingCc ? (
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={{...styles.button, flex: 1}} onClick={updateCostCode}>Save Changes</button>
            <button style={{...styles.button, backgroundColor: "#999", flex: 1}} onClick={() => { setEditingCc(null); setCcForm({ code: "", description: "", category: "" }); }}>Cancel</button>
          </div>
        ) : (
          <button style={styles.button} onClick={addCostCode}>Add Cost Code</button>
        )}
        {costCodes.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <p style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>Current Cost Codes</p>
            {costCodes.map(cc => (
              <div key={cc.cost_code_id} style={{ backgroundColor: "#f7f9fc", borderRadius: "8px", padding: "10px 12px", marginBottom: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontWeight: "500", fontSize: "13px" }}>{cc.code}</span>
                    <span style={{ color: "#888", fontSize: "12px", marginLeft: "8px" }}>{cc.description}</span>
                  </div>
                  <button onClick={() => startEditCc(cc)} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", border: "none", cursor: "pointer", backgroundColor: "#e8f0fe", color: "#2E6DA4", fontWeight: "bold" }}>Edit</button>
                </div>
                {cc.category && <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>{cc.category}</div>}
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Create Crew Login" color="#276749">
        <p style={{ fontSize: "13px", color: "#666", marginTop: 0, marginBottom: "8px" }}>Give a crew member access to the app</p>
        <input style={styles.input} placeholder="Email" type="email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
        <PasswordInput placeholder="Password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
        <PasswordInput placeholder="Confirm Password" value={loginForm.confirm_password} onChange={e => setLoginForm({...loginForm, confirm_password: e.target.value})} />
        {loginError && <p style={{ color: "red", fontSize: "13px", margin: "4px 0" }}>{loginError}</p>}
        <select style={styles.input} value={loginForm.employee_role} onChange={e => setLoginForm({...loginForm, employee_role: e.target.value})}>
          <option value="crew">Crew</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
        <button style={{...styles.button, backgroundColor: "#276749"}} onClick={createLogin}>Create Login</button>
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
      const timesheets = await tsRes.json();
      const materials = await matRes.json();
      setDetails({...details, [job_id]: { timesheets, materials }});
    }
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f0f4f8", minHeight: "100vh", paddingTop: "60px" }}>
      <div style={{ backgroundColor: "#1B3A5C", padding: "24px", color: "white" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "bold", margin: "0 0 4px" }}>Burn Rate Scoreboard</h1>
        <p style={{ fontSize: "14px", opacity: 0.7, margin: "0 0 16px" }}>Live job profitability</p>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {["active", "completed", "all"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 14px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "bold", backgroundColor: filter === f ? "white" : "rgba(255,255,255,0.15)", color: filter === f ? "#1B3A5C" : "white" }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          {[
            { label: "Total Hours", value: totalHours.toFixed(1) },
            { label: "Labour Cost", value: `$${fmt(totalLabour)}` },
            { label: "Materials", value: `$${fmt(totalMaterials)}` },
            { label: "Contract Value", value: `$${fmt(totalRevenue)}` },
            { label: "Total Cost", value: `$${fmt(totalCost)}` },
            { label: "Total Margin", value: `$${fmt(totalMargin)}`, highlight: true, positive: totalMargin >= 0 },
          ].map((item, i) => (
            <div key={i} style={{ backgroundColor: item.highlight ? (item.positive ? "#276749" : "#c53030") : "rgba(255,255,255,0.12)", borderRadius: "10px", padding: "14px 10px", textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "bold" }}>{item.value}</div>
              <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px" }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px", maxWidth: "900px", margin: "0 auto" }}>
        {loading ? (
          <p style={{ color: "#666", textAlign: "center", marginTop: "40px" }}>Loading...</p>
        ) : filteredJobs.length === 0 ? (
          <p style={{ color: "#666", textAlign: "center", marginTop: "40px" }}>No {filter} jobs.</p>
        ) : (
          filteredJobs.map(job => {
            const hasBudget = job.contract_value > 0;
            const hoursPercent = job.budgeted_hours > 0 ? Math.min((job.total_hours / job.budgeted_hours) * 100, 100) : 0;
            const isOverBudget = job.margin !== null && job.margin < 0;
            const isTight = hoursPercent > 70 && hoursPercent <= 90;
            const isOver = hoursPercent > 90;
            const borderColor = job.status === "completed" ? "#276749" : isOverBudget || isOver ? "#e53e3e" : isTight ? "#dd6b20" : "#38a169";
            const isExpanded = expanded[job.job_id];

            return (
              <div key={job.job_id} style={{ backgroundColor: "white", borderRadius: "12px", marginBottom: "12px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderLeft: `5px solid ${borderColor}`, cursor: "pointer" }} onClick={() => toggleJob(job.job_id)}>
                <div style={{ padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "16px", color: "#1B3A5C" }}>{job.job_name}</div>
                      <div style={{ fontSize: "13px", color: "#888", marginTop: "3px" }}>
                        {job.city && `${job.city} · `}
                        <span style={{ backgroundColor: job.status === "completed" ? "#ebf8f0" : job.status === "active" ? "#ebf8f0" : "#f7f7f7", color: job.status === "completed" ? "#276749" : job.status === "active" ? "#276749" : "#666", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {hasBudget && job.margin !== null && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "18px", fontWeight: "bold", color: isOverBudget ? "#e53e3e" : "#276749" }}>
                            {isOverBudget ? "-" : ""}${fmt(Math.abs(job.margin))}
                          </div>
                          <div style={{ fontSize: "12px", color: "#888" }}>
                            {isOverBudget ? "over budget" : `${job.margin_percent}% margin`}
                          </div>
                        </div>
                      )}
                      <div style={{ fontSize: "18px", color: "#888" }}>{isExpanded ? "▲" : "▼"}</div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                    {[
                      { label: "Labour", value: `$${fmt(job.labour_cost)}` },
                      { label: "Materials", value: `$${fmt(job.materials_cost)}` },
                      { label: "Total Cost", value: `$${fmt(job.total_cost)}` },
                    ].map((item, i) => (
                      <div key={i} style={{ backgroundColor: "#f7f9fc", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                        <div style={{ fontSize: "15px", fontWeight: "bold", color: "#1B3A5C" }}>{item.value}</div>
                        <div style={{ fontSize: "11px", color: "#888", marginTop: "3px" }}>{item.label}</div>
                      </div>
                    ))}
                  </div>

                  {job.budgeted_hours > 0 && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#888", marginBottom: "5px" }}>
                        <span>Hours: {job.total_hours}h of {job.budgeted_hours}h budgeted</span>
                        <span style={{ color: isOver ? "#e53e3e" : isTight ? "#dd6b20" : "#666", fontWeight: "bold" }}>{hoursPercent.toFixed(0)}%</span>
                      </div>
                      <div style={{ backgroundColor: "#e2e8f0", borderRadius: "4px", height: "8px" }}>
                        <div style={{ width: `${hoursPercent}%`, height: "8px", borderRadius: "4px", backgroundColor: isOver ? "#e53e3e" : isTight ? "#dd6b20" : "#38a169" }} />
                      </div>
                    </div>
                  )}

                  {hasBudget && (
                    <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#666" }}>
                      <span>Contract: ${fmt(job.contract_value)}</span>
                      {job.overtime_hours > 0 && <span style={{ color: "#dd6b20" }}>OT: {job.overtime_hours}h</span>}
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f0f0f0" }}>
                    <div style={{ fontSize: "13px", fontWeight: "bold", color: "#1B3A5C", marginBottom: "10px", paddingTop: "12px" }}>Timesheet Entries</div>
                    {details[job.job_id] ? (
                      details[job.job_id].timesheets.length === 0 ? (
                        <p style={{ fontSize: "13px", color: "#888" }}>No entries yet.</p>
                      ) : (
                        details[job.job_id].timesheets.map((t, i) => (
                          <div key={i} style={{ marginBottom: "8px", padding: "8px 10px", backgroundColor: "#f7f9fc", borderRadius: "8px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", fontSize: "13px", color: "#444", alignItems: "center" }}>
                              <span style={{ fontWeight: "500" }}>{t.employee_name}</span>
                              <span style={{ color: "#888", textAlign: "center" }}>{t.shift_date}</span>
                              <span style={{ fontWeight: "bold", color: "#1B3A5C", textAlign: "right" }}>{t.hours_worked}h</span>
                            </div>
                            {t.field_notes && <div style={{ fontSize: "12px", color: "#666", marginTop: "5px", fontStyle: "italic" }}>{t.field_notes}</div>}
                          </div>
                        ))
                      )
                    ) : (
                      <p style={{ fontSize: "13px", color: "#888" }}>Loading...</p>
                    )}
                    {details[job.job_id] && details[job.job_id].materials.length > 0 && (
                      <div style={{ marginTop: "14px" }}>
                        <div style={{ fontSize: "13px", fontWeight: "bold", color: "#b7791f", marginBottom: "10px" }}>Materials Purchased</div>
                        {details[job.job_id].materials.map((m, i) => (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", fontSize: "13px", color: "#444", padding: "6px 0", borderBottom: "1px solid #f9f9f9", alignItems: "center" }}>
                            <span style={{ fontWeight: "500" }}>{m.supplier || "Unknown"}</span>
                            <span style={{ color: "#888", textAlign: "center" }}>{m.description}</span>
                            <span style={{ fontWeight: "bold", color: "#b7791f", textAlign: "right" }}>${fmt(m.total_cost)}</span>
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

export default function App() {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [view, setView] = useState("timesheet");

  function handleLogin(accessToken, userRole) {
    setToken(accessToken);
    setRole(userRole);
    setView("timesheet");
  }

  function handleLogout() {
    setToken(null);
    setRole(null);
    setView("timesheet");
  }

  if (!token) return <Login onLogin={handleLogin} />;

  return (
    <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <NavBar view={view} setView={setView} role={role} />
      {view === "timesheet" && <TimesheetForm token={token} />}
      {view === "materials" && <MaterialsForm token={token} />}
      {view === "dashboard" && <Dashboard token={token} />}
      {view === "admin" && <AdminScreen token={token} />}
      <div style={{ padding: "16px", textAlign: "center" }}>
        <button onClick={handleLogout} style={{ fontSize: "13px", color: "#999", background: "none", border: "none", cursor: "pointer" }}>Log Out</button>
      </div>
    </div>
  );
}