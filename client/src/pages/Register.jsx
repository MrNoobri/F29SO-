import React, { useMemo, useState } from "react";
import { Link } from "react-router";

const roles = [
  { value: "patient", label: "Patient" },
  { value: "provider", label: "Provider" },
];

function Register() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "patient",
  });
  const [status, setStatus] = useState("");

  const roleLabel = useMemo(
    () => roles.find((entry) => entry.value === form.role)?.label ?? "Patient",
    [form.role],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setStatus(`${roleLabel} registration wiring will be added in a later commit.`);
  };

  return (
    <div className="app-shell">
      <section className="auth-card">
        <div className="auth-copy-block">
          <p className="eyebrow">New account</p>
          <h1>Create your profile</h1>
          <p className="shell-copy">
            This early registration page captures the main inputs and leaves advanced validation for later.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field-group">
            <span>Full name</span>
            <input
              name="fullName"
              type="text"
              placeholder="Ayesha Khan"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </label>

          <label className="field-group">
            <span>Email address</span>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label className="field-group">
            <span>Password</span>
            <input
              name="password"
              type="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>

          <label className="field-group">
            <span>Account type</span>
            <select name="role" value={form.role} onChange={handleChange}>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>

          <button className="primary-button" type="submit">
            Create account
          </button>

          {status ? <p className="status-note">{status}</p> : null}
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link className="text-link" to="/login">
            Sign in
          </Link>
        </p>
      </section>
    </div>
  );
}

export default Register;
