// 🎓 REACT CONCEPT: Service class for managing notifications
// Like SwiftUI's @StateObject or @ObservedObject for shared services

interface Reminder {
  id: number;
  title: string;
  message?: string;
  reminder_time: string; // HH:MM:SS format
  days_of_week: number[]; // 1=Monday, 7=Sunday
  enabled: boolean; // Changed from is_active to match database
}

class NotificationService {
  private static instance: NotificationService;
  private reminders: Reminder[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private lastCheckedTime: string = '';

  // 🎓 REACT CONCEPT: Singleton pattern
  // Like SwiftUI's @StateObject - ensures only one instance exists
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize the notification service
  public async initialize(): Promise<void> {
    console.log('🔔 Initializing Notification Service...');
    
    // Request notification permission
    await this.requestNotificationPermission();
    
    // Start checking for reminders
    this.startReminderChecker();
    
    console.log('✅ Notification Service initialized');
  }

  // Request browser notification permission
  private async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      console.log('✅ Notification permission already granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('❌ Notification permission denied. Please enable notifications in your browser settings.');
      return false;
    }

    console.log('🔔 Requesting notification permission...');
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      return true;
    } else {
      console.warn('❌ Notification permission denied by user');
      return false;
    }
  }

  // Update reminders list
  public updateReminders(reminders: Reminder[]): void {
    this.reminders = reminders.filter(reminder => reminder.enabled);
    console.log(`📝 Updated reminders: ${this.reminders.length} active reminders`);
  }

  // Start checking for reminders every minute
  private startReminderChecker(): void {
    // Clear existing interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check immediately
    this.checkReminders();

    // Then check every second for precise timing
    this.checkInterval = setInterval(() => {
      this.checkReminders();
    }, 1000); // 1 second

    console.log('⏰ Reminder checker started (checking every second)');
  }

  // Check if any reminders should trigger now
  private checkReminders(): void {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 8); // HH:MM:SS
    const currentDay = now.getDay(); // 0=Sunday, 1=Monday, etc.
    
    // Convert JavaScript day (0=Sunday) to our format (1=Monday, 7=Sunday)
    const dayOfWeek = currentDay === 0 ? 7 : currentDay;

    console.log(`🕐 Checking reminders at ${currentTime} (day ${dayOfWeek})`);

    // Check each active reminder
    this.reminders.forEach(reminder => {
      // Check if it's the right day
      if (!reminder.days_of_week.includes(dayOfWeek)) {
        return;
      }

      // Check if it's the right time (within 1 minute window)
      const reminderTime = reminder.reminder_time;
      const timeDiff = this.getTimeDifference(currentTime, reminderTime);
      
      if (timeDiff >= 0 && timeDiff < 60) { // Within 1 minute
        // Check if we haven't already shown this reminder today
        const reminderKey = `${reminder.id}-${now.toDateString()}`;
        const lastShown = localStorage.getItem(`reminder_${reminderKey}`);
        
        if (!lastShown) {
          this.showNotification(reminder);
          localStorage.setItem(`reminder_${reminderKey}`, 'true');
        }
      }
    });
  }

  // Calculate time difference in seconds
  private getTimeDifference(currentTime: string, reminderTime: string): number {
    const current = this.timeToSeconds(currentTime);
    const reminder = this.timeToSeconds(reminderTime);
    return reminder - current;
  }

  // Convert time string (HH:MM:SS) to seconds
  private timeToSeconds(timeString: string): number {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Show browser notification
  private showNotification(reminder: Reminder): void {
    if (Notification.permission !== 'granted') {
      console.warn('❌ Cannot show notification: permission not granted');
      console.log('💡 Please allow notifications in your browser settings or click the test button to request permission');
      return;
    }

    const notification = new Notification(reminder.title, {
      body: reminder.message || 'Time to hydrate!',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `reminder-${reminder.id}`,
      requireInteraction: true,
      actions: [
        {
          action: 'dismiss',
          title: 'Dismiss'
        },
        {
          action: 'snooze',
          title: 'Snooze 10 min'
        }
      ]
    });

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 10 seconds if not interacted with
    setTimeout(() => {
      notification.close();
    }, 10000);

    console.log(`🔔 Notification shown: ${reminder.title}`);
  }

  // Test notification (for development)
  public async testNotification(): Promise<void> {
    // First check if we have permission
    if (Notification.permission !== 'granted') {
      console.log('🔔 Requesting notification permission for test...');
      const granted = await this.requestNotificationPermission();
      if (!granted) {
        console.warn('❌ Cannot show test notification: permission denied');
        return;
      }
    }

    const testReminder: Reminder = {
      id: 999,
      title: 'Test Notification',
      message: 'This is a test notification from GoutDeau!',
      reminder_time: new Date().toTimeString().substring(0, 8),
      days_of_week: [1, 2, 3, 4, 5, 6, 7],
      enabled: true
    };

    this.showNotification(testReminder);
  }

  // Clean up
  public destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('🔔 Notification Service destroyed');
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
export default notificationService;
