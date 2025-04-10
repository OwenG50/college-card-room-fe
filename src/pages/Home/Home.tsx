import React, { useEffect, useState } from 'react';

function Home() {
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
      <h1>College Card Room</h1>
      <p>Where dreams become reality.</p>
    </div>
  );
}

export default Home;