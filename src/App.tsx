import { BrowserRouter as Router, Routes, Route , Navigate} from "react-router-dom";

import Home from "./pages/Home.js";
import Login from "./pages/Login.js";
import Register from "./pages/Register.js";
import Feed from "./pages/Feed.js";
import Notices from "./pages/Notices.js";
import AdminUsers from "./pages/AdminUsers.js";
import MainLayout from "./layout/MainLayout.js";
import PrivateRoute from "./routes/PrivateRoute.js";

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
