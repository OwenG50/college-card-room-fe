import { User } from './User';

export interface TypeLobby {
  lobbyId: number;
  users: User[];
  isStarted: boolean;
}