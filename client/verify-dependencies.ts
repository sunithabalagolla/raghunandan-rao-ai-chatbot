/**
 * Client Dependency Verification Script
 * Verifies that all required client dependencies for Socket.io infrastructure are installed
 */

import { io } from 'socket.io-client';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

console.log('🔍 Verifying Client Socket.io Infrastructure Dependencies...\n');

// 1. Verify Socket.io Client
try {
  const socket = io('http://localhost:5000', {
    autoConnect: false,
  });
  console.log('✅ socket.io-client: Installed and working');
  socket.disconnect();
} catch (error) {
  console.error('❌ socket.io-client: Failed to initialize', error);
  process.exit(1);
}

// 2. Verify i18next
try {
  i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: { test: 'test' } }
      },
      lng: 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false
      }
    });
  console.log('✅ i18next: Installed and working');
  console.log('✅ react-i18next: Installed and working');
  console.log('✅ i18next-browser-languagedetector: Installed and working');
} catch (error) {
  console.error('❌ i18next: Failed to initialize', error);
  process.exit(1);
}

console.log('\n✨ All client Socket.io infrastructure dependencies verified successfully!');
console.log('\n📋 Installed Dependencies:');
console.log('   - socket.io-client (WebSocket client)');
console.log('   - i18next (Internationalization core)');
console.log('   - react-i18next (React bindings)');
console.log('   - i18next-browser-languagedetector (Language detection)');
