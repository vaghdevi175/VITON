import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Signup() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSignup = async () => {

    try {

      await axios.post(
        "http://localhost:5000/signup",
        {
          email,
          password
        }
      );

      alert("Account created successfully");

      // go back to login page
      navigate("/");

    } catch {

      alert("User already exists");

    }

  };

  return (

    <div style={{textAlign:"center", marginTop:"100px"}}>

      <h2>Signup</h2>

      <input
        placeholder="Email"
        onChange={(e)=>setEmail(e.target.value)}
      />

      <br/><br/>

      <input
        type="password"
        placeholder="Password"
        onChange={(e)=>setPassword(e.target.value)}
      />

      <br/><br/>

      <button onClick={handleSignup}>
        Register
      </button>

      <br/><br/>

      <Link to="/">Back to Login</Link>

    </div>

  );
}

export default Signup;