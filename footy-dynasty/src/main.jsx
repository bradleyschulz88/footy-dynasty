import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/clubTheme.css'
import './index.css'
import AFLManager from './AFLManager'
import { ThemeProvider } from './components/ui/ThemeProvider.tsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AFLManager />
    </ThemeProvider>
  </React.StrictMode>,
)

if (import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      onNeedRefresh() {
        window.__pwaUpdateSW = () => updateSW(true);
        window.dispatchEvent(new CustomEvent('pwa-need-refresh'));
      },
      onOfflineReady() {},
    });
  }).catch(() => {});
}