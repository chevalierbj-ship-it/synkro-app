import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import './index.css'

// Import your Publishable Key from Clerk Dashboard
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Conditionally wrap with ClerkProvider only if key is available
const AppWithAuth = PUBLISHABLE_KEY ? (
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <App />
  </ClerkProvider>
) : (
  <App />
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {AppWithAuth}
  </React.StrictMode>,
)