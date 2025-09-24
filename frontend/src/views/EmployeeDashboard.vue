<template>
  <div class="container">
    <div class="card">
      <h2>Reservation Dashboard</h2>
      <p>Manage all restaurant reservations</p>
    </div>

    <div class="card">
      <div class="filters">
        <div class="form-group">
          <label for="statusFilter">Filter by Status:</label>
          <select id="statusFilter" v-model="filters.status" @change="applyFilters">
            <option value="">All Statuses</option>
            <option value="requested">Requested</option>
            <option value="approved">Approved</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div class="form-group">
          <label for="dateFilter">Filter by Date:</label>
          <input
            id="dateFilter"
            v-model="filters.date"
            type="date"
            @change="applyFilters"
          />
        </div>

        <div class="form-group">
          <label for="guestNameFilter">Search by Guest Name:</label>
          <input
            id="guestNameFilter"
            v-model="filters.guestName"
            type="text"
            placeholder="Enter guest name"
            @input="applyFilters"
          />
        </div>

        <button @click="clearFilters" class="btn btn-outline">Clear Filters</button>
      </div>
    </div>

    <div v-if="loading" class="card">Loading reservations...</div>

    <div v-else-if="filteredReservations.length === 0" class="card">
      <p>No reservations found matching your criteria.</p>
    </div>

    <div v-else class="reservation-list">
      <EmployeeReservationCard
        v-for="reservation in filteredReservations"
        :key="reservation.id + '-' + reservation.status + '-' + reservation.updatedAt"
        :reservation="reservation"
        @approve="handleApprove"
        @complete="handleComplete"
        @cancel="handleCancel"
      />
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import EmployeeReservationCard from '@/components/EmployeeReservationCard.vue'
import { reservationService } from '@/services/reservation'
import type { Reservation, ReservationStatus } from '@/types'

const reservations = ref<Reservation[]>([])
const loading = ref(true)
const error = ref('')

const filters = ref({
  status: '',
  date: '',
  guestName: ''
})

const filteredReservations = computed(() => {
  let filtered = reservations.value

  if (filters.value.status) {
    filtered = filtered.filter(r => r.status === filters.value.status)
  }

  if (filters.value.date) {
    const filterDate = new Date(filters.value.date)
    filtered = filtered.filter(r => {
      const arrivalDate = new Date(r.expectedArrivalTime)
      return arrivalDate.toDateString() === filterDate.toDateString()
    })
  }

  if (filters.value.guestName) {
    const searchTerm = filters.value.guestName.toLowerCase()
    filtered = filtered.filter(r =>
      r.guestName.toLowerCase().includes(searchTerm)
    )
  }

  // 确保按预期到达时间倒序排序（最新的在前面）
  // 直接依赖后端顺序
  // 兜底：统一按创建时间倒序
  return [...filtered].sort((a, b) => (
    new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime()
  ))
})

const loadReservations = async () => {
  try {
    loading.value = true
    error.value = ''
    const list = await reservationService.getReservations()
    // 兜底：按创建时间倒序
    reservations.value = [...list].sort((a, b) => (
      new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime()
    ))
  } catch (err: any) {
    error.value = 'Failed to load reservations'
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  // Filters are applied automatically via computed property
}

const clearFilters = () => {
  filters.value = {
    status: '',
    date: '',
    guestName: ''
  }
}

const handleApprove = async (id: string) => {
  try {
    error.value = ''
    console.log('[EmployeeDashboard] approve click -> id:', id)
    // 乐观更新
    const index = reservations.value.findIndex(r => r.id === id)
    if (index !== -1) {
      const nowIso = new Date().toISOString()
      reservations.value[index] = { ...reservations.value[index], status: 'approved', updatedAt: nowIso }
      reservations.value = [...reservations.value]
      console.log('[EmployeeDashboard] optimistic approve local update done')
    }

    // 发请求（专用接口）
    const approved = await reservationService.approveReservation(id)

    // 矫正为服务器返回
    if (index !== -1) {
      reservations.value[index] = { ...reservations.value[index], ...approved }
      reservations.value = [...reservations.value]
    }

    // 刷新
    await loadReservations()
  } catch (err: any) {
    const gqlMsg = err?.graphQLErrors?.[0]?.message
    const netMsg = err?.message
    error.value = gqlMsg || netMsg || 'Failed to approve reservation'
    await loadReservations()
  }
}

const handleComplete = async (id: string) => {
  try {
    error.value = ''
    console.log('[EmployeeDashboard] complete click -> id:', id)
    // 乐观更新
    const index = reservations.value.findIndex(r => r.id === id)
    if (index !== -1) {
      const nowIso = new Date().toISOString()
      reservations.value[index] = { ...reservations.value[index], status: 'completed', updatedAt: nowIso }
      reservations.value = [...reservations.value]
      console.log('[EmployeeDashboard] optimistic complete local update done')
    }

    // 发请求（专用接口）
    const completed = await reservationService.completeReservation(id)

    // 矫正为服务器返回
    if (index !== -1) {
      reservations.value[index] = { ...reservations.value[index], ...completed }
      reservations.value = [...reservations.value]
    }

    await loadReservations()
  } catch (err: any) {
    const gqlMsg = err?.graphQLErrors?.[0]?.message
    const netMsg = err?.message
    error.value = gqlMsg || netMsg || 'Failed to complete reservation'
    await loadReservations()
  }
}

const handleCancel = async (id: string) => {
  try {
    error.value = ''
    console.log('[EmployeeDashboard] cancel click -> id:', id)
    // 乐观更新：先本地更新
    const index = reservations.value.findIndex(r => r.id === id)
    if (index !== -1) {
      const nowIso = new Date().toISOString()
      reservations.value[index] = {
        ...reservations.value[index],
        status: 'cancelled',
        updatedAt: nowIso
      }
      reservations.value = [...reservations.value]
      console.log('[EmployeeDashboard] optimistic local update done')
    }

    // 调用后端取消
    const cancelled = await reservationService.cancelReservation(id)
    console.log('[EmployeeDashboard] server cancel done -> updatedAt:', cancelled?.updatedAt)

    // 矫正一次服务器返回时间
    if (cancelled?.updatedAt && index !== -1) {
      reservations.value[index] = {
        ...reservations.value[index],
        updatedAt: cancelled.updatedAt
      }
      reservations.value = [...reservations.value]
    }

    // 刷新并等待完成
    await loadReservations()
  } catch (err: any) {
    const gqlMsg = err?.graphQLErrors?.[0]?.message
    const netMsg = err?.message
    error.value = gqlMsg || netMsg || 'Failed to cancel reservation'
    console.error('[EmployeeDashboard] cancel failed:', err)
    await loadReservations()
  }
}

onMounted(() => {
  loadReservations()
})
</script>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
}

.reservation-list {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
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
</style>