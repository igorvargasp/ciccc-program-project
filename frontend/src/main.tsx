import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import App from './App';
import { queryClient } from './lib/queryClient';
import i18n from './lib/i18n';
import { useAppStore } from './store/app';
import './index.css';

// Restore lang preference before render
const savedLang = localStorage.getItem('sfh-lang');
if (savedLang) i18n.changeLanguage(savedLang);

// Restore auth token into Zustand store
const savedToken = localStorage.getItem('sfh-token');
if (savedToken) useAppStore.getState().setToken(savedToken);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </I18nextProvider>
  </React.StrictMode>,
);
