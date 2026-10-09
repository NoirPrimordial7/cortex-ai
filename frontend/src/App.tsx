import { readableName } from "./labels";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  ListIcon,
  MoonIcon,
  SunIcon,
  SignOutIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useSession } from "./session";
import { SourceDialog, State } from "./components";
import Login from "./pages/Login";
import { RouteBoundary } from "./RouteBoundary";
const Assistant = lazy(() => import("./pages/Assistant"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Library = lazy(() => import("./pages/Library"));
const DocumentDetail = lazy(() => import("./pages/DocumentDetail"));
const Upload = lazy(() => import("./pages/Upload"));
const History = lazy(() => import("./pages/History"));
const Conflicts = lazy(() => import("./pages/Conflicts"));
const Audit = lazy(() => import("./pages/Audit"));
const Permissions = lazy(() => import("./pages/Permissions"));
const navigation = [
  { to: "/", label: "Overview", name: "Overview" },
  {
    to: "/assistant",
    label: "Ask Cortex",
    name: "Knowledge assistant",
    action: "query.execute",
  },
  { to: "/documents", label: "Library", name: "Document library" },
  {
    to: "/conflicts",
    label: "Conflicts",
    name: "Conflicts & validity",
    action: "query.execute",
  },
  {
    to: "/history",
    label: "Activity",
    name: "My activity",
    action: "query.execute",
  },
  {
    to: "/permissions",
    label: "People & access",
    name: "Permissions & people",
    action: "user.manage",
  },
  {
    to: "/audit",
    label: "Audit",
    name: "Audit activity",
    action: "audit.read",
  },
];
export default function App() {
  const { user, ready, signOut } = useSession();
  const location = useLocation();
  const [dark, setDark] = useState(() => {
      try {
        return localStorage.getItem("cortex:theme:v1") === "dark";
      } catch {
        return false;
      }
    }),
    [menu, setMenu] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    try {
      localStorage.setItem("cortex:theme:v1", dark ? "dark" : "light");
    } catch {
      /* Theme remains usable when storage is unavailable. */
    }
  }, [dark]);
  useEffect(() => {
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);
  const themeButton = (
    <button
      className="icon-button"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setDark(!dark)}
    >
      {dark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
    </button>
  );
  if (!ready) return <State loading />;
  if (!user)
    return (
      <div className={"app " + (dark ? "dark" : "")}>
        <div className="login-theme">{themeButton}</div>
        <Login />
      </div>
    );
  const allowed = navigation.filter(
    (n) => !n.action || user.actions.includes(n.action),
  );
  const links = allowed.map((n) => (
    <NavLink
      key={n.to}
      to={n.to}
      end={n.to === "/"}
      aria-label={n.name}
      onClick={() => setMenu(false)}
    >
      {n.label}
    </NavLink>
  ));
  function gate(action: string, element: React.ReactNode, to = "/") {
    return user!.actions.includes(action) ? (
      element
    ) : (
      <Navigate to={to} replace />
    );
  }
  return (
    <div className={"app " + (dark ? "dark" : "")}>
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <header className="app-masthead">
        <div className="masthead-inner">
          <NavLink className="wordmark" to="/" aria-label="Cortex home">
            Cortex<span>The Evidence Desk</span>
          </NavLink>
          <div className="masthead-context">
            <strong>
              {user.workspace === "NORTHSTAR"
                ? "Auronix"
                : user.workspace === "ORBIT"
                  ? "Auronix sandbox"
                  : user.workspace}
            </strong>
            <span>
              {user.display_name} ·{" "}
              {user.roles.map((r) => readableName(r.name)).join(", ")}
            </span>
          </div>
          <div className="masthead-actions">
            {themeButton}
            <button
              className="icon-button signout"
              aria-label="Sign out"
              onClick={() => void signOut().catch((e) => setError(e.message))}
            >
              <SignOutIcon size={20} />
            </button>
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              aria-expanded={menu}
              aria-controls="workspace-navigation"
              onClick={() => setMenu(true)}
            >
              <ListIcon size={22} />
            </button>
          </div>
        </div>
        <nav className="app-navigation" aria-label="Workspace navigation">
          {links}
        </nav>
      </header>
      {menu && (
        <SourceDialog
          onClose={() => setMenu(false)}
          label="Workspace navigation"
          className="navigation-dialog"
        >
          <div className="section-heading">
            <h2>Your workspace</h2>
            <button
              className="icon-button"
              aria-label="Close navigation"
              onClick={() => setMenu(false)}
            >
              <XIcon size={22} />
            </button>
          </div>
          <nav id="workspace-navigation">{links}</nav>
          <p className="subtle">
            {user.display_name} ·{" "}
            {user.roles.map((r) => readableName(r.name)).join(", ")}
          </p>
          <button
            className="button"
            onClick={() => void signOut().catch((e) => setError(e.message))}
          >
            Sign out
          </button>
        </SourceDialog>
      )}
      <main id="workspace" className="workspace" tabIndex={-1}>
        {user.read_only_demo && (
          <p className="shared-demo-note">
            Fictional shared demo · documents and permissions are view-only.
            Histories are shared by profile; data resets on backend restart.
          </p>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <RouteBoundary key={location.pathname}>
          <Suspense fallback={<State loading />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route
                path="/assistant"
                element={gate("query.execute", <Assistant />)}
              />
              <Route path="/documents" element={<Library />} />
              <Route path="/documents/:id" element={<DocumentDetail />} />
              <Route
                path="/upload"
                element={gate("document.upload", <Upload />, "/documents")}
              />
              <Route
                path="/history"
                element={gate("query.execute", <History />)}
              />
              <Route
                path="/conflicts"
                element={gate("query.execute", <Conflicts />)}
              />
              <Route
                path="/permissions"
                element={gate("user.manage", <Permissions />)}
              />
              <Route path="/audit" element={gate("audit.read", <Audit />)} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </RouteBoundary>
      </main>
      <footer className="app-footer">
        <span>Policy knowledge, with context.</span>
        <span>Evidence · versions · effective dates</span>
      </footer>
    </div>
  );
}
