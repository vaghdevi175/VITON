import React, { useState } from "react";
import axios from "axios";

function ResetPassword() {

  const [password, setPassword] = useState("");

  const handleReset = async () => {

    try {

      await axios.post(
  "http://localhost:5000/reset-password",
  {
    email: localStorage.getItem("resetEmail"),
    password
  }
);

      alert("Password updated");

    } catch {

      alert("Error resetting password");

    }

  };

  return (

    <div style={{textAlign:"center", marginTop:"100px"}}>

      <h2>Reset Password</h2>

      <input
        type="password"
        placeholder="New Password"
        onChange={(e)=>setPassword(e.target.value)}
      />

      <br/><br/>

      <button onClick={handleReset}>
        Update Password
      </button>

    </div>

  );
}

export default ResetPassword;