import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler to help debug white screen issues
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global Error Caught:', { message, source, lineno, colno, error });
};

window.onunhandledrejection = function(event) {
  console.error('Unhandled Promise Rejection:', event.reason);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Failed to find the root element');
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
