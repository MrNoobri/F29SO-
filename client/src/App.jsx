import React from "react";
import { Link, Navigate, Route, Routes } from "react-router";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";

const ShellLayout = ({ title, description, children }) => (
  <div className="app-shell">
    <header className="shell-header">
      <div>
        <p className="eyebrow">Virtual Health Companion</p>
        <h1>{title}</h1>
        <p className="shell-copy">{description}</p>
      </div>
      <nav className="shell-nav">
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </nav>
    </header>

    <main>{children}</main>
  </div>
);

const HomePage = () => (
  <ShellLayout
    title="Early authentication pages"
    description="This stage replaces the placeholder routes with the first pass of login, registration, and email verification screens."
  >
    <section className="hero-card">
      <h2>Account access flow is taking shape</h2>
      <p>
        The project now includes basic auth page layouts and form structure.
        Submission wiring, validation polish, and protected routes can be added in later commits.
      </p>
      <div className="button-row">
        <Link className="primary-button" to="/login">
          Open login
        </Link>
        <Link className="secondary-button" to="/register">
          Open register
        </Link>
      </div>
    </section>
  </ShellLayout>
);

const NotFoundPage = () => (
  <ShellLayout
    title="Page not found"
    description="The requested route does not exist in this early project stage."
  >
    <section className="placeholder-card">
      <h2>404</h2>
      <p>Return to the home route and continue building from there.</p>
      <Link className="primary-button" to="/">
        Back home
      </Link>
    </section>
  </ShellLayout>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
