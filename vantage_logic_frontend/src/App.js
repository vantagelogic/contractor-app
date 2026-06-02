import { useState, useEffect } from "react";

function App() {
  const [formData, setFormData] = useState({
    employee_id: "",
    job_id: "",
    cost_code_id: "",
    shift_date: "",
    hours_worked: "",
    field_notes: "",
    material_needs: ""
  });

  const [submitted, setSubmitted] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [costCodes, setCostCodes] = useState([]);

  useEffect(() => {
    // When the page loads, fetch employees, jobs and cost codes
    fetch("https://contractor-api-pi7o.onrender.com/employees")
      .then(res => res.json())
      .then(data => setEmployees(data));

    fetch("https://contractor-api-pi7o.onrender.com/jobs")
      .then(res => res.json())
      .then(data => setJobs(data));

    fetch("https://contractor-api-pi7o.onrender.com/cost-codes")
      .then(res => res.json())
      .then(data => setCostCodes(data));
  }, []);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams(formData);
    const response = await fetch(
      `https://contractor-api-pi7o.onrender.com/timesheets?${params}`,
      {
        method: "POST",
      }
    );
    if (response.ok) {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div style={styles.container}>
        <h2 style={styles.success}>Timesheet Submitted!</h2>
        <button style={styles.button} onClick={() => setSubmitted(false)}>
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Log Your Hours</h1>
      <p style={styles.subtitle}>Vantage Logic Field Entry</p>

      <form onSubmit={handleSubmit} style={styles.form}>

        <label style={styles.label}>Employee</label>
        <select
          style={styles.input}
          name="employee_id"
          value={formData.employee_id}
          onChange={handleChange}
          required
        >
          <option value="">Select Employee</option>
          {employees.map(emp => (
            <option key={emp.employee_id} value={emp.employee_id}>
              {emp.first_name} {emp.last_name}
            </option>
          ))}
        </select>

        <label style={styles.label}>Job</label>
        <select
          style={styles.input}
          name="job_id"
          value={formData.job_id}
          onChange={handleChange}
          required
        >
          <option value="">Select Job</option>
          {jobs.map(job => (
            <option key={job.job_id} value={job.job_id}>
              {job.job_name}
            </option>
          ))}
        </select>

        <label style={styles.label}>Cost Code</label>
        <select
          style={styles.input}
          name="cost_code_id"
          value={formData.cost_code_id}
          onChange={handleChange}
          required
        >
          <option value="">Select Cost Code</option>
          {costCodes.map(cc => (
            <option key={cc.cost_code_id} value={cc.cost_code_id}>
              {cc.code} - {cc.description}
            </option>
          ))}
        </select>

        <label style={styles.label}>Date</label>
        <input
          style={styles.input}
          name="shift_date"
          type="date"
          value={formData.shift_date}
          onChange={handleChange}
          required
        />

        <label style={styles.label}>Hours Worked</label>
        <input
          style={styles.input}
          name="hours_worked"
          type="number"
          step="0.5"
          placeholder="e.g. 8.5"
          value={formData.hours_worked}
          onChange={handleChange}
          required
        />

        <label style={styles.label}>Field Notes</label>
        <textarea
          style={styles.textarea}
          name="field_notes"
          placeholder="What did you work on today?"
          value={formData.field_notes}
          onChange={handleChange}
        />

        <label style={styles.label}>Material Needs</label>
        <textarea
          style={styles.textarea}
          name="material_needs"
          placeholder="Any materials needed for tomorrow?"
          value={formData.material_needs}
          onChange={handleChange}
        />

        <button style={styles.button} type="submit">
          Submit Timesheet
        </button>

      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "480px",
    margin: "0 auto",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh"
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1B3A5C",
    marginBottom: "4px"
  },
  subtitle: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "24px"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  label: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#333",
    marginTop: "8px"
  },
  input: {
    padding: "12px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    width: "100%",
    boxSizing: "border-box"
  },
  textarea: {
    padding: "12px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    width: "100%",
    boxSizing: "border-box",
    minHeight: "80px"
  },
  button: {
    marginTop: "16px",
    padding: "14px",
    fontSize: "16px",
    backgroundColor: "#1B3A5C",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold"
  },
  success: {
    color: "#2E6DA4",
    textAlign: "center",
    marginTop: "40px"
  }
};

export default App;
