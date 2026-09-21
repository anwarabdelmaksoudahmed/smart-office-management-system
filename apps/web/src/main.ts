import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import 'primeicons/primeicons.css';

import App from '@/app/App.vue';
import { router } from '@/router';
import { i18n } from '@/i18n';
import { SmartOfficePreset } from '@/plugins/primevue';
import '@/assets/styles/main.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(i18n);
app.use(VueQueryPlugin, {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  },
});
app.use(PrimeVue, {
  theme: {
    preset: SmartOfficePreset,
    options: {
      darkModeSelector: 'html.dark',
      cssLayer: false,
    },
  },
  ripple: true,
});
app.use(ToastService);
app.directive('tooltip', Tooltip);

app.mount('#app');
