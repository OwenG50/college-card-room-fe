import * as signalR from "@microsoft/signalr";

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private static instance: SignalRService | null = null;

  private constructor() {}

  public static getInstance(): SignalRService {
    if (!SignalRService.instance) {
      SignalRService.instance = new SignalRService();
    }
    return SignalRService.instance;
  }

  public async startConnection(): Promise<void> {
    if (this.connection) {
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5177/hubs/pokerRoom", {
        withCredentials: true  // Add credentials as required by your backend
      })
      .withAutomaticReconnect()
      .build();

    try {
      await this.connection.start();
      console.log("Connected to SignalR hub");
    } catch (err) {
      console.error("Error connecting to SignalR hub:", err);
      // Retry connection after a delay
      setTimeout(() => this.startConnection(), 5000);
    }
  }

  public stopConnection(): Promise<void> {
    if (this.connection) {
      return this.connection.stop();
    }
    return Promise.resolve();
  }

  public on(methodName: string, callback: (...args: any[]) => void): void {
    if (this.connection) {
      this.connection.on(methodName, callback);
    }
  }

  public off(methodName: string): void {
    if (this.connection) {
      this.connection.off(methodName);
    }
  }

  public joinGroup(groupName: string): Promise<void> {
    if (this.connection) {
      return this.connection.invoke("JoinGroup", groupName);
    }
    return Promise.reject("Connection not established");
  }

  public leaveGroup(groupName: string): Promise<void> {
    if (this.connection) {
      return this.connection.invoke("LeaveGroup", groupName);
    }
    return Promise.reject("Connection not established");
  }

  public getConnectionId(): string | null {
    return this.connection ? this.connection.connectionId : null;
  }
}

export default SignalRService;