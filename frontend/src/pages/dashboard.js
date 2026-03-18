import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/dashboard.css";

// Helper function to convert images to Base64 so they can be saved in LocalStorage
const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.onerror = (error) => {
      reject(error);
    };
  });
};

function Dashboard({ setUser }) {
  const [person, setPerson] = useState(null);
  const [cloth, setCloth] = useState(null);

  const [personPreview, setPersonPreview] = useState(null);
  const [clothPreview, setClothPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : "User";
  const storageKey = `tryon-history-${currentUser}`;

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(history));
  }, [history, storageKey]);

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const handleTryOn = async () => {
    if (!person || !cloth) {
      alert("Please upload both the Person and Cloth images.");
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("person", person);
    formData.append("cloth", cloth);

    try {
      const res = await axios.post(
        "http://127.0.0.1:5000/tryon",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const outputImage = res.data.result;
      setResult(outputImage);

      // Save to history using the Base64 previews so they persist across page reloads
      const newItem = {
        person: personPreview,
        cloth: clothPreview,
        result: outputImage
      };

      setHistory((prev) => [newItem, ...prev]);
    } catch (error) {
      console.error(error);
      alert("Error connecting to the backend. Please ensure your Python server is running.");
    } finally {
      setLoading(false); 
    }
  };

  const toggleMenu = (e, index) => {
    e.stopPropagation();
    setOpenMenuIndex(openMenuIndex === index ? null : index);
  };

  const handleDeleteHistory = (e, index) => {
    e.stopPropagation();
    const newHistory = history.filter((_, i) => i !== index);
    setHistory(newHistory);
    setOpenMenuIndex(null);
    
    if (selectedIndex === index) {
      setSelectedIndex(null);
      setPersonPreview(null);
      setClothPreview(null);
      setResult(null);
    }
  };

  const handleShareHistory = async (e, item) => {
    e.stopPropagation();
    setOpenMenuIndex(null);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Virtual Try-On',
          text: 'Check out this outfit I tried on virtually!',
          url: window.location.href 
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      alert("Sharing is not fully supported on this desktop browser.");
    }
  };

  const handleCloseMenus = () => {
    setOpenMenuIndex(null);
    setIsUserMenuOpen(false);
  };

  return (
    <div className="dashboard-wrapper" onClick={handleCloseMenus}>
      <div className="dashboard-shape dashboard-shape-1"></div>
      <div className="dashboard-shape dashboard-shape-2"></div>
      <div className="dashboard-shape dashboard-shape-3"></div>
      
      {/* SIDEBAR */}
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="sidebar-header">
          <h2>History</h2>
          <button 
            type="button"
            className="close-sidebar-btn" 
            onClick={(e) => {
              e.stopPropagation();
              setIsSidebarOpen(false);
            }}
          >
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {history.length === 0 ? (
          <p className="empty-text">No history</p>
        ) : (
          <div className="sidebar-list">
            {history.map((item, index) => (
              <div
                key={index}
                className={`sidebar-item ${selectedIndex === index ? "active" : ""} ${openMenuIndex === index ? "menu-open" : ""}`}
                onClick={() => {
                  setSelectedIndex(index);
                  setResult(item.result);
                  setPersonPreview(item.person);
                  setClothPreview(item.cloth);
                  setOpenMenuIndex(null);
                }}
              >
                <img src={item.result} alt="history" />
                
                <button 
                  type="button"
                  className="menu-dots" 
                  onClick={(e) => toggleMenu(e, index)}
                >
                  &#8942;
                </button>

                {openMenuIndex === index && (
                  <div className="dropdown-menu">
                    <div className="dropdown-item" onClick={(e) => handleShareHistory(e, item)}>
                      Share
                    </div>
                    <div className="dropdown-item delete-item" onClick={(e) => handleDeleteHistory(e, index)}>
                      Delete
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="dashboard-container">
        {!isSidebarOpen && (
          <button 
            type="button"
            className="hamburger-btn" 
            onClick={(e) => {
              e.stopPropagation();
              setIsSidebarOpen(true);
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}

        <div className="user-profile-container" onClick={(e) => e.stopPropagation()}>
          <button 
            type="button"
            className="user-icon-btn" 
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen);
              setOpenMenuIndex(null); 
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>

          {isUserMenuOpen && (
            <div className="user-dropdown">
              <div className="user-details">
                <p className="user-email">{currentUser}</p>
              </div>
              <hr className="user-divider" />
              <button type="button" className="dropdown-logout-btn" onClick={logout}>
                Logout
              </button>
            </div>
          )}
        </div>

        <h1 className="title">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '10px', verticalAlign: 'middle'}}>
            <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
            <line x1="16" y1="8" x2="2" y2="22"></line>
            <line x1="17.5" y1="15" x2="9" y2="15"></line>
          </svg>
          Virtual Try-On
        </h1>

        <div className="tryon-card">
          <div className="image-section">
            
           {/* PERSON */}
            <div className="upload-box">
              <h3>Person</h3>
              {/* Using native label connected to input via htmlFor="person-input" */}
              <label htmlFor="person-input" className="image-box-label" style={{ display: 'block', cursor: 'pointer' }}>
                <div className="image-box">
                  {personPreview ? (
                    <img src={personPreview} alt="person" />
                  ) : (
                    <div className="upload-placeholder">
                      <span className="upload-icon">📁</span>
                      <p>Click to upload</p>
                    </div>
                  )}
                </div>
              </label>
              <input
                id="person-input"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onClick={(e) => (e.target.value = null)}
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (!file.type.startsWith("image/")) {
                    alert("Only image files allowed");
                    return;
                  }
                  
                  // Save original file for axios, save Base64 for history/preview
                  setPerson(file);
                  const base64 = await convertToBase64(file);
                  setPersonPreview(base64);
                  setResult(null);
                }}
              />
            </div>

            {/* CLOTH */}
            <div className="upload-box">
              <h3>Cloth</h3>
              <label htmlFor="cloth-input" className="image-box-label" style={{ display: 'block', cursor: 'pointer' }}>
                <div className="image-box">
                  {clothPreview ? (
                    <img src={clothPreview} alt="cloth" />
                  ) : (
                    <div className="upload-placeholder">
                      <span className="upload-icon">👕</span>
                      <p>Click to upload</p>
                    </div>
                  )}
                </div>
              </label>
              <input
                id="cloth-input"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onClick={(e) => (e.target.value = null)}
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (!file.type.startsWith("image/")) {
                    alert("Only image files allowed");
                    return;
                  }
                  
                  // Save original file for axios, save Base64 for history/preview
                  setCloth(file); 
                  const base64 = await convertToBase64(file);
                  setClothPreview(base64);
                  setResult(null);
                }}
              />
            </div>

            {/* RESULT */}
            <div className="upload-box">
              <h3>Result</h3>
              <div className="image-box result-box">
                {result ? (
                  <img src={result} alt="result"/>
                ) : (
                  <div className="upload-placeholder">
                    <span className="upload-icon">✨</span>
                    <p>Try-On Result</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          <button
            type="button"
            className="tryon-btn"
            onClick={handleTryOn}
            disabled={loading}
          >
            {loading ? "Generating..." : "Try On"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;