import React from "react";
import { Link, Navigate, Route, Routes } from "react-router";

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
    title="Health tracking platform setup"
    description="Initial frontend shell with routing, shared layout, and placeholder entry pages."
  >
    <section className="hero-card">
      <h2>Project foundation in progress</h2>
      <p>
        This early version wires up the React app shell before authentication,
        dashboards, and feature modules are added in later commits.
      </p>
      <div className="button-row">
        <Link className="primary-button" to="/login">
          Go to login
        </Link>
        <Link className="secondary-button" to="/register">
          Create account
        </Link>
      </div>
    </section>
  </ShellLayout>
);

const LoginPlaceholder = () => (
  <ShellLayout
    title="Login flow coming next"
    description="Authentication pages will be built in a later commit."
  >
    <section className="placeholder-card">
      <h2>Login page placeholder</h2>
      <p>
        This route is added early so the routing structure is in place before the
        real form components are introduced.
      </p>
    </section>
  </ShellLayout>
);

const RegisterPlaceholder = () => (
  <ShellLayout
    title="Registration flow coming next"
    description="The account creation UI will be added after the auth layer is wired in."
  >
    <section className="placeholder-card">
      <h2>Register page placeholder</h2>
      <p>
        Later commits can replace this placeholder with the real registration
        screen without changing the route structure.
      </p>
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
      <Route path="/login" element={<LoginPlaceholder />} />
      <Route path="/register" element={<RegisterPlaceholder />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
