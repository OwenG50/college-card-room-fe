import React, { useEffect, useState } from 'react';

interface User {
  userId: number;
  firstName: string;
  lastName: string;
  userName: string;
}

function About() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5177/api/User");

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

  return (
    <div>
      <h1>About College Card Room</h1>
      <p>This is a poker application for college students to play virtual poker games.</p>
      
      <h2>Users</h2>
      {loading ? (
        <p>Loading users...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <ul>
          {users.length > 0 ? (
            users.map(user => (
              <li key={user.userId}>
                <strong>{user.userName}</strong> - {user.firstName} {user.lastName}
              </li>
            ))
          ) : (
            <p>No users found</p>
          )}
        </ul>
      )}
    </div>
  );
}

export default About;