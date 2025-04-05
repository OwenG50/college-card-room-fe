import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Users from './pages/Users/Users';
import Lobby from './pages/Lobby/Lobby';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState<{ userName: string } | null>(null);

  useEffect(() => {
    // Check for user in localStorage on initial load
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    // Set up event listener for storage changes (in case login happens in another tab)
    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem('currentUser');
      if (updatedUser) {
        setCurrentUser(JSON.parse(updatedUser));
      } else {
        setCurrentUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event for same-tab updates
    window.addEventListener('userLogin', () => {
      const updatedUser = localStorage.getItem('currentUser');
      if (updatedUser) {
        setCurrentUser(JSON.parse(updatedUser));
      }
    });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLogin', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/users">Users</Link>
            </li>
            <li>
              <Link to="/lobby">Lobbies</Link>
            </li>
          </ul>
          
          <div>
            {currentUser ? (
              <div className="user-info">
                <span className="username">
                  Logged in as <strong>{currentUser.userName}</strong>
                </span>
                <button 
                  onClick={handleLogout}
                  className="logout-button"
                >
                  Logout
                </button>
              </div>
            ) : (
              <span>Not logged in</span>
            )}
          </div>
        </nav>

        <div className="content">
          <Routes>
            <Route path="/about" element={<About />} />
            <Route path="/users" element={<Users />} />
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;