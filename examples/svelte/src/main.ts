import { mount } from 'svelte';
import ExampleApp from './ExampleApp.svelte';
import './styles.css';

const rootElement = document.getElementById('app');

if (!rootElement) {
  throw new Error('Svelte example root element #app was not found');
}

mount(ExampleApp, { target: rootElement });
