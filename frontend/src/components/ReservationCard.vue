<template>
  <div class="reservation-card">
    <div class="card-header">
      <h3>{{ reservation.guestName }}</h3>
      <span :class="getStatusClass(reservation.status)" class="status-badge">
        {{ reservation.status }}
      </span>
    </div>

    <div class="card-content">
      <div class="reservation-details">
        <div class="detail-item">
          <strong>Arrival Time:</strong>
          {{ formatDateTime(reservation.expectedArrivalTime) }}
        </div>
        <div class="detail-item">
          <strong>Guests:</strong>
          {{ reservation.tableSize }}
        </div>
        <div class="detail-item">
          <strong>Contact:</strong>
          {{ reservation.guestContactInfo.email }}
        </div>
        <div class="detail-item">
          <strong>Phone:</strong>
          {{ reservation.guestContactInfo.phone }}
        </div>
        <div v-if="reservation.specialRequests" class="detail-item">
          <strong>Special Requests:</strong>
          {{ reservation.specialRequests }}
        </div>
      </div>

      <div class="card-actions">
        <template v-if="reservation.status === 'requested'">
          <button @click="showEditForm = true" class="btn">Edit</button>
          <button @click="handleCancel" class="btn btn-danger">Cancel</button>
        </template>

        <template v-if="reservation.status === 'approved'">
          <button @click="handleCancel" class="btn btn-danger">Cancel</button>
        </template>

        <button @click="toggleLogs" class="btn btn-outline">View Change Logs</button>
      </div>
    </div>

    <!-- Edit Reservation Modal -->
    <div v-if="showEditForm" class="modal-overlay" @click="showEditForm = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Edit Reservation</h3>
          <button @click="showEditForm = false" class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          <ReservationForm
            :initial-data="reservation"
            @submit="handleUpdate"
            @cancel="showEditForm = false"
            :loading="updating"
          />
        </div>
      </div>
    </div>

    <div v-if="showLogs" class="logs-panel">
      <h4>Change Logs</h4>
      <div v-if="loadingLogs">Loading logs...</div>
      <div v-else-if="logs.length === 0">No logs found.</div>
      <ul v-else>
        <li v-for="log in logs" :key="log.id">
          <strong>{{ new Date(log.createdAt).toLocaleString() }}</strong>
          — {{ log.action }} by {{ log.changedBy?.name || log.changedBy?.email }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ReservationForm from './ReservationForm.vue'
import type { Reservation } from '@/types'

const props = defineProps<{
  reservation: Reservation
}>()

const emit = defineEmits<{
  update: [id: string, updates: any]
  cancel: [id: string]
}>()

const showEditForm = ref(false)
const updating = ref(false)
const showLogs = ref(false)
const logs = ref<any[]>([])
const loadingLogs = ref(false)

const getStatusClass = (status: string) => {
  return `status-${status}`
}

const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString()
}

const handleUpdate = async (updates: any) => {
  updating.value = true
  try {
    await emit('update', props.reservation.id, updates)
    showEditForm.value = false
  } finally {
    updating.value = false
  }
}

const handleCancel = async () => {
  if (confirm('Are you sure you want to cancel this reservation?')) {
    await emit('cancel', props.reservation.id)
    // 取消后确保关闭编辑弹窗（如果打开着）
    showEditForm.value = false
  }
}

const toggleLogs = async () => {
  showLogs.value = !showLogs.value
  if (showLogs.value && logs.value.length === 0) {
    loadingLogs.value = true
    try {
      const { reservationService } = await import('@/services/reservation')
      // Always fetch fresh logs from network after update
      logs.value = await reservationService.getReservationChangeLogs(props.reservation.id)
    } finally {
      loadingLogs.value = false
    }
  }
}
</script>

<style scoped>
.reservation-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.card-header h3 {
  margin: 0;
  color: #333;
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

.edit-form {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.edit-form h4 {
  margin-bottom: 1rem;
  color: #333;
}

.logs-panel {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
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
  max-width: 600px;
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
</style>