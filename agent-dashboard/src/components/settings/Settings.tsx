import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import { apiService } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

interface NotificationSettings {
  browserNotifications: boolean;
  soundAlerts: boolean;
  soundVolume: number;
}

interface WorkSettings {
  autoRefreshInterval: '30s' | '1m' | '2m' | '5m';
  maxConcurrentChats: number;
}

interface DisplaySettings {
  theme: 'light' | 'dark';
}

interface SettingsData {
  notifications: NotificationSettings;
  work: WorkSettings;
  display: DisplaySettings;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  
  // Settings state
  const [settings, setSettings] = useState<SettingsData>({
    notifications: {
      browserNotifications: true,
      soundAlerts: true,
      soundVolume: 70,
    },
    work: {
      autoRefreshInterval: '1m',
      maxConcurrentChats: 5,
    },
    display: {
      theme: theme,
    },
  });

  // Password change state
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Error states
  const [settingsError, setSettingsError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  // Apply theme to document when settings change
  useEffect(() => {
    // Sync theme context with settings
    if (settings.display.theme !== theme) {
      setTheme(settings.display.theme);
    }
  }, [settings.display.theme, theme, setTheme]);

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setSettingsError('');

      console.log('🔍 SETTINGS DEBUG: Fetching settings...');
      const result = await apiService.getSettings();
      console.log('🔍 SETTINGS DEBUG: API response:', result);
      
      if (result.success) {
        setSettings(result.data);
        console.log('✅ SETTINGS DEBUG: Settings loaded successfully:', result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch settings');
      }
    } catch (error) {
      console.error('❌ SETTINGS DEBUG: Error fetching settings:', error);
      setSettingsError(error instanceof Error ? error.message : 'Failed to fetch settings');
      notificationService.showActionableNotification({
        title: 'Settings Error',
        message: 'Failed to load settings. Please refresh the page.',
        type: 'error',
        priority: 'high',
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsChange = (section: keyof SettingsData, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    
    // If theme is changed, update ThemeContext immediately
    if (section === 'display' && field === 'theme') {
      setTheme(value);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setSettingsError('');

      console.log('🔍 SETTINGS DEBUG: Saving settings...', settings);
      const result = await apiService.updateSettings(settings);
      console.log('🔍 SETTINGS DEBUG: Save response:', result);
      
      if (result.success) {
        setSettings(result.data);
        console.log('✅ SETTINGS DEBUG: Settings saved successfully');
        notificationService.showActionableNotification({
          title: 'Settings Saved',
          message: 'Your settings have been updated successfully.',
          type: 'success',
          priority: 'normal',
          autoClose: 3000,
        });
      } else {
        throw new Error(result.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('❌ SETTINGS DEBUG: Error saving settings:', error);
      setSettingsError(error instanceof Error ? error.message : 'Failed to save settings');
      notificationService.showActionableNotification({
        title: 'Save Failed',
        message: 'Failed to save settings. Please try again.',
        type: 'error',
        priority: 'high',
        autoClose: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = (field: keyof ChangePasswordData, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value,
    }));
    setPasswordError('');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    try {
      setIsChangingPassword(true);
      setPasswordError('');

      const result = await apiService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (result.success) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        notificationService.showActionableNotification({
          title: 'Password Changed',
          message: 'Your password has been updated successfully.',
          type: 'success',
          priority: 'normal',
          autoClose: 3000,
        });
      } else {
        throw new Error(result.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-300">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 dark:bg-gray-900 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>
      
      {settingsError && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {settingsError}
        </div>
      )}

      <div className="space-y-6">
        {/* Notification Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Notification Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-100">Browser Notifications</label>
                <p className="text-xs text-gray-500 dark:text-gray-300">Receive notifications when new tickets arrive</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.notifications.browserNotifications}
                  onChange={(e) => handleSettingsChange('notifications', 'browserNotifications', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-100">Sound Alerts</label>
                <p className="text-xs text-gray-500 dark:text-gray-300">Play sound for urgent tickets</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.notifications.soundAlerts}
                  onChange={(e) => handleSettingsChange('notifications', 'soundAlerts', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                Sound Volume: {settings.notifications.soundVolume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.notifications.soundVolume}
                onChange={(e) => handleSettingsChange('notifications', 'soundVolume', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>

        {/* Work Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Work Preferences</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                Auto-refresh Interval
              </label>
              <select
                value={settings.work.autoRefreshInterval}
                onChange={(e) => handleSettingsChange('work', 'autoRefreshInterval', e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="30s">30 seconds</option>
                <option value="1m">1 minute</option>
                <option value="2m">2 minutes</option>
                <option value="5m">5 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                Maximum Concurrent Chats: {settings.work.maxConcurrentChats}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.work.maxConcurrentChats}
                onChange={(e) => handleSettingsChange('work', 'maxConcurrentChats', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>1</span>
                <span>10</span>
              </div>
            </div>
          </div>
        </div>

        {/* Display Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Display Preferences</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">Theme</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={settings.display.theme === 'light'}
                  onChange={(e) => handleSettingsChange('display', 'theme', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-100">Light</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={settings.display.theme === 'dark'}
                  onChange={(e) => handleSettingsChange('display', 'theme', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-100">Dark</span>
              </label>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Account Settings</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {passwordError}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new password (min 6 characters)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChangingPassword ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Save Settings Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;