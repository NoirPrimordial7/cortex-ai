import { Navigate } from "react-router-dom";

/** Retired route: the active three roles use centralized Leave Management. */
export default function Team() {
  return <Navigate to="/leave" replace />;
}
