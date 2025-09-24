<template>
  <div class="container">
    <div class="card">
      <h2>Employee Management</h2>
      <button @click="showCreateForm = true" class="btn">Create New Employee</button>
    </div>

    <div class="card">
      <h3>Employees</h3>
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
      <div v-else class="reservation-list">
        <div class="reservation-card" v-for="e in filteredEmployees" :key="e.id">
          <div class="card-header">
            <h3>{{ e.name }}</h3>
            <span class="status-badge" :class="e.disabled ? 'status-cancelled' : 'status-approved'">
              {{ e.disabled ? 'Disabled' : 'Enabled' }}
            </span>
          </div>
          <div class="card-content">
            <div class="reservation-details">
              <div class="detail-item"><strong>Email:</strong> {{ e.email }}</div>
              <div class="detail-item"><strong>Phone:</strong> {{ e.phone }}</div>
            </div>
            <div class="card-actions">
              <button class="btn btn-success" @click="resetPwd(e.id)" :disabled="busy[e.id]">Reset Password</button>
              <button
                v-if="!e.disabled"
                class="btn btn-danger"
                @click="toggleDisabled(e)"
                :disabled="busy[e.id]"
              >
                Disable
              </button>
              <button
                v-else
                class="btn btn-success"
                @click="toggleDisabled(e)"
                :disabled="busy[e.id]"
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Employee Modal -->
    <div v-if="showCreateForm" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Create New Employee</h3>
          <button @click="closeModal" class="btn-close">&times;</button>
        </div>
        <form @submit.prevent="handleCreate" class="modal-body">
          <div class="form-group">
            <label for="name">Name *</label>
            <input id="name" v-model="name" type="text" required placeholder="Enter employee name" />
          </div>
          <div class="form-group">
            <label for="email">Email *</label>
            <input id="email" v-model="email" type="email" required placeholder="Enter email address" />
          </div>
          <div class="form-group">
            <label for="phone">Phone *</label>
            <input id="phone" v-model="phone" type="tel" required placeholder="Enter phone number" />
          </div>
          <div v-if="createError" class="error-message" style="margin-top: .5rem;">{{ createError }}</div>
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn btn-outline">Cancel</button>
            <button type="submit" class="btn" :disabled="creating">
              {{ creating ? 'Creating...' : 'Create Employee' }}
            </button>
          </div>
        </form>
        <div class="modal-footer">
          <small>Default password will be the email address.</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { adminService } from '@/services/admin'

const employees = ref<any[]>([])
const loading = ref(true)
const creating = ref(false)
const createError = ref('')
const showCreateForm = ref(false)
const name = ref('')
const email = ref('')
const phone = ref('')
const busy = ref<Record<string, boolean>>({})
const filters = ref<{ keyword: string; disabled: string }>({ keyword: '', disabled: '' })

const filteredEmployees = computed(() => {
  let list = employees.value
  const kw = filters.value.keyword.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (e) => e.name?.toLowerCase().includes(kw) || e.email?.toLowerCase().includes(kw)
    )
  }
  if (filters.value.disabled === 'true') {
    list = list.filter((e) => e.disabled === true)
  } else if (filters.value.disabled === 'false') {
    list = list.filter((e) => e.disabled === false)
  }
  return list
})

const load = async () => {
  loading.value = true
  try {
    employees.value = await adminService.listEmployees()
  } finally {
    loading.value = false
  }
}

const handleCreate = async () => {
  creating.value = true
  try {
    createError.value = ''
    const payload = {
      name: name.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim()
    }
    await adminService.createEmployee(payload)
    name.value = ''
    email.value = ''
    phone.value = ''
    showCreateForm.value = false
    await load()
  } catch (e: any) {
    const apiMsg = e?.response?.data?.error
    const rawMsg = e?.message
    createError.value = apiMsg || rawMsg || 'Failed to create employee'
    // 保持弹窗打开，便于用户修正
  } finally {
    creating.value = false
  }
}

const closeModal = () => {
  showCreateForm.value = false
  name.value = ''
  email.value = ''
  phone.value = ''
}

const resetPwd = async (id: string) => {
  busy.value[id] = true
  try {
    await adminService.resetEmployeePassword(id)
    alert('Password reset to email')
  } finally {
    busy.value[id] = false
  }
}

const toggleDisabled = async (e: any) => {
  busy.value[e.id] = true
  try {
    const res = await adminService.setEmployeeDisabled(e.id, !e.disabled)
    e.disabled = res.disabled
  } finally {
    busy.value[e.id] = false
  }
}

const applyFilters = () => {
  // Filters are applied automatically via computed property
}

const clearFilters = () => {
  filters.value = { keyword: '', disabled: '' }
}

onMounted(load)
</script>

<style scoped>
.reservation-list {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.reservation-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.reservation-details {
  margin-bottom: 1rem;
}

.detail-item {
  margin-bottom: 0.5rem;
}

.card-actions {
  display: flex;
  gap: 1rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.8rem;
  text-transform: capitalize;
}

.status-approved {
  background: #e6f4ea;
  color: #1e7e34;
}

.status-cancelled {
  background: #fdecea;
  color: #c82333;
}

.form-inline {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 0.5rem;
  align-items: center;
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
}

.btn-outline {
  background: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.btn-outline:hover {
  background: #6c757d;
  color: white;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 1rem;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #eee;
  text-align: center;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}
</style>


