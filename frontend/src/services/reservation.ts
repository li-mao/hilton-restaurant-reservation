import { gql } from '@apollo/client/core'
import { apolloClient } from './apollo'
import type {
  Reservation,
  CreateReservationInput,
  UpdateReservationInput,
  ReservationFilter
} from '@/types'

const GET_RESERVATIONS = gql`
  query GetReservations($filter: ReservationFilter) {
    reservations(filter: $filter) {
      id
      guestName
      guestContactInfo {
        phone
        email
      }
      expectedArrivalTime
      tableSize
      status
      specialRequests
      createdBy {
        id
        name
        email
      }
      createdAt
      updatedAt
    }
  }
`

const GET_MY_RESERVATIONS = gql`
  query GetMyReservations {
    myReservations {
      id
      guestName
      guestContactInfo {
        phone
        email
      }
      expectedArrivalTime
      tableSize
      status
      specialRequests
      createdAt
      updatedAt
    }
  }
`

const CREATE_RESERVATION = gql`
  mutation CreateReservation($input: CreateReservationInput!) {
    createReservation(input: $input) {
      id
      guestName
      guestContactInfo {
        phone
        email
      }
      expectedArrivalTime
      tableSize
      status
      specialRequests
      createdAt
    }
  }
`

const UPDATE_RESERVATION = gql`
  mutation UpdateReservation($id: ID!, $input: UpdateReservationInput!) {
    updateReservation(id: $id, input: $input) {
      id
      guestName
      guestContactInfo {
        phone
        email
      }
      expectedArrivalTime
      tableSize
      status
      specialRequests
      updatedAt
    }
  }
`

const CANCEL_RESERVATION = gql`
  mutation CancelReservation($id: ID!) {
    cancelReservation(id: $id) {
      id
      status
      updatedAt
    }
  }
`

const APPROVE_RESERVATION = gql`
  mutation ApproveReservation($id: ID!) {
    approveReservation(id: $id) {
      id
      status
      updatedAt
    }
  }
`

const COMPLETE_RESERVATION = gql`
  mutation CompleteReservation($id: ID!) {
    completeReservation(id: $id) {
      id
      status
      updatedAt
    }
  }
`

const GET_RESERVATION_CHANGE_LOGS = gql`
  query ReservationChangeLogs($reservationId: ID!) {
    reservationChangeLogs(reservationId: $reservationId) {
      id
      action
      changedBy { id name email }
      snapshot
      createdAt
    }
  }
`

export const reservationService = {
  async getReservations(filter?: ReservationFilter): Promise<Reservation[]> {
    const { data } = await apolloClient.query({
      query: GET_RESERVATIONS,
      variables: { filter },
      fetchPolicy: 'network-only'
    })
    return data.reservations
  },

  async getMyReservations(): Promise<Reservation[]> {
    const { data } = await apolloClient.query({
      query: GET_MY_RESERVATIONS,
      fetchPolicy: 'network-only'
    })
    return data.myReservations
  },

  async createReservation(input: CreateReservationInput): Promise<Reservation> {
    const { data } = await apolloClient.mutate({
      mutation: CREATE_RESERVATION,
      variables: { input }
      // 不在这里做 refetch/reset，交由视图层刷新
    })
    return data.createReservation
  },

  async updateReservation(id: string, input: UpdateReservationInput): Promise<Reservation> {
    const { data } = await apolloClient.mutate({
      mutation: UPDATE_RESERVATION,
      variables: { id, input }
      // 由视图层刷新
    })
    return data.updateReservation
  },

  async cancelReservation(id: string): Promise<Reservation> {
    const { data } = await apolloClient.mutate({
      mutation: CANCEL_RESERVATION,
      variables: { id }
      // 不在这里做 refetch，交由视图层的 load 函数刷新，避免后端某些降级路径报错影响取消结果
    })
    return data.cancelReservation
  },

  async approveReservation(id: string): Promise<Reservation> {
    const { data } = await apolloClient.mutate({
      mutation: APPROVE_RESERVATION,
      variables: { id }
    })
    return data.approveReservation
  },

  async completeReservation(id: string): Promise<Reservation> {
    const { data } = await apolloClient.mutate({
      mutation: COMPLETE_RESERVATION,
      variables: { id }
    })
    return data.completeReservation
  },

  async getReservationChangeLogs(reservationId: string): Promise<any[]> {
    const { data } = await apolloClient.query({
      query: GET_RESERVATION_CHANGE_LOGS,
      variables: { reservationId },
      fetchPolicy: 'network-only'
    })
    return data.reservationChangeLogs
  }
}