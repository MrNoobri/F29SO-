import React, { useState } from "react";
import { Link } from "react-router";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setStatus("Login submission will be wired to the auth context in a later commit.");
  };

  return (
    <div className="app-shell">
      <section className="auth-card">
        <div className="auth-copy-block">
          <p className="eyebrow">Account access</p>
          <h1>Welcome back</h1>
          <p className="shell-copy">
            This early version introduces the login screen layout and local form state.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field-group">
            <span>Email address</span>
            <input
              name="email"
              type="email"
              placeholder="doctor@example.com"
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
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>

          <div className="auth-actions">
            <button className="primary-button" type="submit">
              Sign in
            </button>
            <Link className="text-link" to="/verify-email">
              Need to verify email?
            </Link>
          </div>

          {status ? <p className="status-note">{status}</p> : null}
        </form>

        <p className="auth-footer">
          Don&apos;t have an account?{" "}
          <Link className="text-link" to="/register">
            Create one
          </Link>
        </p>
      </section>
    </div>
  );
}

export default Login;
