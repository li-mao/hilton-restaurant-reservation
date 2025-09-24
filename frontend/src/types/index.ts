export interface User {
  id: string
  name: string
  email: string
  role: string
  phone: string
  passwordChanged?: boolean
  createdAt?: string
}

export interface GuestContactInfo {
  phone: string
  email: string
}

export type ReservationStatus = 'requested' | 'approved' | 'cancelled' | 'completed'

export interface Reservation {
  id: string
  guestName: string
  guestContactInfo: GuestContactInfo
  expectedArrivalTime: string
  tableSize: number
  status: ReservationStatus
  specialRequests?: string
  createdBy: User
  createdAt: string
  updatedAt: string
}

export interface CreateReservationInput {
  guestName: string
  guestContactInfo: GuestContactInfo
  expectedArrivalTime: string
  tableSize: number
  specialRequests?: string
}

export interface UpdateReservationInput {
  guestName?: string
  guestContactInfo?: GuestContactInfo
  expectedArrivalTime?: string
  tableSize?: number
  specialRequests?: string
  status?: ReservationStatus
}

export interface ReservationFilter {
  status?: ReservationStatus
  startDate?: string
  endDate?: string
  guestName?: string
}