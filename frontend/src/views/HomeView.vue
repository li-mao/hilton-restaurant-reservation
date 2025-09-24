<template>
  <div class="container">
    <div class="card">
      <h1>Welcome to Hilton Restaurant Reservations</h1>
      <p>Book your table with ease and enjoy a delightful dining experience.</p>
      
    </div>

    <div class="features">
      <div class="card">
        <h3>For Guests</h3>
        <ul>
          <li>Easy online table booking</li>
          <li>Manage your reservations</li>
          <li>Update or cancel bookings</li>
          <li>Receive confirmation notifications</li>
        </ul>
      </div>

      <div class="card">
        <h3>For Restaurant Staff</h3>
        <ul>
          <li>Manage all reservations</li>
          <li>Approve or cancel bookings</li>
          <li>View guest contact information</li>
          <li>Filter reservations by date and status</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<style scoped>
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

h1 {
  text-align: center;
  color: #007bff;
  margin-bottom: 1rem;
}

p {
  text-align: center;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

li:last-child {
  border-bottom: none;
}
</style>