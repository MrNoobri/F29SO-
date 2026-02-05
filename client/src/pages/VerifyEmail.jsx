import React from "react";
import { Link } from "react-router";

function VerifyEmail() {
  return (
    <div className="app-shell">
      <section className="auth-card">
        <div className="auth-copy-block">
          <p className="eyebrow">Email verification</p>
          <h1>Check your inbox</h1>
          <p className="shell-copy">
            The full verification token handling will be added later. For now, this page gives the user
            a clear next step after sign up.
          </p>
        </div>

        <div className="placeholder-card">
          <h2>Verification pending</h2>
          <p>
            We&apos;ll send a verification email after the registration flow is connected to the backend.
          </p>
          <div className="button-row">
            <Link className="primary-button" to="/login">
              Back to login
            </Link>
            <Link className="secondary-button" to="/register">
              Back to register
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default VerifyEmail;
