import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getAuthToken } from "../auth/session";
import API from "../api/axios";
import Loader from "../components/Loader";

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const token = getAuthToken();
  const [checking, setChecking] = useState(true);
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    API.get<{ user?: { isBanned?: boolean } }>("/auth/me")
      .then((res) => {
        if (cancelled) return;
        if (res.data?.user?.isBanned) {
          setIsBanned(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (checking) {
    return (
      <div className="py-24 flex justify-center">
        <Loader />
      </div>
    );
  }

  if (isBanned) {
    return <Navigate to="/banned" replace />;
  }

  return <>{children}</>;
}
