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
      <label for="arrivalDate">Expected Arrival Time *</label>
      <div class="datetime-row">
        <input
          id="arrivalDate"
          v-model="datePart"
          type="date"
          required
          :min="minDate"
          class="datetime-input"
        />
        <input
          id="arrivalTime"
          v-model="timePart"
          type="time"
          required
          :min="minTimeForSelectedDate"
          :max="maxTimeForSelectedDate"
          class="datetime-input"
        />
      </div>
      <small class="help-text">营业时间：10:00–22:00</small>
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

// 工具：转 YYYY-MM-DD
function toLocalDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 工具：向上取整到步长（分钟）
// 工具：向上取整到分钟（不再固定15分钟步长）
function ceilToMinute(date: Date): Date {
  const t = date.getTime()
  const ms = 60 * 1000
  const rounded = Math.ceil(t / ms) * ms
  return new Date(rounded)
}

const datePart = ref('')
const timePart = ref('')

const minDate = computed(() => {
  const now = new Date()
  return toLocalDateString(now)
})

const minTimeForSelectedDate = computed(() => {
  if (!datePart.value) return ''
  const now = new Date()
  const today = toLocalDateString(now)
  // 未来日期：从开门时间开始
  if (datePart.value !== today) return businessOpenTime
  // 今天：从“当前时间+30分钟(四舍五入至步长)”与开门时间取最大值
  const min = new Date(now)
  min.setMinutes(min.getMinutes() + 30)
  const rounded = ceilToMinute(min)
  const hhNow = String(rounded.getHours()).padStart(2, '0')
  const mmNow = String(rounded.getMinutes()).padStart(2, '0')
  const candidate = `${hhNow}:${mmNow}`
  return candidate < businessOpenTime ? businessOpenTime : candidate
})

// 营业时间限制（默认 10:00–22:00）
const BUSINESS_OPEN = 10
const BUSINESS_CLOSE = 22

const businessOpenTime = `${String(BUSINESS_OPEN).padStart(2, '0')}:00`
const businessCloseTime = `${String(BUSINESS_CLOSE).padStart(2, '0')}:00`

const maxTimeForSelectedDate = computed(() => {
  // 当天最大时间不超过打烊时间
  return businessCloseTime
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
      const y = dt.getFullYear()
      const m = String(dt.getMonth() + 1).padStart(2, '0')
      const d = String(dt.getDate()).padStart(2, '0')
      const hh = String(dt.getHours()).padStart(2, '0')
      const mm = String(dt.getMinutes()).padStart(2, '0')
      datePart.value = `${y}-${m}-${d}`
      timePart.value = `${hh}:${mm}`
      form.expectedArrivalTime = `${datePart.value}T${timePart.value}`
    }
  }
  if (typeof data.tableSize === 'number') form.tableSize = data.tableSize
  if (typeof data.specialRequests === 'string') form.specialRequests = data.specialRequests
}

watch(() => props.initialData, () => setFromInitialData(), { immediate: true })

// 同步组合日期与时间，保持后端字段兼容
watch([datePart, timePart], () => {
  if (datePart.value && timePart.value) {
    form.expectedArrivalTime = `${datePart.value}T${timePart.value}`
  }
})

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

  if (!datePart.value || !timePart.value) {
    error.value = 'Please select arrival date and time'
    return
  }

  if (form.tableSize < 1) {
    error.value = 'Please select number of guests'
    return
  }

  // 校验最小时间（当前日期需晚于30分钟）
  const now = new Date()
  const today = toLocalDateString(now)
  if (datePart.value === today) {
    const [hh, mm] = timePart.value.split(':')
    const selected = new Date(now)
    selected.setHours(parseInt(hh || '0', 10), parseInt(mm || '0', 10), 0, 0)
    const min = new Date(now)
    min.setMinutes(min.getMinutes() + 30)
    if (selected < min) {
      error.value = 'Arrival time must be at least 30 minutes from now'
      return
    }
  }

  // 营业时间校验（10:00–22:00 包含端点）
  const [selH, selM] = timePart.value.split(':').map((x) => parseInt(x || '0', 10))
  const totalMinutes = selH * 60 + selM
  const openMinutes = BUSINESS_OPEN * 60
  const closeMinutes = BUSINESS_CLOSE * 60
  if (totalMinutes < openMinutes || totalMinutes > closeMinutes) {
    error.value = 'Arrival time must be within business hours (10:00–22:00)'
    return
  }

  // 组合最终值
  form.expectedArrivalTime = `${datePart.value}T${timePart.value}`
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

.datetime-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.datetime-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.help-text {
  display: block;
  margin-top: 0.25rem;
  color: #666;
  font-size: 0.875rem;
}
</style>