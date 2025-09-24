<template>
  <form @submit.prevent="handleSubmit" class="reservation-form">
    <div class="form-group">
      <label for="guestName">Guest Name *</label>
      <input
        id="guestName"
        v-model="form.guestName"
        type="text"
        required
        placeholder="Enter guest name"
      />
    </div>

    <div class="form-group">
      <label for="email">Email Address *</label>
      <input
        id="email"
        v-model="form.guestContactInfo.email"
        type="email"
        required
        placeholder="Enter email address"
      />
    </div>

    <div class="form-group">
      <label for="phone">Phone Number *</label>
      <input
        id="phone"
        v-model="form.guestContactInfo.phone"
        type="tel"
        required
        placeholder="Enter phone number"
      />
    </div>

    <div class="form-group">
      <label for="arrivalTime">Expected Arrival Time *</label>
      <input
        id="arrivalTime"
        v-model="form.expectedArrivalTime"
        type="datetime-local"
        required
        :min="minDateTime"
      />
    </div>

    <div class="form-group">
      <label for="tableSize">Number of Guests *</label>
      <select
        id="tableSize"
        v-model.number="form.tableSize"
        required
      >
        <option value="">Select number of guests</option>
        <option v-for="n in 20" :key="n" :value="n">{{ n }} {{ n === 1 ? 'Guest' : 'Guests' }}</option>
      </select>
    </div>

    <div class="form-group">
      <label for="specialRequests">Special Requests</label>
      <textarea
        id="specialRequests"
        v-model="form.specialRequests"
        placeholder="Any special requests (optional)"
        rows="3"
      />
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>

    <div class="form-actions">
      <button type="button" @click="$emit('cancel')" class="btn btn-outline">Cancel</button>
      <button type="submit" class="btn btn-success" :disabled="loading">
        {{ loading ? 'Submitting...' : submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { CreateReservationInput, Reservation } from '@/types'

const props = defineProps<{
  loading?: boolean
  initialData?: Partial<Reservation> | Partial<CreateReservationInput>
}>()

const emit = defineEmits<{
  submit: [input: CreateReservationInput]
  cancel: []
}>()

const form = reactive<CreateReservationInput>({
  guestName: '',
  guestContactInfo: {
    phone: '',
    email: ''
  },
  expectedArrivalTime: '',
  tableSize: 2,
  specialRequests: ''
})

const error = ref('')

const minDateTime = computed(() => {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 30) // Minimum 30 minutes from now
  return now.toISOString().slice(0, 16)
})

const submitLabel = computed(() => (props.initialData ? 'Update Reservation' : 'Create Reservation'))

const setFromInitialData = () => {
  const data = props.initialData as any
  if (!data) return
  if (data.guestName) form.guestName = data.guestName
  if (data.guestContactInfo) {
    if (data.guestContactInfo.email) form.guestContactInfo.email = data.guestContactInfo.email
    if (data.guestContactInfo.phone) form.guestContactInfo.phone = data.guestContactInfo.phone
  }
  if (data.expectedArrivalTime) {
    const dt = new Date(data.expectedArrivalTime)
    if (!isNaN(dt.getTime())) {
      form.expectedArrivalTime = dt.toISOString().slice(0, 16)
    }
  }
  if (typeof data.tableSize === 'number') form.tableSize = data.tableSize
  if (typeof data.specialRequests === 'string') form.specialRequests = data.specialRequests
}

watch(() => props.initialData, () => setFromInitialData(), { immediate: true })

const handleSubmit = () => {
  error.value = ''

  if (!form.guestName.trim()) {
    error.value = 'Please enter guest name'
    return
  }

  if (!form.guestContactInfo.email || !form.guestContactInfo.phone) {
    error.value = 'Please enter contact information'
    return
  }

  if (!form.expectedArrivalTime) {
    error.value = 'Please select arrival time'
    return
  }

  if (form.tableSize < 1) {
    error.value = 'Please select number of guests'
    return
  }

  emit('submit', { ...form })
}
</script>

<style scoped>
.reservation-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
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