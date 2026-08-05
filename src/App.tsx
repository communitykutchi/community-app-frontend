import { BrowserRouter as Router, Routes, Route , Navigate} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import Notices from "./pages/Notices";
import AdminUsers from "./pages/AdminUsers";
import PeopleProfile from "./pages/personProfile";
import Friends from "./pages/Friends";
import Chat from "./pages/Chat";
import ChatHub from "./pages/ChatHub";
import MainLayout from "./layout/MainLayout";
import PrivateRoute from "./routes/PrivateRoute";

function App() {
  return (
    <Router>

      <MainLayout>

        <Routes>

          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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
            path="/profile"
            element={
              <PrivateRoute>
                <PeopleProfile />
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
                <Chat />
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

          <Route
            path="/admin/users"
            element={
              <PrivateRoute>
                <AdminUsers />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>

      </MainLayout>

    </Router>
  );
}

export default App;
