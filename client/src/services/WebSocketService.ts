// 🎓 REACT CONCEPT: WebSocket service for real-time communication
// Like SwiftUI's @StateObject for managing network connections

interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
  timestamp?: string;
  userId?: string;
}

class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10; // Increase max attempts
  private reconnectDelay = 1000; // Start with 1 second
  private isConnecting = false;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  // 🎓 REACT CONCEPT: Singleton pattern
  // Like SwiftUI's @StateObject - ensures only one connection exists
  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  // Connect to WebSocket server
  public connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
        resolve();
        return;
      }

      this.isConnecting = true;
      console.log('🔌 Connecting to WebSocket server...');

      try {
        // Connect to the server WebSocket endpoint
        const serverUrl = process.env.REACT_APP_SERVER_URL || 'ws://localhost:5002';
        this.ws = new WebSocket(`${serverUrl}/ws`);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          
          // Start ping interval to keep connection alive
          this.startPingInterval();
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket connection closed:', event.code, event.reason);
          this.isConnecting = false;
          this.ws = null;
          
          // Attempt to reconnect if not a clean close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect(userId);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  // Schedule reconnection attempt
  private scheduleReconnect(userId: string): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect(userId).catch(error => {
        console.error('❌ Reconnection failed:', error);
      });
    }, delay);
  }

  // Handle incoming messages
  private handleMessage(message: WebSocketMessage): void {
    console.log('📨 Received WebSocket message:', message);

    // Handle different message types
    switch (message.type) {
      case 'welcome':
        console.log('👋 Server welcome:', message.message);
        break;
      case 'reminder':
        this.handleReminderNotification(message);
        break;
      case 'test':
        this.handleTestNotification(message);
        break;
      case 'test_reminder_created':
        console.log('🧪 Test reminder created:', message.message);
        break;
      case 'sync_complete':
        console.log('🔄 Reminders synced:', message.message);
        break;
      case 'pong':
        console.log('🏓 Pong received');
        break;
      default:
        console.log('❓ Unknown message type:', message.type);
    }

    // Call registered handlers
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.data);
    }
  }

  // Handle reminder notifications
  private handleReminderNotification(message: WebSocketMessage): void {
    console.log('🔔 Reminder notification received:', message);
    
    // Show browser notification if permission is granted
    if (Notification.permission === 'granted') {
      new Notification(message.data?.title || 'Reminder', {
        body: message.data?.message || 'Time to hydrate!',
        icon: '/favicon.ico',
        tag: `reminder-${message.data?.id}`,
        requireInteraction: true
      });
    }
  }

  // Handle test notifications
  private handleTestNotification(message: WebSocketMessage): void {
    console.log('🧪 Test notification received:', message);
    
    // Show browser notification if permission is granted
    if (Notification.permission === 'granted') {
      new Notification('Test Notification', {
        body: message.data?.message || 'This is a test from the server!',
        icon: '/favicon.ico',
        tag: 'test-notification'
      });
    }
  }

  // Send message to server
  public sendMessage(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      console.log('📤 Sent message:', message);
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
      console.log('🔍 WebSocket state:', this.ws ? this.ws.readyState : 'null');
      console.log('🔍 WebSocket URL:', this.ws ? 'connected' : 'not connected');
    }
  }

  // Send ping to server
  public ping(): void {
    this.sendMessage({ type: 'ping' });
  }

  // Request test notification from server
  public requestTestNotification(userId: string): void {
    this.sendMessage({ 
      type: 'test_notification', 
      userId 
    });
  }

  // Request reminders from server
  public requestReminders(userId: string): void {
    this.sendMessage({ 
      type: 'get_reminders', 
      userId 
    });
  }

  // Sync reminders with server
  public syncReminders(): void {
    this.sendMessage({ 
      type: 'sync_reminders'
    });
  }

  // Register message handler
  public onMessage(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  // Unregister message handler
  public offMessage(type: string): void {
    this.messageHandlers.delete(type);
  }

  // Check if connected
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Start ping interval to keep connection alive
  private startPingInterval(): void {
    this.stopPingInterval(); // Clear any existing interval
    
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ping();
      }
    }, 30000); // Ping every 30 seconds
  }

  // Stop ping interval
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Disconnect
  public disconnect(): void {
    this.stopPingInterval(); // Stop ping interval
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
    this.messageHandlers.clear();
    this.reconnectAttempts = 0;
    console.log('🔌 WebSocket disconnected');
  }

  // Get connection status
  public getStatus(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'unknown';
    }
  }
}

// Export singleton instance
export const webSocketService = WebSocketService.getInstance();
export default webSocketService;
