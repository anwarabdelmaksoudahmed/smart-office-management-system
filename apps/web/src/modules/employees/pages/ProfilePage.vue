<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMutation } from '@tanstack/vue-query';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Select from 'primevue/select';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { authApi } from '@/modules/auth/api/auth.api';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { applyDocumentLocale, type AppLocale } from '@/i18n';
import PageHeader from '@/shared/components/ui/PageHeader.vue';

const { t, locale } = useI18n();
const toast = useToast();
const auth = useAuthStore();

const firstName = ref('');
const lastName = ref('');
const phone = ref('');
const profileLocale = ref<AppLocale>('en');
const avatarUrl = ref<string | null>(null);
const avatarPreview = ref<string | null>(null);

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

watch(
  () => auth.user,
  (u) => {
    if (!u) return;
    firstName.value = u.firstName ?? '';
    lastName.value = u.lastName ?? '';
    phone.value = u.phone ?? '';
    profileLocale.value = (u.locale as AppLocale) || 'en';
    avatarUrl.value = u.avatarUrl ?? null;
    avatarPreview.value = u.avatarUrl ?? null;
  },
  { immediate: true },
);

const initials = computed(() => {
  const a = firstName.value.trim().charAt(0);
  const b = lastName.value.trim().charAt(0);
  return `${a}${b}`.toUpperCase() || '?';
});

const localeOptions = [
  { label: 'English', value: 'en' },
  { label: 'العربية', value: 'ar' },
];

function onAvatarSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    toast.add({
      severity: 'error',
      summary: t('profile.avatarInvalid'),
      life: 3500,
    });
    input.value = '';
    return;
  }

  if (file.size > 450_000) {
    toast.add({
      severity: 'error',
      summary: t('profile.avatarTooLarge'),
      life: 3500,
    });
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const result = String(reader.result ?? '');
    avatarPreview.value = result;
    avatarUrl.value = result;
  };
  reader.readAsDataURL(file);
}

function clearAvatar() {
  avatarUrl.value = null;
  avatarPreview.value = null;
}

const saveProfileMutation = useMutation({
  mutationFn: () =>
    authApi.updateProfile({
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      phone: phone.value.trim() || undefined,
      locale: profileLocale.value,
      avatarUrl: avatarUrl.value,
    }),
  onSuccess: async ({ data }) => {
    await auth.fetchMe();
    if (data.locale === 'en' || data.locale === 'ar') {
      locale.value = data.locale;
      applyDocumentLocale(data.locale);
    }
    toast.add({
      severity: 'success',
      summary: t('profile.saved'),
      life: 2500,
    });
  },
  onError: () => {
    toast.add({
      severity: 'error',
      summary: t('profile.saveFailed'),
      life: 3500,
    });
  },
});

const passwordMutation = useMutation({
  mutationFn: () => {
    if (newPassword.value !== confirmPassword.value) {
      return Promise.reject(new Error('MISMATCH'));
    }
    return authApi.changePassword(currentPassword.value, newPassword.value);
  },
  onSuccess: () => {
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    toast.add({
      severity: 'success',
      summary: t('profile.passwordChanged'),
      life: 3000,
    });
  },
  onError: (err: unknown) => {
    const message =
      err instanceof Error && err.message === 'MISMATCH'
        ? t('profile.passwordMismatch')
        : t('profile.passwordFailed');
    toast.add({
      severity: 'error',
      summary: message,
      life: 3500,
    });
  },
});
</script>

<template>
  <div class="soc-page soc-page-enter">
    <Toast />
    <PageHeader :title="t('profile.title')" :blurb="t('profile.blurb')" />

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <section class="soc-surface space-y-5 p-5">
        <h2 class="font-display text-lg font-semibold">{{ t('profile.personal') }}</h2>

        <div class="flex items-center gap-4">
          <div
            class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl text-xl font-semibold"
            style="background: var(--soc-brand-soft); color: var(--soc-brand)"
          >
            <img
              v-if="avatarPreview"
              :src="avatarPreview"
              alt=""
              class="h-full w-full object-cover"
            />
            <span v-else>{{ initials }}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <label class="inline-flex cursor-pointer">
              <span
                class="rounded-lg border px-3 py-2 text-sm"
                style="border-color: var(--soc-border)"
              >
                {{ t('profile.changePhoto') }}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="hidden"
                @change="onAvatarSelected"
              />
            </label>
            <Button
              v-if="avatarPreview"
              :label="t('profile.removePhoto')"
              text
              severity="secondary"
              @click="clearAvatar"
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium">{{ t('profile.firstName') }}</label>
            <InputText v-model="firstName" class="w-full" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium">{{ t('profile.lastName') }}</label>
            <InputText v-model="lastName" class="w-full" />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('auth.email') }}</label>
          <InputText :model-value="auth.user?.email ?? ''" class="w-full" disabled />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('profile.phone') }}</label>
          <InputText v-model="phone" class="w-full" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('common.language') }}</label>
          <Select
            v-model="profileLocale"
            :options="localeOptions"
            option-label="label"
            option-value="value"
            class="w-full"
          />
        </div>

        <Button
          :label="t('common.save')"
          :loading="saveProfileMutation.isPending.value"
          @click="saveProfileMutation.mutate()"
        />
      </section>

      <section class="soc-surface space-y-5 p-5">
        <h2 class="font-display text-lg font-semibold">{{ t('profile.security') }}</h2>
        <p class="text-sm soc-muted">{{ t('profile.passwordHint') }}</p>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('profile.currentPassword') }}</label>
          <Password
            v-model="currentPassword"
            class="w-full"
            input-class="w-full"
            :feedback="false"
            toggle-mask
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('profile.newPassword') }}</label>
          <Password
            v-model="newPassword"
            class="w-full"
            input-class="w-full"
            toggle-mask
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium">{{ t('profile.confirmPassword') }}</label>
          <Password
            v-model="confirmPassword"
            class="w-full"
            input-class="w-full"
            :feedback="false"
            toggle-mask
          />
        </div>

        <Button
          :label="t('profile.changePassword')"
          severity="secondary"
          :loading="passwordMutation.isPending.value"
          :disabled="!currentPassword || !newPassword || !confirmPassword"
          @click="passwordMutation.mutate()"
        />
      </section>
    </div>
  </div>
</template>
