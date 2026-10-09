import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { useStore } from './store/useStore'

// Hydrate IndexedDB persistent database on boot
useStore.getState().initDatabase();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
