import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.js";
import Login from "./pages/Login.js";
import Register from "./pages/Register.js";
import Feed from "./pages/Feed.js";
import Notices from "./pages/Notices.js";
import AdminUsers from "./pages/AdminUsers.js";
import MainLayout from "./layout/MainLayout.js";
import PrivateRoute from "./routes/PrivateRoute.js";
function App() {
    return (_jsx(Router, { children: _jsx(MainLayout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/register", element: _jsx(Register, {}) }), _jsx(Route, { path: "/", element: _jsx(PrivateRoute, { children: _jsx(Home, {}) }) }), _jsx(Route, { path: "/feed", element: _jsx(PrivateRoute, { children: _jsx(Feed, {}) }) }), _jsx(Route, { path: "/notices", element: _jsx(PrivateRoute, { children: _jsx(Notices, {}) }) }), _jsx(Route, { path: "/admin/users", element: _jsx(PrivateRoute, { children: _jsx(AdminUsers, {}) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/login", replace: true }) })] }) }) }));
}
export default App;
