import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import Notices from "./pages/Notices";
import Polls from "./pages/Polls";
import Workers from "./pages/Workers";
import Help from "./pages/Help";
import Banned from "./pages/Banned";
import SuperAdmin from "./pages/SuperAdmin";
import Admin from "./pages/Admin";
import PeopleProfile from "./pages/personProfile";
import UserProfile from "./pages/UserProfile";
import Friends from "./pages/Friends";
import Chat from "./pages/Chat";
import ChatHub from "./pages/ChatHub";
import MainLayout from "./layout/MainLayout";
import PrivateRoute from "./routes/PrivateRoute";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <MainLayout>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/banned" element={<Banned />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />

            <Route
              path="/feed"
              element={
                <PrivateRoute>
                  <Feed />
                </PrivateRoute>
              }
            />

            <Route
              path="/notices"
              element={
                <PrivateRoute>
                  <Notices />
                </PrivateRoute>
              }
            />

            <Route
              path="/polls"
              element={
                <PrivateRoute>
                  <Polls />
                </PrivateRoute>
              }
            />

            <Route
              path="/jobs"
              element={
                <PrivateRoute>
                  <Workers />
                </PrivateRoute>
              }
            />
            <Route
              path="/workers"
              element={
                <PrivateRoute>
                  <Workers />
                </PrivateRoute>
              }
            />

            <Route
              path="/help"
              element={
                <PrivateRoute>
                  <Help />
                </PrivateRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <PeopleProfile />
                </PrivateRoute>
              }
            />

            <Route
              path="/user/:userId"
              element={
                <PrivateRoute>
                  <UserProfile />
                </PrivateRoute>
              }
            />

            <Route
              path="/friends"
              element={
                <PrivateRoute>
                  <Friends />
                </PrivateRoute>
              }
            />

            <Route
              path="/friends/:friendId/chat"
              element={
                <PrivateRoute>
                  <ChatHub />
                </PrivateRoute>
              }
            />

            <Route
              path="/chat/:friendId"
              element={
                <PrivateRoute>
                  <ChatHub />
                </PrivateRoute>
              }
            />

            <Route
              path="/chats"
              element={
                <PrivateRoute>
                  <ChatHub />
                </PrivateRoute>
              }
            />

            <Route
              path="/chat"
              element={
                <PrivateRoute>
                  <ChatHub />
                </PrivateRoute>
              }
            />

            {/* Dedicated Super Admin Control Center */}
            <Route
              path="/super-admin"
              element={
                <PrivateRoute>
                  <SuperAdmin />
                </PrivateRoute>
              }
            />

            {/* Standard Admin Panel */}
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <Admin />
                </PrivateRoute>
              }
            />

            <Route path="/admin/users" element={<Navigate to="/super-admin" replace />} />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </MainLayout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
