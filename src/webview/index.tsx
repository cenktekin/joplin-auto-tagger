import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

declare const webviewApi: {
  postMessage: (message: any) => Promise<any>;
  onMessage: (handler: (message: any) => void) => (() => void) | void;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

