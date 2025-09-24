<template>
  <div class="container">
    <div class="card">
      <h2>Guest Management</h2>
      <p>Manage guest user accounts and their access status.</p>
    </div>

    <div class="card">
      <h3>Guest Users</h3>
      <div class="filters">
        <div class="form-group">
          <label for="keywordFilter">Search by Name or Email:</label>
          <input
            id="keywordFilter"
            v-model="filters.keyword"
            type="text"
            placeholder="Enter name or email"
            @input="applyFilters"
          />
        </div>

        <div class="form-group">
          <label for="statusFilter">Filter by Status:</label>
          <select id="statusFilter" v-model="filters.disabled" @change="applyFilters">
            <option value="">All</option>
            <option value="false">Enabled</option>
            <option value="true">Disabled</option>
          </select>
        </div>

        <button @click="clearFilters" class="btn btn-outline">Clear Filters</button>
      </div>
      
      <div v-if="loading">Loading...</div>
      <div v-else class="guest-list">
        <div class="guest-card" v-for="g in filteredGuests" :key="g.id">
          <div class="card-header">
            <h3>{{ g.name }}</h3>
            <span class="status-badge" :class="g.disabled ? 'status-cancelled' : 'status-approved'">
              {{ g.disabled ? 'Disabled' : 'Enabled' }}
            </span>
          </div>
          <div class="card-content">
            <div class="guest-details">
              <div class="detail-item"><strong>Email:</strong> {{ g.email }}</div>
              <div class="detail-item"><strong>Phone:</strong> {{ g.phone }}</div>
              <div class="detail-item"><strong>Registered:</strong> {{ formatDate(g.createdAt) }}</div>
            </div>
            <div class="card-actions">
              <button
                v-if="!g.disabled"
                class="btn btn-danger"
                @click="toggleDisabled(g)"
                :disabled="busy[g.id]"
              >
                Disable Account
              </button>
              <button
                v-else
                class="btn btn-success"
                @click="toggleDisabled(g)"
                :disabled="busy[g.id]"
              >
                Enable Account
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="filteredGuests.length === 0" class="empty-state">
          <p>No guests found matching your criteria.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { adminService } from '@/services/admin'

const guests = ref<any[]>([])
const loading = ref(true)
const busy = ref<Record<string, boolean>>({})
const filters = ref<{ keyword: string; disabled: string }>({ keyword: '', disabled: '' })

const filteredGuests = computed(() => {
  let list = guests.value
  const kw = filters.value.keyword.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (g) => g.name?.toLowerCase().includes(kw) || g.email?.toLowerCase().includes(kw)
    )
  }
  if (filters.value.disabled === 'true') {
    list = list.filter((g) => g.disabled === true)
  } else if (filters.value.disabled === 'false') {
    list = list.filter((g) => g.disabled === false)
  }
  return list
})

const load = async () => {
  loading.value = true
  try {
    guests.value = await adminService.listGuests()
  } catch (error) {
    console.error('Failed to load guests:', error)
    alert('Failed to load guests. Please try again.')
  } finally {
    loading.value = false
  }
}

const toggleDisabled = async (g: any) => {
  busy.value[g.id] = true
  try {
    const res = await adminService.setGuestDisabled(g.id, !g.disabled)
    g.disabled = res.disabled
    alert(`Guest account ${g.disabled ? 'disabled' : 'enabled'} successfully.`)
  } catch (error) {
    console.error('Failed to toggle guest status:', error)
    alert('Failed to update guest status. Please try again.')
  } finally {
    busy.value[g.id] = false
  }
}

const applyFilters = () => {
  // Filters are applied automatically via computed property
}

const clearFilters = () => {
  filters.value = { keyword: '', disabled: '' }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(load)
</script>

<style scoped>
.guest-list {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.guest-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 1.5rem;
  border-left: 4px solid #4CAF50;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
  color: #333;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-approved {
  background-color: #d4edda;
  color: #155724;
}

.status-cancelled {
  background-color: #f8d7da;
  color: #721c24;
}

.guest-details {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  gap: 0.5rem;
}

.detail-item strong {
  min-width: 80px;
  color: #666;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.filters {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 1rem;
  align-items: end;
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group label {
  font-weight: 500;
  color: #333;
  font-size: 0.875rem;
}

.form-group input,
.form-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #218838;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
}

.btn-outline {
  background-color: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.btn-outline:hover:not(:disabled) {
  background-color: #6c757d;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.card h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.card h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.card p {
  margin: 0;
  color: #666;
}
</style>
