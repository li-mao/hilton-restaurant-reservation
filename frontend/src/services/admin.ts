import api from './api'

export const adminService = {
  async listEmployees() {
    const { data } = await api.get('/admin/employees')
    return data.data.employees
  },

  async createEmployee(payload: { name: string; email: string; phone: string }) {
    const { data } = await api.post('/admin/employees', payload)
    return data.data.employee
  },

  async resetEmployeePassword(id: string) {
    const { data } = await api.post(`/admin/employees/${id}/reset-password`)
    return data
  },

  async setEmployeeDisabled(id: string, disabled: boolean) {
    const { data } = await api.patch(`/admin/employees/${id}/disabled`, { disabled })
    return data.data
  },

  async listGuests() {
    const { data } = await api.get('/admin/guests')
    return data.data.guests
  },

  async setGuestDisabled(id: string, disabled: boolean) {
    const { data } = await api.patch(`/admin/guests/${id}/disabled`, { disabled })
    return data.data
  }
}


