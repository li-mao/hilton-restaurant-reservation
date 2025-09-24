<template>
  <div class="container">
    <div class="card login-card">
      <h2>Change Password</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="current">Current Password</label>
          <input id="current" v-model="currentPassword" type="password" required />
        </div>
        <div class="form-group">
          <label for="new">New Password</label>
          <input id="new" v-model="newPassword" type="password" required minlength="6" />
        </div>
        <div class="form-group">
          <label for="confirm">Confirm New Password</label>
          <input id="confirm" v-model="confirmPassword" type="password" required minlength="6" />
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="success" class="success-message">Password updated successfully.</div>
        <button type="submit" class="btn" :disabled="loading">{{ loading ? 'Updating...' : 'Update Password' }}</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/auth'

const router = useRouter()
const authStore = useAuthStore()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

const handleSubmit = async () => {
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }
  try {
    loading.value = true
    error.value = ''
    success.value = false
    const resp = await authService.changePassword(currentPassword.value, newPassword.value)
    // update token and user in store
    authStore.token = resp.token as any
    localStorage.setItem('token', resp.token)
    authStore.user = resp.data.user as any
    success.value = true
    router.push('/reservations')
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Update failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-card {
  max-width: 400px;
  margin: 2rem auto;
}
</style>


