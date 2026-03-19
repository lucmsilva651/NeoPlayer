import { createApp } from 'vue';
import { addCollection } from '@iconify/vue';
import { icons } from '@iconify-json/mdi';
import App from './App.vue';
import './css/index.css';
import './css/animations.css';

// Add only the MDI icons used in this app (offline bundle)
addCollection({
  prefix: 'mdi',
  icons: Object.fromEntries(
    [
      'information-outline',
      'link',
      'folder-open',
      'arrow-right',
      'play',
      'stop',
      'repeat',
      'repeat-off',
      'pause',
      'format-list-bulleted',
    ].map((name) => [name, icons.icons[name]])
  ),
  width: icons.width,
  height: icons.height,
});

createApp(App).mount('#app');
