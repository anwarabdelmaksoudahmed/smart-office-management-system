import { usePreferredDark, useStorage } from '@vueuse/core';
import { computed, watch } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'soc.theme';

export function useTheme() {
  const preferredDark = usePreferredDark();
  const mode = useStorage<ThemeMode>(STORAGE_KEY, 'system');

  const isDark = computed(() => {
    if (mode.value === 'system') return preferredDark.value;
    return mode.value === 'dark';
  });

  function apply(): void {
    document.documentElement.classList.toggle('dark', isDark.value);
  }

  function setMode(next: ThemeMode): void {
    mode.value = next;
  }

  function toggle(): void {
    setMode(isDark.value ? 'light' : 'dark');
  }

  watch([isDark, mode], apply, { immediate: true });

  return { mode, isDark, setMode, toggle, apply };
}
