<template>
  <div class="container">
    <h2>Admin Panel</h2>
    <p>Welcome, {{ auth.user?.name }} ({{ auth.user?.role }})</p>

    <div class="grid">
      <div class="card">
        <h3>Reservation Dashboard</h3>
        <p>Operational view for employees.</p>
        <router-link class="btn" to="/reservation-dashboard">Open Reservation Dashboard</router-link>
      </div>

      <div class="card">
        <h3>Employee Management</h3>
        <p>Create and view employees.</p>
        <router-link class="btn" to="/admin/employees">Open Employee Dashboard</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}
.card {
  padding: 1rem;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
}
.btn {
  display: inline-block;
  margin-top: 0.5rem;
}
</style>


