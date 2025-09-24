<template>
  <div class="container">
    <div class="card">
      <h2>My Reservations</h2>
      <button v-if="isGuest" @click="showCreateForm = true" class="btn">Make New Reservation</button>
      <p v-else class="hint">Only guests can create reservations. Employees/Admins can update or cancel.</p>
    </div>

    <!-- Create Reservation Modal -->
    <div v-if="showCreateForm && isGuest" class="modal-overlay" @click="showCreateForm = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Create New Reservation</h3>
          <button @click="showCreateForm = false" class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          <ReservationForm
            @submit="handleCreateReservation"
            @cancel="showCreateForm = false"
            :loading="creating"
          />
        </div>
      </div>
    </div>

    <div v-if="loading" class="card">Loading reservations...</div>

    <div v-else-if="reservations.length === 0" class="card">
      <p>No reservations found. Make your first reservation!</p>
    </div>

    <div v-else class="reservation-list">
      <ReservationCard
        v-for="reservation in reservations"
        :key="reservation.id + '-' + reservation.status + '-' + reservation.updatedAt"
        :reservation="reservation"
        @update="handleUpdateReservation"
        @cancel="handleCancelReservation"
      />
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import ReservationForm from '@/components/ReservationForm.vue'
import ReservationCard from '@/components/ReservationCard.vue'
import { reservationService } from '@/services/reservation'
import type { Reservation, CreateReservationInput } from '@/types'
import { useAuthStore } from '@/stores/auth'

const reservations = ref<Reservation[]>([])
const loading = ref(true)
const creating = ref(false)
const error = ref('')
const showCreateForm = ref(false)
const auth = useAuthStore()
const isGuest = computed(() => auth.user?.role === 'guest')

const loadReservations = async () => {
  try {
    loading.value = true
    error.value = ''
    const loadedReservations = await reservationService.getMyReservations()
    // 兜底：按创建时间倒序
    reservations.value = [...loadedReservations].sort((a, b) => (
      new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime()
    ))
  } catch (err: any) {
    const gqlMsg = err?.graphQLErrors?.[0]?.message
    const netMsg = err?.message
    error.value = gqlMsg || netMsg || 'Failed to load reservations'
    console.error('Load reservations error:', err)
  } finally {
    loading.value = false
  }
}

const handleCreateReservation = async (input: CreateReservationInput) => {
  try {
    creating.value = true
    error.value = ''
    // 立即关闭弹窗，提升交互体验
    showCreateForm.value = false
    console.log('[ReservationsView] create submit -> closing modal immediately')
    await nextTick()
    const newReservation = await reservationService.createReservation(input)
    reservations.value = [newReservation, ...reservations.value]
    // 主动刷新我的预订列表，避免整页刷新导致的状态丢失
    await loadReservations()
  } catch (err: any) {
    error.value = err?.message || 'Failed to create reservation'
    // 如果失败，可重新打开以便用户重试/查看错误
    console.warn('[ReservationsView] create failed -> reopen modal')
    showCreateForm.value = true
  } finally {
    creating.value = false
  }
}

const handleUpdateReservation = async (id: string, updates: any) => {
  try {
    error.value = ''
    // 乐观更新：先本地合并
    const nowIso = new Date().toISOString()
    reservations.value = reservations.value.map(r => (
      r.id === id ? { ...r, ...updates, updatedAt: nowIso } : r
    ))
    reservations.value = [...reservations.value]

    // 发请求
    const updated = await reservationService.updateReservation(id, updates)

    // 用服务器返回值矫正一次
    reservations.value = reservations.value.map(r => (
      r.id === id ? { ...r, ...updated } : r
    ))
    reservations.value = [...reservations.value]

    // 刷新列表，确保一致
    await loadReservations()
  } catch (err: any) {
    const gqlMsg = err?.graphQLErrors?.[0]?.message
    const netMsg = err?.message
    error.value = gqlMsg || netMsg || 'Failed to update reservation'
    // 回滚：重新加载
    await loadReservations()
  }
}

const handleCancelReservation = async (id: string) => {
  try {
    error.value = ''
    console.log('[ReservationsView] cancel click -> id:', id)
    // 乐观更新：先本地更新为已取消，立即反馈
    const nowIso = new Date().toISOString()
    reservations.value = reservations.value.map(r => (
      r.id === id ? { ...r, status: 'cancelled', updatedAt: nowIso } : r
    ))
    reservations.value = [...reservations.value]
    console.log('[ReservationsView] optimistic local update done')

    // 调用后端取消
    const cancelled = await reservationService.cancelReservation(id)
    console.log('[ReservationsView] server cancel done -> updatedAt:', cancelled?.updatedAt)

    // 用服务器返回的时间矫正一次
    if (cancelled?.updatedAt) {
      reservations.value = reservations.value.map(r => (
        r.id === id ? { ...r, updatedAt: cancelled.updatedAt } : r
      ))
      reservations.value = [...reservations.value]
    }

    // 刷新列表并等待完成
    await loadReservations()
  } catch (err: any) {
    const gqlMsg = err?.graphQLErrors?.[0]?.message
    const netMsg = err?.message
    const msg = (gqlMsg || netMsg || '').toString()
    console.error('[ReservationsView] cancel failed:', msg)
    // 如果是后端返回的 "document not found"，视为幂等成功（文档已不存在）
    if (/document not found|key not found/i.test(msg)) {
      console.warn('[ReservationsView] treating "document not found" as idempotent success')
      // 刷新一次，确保状态一致
      await loadReservations()
      return
    }
    error.value = msg || 'Failed to cancel reservation'
    // 其他错误：回滚到服务器状态
    await loadReservations()
  }
}

onMounted(() => {
  loadReservations()
})
</script>

<style scoped>
.reservation-list {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.btn {
  margin-bottom: 1rem;
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