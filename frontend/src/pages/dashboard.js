import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "../css/dashboard.css";
import { useNavigate } from "react-router-dom";

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
  const isSaving = useRef(false);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isResultMenuOpen, setIsResultMenuOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
  // 1. Check URL first (for Google Redirects)
  const params = new URLSearchParams(window.location.search);
  const emailParam = params.get("email");
  if (emailParam) return emailParam;

  // 2. Fallback to LocalStorage
  const storedUser = localStorage.getItem("user");
  return storedUser ? JSON.parse(storedUser) : "User";
});
  const navigate = useNavigate();
  const storageKey = `tryon-history-${currentUser}`;
  const [history, setHistory] = useState(() => {
  try {
    // If we have a user (from URL or Storage), fetch their specific history
    const saved = localStorage.getItem(`tryon-history-${currentUser}`);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
});
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");

  if (email) {
    localStorage.setItem("user", JSON.stringify(email));
    setUser(email);
    setCurrentUser(email);   // ✅ IMPORTANT
    const newUserHistoryKey = `tryon-history-${email}`;
    const savedHistory = localStorage.getItem(newUserHistoryKey);
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    } else {
      setHistory([]);
    }
    window.history.replaceState({}, document.title, "/dashboard");
  } else {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }
}, []);

  const logout = () => {
  localStorage.removeItem("user");
  setUser(null);
  navigate("/");   // 🔥 THIS LINE FIXES EVERYTHING
};

  const handleTryOn = async () => {
  if (!person || !cloth) {
    alert("Please upload both the Person and Cloth images.");
    return;
  }
  
  if (isSaving.current) return; // 🚀 prevent duplicate
  isSaving.current = true;

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

    const newItem = {
  person: personPreview,
  cloth: clothPreview,
  result: outputImage,
  personName: person.name,
  clothName: cloth.name
};

    setHistory((prev) => {
  const updated = [newItem, ...prev];

  localStorage.setItem(storageKey, JSON.stringify(updated));

  return updated;
});

  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
    isSaving.current = false;
  }
};

  const handleDownload = async (e) => {
    e.stopPropagation();
    //setIsResultMenuOpen(false); // Close menu on click
    if (!result) return;

    try {
      // Force download by fetching the image as a blob
      const response = await fetch(result);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "my-virtual-tryon.png";
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const toggleMenu = (e, index) => {
    e.stopPropagation();
    setOpenMenuIndex(openMenuIndex === index ? null : index);
  };

  const handleDeleteHistory = (e, index) => {
  e.stopPropagation();

  const newHistory = (history || []).filter((_, i) => i !== index);

  setHistory(newHistory);

  // ✅ SAVE AFTER DELETE
  localStorage.setItem(storageKey, JSON.stringify(newHistory));

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
    setIsResultMenuOpen(false); // Add this line
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
            {/* RESULT */}
            <div className="upload-box">
              <h3>Result</h3>
              <div className="image-box result-box" style={{ position: 'relative' }}>
                {result ? (
                  <>
                    <img src={result} alt="result" />
                    
                    {/* 3-Dots Menu Button - Bottom Left */}
                    {/* Direct Download Button - Bottom Left */}
<button 
  type="button"
  style={{
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    background: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    border: 'none',
    color: '#ffffff',
    zIndex: '10,7',
    transition: 'transform 0.2s ease, background 0.2s ease'
  }}
  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
  onClick={handleDownload}
  title="Download Result"
>
  {/* Clean Feather SVG Download Icon */}
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
</button>

                    {/* Dropdown Menu */}
                    {isResultMenuOpen && (
                      <div 
                        className="dropdown-menu" 
                        style={{
                          position: 'absolute',
                          bottom: '50px',
                          left: '10px',
                          top: 'auto',
                          right: 'auto',
                          zIndex: 100
                        }}
                      >
                        <div className="dropdown-item" onClick={handleDownload}>
                          Download
                        </div>
                      </div>
                    )}
                  </>
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