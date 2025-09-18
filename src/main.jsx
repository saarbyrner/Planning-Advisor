import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { LicenseInfo } from '@mui/x-data-grid-premium';

LicenseInfo.setLicenseKey('bc1c125f0df063ef4d354f52404b3b86Tz0xMTc1MzksRT0xNzg2NTc5MTk5MDAwLFM9cHJlbWl1bSxMTT1zdWJzY3JpcHRpb24sUFY9aW5pdGlhbCxLVj0y');

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)