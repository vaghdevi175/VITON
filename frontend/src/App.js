import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/login";
import Signup from "./pages/signup";
import ForgotPassword from "./pages/forgotpassword";
import Dashboard from "./pages/dashboard";
import ResetPassword from "./pages/resetpassword";

function App() {

  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  if (user === undefined) return <div>Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />}
        />

        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
  path="/dashboard"
  element={
    user || window.location.search.includes("email")
      ? <Dashboard setUser={setUser} />
      : <Navigate to="/" />
  }
/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;