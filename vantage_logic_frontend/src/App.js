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
      onLogin(data.access_token, data.role, data.company_id);
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

function TimesheetForm({ token }) {
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

        <button style={styles.button} type="submit">Submit Timesheet</button>
      </form>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);

  function handleLogin(accessToken, userRole) {
    setToken(accessToken);
    setRole(userRole);
  }

  if (!token) return <Login onLogin={handleLogin} />;
  return <TimesheetForm token={token} />;
}

const styles = {
  container: { maxWidth: "480px", margin: "0 auto", padding: "24px", fontFamily: "Arial, sans-serif", backgroundColor: "#f5f5f5", minHeight: "100vh" },
  title: { fontSize: "24px", fontWeight: "bold", color: "#1B3A5C", marginBottom: "4px" },
  subtitle: { fontSize: "14px", color: "#666", marginBottom: "24px" },
  form: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "14px", fontWeight: "bold", color: "#333", marginTop: "8px" },
  input: { padding: "12px", fontSize: "16px", borderRadius: "8px", border: "1px solid #ccc", width: "100%", boxSizing: "border-box" },
  textarea: { padding: "12px", fontSize: "16px", borderRadius: "8px", border: "1px solid #ccc", width: "100%", boxSizing: "border-box", minHeight: "80px" },
  button: { marginTop: "16px", padding: "14px", fontSize: "16px", backgroundColor: "#1B3A5C", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
  success: { color: "#2E6DA4", textAlign: "center", marginTop: "40px" }
};
