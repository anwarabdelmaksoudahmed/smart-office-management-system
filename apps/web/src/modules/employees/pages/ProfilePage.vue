<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMutation } from '@tanstack/vue-query';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import { authApi } from '@/modules/auth/api/auth.api';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { applyDocumentLocale, type AppLocale } from '@/i18n';
import PageHeader from '@/shared/components/ui/PageHeader.vue';

const MIN_PASSWORD_LENGTH = 8;

const { t, locale } = useI18n();
const toast = useToast();
const auth = useAuthStore();

const firstName = ref('');
const lastName = ref('');
const phone = ref('');
const profileLocale = ref<AppLocale>('en');
const avatarUrl = ref<string | null>(null);
const avatarPreview = ref<string | null>(null);
const avatarInput = ref<HTMLInputElement | null>(null);

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

function resetForm() {
  const u = auth.user;
  if (!u) return;
  firstName.value = u.firstName ?? '';
  lastName.value = u.lastName ?? '';
  phone.value = u.phone ?? '';
  profileLocale.value = (u.locale as AppLocale) || 'en';
  avatarUrl.value = u.avatarUrl ?? null;
  avatarPreview.value = u.avatarUrl ?? null;
}

watch(() => auth.user, resetForm, { immediate: true });

const initials = computed(() => {
  const a = firstName.value.trim().charAt(0);
  const b = lastName.value.trim().charAt(0);
  return `${a}${b}`.toUpperCase() || '?';
});

const fullName = computed(() =>
  `${auth.user?.firstName ?? ''} ${auth.user?.lastName ?? ''}`.trim(),
);

const roleLabels = computed(() =>
  (auth.user?.roles ?? []).map((role) =>
    role
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
  ),
);

const localeOptions = [
  { label: 'English', value: 'en' },
  { label: 'العربية', value: 'ar' },
];

const nameInvalid = computed(() => !firstName.value.trim() || !lastName.value.trim());

const isDirty = computed(() => {
  const u = auth.user;
  if (!u) return false;
  return (
    firstName.value.trim() !== (u.firstName ?? '') ||
    lastName.value.trim() !== (u.lastName ?? '') ||
    phone.value.trim() !== (u.phone ?? '') ||
    profileLocale.value !== ((u.locale as AppLocale) || 'en') ||
    avatarUrl.value !== (u.avatarUrl ?? null)
  );
});

const passwordTooShort = computed(
  () => newPassword.value.length > 0 && newPassword.value.length < MIN_PASSWORD_LENGTH,
);
const passwordMismatch = computed(
  () => confirmPassword.value.length > 0 && newPassword.value !== confirmPassword.value,
);
const canChangePassword = computed(
  () =>
    !!currentPassword.value &&
    newPassword.value.length >= MIN_PASSWORD_LENGTH &&
    newPassword.value === confirmPassword.value,
);

const passwordStrength = computed(() => {
  const value = newPassword.value;
  if (!value) return 0;
  let score = 0;
  if (value.length >= MIN_PASSWORD_LENGTH) score++;
  if (value.length >= 12) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return Math.min(4, Math.max(1, score - 1));
});

const strengthMeta = computed(() => {
  const levels = [
    { key: 'profile.strengthWeak', color: 'var(--soc-danger)' },
    { key: 'profile.strengthFair', color: 'var(--soc-warn)' },
    { key: 'profile.strengthGood', color: 'var(--soc-brand)' },
    { key: 'profile.strengthStrong', color: 'var(--soc-success)' },
  ];
  return levels[passwordStrength.value - 1] ?? null;
});

function openAvatarPicker() {
  avatarInput.value?.click();
}

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
  input.value = '';
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

function saveProfile() {
  if (nameInvalid.value || !isDirty.value) return;
  saveProfileMutation.mutate();
}

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

function changePassword() {
  if (!canChangePassword.value) return;
  passwordMutation.mutate();
}
</script>

<template>
  <div class="soc-page soc-page-enter">
    <PageHeader :title="t('profile.title')" :blurb="t('profile.blurb')" />

    <section class="soc-surface mt-6 overflow-hidden">
      <div class="profile-banner h-24 sm:h-28" />
      <div class="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:gap-5">
        <div class="relative -mt-12 shrink-0 sm:-mt-14">
          <div
            class="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 text-2xl font-semibold shadow-sm sm:h-28 sm:w-28"
            style="
              background: var(--soc-brand-soft);
              color: var(--soc-brand);
              border-color: var(--soc-surface);
            "
          >
            <img
              v-if="avatarPreview"
              :src="avatarPreview"
              :alt="fullName"
              class="h-full w-full object-cover"
            />
            <span v-else>{{ initials }}</span>
          </div>
          <button
            type="button"
            class="absolute -bottom-1 -end-1 flex h-9 w-9 items-center justify-center rounded-full border-2 text-white shadow transition hover:scale-105"
            style="background: var(--soc-brand); border-color: var(--soc-surface)"
            :aria-label="t('profile.changePhoto')"
            :title="t('profile.changePhoto')"
            @click="openAvatarPicker"
          >
            <i class="pi pi-camera text-sm" />
          </button>
          <input
            ref="avatarInput"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="hidden"
            @change="onAvatarSelected"
          />
        </div>

        <div class="min-w-0 flex-1">
          <h2 class="truncate font-display text-xl font-semibold sm:text-2xl">
            {{ fullName || auth.user?.email }}
          </h2>
          <p class="mt-0.5 flex items-center gap-1.5 truncate text-sm soc-muted">
            <i class="pi pi-envelope text-xs" />
            <span class="truncate">{{ auth.user?.email }}</span>
          </p>
          <div v-if="roleLabels.length" class="mt-2 flex flex-wrap gap-1.5">
            <Tag
              v-for="role in roleLabels"
              :key="role"
              :value="role"
              severity="secondary"
              rounded
            />
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button
            :label="t('profile.changePhoto')"
            icon="pi pi-upload"
            size="small"
            outlined
            @click="openAvatarPicker"
          />
          <Button
            v-if="avatarPreview"
            :label="t('profile.removePhoto')"
            icon="pi pi-trash"
            size="small"
            text
            severity="danger"
            @click="clearAvatar"
          />
        </div>
      </div>
      <p class="border-t px-5 py-2.5 text-xs soc-muted" style="border-color: var(--soc-border)">
        <i class="pi pi-info-circle me-1 text-xs" />
        {{ t('profile.photoHint') }}
      </p>
    </section>

    <div class="mt-6 grid gap-6 lg:grid-cols-5">
      <form class="soc-surface space-y-5 p-5 lg:col-span-3" @submit.prevent="saveProfile">
        <div class="flex items-start gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style="background: var(--soc-brand-soft); color: var(--soc-brand)"
          >
            <i class="pi pi-user" />
          </span>
          <div>
            <h2 class="font-display text-lg font-semibold">{{ t('profile.personal') }}</h2>
            <p class="text-sm soc-muted">{{ t('profile.personalHint') }}</p>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-1.5">
            <label for="profile-first-name" class="text-sm font-medium">
              {{ t('profile.firstName') }} <span style="color: var(--soc-danger)">*</span>
            </label>
            <InputText
              id="profile-first-name"
              v-model="firstName"
              class="w-full"
              autocomplete="given-name"
              :invalid="!firstName.trim()"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="profile-last-name" class="text-sm font-medium">
              {{ t('profile.lastName') }} <span style="color: var(--soc-danger)">*</span>
            </label>
            <InputText
              id="profile-last-name"
              v-model="lastName"
              class="w-full"
              autocomplete="family-name"
              :invalid="!lastName.trim()"
            />
          </div>
        </div>
        <p v-if="nameInvalid" class="-mt-2 text-xs" style="color: var(--soc-danger)">
          {{ t('profile.nameRequired') }}
        </p>

        <div class="flex flex-col gap-1.5">
          <label for="profile-email" class="text-sm font-medium">{{ t('auth.email') }}</label>
          <div class="relative">
            <i class="pi pi-lock pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-xs soc-muted" />
            <InputText
              id="profile-email"
              :model-value="auth.user?.email ?? ''"
              class="w-full !ps-8"
              disabled
            />
          </div>
          <small class="text-xs soc-muted">{{ t('profile.emailLocked') }}</small>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-1.5">
            <label for="profile-phone" class="text-sm font-medium">{{ t('profile.phone') }}</label>
            <InputText
              id="profile-phone"
              v-model="phone"
              class="w-full"
              type="tel"
              dir="ltr"
              autocomplete="tel"
              placeholder="+966 5x xxx xxxx"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="profile-locale" class="text-sm font-medium">{{ t('common.language') }}</label>
            <Select
              v-model="profileLocale"
              input-id="profile-locale"
              :options="localeOptions"
              option-label="label"
              option-value="value"
              class="w-full"
            />
          </div>
        </div>

        <div
          class="flex flex-wrap items-center justify-between gap-3 border-t pt-4"
          style="border-color: var(--soc-border)"
        >
          <span class="text-xs soc-muted">
            <template v-if="isDirty">
              <i class="pi pi-circle-fill me-1 text-[0.5rem]" style="color: var(--soc-warn)" />
              {{ t('profile.unsavedChanges') }}
            </template>
            <template v-else>
              <i class="pi pi-check-circle me-1 text-xs" style="color: var(--soc-success)" />
              {{ t('profile.upToDate') }}
            </template>
          </span>
          <div class="flex gap-2">
            <Button
              type="button"
              :label="t('profile.discard')"
              severity="secondary"
              text
              :disabled="!isDirty || saveProfileMutation.isPending.value"
              @click="resetForm"
            />
            <Button
              type="submit"
              :label="t('common.save')"
              icon="pi pi-check"
              :loading="saveProfileMutation.isPending.value"
              :disabled="!isDirty || nameInvalid"
            />
          </div>
        </div>
      </form>

      <form class="soc-surface space-y-5 p-5 lg:col-span-2" @submit.prevent="changePassword">
        <div class="flex items-start gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style="background: var(--soc-brand-soft); color: var(--soc-brand)"
          >
            <i class="pi pi-shield" />
          </span>
          <div>
            <h2 class="font-display text-lg font-semibold">{{ t('profile.security') }}</h2>
            <p class="text-sm soc-muted">{{ t('profile.passwordHint') }}</p>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="profile-current-password" class="text-sm font-medium">
            {{ t('profile.currentPassword') }}
          </label>
          <Password
            v-model="currentPassword"
            input-id="profile-current-password"
            class="w-full"
            input-class="w-full"
            autocomplete="current-password"
            :feedback="false"
            toggle-mask
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="profile-new-password" class="text-sm font-medium">
            {{ t('profile.newPassword') }}
          </label>
          <Password
            v-model="newPassword"
            input-id="profile-new-password"
            class="w-full"
            input-class="w-full"
            autocomplete="new-password"
            :feedback="false"
            :invalid="passwordTooShort"
            toggle-mask
          />
          <div v-if="newPassword" class="mt-1 space-y-1">
            <div class="flex gap-1">
              <span
                v-for="i in 4"
                :key="i"
                class="h-1.5 flex-1 rounded-full transition-colors"
                :style="{
                  background:
                    i <= passwordStrength && strengthMeta ? strengthMeta.color : 'var(--soc-border)',
                }"
              />
            </div>
            <p v-if="strengthMeta" class="text-xs" :style="{ color: strengthMeta.color }">
              {{ t(strengthMeta.key) }}
            </p>
          </div>
          <small
            class="text-xs"
            :style="passwordTooShort ? 'color: var(--soc-danger)' : ''"
            :class="passwordTooShort ? '' : 'soc-muted'"
          >
            {{ t('profile.passwordMinLength', { count: MIN_PASSWORD_LENGTH }) }}
          </small>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="profile-confirm-password" class="text-sm font-medium">
            {{ t('profile.confirmPassword') }}
          </label>
          <Password
            v-model="confirmPassword"
            input-id="profile-confirm-password"
            class="w-full"
            input-class="w-full"
            autocomplete="new-password"
            :feedback="false"
            :invalid="passwordMismatch"
            toggle-mask
          />
          <small v-if="passwordMismatch" class="text-xs" style="color: var(--soc-danger)">
            {{ t('profile.passwordMismatch') }}
          </small>
        </div>

        <Button
          type="submit"
          :label="t('profile.changePassword')"
          icon="pi pi-key"
          class="w-full"
          severity="secondary"
          :loading="passwordMutation.isPending.value"
          :disabled="!canChangePassword"
        />
      </form>
    </div>
  </div>
</template>

<style scoped>
.profile-banner {
  background:
    radial-gradient(600px 160px at 85% 0%, color-mix(in srgb, var(--soc-accent) 35%, transparent), transparent 70%),
    linear-gradient(120deg, var(--soc-sidebar) 0%, var(--soc-brand) 100%);
}
</style>
