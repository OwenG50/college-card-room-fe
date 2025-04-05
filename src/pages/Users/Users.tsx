import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Users.css';
import { User } from '../../Types/User';

function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [loginStatus, setLoginStatus] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5177/api/Users");

        if (!response.ok) {
          throw new Error(`API call failed with status: ${response.status}`);
        }

        const data = await response.json();
        setUsers(data);
        
      } catch (error) {
        console.error(error);
        setError("Error fetching users from server");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const handleUserLogin = async (userId: number) => {
    try {
      setLoginStatus(`Logging in...`);
      
      // Call your getUserById endpoint
      const response = await fetch(`http://localhost:5177/api/Users/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to login as user. Status: ${response.status}`);
      }
      
      const userData = await response.json();
      
      // Store user data in localStorage or sessionStorage
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      // Dispatch custom event to notify App component of login
      window.dispatchEvent(new Event('userLogin'));
      
      setLoginStatus(`Successfully logged in as ${userData.userName}`);
      
      // Redirect to home page after successful login
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (error) {
      console.error(error);
      setLoginStatus(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="users-container">
      <h1>Users</h1>
      {loginStatus && (
        <div className={`status-message ${loginStatus.includes('failed') ? 'error' : 'success'}`}>
          {loginStatus}
        </div>
      )}
      
      {loading ? (
        <p className="loading-message">Loading users...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div>
          <h2>Select a User to Login As</h2>
          <ul className="users-list">
            {users.length > 0 ? (
              users.map(user => (
                <li 
                  key={user.userId} 
                  className="user-item"
                  onClick={() => handleUserLogin(user.userId)}
                >
                  <strong>{user.userName}</strong> - {user.firstName} {user.lastName}
                </li>
              ))
            ) : (
              <p>No users found</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Users;