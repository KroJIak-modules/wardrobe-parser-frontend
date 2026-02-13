import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, configure } from '@gravity-ui/uikit';
import '@gravity-ui/uikit/styles/fonts.css';
import '@gravity-ui/uikit/styles/styles.css';
import App from './App';
import './styles.css';

configure({ lang: 'ru' });

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
