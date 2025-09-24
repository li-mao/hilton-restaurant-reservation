<template>
  <nav class="navbar">
    <div class="container">
      <router-link to="/" class="navbar-brand">
        Hilton Restaurant Reservations
      </router-link>

      <ul class="navbar-nav">
        <template v-if="authStore.isAuthenticated">
          <li v-if="!authStore.isEmployee"><router-link to="/reservations" class="nav-link">My Reservations</router-link></li>
          <li v-if="authStore.isEmployee"><router-link to="/reservation-dashboard" class="nav-link">Reservation Dashboard</router-link></li>
          <li v-if="authStore.user?.role === 'admin'"><router-link to="/admin/employees" class="nav-link">Employee Management</router-link></li>
          <li v-if="authStore.user?.role === 'admin'"><router-link to="/admin/guests" class="nav-link">Guest Management</router-link></li>
          <li><span class="nav-link">{{ authStore.user?.name }}</span></li>
          <li><button @click="handleLogout" class="btn btn-danger">Logout</button></li>
        </template>
        <template v-else>
          <li><router-link to="/login" class="nav-link">Login</router-link></li>
          <li><router-link to="/register" class="nav-link">Register</router-link></li>
        </template>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>