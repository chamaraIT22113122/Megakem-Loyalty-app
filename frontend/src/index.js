import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Unregister Service Worker to ensure mobile devices always get the latest version
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready
    .then((registration) => {
      registration.unregister();
      console.log('Service worker unregistered successfully');
    })
    .catch((error) => {
      console.error(error.message);
    });
}
