import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ExampleApp } from './ExampleApp';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('React example root element #root was not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <ExampleApp />
  </StrictMode>,
);
