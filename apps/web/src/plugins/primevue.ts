import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes';

/** Brand-aligned PrimeVue preset (teal / slate — not purple defaults) */
export const SmartOfficePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{teal.50}',
      100: '{teal.100}',
      200: '{teal.200}',
      300: '{teal.300}',
      400: '{teal.400}',
      500: '{teal.600}',
      600: '{teal.700}',
      700: '{teal.800}',
      800: '{teal.900}',
      900: '{teal.950}',
      950: '{teal.950}',
    },
  },
});
