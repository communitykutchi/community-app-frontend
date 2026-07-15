import { Navigate } from "react-router-dom";
import { type ReactNode } from "react";
import { getAuthToken } from "../auth/session.js";

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const token = getAuthToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
