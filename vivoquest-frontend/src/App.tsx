import React from 'react';
import { AppRouter } from './app/router';
import { AppProviders } from './app/providers';
import './styles/tokens.css';
import './styles/base.css';
import './styles/shell.css';
import './styles/components.css';

export const App: React.FC = () => {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
};

export default App;
