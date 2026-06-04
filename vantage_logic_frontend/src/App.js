import { useState, useEffect } from "react";

const API = "https://contractor-api-pi7o.onrender.com";

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
    <div style={styles.container}>
      <h1 style={styles.title}>Vantage Logic</h1>
      <p style={styles.subtitle}>Sign in to continue</p>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>Email</label>
        <input
          style={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label style={styles.label}>Password</label>
        <input
          style={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}
        <button style={styles.button} type="submit">Sign In</button>
      </form>
    </div>
  );
}

function TimesheetForm({ token, onLogout, role, onAdmin, onDashboard }) {
  const [formData, setFormData] = useState({
    employee_id: "", job_id: "", cost_code_id: "",
    shift_date: "", hours_worked: "", field_notes: "", material_needs: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [costCodes, setCostCodes] = useState([]);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${API}/employees`, { headers }).then(r => r.json()).then(setEmployees);
    fetch(`${API}/jobs`, { headers }).then(r => r.json()).then(setJobs);
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
          {employees.map(emp => (
            <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>
          ))}
        </select>

        <label style={styles.label}>Job</label>
        <select style={styles.input} name="job_id" value={formData.job_id} onChange={handleChange} required>
          <option value="">Select Job</option>
          {jobs.map(job => (
            <option key={job.job_id} value={job.job_id}>{job.job_name}</option>
          ))}
        </select>

        <label style={styles.label}>Cost Code</label>
        <select style={styles.input} name="cost_code_id" value={formData.cost_code_id} onChange={handleChange} required>
          <option value="">Select Cost Code</option>
          {costCodes.map(cc => (
            <option key={cc.cost_code_id} value={cc.cost_code_id}>{cc.code} - {cc.description}</option>
          ))}
        </select>

        <label style={styles.label}>Date</label>
        <input style={styles.input} name="shift_date" type="date" value={formData.shift_date} onChange={handleChange} required />

        <label style={styles.label}>Hours Worked</label>
        <input style={styles.input} name="hours_worked" type="number" step="0.5" placeholder="e.g. 8.5" value={formData.hours_worked} onChange={handleChange} required />

        <label style={styles.label}>Field Notes</label>
        <textarea style={styles.textarea} name="field_notes" placeholder="What did you work on today?" value={formData.field_notes} onChange={handleChange} />

        <label style={styles.label}>Material Needs</label>
        <textarea style={styles.textarea} name="material_needs" placeholder="Any materials needed for tomorrow?" value={formData.material_needs} onChange={handleChange} />

        {(role === "owner" || role === "admin") && (
          <button style={{...styles.button, backgroundColor: "#2E6DA4", marginTop: "8px"}} type="button" onClick={onAdmin}>Admin Panel</button>
        )}

        {(role === "owner" || role === "admin") && (
          <button style={{...styles.button, backgroundColor: "#1a5c3a", marginTop: "8px"}} type="button" onClick={onDashboard}>Dashboard</button>
        )}

        <button style={styles.button} type="submit">Submit Timesheet</button>
        <button style={{...styles.button, backgroundColor: "#999", marginTop: "8px"}} type="button" onClick={onLogout}>Log Out</button>
      </form>
    </div>
  );
}

function AdminScreen({ token, onLogout, onBack }) {
  const API = "https://contractor-api-pi7o.onrender.com";
  const headers = { Authorization: `Bearer ${token}` };

  const [empForm, setEmpForm] = useState({ first_name: "", last_name: "", role: "", hourly_rate: "", burden_rate: "" });
  const [jobForm, setJobForm] = useState({ job_name: "", job_address: "", contract_value: "" });
  const [ccForm, setCcForm] = useState({ code: "", description: "", category: "" });
  const [message, setMessage] = useState("");

  async function addEmployee() {
    const params = new URLSearchParams(empForm);
    const res = await fetch(`${API}/employees?${params}`, { method: "POST", headers });
    if (res.ok) { setMessage("Employee added!"); setEmpForm({ first_name: "", last_name: "", role: "", hourly_rate: "", burden_rate: "" }); }
    else setMessage("Error adding employee.");
  }

  async function addJob() {
    const params = new URLSearchParams(jobForm);
    const res = await fetch(`${API}/jobs?${params}`, { method: "POST", headers });
    if (res.ok) { setMessage("Job added!"); setJobForm({ job_name: "", job_address: "", contract_value: "" }); }
    else setMessage("Error adding job.");
  }

  async function addCostCode() {
    const params = new URLSearchParams(ccForm);
    const res = await fetch(`${API}/cost-codes?${params}`, { method: "POST", headers });
    if (res.ok) { setMessage("Cost code added!"); setCcForm({ code: "", description: "", category: "" }); }
    else setMessage("Error adding cost code.");
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Admin Panel</h1>
      <p style={styles.subtitle}>Manage your team and jobs</p>
      {message && <p style={{ color: "#2E6DA4", fontWeight: "bold", marginBottom: "12px" }}>{message}</p>}

      <h2 style={styles.sectionTitle}>Add Employee</h2>
      <input style={styles.input} placeholder="First Name" value={empForm.first_name} onChange={e => setEmpForm({...empForm, first_name: e.target.value})} />
      <input style={styles.input} placeholder="Last Name" value={empForm.last_name} onChange={e => setEmpForm({...empForm, last_name: e.target.value})} />
      <input style={styles.input} placeholder="Role (e.g. Carpenter)" value={empForm.role} onChange={e => setEmpForm({...empForm, role: e.target.value})} />
      <input style={styles.input} placeholder="Hourly Rate" type="number" value={empForm.hourly_rate} onChange={e => setEmpForm({...empForm, hourly_rate: e.target.value})} />
      <input style={styles.input} placeholder="Burden Rate" type="number" value={empForm.burden_rate} onChange={e => setEmpForm({...empForm, burden_rate: e.target.value})} />
      <button style={styles.button} onClick={addEmployee}>Add Employee</button>

      <h2 style={styles.sectionTitle}>Add Job</h2>
      <input style={styles.input} placeholder="Job Name" value={jobForm.job_name} onChange={e => setJobForm({...jobForm, job_name: e.target.value})} />
      <input style={styles.input} placeholder="Job Address" value={jobForm.job_address} onChange={e => setJobForm({...jobForm, job_address: e.target.value})} />
      <input style={styles.input} placeholder="Contract Value" type="number" value={jobForm.contract_value} onChange={e => setJobForm({...jobForm, contract_value: e.target.value})} />
      <button style={styles.button} onClick={addJob}>Add Job</button>

      <h2 style={styles.sectionTitle}>Add Cost Code</h2>
      <input style={styles.input} placeholder="Code (e.g. 001)" value={ccForm.code} onChange={e => setCcForm({...ccForm, code: e.target.value})} />
      <input style={styles.input} placeholder="Description" value={ccForm.description} onChange={e => setCcForm({...ccForm, description: e.target.value})} />
      <input style={styles.input} placeholder="Category (e.g. Labour)" value={ccForm.category} onChange={e => setCcForm({...ccForm, category: e.target.value})} />
      <button style={styles.button} onClick={addCostCode}>Add Cost Code</button>

      <div style={{ marginTop: "24px", display: "flex", gap: "8px" }}>
        <button style={{...styles.button, backgroundColor: "#555", flex: 1}} onClick={onBack}>Back to Timesheet</button>
        <button style={{...styles.button, backgroundColor: "#999", flex: 1}} onClick={onLogout}>Log Out</button>
      </div>
    </div>
  );
}

function Dashboard({ token, onLogout, onBack }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { setJobs(data); setLoading(false); });
  }, [token]);

  const totalHours = jobs.reduce((sum, j) => sum + j.total_hours, 0);
  const totalLabour = jobs.reduce((sum, j) => sum + j.labour_cost, 0);
  const totalRevenue = jobs.reduce((sum, j) => sum + j.contract_value, 0);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Burn Rate Scoreboard</h1>
      <p style={styles.subtitle}>Live job profitability</p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <div style={summaryCard}>
          <div style={summaryNumber}>{totalHours.toFixed(1)}</div>
          <div style={summaryLabel}>Total Hours</div>
        </div>
        <div style={summaryCard}>
          <div style={summaryNumber}>${totalLabour.toLocaleString()}</div>
          <div style={summaryLabel}>Labour Cost</div>
        </div>
        <div style={summaryCard}>
          <div style={summaryNumber}>${totalRevenue.toLocaleString()}</div>
          <div style={summaryLabel}>Contract Value</div>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "#666" }}>Loading...</p>
      ) : jobs.length === 0 ? (
        <p style={{ color: "#666" }}>No job

export default function App() {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [view, setView] = useState("timesheet");

  function handleLogin(accessToken, userRole) {
    setToken(accessToken);
    setRole(userRole);
  }

  function handleLogout() {
    setToken(null);
    setRole(null);
    setView("timesheet");
  }

if (!token) return <Login onLogin={handleLogin} />;
  if (view === "admin") return <AdminScreen token={token} onLogout={handleLogout} onBack={() => setView("timesheet")} />;
  if (view === "dashboard") return <Dashboard token={token} onLogout={handleLogout} onBack={() => setView("timesheet")} />;
  return <TimesheetForm token={token} onLogout={handleLogout} role={role} onAdmin={() => setView("admin")} onDashboard={() => setView("dashboard")} />;

const styles = {
  container: { maxWidth: "480px", margin: "0 auto", padding: "24px", fontFamily: "Arial, sans-serif", backgroundColor: "#f5f5f5", minHeight: "100vh" },
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
