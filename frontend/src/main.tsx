import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './assets/styles/fonts.css'
import './assets/styles/manamaalai.css'
import './assets/styles/index.css'
import i18n from './i18n'
import { I18nextProvider } from 'react-i18next'

// Disable automatic scroll restoration and scroll to top on page load
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Prevent accidental value changes in number inputs on scroll while allowing page scroll
document.addEventListener('wheel', () => {
    if (document.activeElement instanceof HTMLInputElement && document.activeElement.type === 'number') {
        document.activeElement.blur();
    }
});

window.onerror = (_msg, _url, _line, _col, err) => {
  console.error('Uncaught error:', err);
};
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </React.StrictMode>
)
