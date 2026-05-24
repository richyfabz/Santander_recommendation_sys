import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Root Application Mounting Hub.
 * * We stripped out the generic 'reportWebVitals' imports and execution 
 * hooks from this file to prevent compile-time resolution crashes.
 */

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);