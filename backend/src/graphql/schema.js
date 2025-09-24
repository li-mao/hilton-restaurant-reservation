const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar Date

  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    phone: String!
    createdAt: Date!
  }

  type GuestContactInfo {
    phone: String!
    email: String!
  }

  enum ReservationStatus {
    requested
    approved
    cancelled
    completed
  }

  type Reservation {
    id: ID!
    guestName: String!
    guestContactInfo: GuestContactInfo!
    expectedArrivalTime: Date!
    tableSize: Int!
    status: ReservationStatus!
    specialRequests: String
    createdBy: User!
    createdAt: Date!
    updatedAt: Date!
  }

  type ReservationChangeLog {
    id: ID!
    reservationId: ID!
    action: String!
    changedBy: User!
    snapshot: JSON
    createdAt: Date!
  }

  scalar JSON

  type AuthPayload {
    token: String!
    user: User!
  }

  input GuestContactInfoInput {
    phone: String!
    email: String!
  }

  input CreateReservationInput {
    guestName: String!
    guestContactInfo: GuestContactInfoInput!
    expectedArrivalTime: Date!
    tableSize: Int!
    specialRequests: String
  }

  input UpdateReservationInput {
    guestName: String
    guestContactInfo: GuestContactInfoInput
    expectedArrivalTime: Date
    tableSize: Int
    specialRequests: String
    status: ReservationStatus
  }

  input ReservationFilter {
    status: ReservationStatus
    startDate: Date
    endDate: Date
    guestName: String
  }

  type Query {
    # Auth queries
    me: User

    # Reservation queries
    reservations(filter: ReservationFilter): [Reservation!]!
    reservation(id: ID!): Reservation
    myReservations: [Reservation!]!
    reservationChangeLogs(reservationId: ID!): [ReservationChangeLog!]!
  }

  type Mutation {
    # Auth mutations
    register(name: String!, email: String!, password: String!, phone: String!, role: String): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    # Reservation mutations
    createReservation(input: CreateReservationInput!): Reservation!
    updateReservation(id: ID!, input: UpdateReservationInput!): Reservation!
    cancelReservation(id: ID!): Reservation!
    approveReservation(id: ID!): Reservation!
    completeReservation(id: ID!): Reservation!
  }
`;

module.exports = typeDefs;