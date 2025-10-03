// server/index.js - GoutDeau Server with WebSocket Support

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const reminderService = require('./reminderService');
const config = require('./config');

const app = express();
const PORT = config.port;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  path: '/ws'
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('🔌 New WebSocket connection');
  
  // Add client to reminder service
  reminderService.addWebSocketClient(ws);
  
  // Handle messages from client
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received message:', data);
      
      // Handle different message types
      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          break;
        case 'test_notification':
          reminderService.sendTestNotification(data.userId);
          break;
        case 'create_test_reminder':
          const testReminder = reminderService.createTestReminder(data.userId);
          ws.send(JSON.stringify({ 
            type: 'test_reminder_created', 
            data: testReminder,
            message: 'Test reminder created for 1 minute from now',
            timestamp: new Date().toISOString()
          }));
          break;
        case 'get_reminders':
          const reminders = reminderService.getUserReminders(data.userId);
          ws.send(JSON.stringify({ 
            type: 'reminders', 
            data: reminders,
            timestamp: new Date().toISOString()
          }));
          break;
        case 'sync_reminders':
          await reminderService.syncReminders();
          ws.send(JSON.stringify({ 
            type: 'sync_complete',
            message: 'Reminders synced successfully',
            timestamp: new Date().toISOString()
          }));
          break;
        default:
          console.log('❓ Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
    }
  });
  
  // Handle connection close
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
    reminderService.removeWebSocketClient(ws);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    reminderService.removeWebSocketClient(ws);
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to GoutDeau reminder service',
    timestamp: new Date().toISOString()
  }));
});

// REST API endpoints
app.get('/', (req, res) => {
  res.json({ 
    message: 'GoutDeau Server with WebSocket Support',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connections: wss.clients.size
  });
});

// Test notification endpoint
app.post('/api/test-notification', (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  reminderService.sendTestNotification(userId);
  res.json({ 
    message: 'Test notification sent',
    userId,
    timestamp: new Date().toISOString()
  });
});

// Get reminders for user
app.get('/api/reminders/:userId', (req, res) => {
  const { userId } = req.params;
  const reminders = reminderService.getUserReminders(userId);
  
  res.json({
    reminders,
    count: reminders.length,
    timestamp: new Date().toISOString()
  });
});

// Sync reminders with database
app.post('/api/sync-reminders', async (req, res) => {
  try {
    await reminderService.syncReminders();
    res.json({ 
      message: 'Reminders synced successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to sync reminders',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get reminder by ID
app.get('/api/reminders/:userId/:reminderId', async (req, res) => {
  const { reminderId } = req.params;
  
  try {
    const reminder = await reminderService.getReminderById(reminderId);
    if (!reminder) {
      return res.status(404).json({ 
        error: 'Reminder not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      reminder,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch reminder',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
server.listen(PORT, async () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}/ws`);
  
  // Initialize reminder service
  await reminderService.initialize();
  
  console.log('✅ GoutDeau server fully initialized');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  reminderService.destroy();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});