// main.jsx
// PURPOSE: The true entry point of the React application.
// This is the first JavaScript file that runs in the browser.
// It mounts the entire React app onto the HTML page.

// StrictMode is a React development tool — it intentionally renders components
// twice (in dev only) to catch side effects, deprecated APIs, and bugs early.
// It has zero effect on production builds.
import { StrictMode } from 'react'

// createRoot is the modern React 18+ API for rendering.
// It replaces the old ReactDOM.render() and enables concurrent features.
import { createRoot } from 'react-dom/client'

// Import the global base CSS (resets, scrollbar styling, font smoothing)
// Must be imported here so it applies to the entire app from the very start.
import './index.css'

// react-toastify: CSS must be imported once at the root so toast styles load globally
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer } from 'react-toastify'

import { Provider } from 'react-redux';
import store from './store/store.js';

// The root App component — the top of the entire component tree
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
      <ToastContainer
        position="bottom-left"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </Provider>
  </StrictMode>,
)

