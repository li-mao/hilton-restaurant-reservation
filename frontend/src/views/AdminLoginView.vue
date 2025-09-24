<template>
  <div class="container">
    <div class="card login-card">
      <h2>Admin/Employee Login</h2>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" required placeholder="Enter your email" />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input id="password" v-model="password" type="password" required placeholder="Enter your password" />
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <button type="submit" class="btn" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <p class="text-center">
        Regular user? <router-link to="/login">Go to User Login</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  try {
    loading.value = true
    error.value = ''

    const resp = await authStore.login(email.value, password.value)
    const loggedUser = resp.data.user

    if (!(loggedUser.role === 'admin' || loggedUser.role === 'employee')) {
      // not allowed for admin portal
      error.value = 'This portal is for admin/employee only'
      authStore.logout()
      return
    }

    if (loggedUser.passwordChanged === false) {
      router.push('/change-password')
      return
    }

    router.push('/employee-dashboard')
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Login failed'
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

.text-center {
  text-align: center;
  margin-top: 1rem;
}
</style>


