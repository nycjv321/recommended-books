import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { RepositoryProvider, createElectronRepositories } from './repositories';
import './index.css';

const repositories = createElectronRepositories();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RepositoryProvider repositories={repositories}>
      <HashRouter>
        <App />
      </HashRouter>
    </RepositoryProvider>
  </React.StrictMode>
);
