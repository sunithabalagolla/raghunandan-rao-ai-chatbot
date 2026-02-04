export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  requireInteraction?: boolean;
  silent?: boolean;
  sound?: boolean;
  vibrate?: number[];
  actions?: NotificationAction[];
  data?: any;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
  autoClose?: number; // milliseconds
  data?: any; // Additional data for callbacks
}

export interface NotificationSettings {
  browserNotifications: boolean;
  soundAlerts: boolean;
  volume: number; // 0-100
  inAppNotifications: boolean;
  priorityFilter: 'all' | 'normal' | 'high' | 'urgent';
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private settings: NotificationSettings;
  private inAppNotifications: InAppNotification[] = [];
  private notificationCallbacks: ((notification: InAppNotification) => void)[] = [];
  private audioContext: AudioContext | null = null;
  private soundBuffers: Map<string, AudioBuffer> = new Map();

  constructor() {
    this.settings = this.loadSettings();
    this.initializeAudioContext();
    this.checkPermission();
  }

  /**
   * Initialize audio context for sound alerts
   */
  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Load default notification sounds
      await this.loadSounds();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  /**
   * Load notification sound files
   */
  private async loadSounds() {
    const sounds = {
      'default': '/sounds/notification-default.mp3',
      'urgent': '/sounds/notification-urgent.mp3',
      'success': '/sounds/notification-success.mp3',
      'warning': '/sounds/notification-warning.mp3',
      'error': '/sounds/notification-error.mp3'
    };

    for (const [name, url] of Object.entries(sounds)) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
          this.soundBuffers.set(name, audioBuffer);
        }
      } catch (error) {
        console.warn(`Failed to load sound ${name}:`, error);
      }
    }
  }

  /**
   * Check current notification permission
   */
  private checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        this.updateSettings({ browserNotifications: true });
        return true;
      } else {
        this.updateSettings({ browserNotifications: false });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Show notification with priority-based strategy
   */
  async showNotification(options: NotificationOptions): Promise<void> {
    const priority = options.priority || 'normal';
    
    // Check if notifications should be shown based on settings and quiet hours
    if (!this.shouldShowNotification(priority)) {
      return;
    }

    // Try browser notification first
    if (this.settings.browserNotifications && this.permission === 'granted') {
      await this.showBrowserNotification(options);
    }

    // Always show in-app notification as fallback
    this.showInAppNotification(options);

    // Play sound if enabled
    if (this.settings.soundAlerts && options.sound !== false) {
      this.playNotificationSound(priority);
    }

    // Vibrate if supported and urgent
    if (priority === 'urgent' && 'vibrate' in navigator) {
      navigator.vibrate(options.vibrate || [200, 100, 200]);
    }
  }

  /**
   * Show browser notification
   */
  private async showBrowserNotification(options: NotificationOptions): Promise<void> {
    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || this.getDefaultIcon(options.priority),
        tag: options.tag,
        requireInteraction: options.requireInteraction || options.priority === 'urgent',
        silent: options.silent || false,
        data: options.data
      });

      // Auto-close non-urgent notifications
      if (options.priority !== 'urgent' && !options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, this.getAutoCloseDelay(options.priority));
      }

      // Handle notification clicks
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Handle custom click actions
        if (options.data?.onClick) {
          options.data.onClick();
        }
      };

    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  /**
   * Show in-app notification
   */
  private showInAppNotification(options: NotificationOptions): void {
    const inAppNotification: InAppNotification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      title: options.title,
      message: options.body,
      type: this.getNotificationType(options.priority),
      priority: options.priority || 'normal',
      timestamp: new Date(),
      read: false,
      actions: options.actions,
      autoClose: options.requireInteraction ? undefined : this.getAutoCloseDelay(options.priority)
    };

    this.inAppNotifications.unshift(inAppNotification);
    
    // Limit to 50 notifications
    if (this.inAppNotifications.length > 50) {
      this.inAppNotifications = this.inAppNotifications.slice(0, 50);
    }

    // Notify callbacks
    this.notificationCallbacks.forEach(callback => callback(inAppNotification));
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(priority: string = 'normal'): void {
    if (!this.audioContext || !this.settings.soundAlerts) {
      return;
    }

    try {
      const soundName = priority === 'urgent' ? 'urgent' : 'default';
      const buffer = this.soundBuffers.get(soundName) || this.soundBuffers.get('default');
      
      if (buffer) {
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        gainNode.gain.value = this.settings.volume / 100;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start();
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  /**
   * Check if notification should be shown based on settings
   */
  private shouldShowNotification(priority: string): boolean {
    // Check priority filter
    const priorityLevels = { low: 0, normal: 1, high: 2, urgent: 3 };
    const currentLevel = priorityLevels[priority as keyof typeof priorityLevels] || 1;
    const filterLevel = priorityLevels[this.settings.priorityFilter as keyof typeof priorityLevels] || 0;
    
    if (currentLevel < filterLevel) {
      return false;
    }

    // Check quiet hours
    if (this.settings.quietHours.enabled && priority !== 'urgent') {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (this.isInQuietHours(currentTime)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if current time is in quiet hours
   */
  private isInQuietHours(currentTime: string): boolean {
    const { start, end } = this.settings.quietHours;
    
    if (start === end) return false;
    
    if (start < end) {
      return currentTime >= start && currentTime <= end;
    } else {
      // Quiet hours span midnight
      return currentTime >= start || currentTime <= end;
    }
  }

  /**
   * Get default icon based on priority
   */
  private getDefaultIcon(priority?: string): string {
    switch (priority) {
      case 'urgent':
        return '/icons/notification-urgent.png';
      case 'high':
        return '/icons/notification-high.png';
      case 'low':
        return '/icons/notification-low.png';
      default:
        return '/icons/notification-default.png';
    }
  }

  /**
   * Get notification type for in-app display
   */
  private getNotificationType(priority?: string): 'info' | 'success' | 'warning' | 'error' {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  }

  /**
   * Get auto-close delay based on priority
   */
  private getAutoCloseDelay(priority?: string): number {
    switch (priority) {
      case 'urgent':
        return 0; // Never auto-close
      case 'high':
        return 10000; // 10 seconds
      case 'low':
        return 3000; // 3 seconds
      default:
        return 5000; // 5 seconds
    }
  }

  /**
   * Get notification settings
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Update notification settings
   */
  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): NotificationSettings {
    try {
      const saved = localStorage.getItem('notificationSettings');
      if (saved) {
        return { ...this.getDefaultSettings(), ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
    
    return this.getDefaultSettings();
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): NotificationSettings {
    return {
      browserNotifications: false,
      soundAlerts: true,
      volume: 70,
      inAppNotifications: true,
      priorityFilter: 'normal',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };
  }

  /**
   * Get all in-app notifications
   */
  getInAppNotifications(): InAppNotification[] {
    return [...this.inAppNotifications];
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): number {
    return this.inAppNotifications.filter(n => !n.read).length;
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const notification = this.inAppNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.inAppNotifications.forEach(n => n.read = true);
  }

  /**
   * Clear notification
   */
  clearNotification(notificationId: string): void {
    this.inAppNotifications = this.inAppNotifications.filter(n => n.id !== notificationId);
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    this.inAppNotifications = [];
  }

  /**
   * Register callback for new notifications
   */
  onNotification(callback: (notification: InAppNotification) => void): void {
    this.notificationCallbacks.push(callback);
  }

  /**
   * Test notification system
   */
  async testNotification(priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'): Promise<void> {
    await this.showNotification({
      title: 'Test Notification',
      body: `This is a ${priority} priority test notification`,
      priority,
      sound: true,
      icon: this.getDefaultIcon(priority)
    });
  }

  /**
   * Show ticket-related notifications
   */
  async showTicketNotification(type: 'new' | 'assigned' | 'escalated' | 'resolved', ticketData: any): Promise<void> {
    const notifications = {
      new: {
        title: 'New Ticket Available',
        body: `Priority: ${ticketData.priority} - ${ticketData.subject}`,
        priority: 'normal' as const,
        icon: '/icons/ticket-new.png'
      },
      assigned: {
        title: 'Ticket Assigned',
        body: `You have been assigned ticket: ${ticketData.subject}`,
        priority: 'high' as const,
        icon: '/icons/ticket-assigned.png'
      },
      escalated: {
        title: 'Ticket Escalated',
        body: `Urgent: Ticket ${ticketData.id} requires immediate attention`,
        priority: 'urgent' as const,
        icon: '/icons/ticket-escalated.png'
      },
      resolved: {
        title: 'Ticket Resolved',
        body: `Ticket ${ticketData.id} has been successfully resolved`,
        priority: 'low' as const,
        icon: '/icons/ticket-resolved.png'
      }
    };

    const notification = notifications[type];
    await this.showNotification({
      ...notification,
      tag: `ticket-${ticketData.id}`,
      data: { ticketId: ticketData.id, type }
    });
  }

  /**
   * Show actionable in-app notification (for toasts with action buttons)
   */
  showActionableNotification(notification: Omit<InAppNotification, 'id' | 'timestamp' | 'read'>): void {
    const actionableNotification: InAppNotification = {
      id: `actionable-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: new Date(),
      read: false,
      ...notification
    };

    this.inAppNotifications.unshift(actionableNotification);
    
    // Limit to 50 notifications
    if (this.inAppNotifications.length > 50) {
      this.inAppNotifications = this.inAppNotifications.slice(0, 50);
    }

    // Notify callbacks (this will trigger toast display)
    this.notificationCallbacks.forEach(callback => callback(actionableNotification));
    
    // Play sound if enabled
    if (this.settings.soundAlerts) {
      this.playNotificationSound(notification.priority);
    }
  }

  /**
   * Show SLA-related notifications
   */
  async showSLANotification(type: 'warning' | 'critical' | 'breach', slaData: any): Promise<void> {
    const notifications = {
      warning: {
        title: 'SLA Warning',
        body: `Ticket ${slaData.ticketId} SLA deadline approaching`,
        priority: 'normal' as const
      },
      critical: {
        title: 'SLA Critical',
        body: `Ticket ${slaData.ticketId} SLA deadline imminent`,
        priority: 'high' as const
      },
      breach: {
        title: 'SLA Breach',
        body: `Ticket ${slaData.ticketId} SLA has been exceeded`,
        priority: 'urgent' as const
      }
    };

    const notification = notifications[type];
    await this.showNotification({
      ...notification,
      tag: `sla-${slaData.ticketId}`,
      requireInteraction: type === 'breach',
      data: { ticketId: slaData.ticketId, type: 'sla' }
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;