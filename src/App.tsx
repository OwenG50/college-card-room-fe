import React, { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const response = await fetch("http://localhost:5177/api/Hello");

        if (!response.ok) {
          throw new Error(`API call failed with status: ${response.status}`);
        }

        const data = await response.text();
        setMessage(data);
        
      } catch (error) {
        console.error(error);
        setMessage("Error fetching message from server");
      }
    }

    fetchMessage();
  }, []);

  return (
    <div>
      <h1>Poker App</h1>
      <p>Message from API: {message}</p>
    </div>
  );
}

export default App;
