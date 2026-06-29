import React from 'react';
import ReactDOM from 'react-dom/client';
// ⚠️ i18n MUST be imported before App so language is set before first render
import './i18n/index';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
