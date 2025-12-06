import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import './index.css'

// Import your Publishable Key from Clerk Dashboard
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Warn in development if Clerk key is missing
if (!PUBLISHABLE_KEY) {
  console.warn(
    '⚠️ Missing VITE_CLERK_PUBLISHABLE_KEY - Clerk authentication will not be available.\n' +
    'Add VITE_CLERK_PUBLISHABLE_KEY to your .env.local file or Vercel environment variables.'
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>,
)