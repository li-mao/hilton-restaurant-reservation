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
          <strong>Email:</strong>
          {{ reservation.guestContactInfo.email }}
        </div>
        <div class="detail-item">
          <strong>Phone:</strong>
          {{ reservation.guestContactInfo.phone }}
        </div>
        <div class="detail-item">
          <strong>Created By:</strong>
          {{ reservation.createdBy.name }}
        </div>
        <div v-if="reservation.specialRequests" class="detail-item">
          <strong>Special Requests:</strong>
          {{ reservation.specialRequests }}
        </div>
      </div>

      <div class="card-actions">
        <template v-if="reservation.status === 'requested'">
          <button @click="handleApprove" class="btn btn-success">Approve</button>
          <button @click="handleCancel" class="btn btn-danger">Cancel</button>
        </template>

        <template v-if="reservation.status === 'approved'">
          <button @click="handleComplete" class="btn">Complete</button>
          <button @click="handleCancel" class="btn btn-danger">Cancel</button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Reservation } from '@/types'

const props = defineProps<{
  reservation: Reservation
}>()

const emit = defineEmits<{
  approve: [id: string]
  complete: [id: string]
  cancel: [id: string]
}>()

const processing = ref(false)

const getStatusClass = (status: string) => {
  return `status-${status}`
}

const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString()
}

const handleApprove = async () => {
  if (confirm('Are you sure you want to approve this reservation?')) {
    processing.value = true
    try {
      await emit('approve', props.reservation.id)
    } finally {
      processing.value = false
    }
  }
}

const handleComplete = async () => {
  if (confirm('Are you sure you want to mark this reservation as completed?')) {
    processing.value = true
    try {
      await emit('complete', props.reservation.id)
    } finally {
      processing.value = false
    }
  }
}

const handleCancel = async () => {
  if (confirm('Are you sure you want to cancel this reservation?')) {
    processing.value = true
    try {
      await emit('cancel', props.reservation.id)
    } finally {
      processing.value = false
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
</style>