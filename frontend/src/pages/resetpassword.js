import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../css/login.css"; // Reuse the same CSS!

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleReset = async () => {
    if (!password) {
      alert("Please enter a new password");
      return;
    }

    // 1. Grab the email from the URL parameters
    const queryParams = new URLSearchParams(window.location.search);
    const userEmail = queryParams.get("email") || localStorage.getItem("resetEmail");

    if (!userEmail) {
      alert("Email not found. Please request a new reset link.");
      return;
    }

    try {
      // 2. Send the extracted email to the backend
      await axios.post("http://localhost:5000/reset-password", {
        email: userEmail,
        password
      });
      setSuccess(true);
    } catch {
      alert("Error resetting password. Link may be expired.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-split-card">
        
        {/* LEFT BRANDING PANEL (Kept identical for consistency) */}
        <div className="login-left">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>

          <div className="left-content">
            <div className="brand-logo">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                <line x1="16" y1="8" x2="2" y2="22"></line>
                <line x1="17.5" y1="15" x2="9" y2="15"></line>
              </svg>
              <span>Virtual Try-On</span>
            </div>
            <div className="welcome-text">
              <p>Hey</p>
              <p>Welcome To</p>
              <h3>Virtual Try-On</h3>
            </div>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="login-right">
          <div className="form-container">
            {success ? (
              <div style={{textAlign: "center", padding: "20px 0"}}>
                <div style={{fontSize: "48px", marginBottom: "10px"}}>✅</div>
                <h2>Password Updated!</h2>
                <p style={{color: "#64748b", marginBottom: "30px"}}>Your password has been successfully reset.</p>
                <button className="login-btn" onClick={() => navigate("/")}>
                  GO TO LOGIN
                </button>
              </div>
            ) : (
              <>
                <h2>Create New Password</h2>
                <p style={{marginBottom: '20px', color: '#64748b'}}>Please enter your new password below.</p>
                
                <div className="input-group">
                  <div className="input-wrapper">
                    <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="New Password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                    />
                    <button type="button" className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>

                <button className="login-btn" style={{marginTop: '20px'}} onClick={handleReset}>
                  UPDATE PASSWORD
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ResetPassword;