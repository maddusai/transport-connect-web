Object.keys(localStorage).forEach(k => { if (k.startsWith("transport_connect_") && k !== "transport_connect_jwt_token" && k !== "transport_connect_current_user") localStorage.removeItem(k); });
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
