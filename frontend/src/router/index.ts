import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import ReservationsView from '@/views/ReservationsView.vue'
import EmployeeDashboard from '@/views/EmployeeDashboard.vue'
import ChangePasswordView from '@/views/ChangePasswordView.vue'
import AdminDashboard from '@/views/AdminDashboard.vue'
import EmployeeManagement from '@/views/EmployeeManagement.vue'
import GuestManagement from '@/views/GuestManagement.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminDashboard,
      meta: { requiresAuth: true, requiresEmployee: true }
    },
    {
      path: '/change-password',
      name: 'change-password',
      component: ChangePasswordView,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/reservations',
      name: 'reservations',
      component: ReservationsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/reservation-dashboard',
      name: 'reservation-dashboard',
      component: EmployeeDashboard,
      meta: { requiresAuth: true, requiresEmployee: true }
    },
    {
      path: '/admin/employees',
      name: 'employee-management',
      component: EmployeeManagement,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/guests',
      name: 'guest-management',
      component: GuestManagement,
      meta: { requiresAuth: true, requiresAdmin: true }
    }
  ]
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  // Ensure user profile is loaded before checks
  try {
    if (auth.token && !auth.user) {
      await auth.fetchProfile()
    }
  } catch (e) {
    // token invalid or fetch failed -> will be handled by interceptor
  }

  const requiresAuth = to.meta?.requiresAuth
  const requiresEmployee = to.meta?.requiresEmployee
  const requiresAdmin = to.meta?.requiresAdmin

  if (requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (requiresEmployee && !(auth.user?.role === 'employee' || auth.user?.role === 'admin')) {
    return { name: 'home' }
  }

  if (requiresAdmin && auth.user?.role !== 'admin') {
    return { name: 'home' }
  }

  if (to.name !== 'change-password' && auth.user && auth.user.passwordChanged === false) {
    return { name: 'change-password' }
  }
})

export default router