import React, { useEffect, useState } from 'react';
import './Lobby.css';
import { User } from '../../Types/User';
import { TypeLobby } from '../../Types/TypeLobby';
import SignalRService from '../../services/SignalRService';

function Lobby() {
  const [lobbies, setLobbies] = useState<TypeLobby[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const signalRService = SignalRService.getInstance();

    // Initialize SignalR connection when component mounts
  useEffect(() => {
    const initializeSignalR = async () => {
      try {
        await signalRService.startConnection();
        
        // Listen for lobby updates
        signalRService.on("ReceiveMessage", (message) => {
          console.log("SignalR message:", message);
          setStatusMessage(message);
        });
        
              // Listen for lobby updates and refresh the lobbies state
      signalRService.on("LobbyUpdated", (updatedLobby: TypeLobby) => {
        setLobbies((prevLobbies) =>
          prevLobbies.map((lobby) =>
            lobby.lobbyId === updatedLobby.lobbyId ? updatedLobby : lobby
          )
        );
      });
      
      // Listen for new lobby creation
      signalRService.on("LobbyCreated", (newLobby: TypeLobby) => {
        console.log("Received newLobby:", newLobby);
        if (newLobby && newLobby.lobbyId) {
          setLobbies((prevLobbies) => [...prevLobbies, newLobby]);
        } else {
          console.error("Received invalid newLobby object:", newLobby);
        }
      });
      } catch (error) {
        console.error("Error initializing SignalR:", error);
      }
    };

    signalRService.on("PlayerJoinedLobby", (lobbyId: number, user: User) => {
      console.log(`Player joined lobby: ${lobbyId}`, user);
    
      if (!lobbyId || !user) {
        console.error("Invalid data received for PlayerJoinedLobby:", { lobbyId, user });
        return;
      }
    
      setLobbies((prevLobbies) =>
        prevLobbies.map((lobby) =>
          lobby.lobbyId === lobbyId
            ? { ...lobby, users: [...lobby.users, user] } // Add the new user to the lobby's user list
            : lobby
        )
      );
    });

    initializeSignalR();

    // Clean up when component unmounts
    return () => {
      signalRService.off("ReceiveMessage");
      signalRService.off("LobbyUpdated");
      signalRService.off("LobbyCreated");
      signalRService.off("PlayerJoinedLobby");
    };
  }, []);

  // Fetch current user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser) as User;
      
      // Update the user with the SignalR connection ID
      user.connectionId = signalRService.getConnectionId() ?? undefined;
      
      setCurrentUser(user);
    }
  }, []);

  // Fetch all lobbies
  useEffect(() => {
    fetchLobbies();
  }, []);

  useEffect(() => {
    fetchLobbies();
  }, []);

  const fetchLobbies = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch("http://localhost:5177/api/Lobbies");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch lobbies. Status: ${response.status}`);
      }
      
      const data = await response.json();
      setLobbies(data);
      
    } catch (error) {
      console.error(error);
      setError(`Error fetching lobbies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const createLobby = async () => {
    try {
      setStatusMessage("Creating lobby...");
      
      const response = await fetch("http://localhost:5177/api/Lobbies/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create lobby. Status: ${response.status}`);
      }
      
      const newLobby = await response.json();
      setLobbies(prevLobbies => [...prevLobbies, newLobby]);
      setStatusMessage("Lobby created successfully!");
      
      // Refresh lobbies to get the most up-to-date list
      fetchLobbies();
      
    } catch (error) {
      console.error(error);
      setStatusMessage(`Error creating lobby: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const joinLobby = async (lobbyId: number) => {
    if (!currentUser) {
      setStatusMessage("Please log in before joining a lobby");
      return;
    }
    
    try {
      setStatusMessage("Joining lobby...");
      
      // Make sure we have the latest connectionId
      const updatedUser = { 
        ...currentUser, 
        connectionId: signalRService.getConnectionId() 
      };
      
      const response = await fetch(`http://localhost:5177/api/Lobbies/${lobbyId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedUser)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to join lobby. Status: ${response.status}`);
      }
      
      // Join the SignalR group for this lobby
      await signalRService.joinGroup(lobbyId.toString());
      
      setStatusMessage(`Successfully joined lobby ${lobbyId}`);
      
      // Refresh lobbies to update the users list
      fetchLobbies();
      
    } catch (error) {
      console.error(error);
      setStatusMessage(`Error joining lobby: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const startGame = async (lobbyId: number) => {
    try {
      setStatusMessage("Starting game...");
      
      const response = await fetch(`http://localhost:5177/api/Lobbies/${lobbyId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to start game. Status: ${response.status}`);
      }
      
      setStatusMessage(`Game started in lobby ${lobbyId}`);

      setLobbies(prevLobbies =>
        prevLobbies.map(lobby =>
          lobby.lobbyId === lobbyId ? { ...lobby, isStarted: true } : lobby
        )
      );
      
      // Refresh lobbies
      fetchLobbies();
      
    } catch (error) {
      console.error(error);
      setStatusMessage(`Error starting game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };


  // Check if current user is in a specific lobby
  const isUserInLobby = (lobby: TypeLobby) => {
    if (!currentUser) return false;
    return lobby.users.some(user => user.userId === currentUser.userId);
  };

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>Game Lobbies</h1>
        {currentUser ? (
          <div>Logged in as: <strong>{currentUser.userName}</strong></div>
        ) : (
          <div>Please log in to join lobbies</div>
        )}
      </div>
      
      {statusMessage && (
        <div className={`status-message ${statusMessage.includes('Error') ? 'error' : 'success'}`}>
          {statusMessage}
        </div>
      )}
      
      <button 
        className="button primary create-lobby-button"
        onClick={createLobby}
        disabled={loading}
      >
        Create New Lobby
      </button>
      
      <div className="lobbies-section">
        <h2>Available Lobbies</h2>
        
        {loading ? (
          <p className="loading-message">Loading lobbies...</p>
        ) : error ? (
          <p className="status-message error">{error}</p>
        ) : lobbies.length === 0 ? (
          <p>No lobbies available. Create one to get started!</p>
        ) : (
          <ul className="lobby-list">
            {lobbies.map(lobby => (
              <li key={lobby.lobbyId} className="lobby-item">
                <div className="lobby-details">
                  <h3>Lobby #{lobby.lobbyId}</h3>
                  <div className="lobby-users">
                    Players: {lobby.users.length}
                    <ul>
                        {lobby.users.map((user, index) => (
                        <li key={user.userId !== undefined ? user.userId : `user-${index}`}>
                            {user.userName}
                        </li>
                        ))}
                    </ul>
                  </div>
                </div>
                
                <div className="lobby-actions">
                  {isUserInLobby(lobby) ? (
                    <>
                      {/* Only show Start button if user is in lobby and the game hasn't started */}
                      {!lobby.isStarted && (
                        <button 
                          className="button secondary"
                          onClick={() => startGame(lobby.lobbyId)}
                        >
                          Start Game
                        </button>
                      )}
                    </>
                  ) : (
                    <button 
                      className="button secondary"
                      onClick={() => joinLobby(lobby.lobbyId)}
                      disabled={!currentUser}
                    >
                      Join
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Lobby;