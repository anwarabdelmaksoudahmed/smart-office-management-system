<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { useForm, useField } from 'vee-validate';
import * as yup from 'yup';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';
import LocaleSwitcher from '@/shared/components/ui/LocaleSwitcher.vue';
import ThemeToggle from '@/shared/components/ui/ThemeToggle.vue';
import { useAuthStore } from '@/modules/auth/stores/auth.store';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const errorMessage = ref('');

const schema = yup.object({
  email: yup
    .string()
    .required(() => t('auth.requiredEmail'))
    .email(() => t('auth.emailInvalid')),
  password: yup.string().required(() => t('auth.requiredPassword')).min(8),
});

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: {
    email: 'admin@smartoffice.local',
    password: 'Admin@12345',
  },
});

const { value: email, errorMessage: emailError } = useField<string>('email');
const { value: password, errorMessage: passwordError } = useField<string>('password');

const onSubmit = handleSubmit(async (values) => {
  errorMessage.value = '';
  try {
    const target = await auth.login(values.email, values.password);
    const redirect = (route.query.redirect as string) || target;
    await router.replace(redirect);
  } catch {
    errorMessage.value = t('auth.invalid');
  }
});
</script>

<template>
  <div class="relative flex min-h-screen">
    <!-- Atmosphere panel -->
    <div
      class="relative hidden w-[48%] overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10"
      style="background: var(--soc-hero-glow)"
    >
      <div class="absolute inset-0 opacity-40"
        style="background-image: url(&quot;data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23247365' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E&quot;)"
      />
      <div class="relative">
        <p class="font-display text-sm font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">
          Smart Office
        </p>
        <h1 class="mt-6 max-w-md font-display text-4xl font-semibold leading-tight text-ink-950 dark:text-ink-50 xl:text-5xl">
          {{ t('app.name') }}
        </h1>
        <p class="mt-4 max-w-sm text-base text-ink-600 dark:text-ink-300">
          {{ t('app.tagline') }}
        </p>
      </div>
      <p class="relative text-sm text-ink-500 dark:text-ink-400">
        {{ t('auth.demoHint') }}
      </p>
    </div>

    <!-- Form panel -->
    <div class="flex flex-1 flex-col">
      <div class="flex justify-end gap-2 p-4">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>

      <div class="flex flex-1 items-center justify-center px-6 pb-16">
        <form class="w-full max-w-md space-y-6" @submit.prevent="onSubmit">
          <div class="lg:hidden">
            <p class="font-display text-sm font-semibold text-brand-700 dark:text-brand-300">
              Smart Office
            </p>
            <h1 class="mt-2 font-display text-3xl font-semibold">
              {{ t('app.name') }}
            </h1>
          </div>

          <div>
            <h2 class="font-display text-2xl font-semibold">{{ t('auth.welcome') }}</h2>
            <p class="mt-1 text-sm soc-muted">{{ t('auth.subtitle') }}</p>
          </div>

          <Message v-if="errorMessage" severity="error" :closable="false">
            {{ errorMessage }}
          </Message>

          <div class="space-y-4">
            <div class="flex flex-col gap-1.5">
              <label for="email" class="text-sm font-medium">{{ t('auth.email') }}</label>
              <InputText
                id="email"
                v-model="email"
                type="email"
                autocomplete="username"
                class="w-full"
                :invalid="Boolean(emailError)"
              />
              <small v-if="emailError" class="text-red-600 dark:text-red-400">{{ emailError }}</small>
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="password" class="text-sm font-medium">{{ t('auth.password') }}</label>
              <Password
                id="password"
                v-model="password"
                :feedback="false"
                toggle-mask
                input-class="w-full"
                class="w-full"
                autocomplete="current-password"
                :invalid="Boolean(passwordError)"
              />
              <small v-if="passwordError" class="text-red-600 dark:text-red-400">{{ passwordError }}</small>
            </div>
          </div>

          <Button
            type="submit"
            class="w-full"
            :loading="isSubmitting || auth.loading"
            :label="isSubmitting || auth.loading ? t('auth.loggingIn') : t('auth.login')"
          />

          <p class="text-center text-xs soc-muted lg:hidden">{{ t('auth.demoHint') }}</p>
        </form>
      </div>
    </div>
  </div>
</template>
