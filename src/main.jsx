import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { LicenseInfo } from '@mui/x-data-grid-premium';

LicenseInfo.setLicenseKey('4e5ec90a1afaadb78690f94968111927Tz05NTgxNSxFPTE3NTQ3NDE0NDcwMDAsUz1wcmVtaXVtLExNPXN1YnNjcmlwdGlvbixQVj1pbml0aWFsLEtWPTI=');

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)