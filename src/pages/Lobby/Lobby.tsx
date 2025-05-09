import React, { useEffect, useState } from 'react';
import './Lobby.css';
import { User } from '../../Types/User';
import { TypeLobby } from '../../Types/TypeLobby';
import SignalRService from '../../services/SignalRService';
import { useNavigate } from 'react-router-dom';

function Lobby() {
  const [lobbies, setLobbies] = useState<TypeLobby[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [gameUrls, setGameUrls] = useState<Record<number, string>>({});
  const navigate = useNavigate();

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
          
          // Listen for lobby deletion
          signalRService.on("LobbyDeleted", (deletedLobbyId: number) => {
            console.log(`Lobby deleted: ${deletedLobbyId}`);
            setLobbies((prevLobbies) =>
              prevLobbies.filter((lobby) => lobby.lobbyId !== deletedLobbyId)
            );
            setStatusMessage(`Lobby ${deletedLobbyId} was deleted.`);
          });
          
          // Listen for player joining a lobby
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

      // Listen for game start
      signalRService.on("GameStarted", async (lobbyId: number) => {
        console.log(`Game started in lobby: ${lobbyId}`);
        setStatusMessage(`Game started in lobby ${lobbyId}!`);
        
        // Update the lobbies state to mark the game as started
        setLobbies((prevLobbies) =>
          prevLobbies.map((lobby) =>
            lobby.lobbyId === lobbyId ? { ...lobby, isStarted: true } : lobby
          )
        );

        // Fetch poker game data and set gameUrl for all users in the lobby
        try {
          const pokerGameResponse = await fetch(`http://localhost:5177/api/pokerGames/lobby/${lobbyId}`);
          if (pokerGameResponse.ok) {
            const pokerGameData = await pokerGameResponse.json();
            if (pokerGameData && pokerGameData.gameUrl) {
              setGameUrls(prev => ({ ...prev, [lobbyId]: pokerGameData.gameUrl }));
            }
          }
        } catch (err) {
          console.error("Failed to fetch poker game data after GameStarted:", err);
        }
      });

      // ...existing handlers...
    } catch (error) {
      console.error("Error initializing SignalR:", error);
    }
  };

  initializeSignalR();
    
      // Clean up when component unmounts
      return () => {
        signalRService.off("ReceiveMessage");
        signalRService.off("LobbyUpdated");
        signalRService.off("LobbyCreated");
        signalRService.off("PlayerJoinedLobby");
        signalRService.off("LobbyDeleted");
        signalRService.off("GameStarted");
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
      
      // Fetch gameUrl for all started lobbies
      const startedLobbies = data.filter((lobby: TypeLobby) => lobby.isStarted);
      const urls: Record<number, string> = {};
      await Promise.all(
        startedLobbies.map(async (lobby: TypeLobby) => {
          try {
            const res = await fetch(`http://localhost:5177/api/pokerGames/lobby/${lobby.lobbyId}`);
            if (res.ok) {
              const gameData = await res.json();
              if (gameData && gameData.gameUrl) {
                urls[lobby.lobbyId] = gameData.gameUrl;
              }
            }
          } catch (err) {
            // Ignore errors for individual lobbies
          }
        })
      );
      setGameUrls(urls);

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

  const deleteLobby = async (lobbyId: number) => {
    try {
      setStatusMessage(`Deleting lobby ${lobbyId}...`);
  
      const response = await fetch(`http://localhost:5177/api/Lobbies/${lobbyId}`, {
        method: "DELETE",
      });
  
      if (!response.ok) {
        throw new Error(`Failed to delete lobby. Status: ${response.status}`);
      }
  
      setStatusMessage(`Lobby ${lobbyId} deleted successfully!`);
  
      // Remove the deleted lobby from the state
      setLobbies((prevLobbies) =>
        prevLobbies.filter((lobby) => lobby.lobbyId !== lobbyId)
      );
    } catch (error) {
      console.error(error);
      setStatusMessage(
        `Error deleting lobby: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
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
                      {/* Always show Go to Game button if game is started and gameUrl exists */}
                      {lobby.isStarted && gameUrls[lobby.lobbyId] && (
                        <button
                          className="button primary"
                          onClick={() => navigate(gameUrls[lobby.lobbyId].replace('http://localhost:3000', ''))}
                        >
                          Go to Game
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
                    <button
                      className="button danger"
                      onClick={() => deleteLobby(lobby.lobbyId)}
                      disabled={loading}
                    >
                      Delete
                    </button>
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