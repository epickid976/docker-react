// 🎓 NODE.JS CONCEPT: Service class for server-side reminder management
// This handles scheduled reminders and WebSocket notifications

const cron = require('node-cron');
const WebSocket = require('ws');
const { supabase, testConnection } = require('./supabaseClient');

class ReminderService {
  constructor() {
    this.reminders = new Map(); // Store active reminders
    this.wsClients = new Set(); // Store WebSocket connections
    this.cronJobs = new Map(); // Store cron job references
    this.isInitialized = false;
  }

  // Initialize the reminder service
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🔔 Initializing Reminder Service...');
    
    // Test Supabase connection
    const isConnected = await testConnection();
    if (!isConnected) {
      console.warn('⚠️  Supabase not connected, running in offline mode');
    }
    
    // Load reminders from database
    await this.loadReminders();
    
    // Start the reminder checker
    this.startReminderChecker();
    
    this.isInitialized = true;
    console.log('✅ Reminder Service initialized');
  }

  // Load reminders from database
  async loadReminders() {
    try {
      console.log('📝 Loading reminders from Supabase...');
      
      // Query active reminders from Supabase
      const { data: reminders, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('enabled', true);
      
      if (error) {
        console.error('❌ Error loading reminders from Supabase:', error);
        return;
      }
      
      // Clear existing reminders
      this.reminders.clear();
      
      // Store reminders in memory
      if (reminders && reminders.length > 0) {
        reminders.forEach(reminder => {
          this.reminders.set(reminder.id, reminder);
        });
        console.log(`📝 Loaded ${reminders.length} active reminders from Supabase`);
      } else {
        console.log('📝 No active reminders found in database');
      }
      
    } catch (error) {
      console.error('❌ Error loading reminders:', error);
    }
  }

  // Start checking for reminders every second
  startReminderChecker() {
    // Check every second for precise timing (6th asterisk = seconds)
    const cronJob = cron.schedule('* * * * * *', () => {
      this.checkReminders();
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    this.cronJobs.set('reminderChecker', cronJob);
    console.log('⏰ Reminder checker started (cron: every second)');
  }

  // Check if any reminders should trigger now
  checkReminders() {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 8); // HH:MM:SS
    const currentDay = now.getDay(); // 0=Sunday, 1=Monday, etc.
    
    // Convert JavaScript day (0=Sunday) to our format (1=Monday, 7=Sunday)
    const dayOfWeek = currentDay === 0 ? 7 : currentDay;

    console.log(`🕐 Checking reminders at ${currentTime} (day ${dayOfWeek})`);
    console.log(`📝 Active reminders: ${this.reminders.size}`);

    // Check each active reminder
    this.reminders.forEach((reminder, reminderId) => {
      console.log(`🔍 Checking reminder: ${reminder.title} at ${reminder.reminder_time} for days ${reminder.days_of_week}`);
      
      // Check if it's the right day
      if (!reminder.days_of_week.includes(dayOfWeek)) {
        console.log(`❌ Wrong day: ${dayOfWeek} not in ${reminder.days_of_week}`);
        return;
      }

      // Check if it's the right time (within 1 minute window)
      const reminderTime = reminder.reminder_time;
      const timeDiff = this.getTimeDifference(currentTime, reminderTime);
      
      console.log(`⏰ Time diff: ${timeDiff} seconds (current: ${currentTime}, reminder: ${reminderTime})`);
      
      if (timeDiff >= 0 && timeDiff < 2) { // Within 2 seconds (to handle any timing drift)
        console.log(`✅ Sending reminder: ${reminder.title}`);
        this.sendReminderNotification(reminder);
      } else {
        console.log(`⏳ Not time yet for: ${reminder.title}`);
      }
    });
  }

  // Calculate time difference in seconds
  getTimeDifference(currentTime, reminderTime) {
    const current = this.timeToSeconds(currentTime);
    const reminder = this.timeToSeconds(reminderTime);
    return reminder - current;
  }

  // Convert time string (HH:MM:SS) to seconds
  timeToSeconds(timeString) {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Send reminder notification via WebSocket
  sendReminderNotification(reminder) {
    const notification = {
      type: 'reminder',
      id: reminder.id,
      title: reminder.title,
      message: reminder.message || 'Time to hydrate!',
      timestamp: new Date().toISOString(),
      userId: reminder.user_id
    };

    console.log(`🔔 Sending reminder notification: ${reminder.title}`);

    // Send to all connected WebSocket clients
    this.wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(notification));
      }
    });
  }

  // Add a new reminder
  addReminder(reminder) {
    this.reminders.set(reminder.id, reminder);
    console.log(`➕ Added reminder: ${reminder.title}`);
  }

  // Update an existing reminder
  updateReminder(reminderId, updates) {
    if (this.reminders.has(reminderId)) {
      const reminder = this.reminders.get(reminderId);
      const updatedReminder = { ...reminder, ...updates };
      this.reminders.set(reminderId, updatedReminder);
      console.log(`✏️ Updated reminder: ${updatedReminder.title}`);
    }
  }

  // Remove a reminder
  removeReminder(reminderId) {
    if (this.reminders.has(reminderId)) {
      const reminder = this.reminders.get(reminderId);
      this.reminders.delete(reminderId);
      console.log(`🗑️ Removed reminder: ${reminder.title}`);
    }
  }

  // Sync reminders with database (called when client makes changes)
  async syncReminders() {
    try {
      console.log('🔄 Syncing reminders with database...');
      await this.loadReminders();
      console.log('✅ Reminders synced successfully');
    } catch (error) {
      console.error('❌ Error syncing reminders:', error);
    }
  }

  // Get reminder by ID from database
  async getReminderById(reminderId) {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('id', reminderId)
        .single();
      
      if (error) {
        console.error('❌ Error fetching reminder:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching reminder:', error);
      return null;
    }
  }

  // Add WebSocket client
  addWebSocketClient(ws) {
    this.wsClients.add(ws);
    console.log(`🔌 WebSocket client connected (${this.wsClients.size} total)`);
  }

  // Remove WebSocket client
  removeWebSocketClient(ws) {
    this.wsClients.delete(ws);
    console.log(`🔌 WebSocket client disconnected (${this.wsClients.size} total)`);
  }

  // Get all reminders for a user
  getUserReminders(userId) {
    const userReminders = [];
    this.reminders.forEach(reminder => {
      if (reminder.user_id === userId) {
        userReminders.push(reminder);
      }
    });
    return userReminders;
  }

  // Test notification
  sendTestNotification(userId) {
    const testNotification = {
      type: 'test',
      title: 'Test Notification',
      message: 'This is a test notification from GoutDeau server!',
      timestamp: new Date().toISOString(),
      userId: userId
    };

    console.log(`🧪 Sending test notification to user ${userId}`);
    
    this.wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(testNotification));
      }
    });
  }

  // Create a test reminder for current time + 1 minute
  createTestReminder(userId) {
    const now = new Date();
    const testTime = new Date(now.getTime() + 60000); // 1 minute from now
    const testTimeString = testTime.toTimeString().substring(0, 8);
    const currentDay = now.getDay();
    const dayOfWeek = currentDay === 0 ? 7 : currentDay;

    const testReminder = {
      id: 9999,
      user_id: userId,
      title: 'Test Scheduled Reminder',
      message: 'This is a test reminder scheduled for 1 minute from now!',
      reminder_time: testTimeString,
      days_of_week: [dayOfWeek], // Today
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.addReminder(testReminder);
    console.log(`🧪 Created test reminder for ${testTimeString} (day ${dayOfWeek})`);
    
    return testReminder;
  }

  // Clean up
  destroy() {
    this.cronJobs.forEach((job, name) => {
      job.destroy();
      console.log(`🛑 Stopped cron job: ${name}`);
    });
    this.cronJobs.clear();
    this.reminders.clear();
    this.wsClients.clear();
    console.log('🔔 Reminder Service destroyed');
  }
}

// Export singleton instance
const reminderService = new ReminderService();
module.exports = reminderService;
