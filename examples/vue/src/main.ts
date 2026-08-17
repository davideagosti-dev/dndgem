import { createApp } from 'vue';
import { ExampleApp } from './ExampleApp';
import './styles.css';

const rootElement = document.getElementById('app');

if (!rootElement) {
  throw new Error('Vue example root element #app was not found');
}

createApp(ExampleApp).mount(rootElement);
