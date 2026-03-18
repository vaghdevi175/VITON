import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function ForgotPassword() {

  const [email, setEmail] = useState("");

  const handleReset = async () => {

    try {

      await axios.post(
        "http://localhost:5000/forgot-password",
        { email }
      );

      // STORE EMAIL FOR RESET PAGE
      localStorage.setItem("resetEmail", email);

      alert("Password reset link sent to your email");

      // redirect user to reset page
      window.location.href = "/reset-password";

    } catch {

      alert("Email not found");

    }

  };

  return (

    <div style={{ textAlign: "center", marginTop: "100px" }}>

      <h2>Forgot Password</h2>

      <input
        type="email"
        placeholder="Enter your email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <br/><br/>

      <button onClick={handleReset}>
        Send Reset Link
      </button>

      <br/><br/>

      <Link to="/">Back to Login</Link>

    </div>

  );
}

export default ForgotPassword;