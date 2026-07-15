import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from "react-router-dom";
import { getAuthToken } from "../auth/session.js";
export default function PrivateRoute({ children }) {
    const token = getAuthToken();
    if (!token) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
