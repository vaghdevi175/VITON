import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../css/login.css";
import React, { useState } from "react";

function Login({ setUser }) {
  // --- FRONT FACE: LOGIN STATES ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // --- BACK FACE: SIGNUP & FORGOT STATES ---
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  
  // --- UI TOGGLE STATES ---
  const [isFlipped, setIsFlipped] = useState(false);
  const [backView, setBackView] = useState("signup"); // "signup" or "forgot"
  const [signupSuccess, setSignupSuccess] = useState(false); 
  const [forgotSuccess, setForgotSuccess] = useState(false); // Controls forgot success message
  
  const navigate = useNavigate();

  // ==========================
  //      AXIOS FUNCTIONS
  // ==========================

  const handleLogin = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/login",
        { email, password }
      );
      localStorage.setItem("user", JSON.stringify(res.data.email));
      setUser(res.data.email);
      navigate("/dashboard");
    } catch {
      alert("Invalid credentials");
    }
  };

  const handleSignup = async () => {
    if (!signupEmail || !signupPassword) {
      alert("Please fill in both fields");
      return;
    }
    try {
      await axios.post("http://localhost:5000/signup", {
        email: signupEmail,
        password: signupPassword
      });
      setSignupSuccess(true);
    } catch {
      alert("User already exists or an error occurred");
    }
  };

  const handleForgot = async () => {
    if (!forgotEmail) {
      alert("Please enter your email");
      return;
    }
    try {
      await axios.post("http://localhost:5000/forgot-password", { 
        email: forgotEmail 
      });
      
      // Show inline success state instead of redirecting immediately
      localStorage.setItem("resetEmail", forgotEmail);
      setForgotSuccess(true); 
    } catch {
      alert("Email not found");
    }
  };

  // ==========================
  //     FLIP CONTROLLERS
  // ==========================

  const showSignUp = () => {
    setBackView("signup");
    setIsFlipped(true);
  };

  const showForgot = () => {
    setBackView("forgot");
    setIsFlipped(true);
  };

  const showLogin = () => {
    setIsFlipped(false);
    
    // Clear all the back-face forms/states after the flip animation completes (0.6s)
    setTimeout(() => {
      setSignupSuccess(false);
      setForgotSuccess(false);
      setSignupEmail("");
      setSignupPassword("");
      setForgotEmail("");
    }, 600);
  };

  return (
    <div className="login-page">
      <div className="login-split-card">
        
        {/* LEFT BRANDING PANEL */}
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
          <div className={`flip-inner ${isFlipped ? "is-flipped" : ""}`}>
            
            {/* FRONT FACE: LOGIN */}
            <div className="flip-front" style={{ pointerEvents: isFlipped ? "none" : "auto" }}>
              <div className="form-container">
                <h2>Login</h2>

                <div className="input-group">
                  <div className="input-wrapper">
                    <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>

                <div className="input-group">
                  <div className="input-wrapper">
                    <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="login-links">
                  <span className="signup-text">
                    Don't have account? <span style={{color: '#667eea', cursor: 'pointer', fontWeight: 'bold'}} onClick={showSignUp}>Sign up</span>
                  </span>
                  <span className="forgot-text" style={{cursor: 'pointer'}} onClick={showForgot}>Forgot Password?</span>
                </div>

                <button className="login-btn" onClick={handleLogin}>LOGIN</button>
                <div className="divider">
                  <span>OR</span>
                </div>

                <button 
                  className="google-modern-btn"
                  onClick={() => window.location.href = "http://localhost:5000/google-login"}
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="google" />
                  <span>Continue with Google</span>
                </button>
                
                <div className="support-text">
                  <p>If you are having trouble please contact</p>
                  <a href="mailto:support@virtualtryon.com">support@virtualtryon.com</a>
                </div>
              </div>
            </div>

            {/* BACK FACE: SIGNUP OR FORGOT PASSWORD */}
            <div className="flip-back" style={{ pointerEvents: isFlipped ? "auto" : "none" }}>
              <div className="form-container">
                
                {/* --- SIGN UP VIEW --- */}
                {backView === "signup" ? (
                  signupSuccess ? (
                    <div style={{textAlign: "center", padding: "40px 0"}}>
                      <div style={{fontSize: "48px", marginBottom: "10px"}}>🎉</div>
                      <h2>Success!</h2>
                      <p style={{color: "#64748b", marginBottom: "30px"}}>You have successfully registered.</p>
                      <div style={{textAlign: 'center', marginTop: '20px'}}>
                        <span className="back-link-text" onClick={showLogin}>← Back to Login</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2>Sign Up</h2>
                      <div className="input-group">
                        <div className="input-wrapper">
                          <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>
                          </svg>
                          <input type="email" placeholder="Email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} autoComplete="off" />
                        </div>
                      </div>
                      <div className="input-group">
                        <div className="input-wrapper">
                          <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                          <input type="password" placeholder="Password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} autoComplete="new-password" />
                        </div>
                      </div>
                      <button className="login-btn" style={{marginTop: '20px'}} onClick={handleSignup}>REGISTER</button>
                      
                      <div style={{textAlign: 'center', marginTop: '20px'}}>
                        <span className="back-link-text" onClick={showLogin}>← Back to Login</span>
                      </div>
                    </>
                  )
                ) : (

                  /* --- FORGOT PASSWORD VIEW --- */
                  forgotSuccess ? (
                    <div style={{textAlign: "center", padding: "40px 0"}}>
                      <div style={{fontSize: "48px", marginBottom: "10px"}}>✉️</div>
                      <h2>Check your email</h2>
                      <p style={{color: "#64748b", marginBottom: "30px"}}>
                        We've sent a password reset link to <strong>{forgotEmail}</strong>.
                      </p>
                      <div style={{textAlign: 'center', marginTop: '20px'}}>
                        <span className="back-link-text" onClick={showLogin}>← Back to Login</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2>Reset Password</h2>
                      <p style={{marginBottom: '20px', color: '#64748b'}}>Enter your email to receive a reset link.</p>
                      <div className="input-group">
                        <div className="input-wrapper">
                          <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>
                          </svg>
                          <input type="email" placeholder="Email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} autoComplete="off" />
                        </div>
                      </div>
                      <button className="login-btn" style={{marginTop: '20px'}} onClick={handleForgot}>SEND LINK</button>
                      
                      <div style={{textAlign: 'center', marginTop: '20px'}}>
                        <span className="back-link-text" onClick={showLogin}>← Back to Login</span>
                      </div>
                    </>
                  )
                )}

              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;