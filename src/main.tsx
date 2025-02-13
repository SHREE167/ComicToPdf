import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from './App'
import './index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster position="bottom-center" />
  </React.StrictMode>,
)