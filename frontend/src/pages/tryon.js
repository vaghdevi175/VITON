import React, { useState } from "react";
import axios from "axios";

function TryOn() {

  const [person, setPerson] = useState(null);
  const [cloth, setCloth] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

 const handleTryOn = async () => {

  if (!person || !cloth) {
    alert("Upload both images");
    return;
  }

  const formData = new FormData();
  formData.append("person", person);
  formData.append("cloth", cloth);

  try {

    const res = await axios.post(
      "http://localhost:5000/tryon",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    console.log(res.data);

    setResult(res.data.result);

  } catch (error) {
    console.error("TRYON ERROR:", error);
    alert("Backend failed. Check Flask terminal.");
  }

};



  return (

    <div style={{textAlign:"center", padding:"40px"}}>

      <h1>Virtual Try-On</h1>

      <div>
        <h3>Upload Person Image</h3>
        <input
          type="file"
          onChange={(e)=>setPerson(e.target.files[0])}
        />
      </div>

      <br/>

      <div>
        <h3>Upload Cloth Image</h3>
        <input
          type="file"
          onChange={(e)=>setCloth(e.target.files[0])}
        />
      </div>

      <br/>

      <button
        onClick={handleTryOn}
        style={{
          padding:"12px 25px",
          fontSize:"18px",
          cursor:"pointer"
        }}
      >
        Try On
      </button>

      {loading && (
        <h3 style={{marginTop:"20px"}}>
          Processing... please wait
        </h3>
      )}

      {result && (
        <div style={{marginTop:"40px"}}>
          <h2>Result</h2>
          <img src={result} alt="TryOn Result" width="400"/>
        </div>
      )}

    </div>

  );
}

export default TryOn;