// CRITICAL: Import i18n FIRST before anything else
import './i18n/init';

import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <App />
)
