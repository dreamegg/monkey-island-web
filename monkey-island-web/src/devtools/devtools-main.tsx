import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import DevToolsApp from './DevToolsApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DevToolsApp />
  </StrictMode>,
);
