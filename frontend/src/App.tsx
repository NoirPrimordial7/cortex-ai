import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  BookOpenTextIcon,
  FilesIcon,
  SquaresFourIcon,
  WarningCircleIcon,
  UsersThreeIcon,
  ClockCounterClockwiseIcon,
  SignOutIcon,
  MoonIcon,
  SunIcon,
  ListIcon,
  XIcon,
  CirclesThreePlusIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { useSession } from "./session";
import { State } from "./components";
import Login from "./pages/Login";
import { RouteBoundary } from "./RouteBoundary";
const Assistant = lazy(() => import("./pages/Assistant"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Library = lazy(() => import("./pages/Library"));
const DocumentDetail = lazy(() => import("./pages/DocumentDetail"));
const Upload = lazy(() => import("./pages/Upload"));
const Activity = lazy(() => import("./pages/Activity"));
const Permissions = lazy(() => import("./pages/Permissions"));
export default function App() {
  const { user, ready, signOut } = useSession();
  const [dark, setDark] = useState(false),
    [menu, setMenu] = useState(false),
    [error, setError] = useState("");
  const [mobile, setMobile] = useState(
    () => matchMedia("(max-width: 700px)").matches,
  );
  const rail = useRef<HTMLElement>(null),
    menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const query = matchMedia("(max-width: 700px)");
    const changed = () => {
      setMobile(query.matches);
      if (!query.matches) setMenu(false);
    };
    query.addEventListener("change", changed);
    return () => query.removeEventListener("change", changed);
  }, []);
  useEffect(() => {
    if (!menu || !mobile) return;
    rail.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        menuButton.current?.focus();
      }
      if (e.key !== "Tab") return;
      const items = [
        menuButton.current,
        ...Array.from(
          rail.current?.querySelectorAll<HTMLElement>("a,button") || [],
        ),
      ].filter((x): x is HTMLElement => x !== null);
      const first = items[0],
        last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [menu, mobile]);
  const location = useLocation();
  if (!ready) return <State loading />;
  if (!user) return <Login />;
  const nav = [
    { to: "/", label: "Overview", icon: SquaresFourIcon },
    {
      to: "/assistant",
      label: "Knowledge assistant",
      icon: BookOpenTextIcon,
      action: "query.execute",
    },
    { to: "/documents", label: "Document library", icon: FilesIcon },
    {
      to: "/conflicts",
      label: "Conflicts & validity",
      icon: WarningCircleIcon,
      action: "query.execute",
    },
    {
      to: "/history",
      label: "My activity",
      icon: ClockCounterClockwiseIcon,
      action: "query.execute",
    },
    {
      to: "/permissions",
      label: "Permissions & people",
      icon: UsersThreeIcon,
      action: "user.manage",
    },
    {
      to: "/audit",
      label: "Audit activity",
      icon: ShieldCheckIcon,
      action: "audit.read",
    },
  ];
  const title =
    nav.find((n) => n.to === location.pathname)?.label || "Document workspace";
  return (
    <div className={"app " + (dark ? "dark" : "")}>
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <button
        ref={menuButton}
        className="menu-toggle icon-button"
        aria-label={menu ? "Close navigation" : "Open navigation"}
        aria-expanded={menu}
        aria-controls="workspace-navigation"
        onClick={() => setMenu(!menu)}
      >
        {menu ? <XIcon size={22} /> : <ListIcon size={22} />}
      </button>
      <aside
        id="workspace-navigation"
        ref={rail}
        className={"rail " + (menu ? "expanded" : "")}
      >
        <div className="brand">
          <CirclesThreePlusIcon size={25} weight="duotone" />
          <span>
            cortex<span className="brand-ai">AI</span>
          </span>
        </div>
        <div className="workspace-label">
          <span className="workspace-initial">N</span>
          <div>
            <strong>
              {user.workspace === "NORTHSTAR"
                ? "Northstar Works"
                : user.workspace}
            </strong>
            <span>Fictional company</span>
          </div>
        </div>
        <nav aria-label="Workspace navigation">
          {nav
            .filter((n) => !n.action || user.actions.includes(n.action))
            .map((n) => (
              <NavLink
                to={n.to}
                end={n.to === "/"}
                key={n.to}
                aria-label={n.label}
                onClick={() => setMenu(false)}
              >
                <n.icon size={20} weight="regular" />
                {n.label}
              </NavLink>
            ))}
        </nav>
        <footer className="rail-footer">
          <div className="profile">
            <span>
              {user.display_name
                .split(" ")
                .map((s) => s[0])
                .join("")
                .slice(0, 2)}
            </span>
            <div>
              <strong>{user.display_name}</strong>
              <small>{user.roles.map((r) => r.name).join(" · ")}</small>
            </div>
          </div>
          <div className="rail-actions">
            <button
              aria-label={
                dark ? "Switch to light theme" : "Switch to dark theme"
              }
              onClick={() => setDark(!dark)}
            >
              {dark ? <SunIcon size={18} /> : <MoonIcon size={18} />}Theme
            </button>
            <button
              onClick={() => void signOut().catch((e) => setError(e.message))}
            >
              <SignOutIcon size={18} />
              Sign out
            </button>
          </div>
        </footer>
      </aside>
      <div className="app-body" inert={mobile && menu}>
        <header className="topbar">
          <span>{title}</span>
          <div>
            <span className="environment">
              {user.read_only_demo ? "Shared demo" : "Local workspace"}
            </span>
            <span className="top-date">
              {new Intl.DateTimeFormat("en", {
                dateStyle: "medium",
                timeZone: "Asia/Kolkata",
              }).format(new Date())}
            </span>
          </div>
        </header>
        <main id="workspace" className="workspace">
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
                  element={
                    user.actions.includes("query.execute") ? (
                      <Assistant />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />
                <Route path="/documents" element={<Library />} />
                <Route path="/documents/:id" element={<DocumentDetail />} />
                <Route
                  path="/upload"
                  element={
                    user.actions.includes("document.upload") ? (
                      <Upload />
                    ) : (
                      <Navigate to="/documents" replace />
                    )
                  }
                />
                <Route path="/conflicts" element={<Activity conflicts />} />
                <Route path="/history" element={<Activity />} />
                <Route
                  path="/permissions"
                  element={
                    user.actions.includes("user.manage") ? (
                      <Permissions />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />
                <Route
                  path="/audit"
                  element={
                    user.actions.includes("audit.read") ? (
                      <Activity audit />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </RouteBoundary>
        </main>
      </div>
    </div>
  );
}
