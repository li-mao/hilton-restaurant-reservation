Feature: Reservation Management
  As a guest user
  I want to manage my restaurant reservations
  So that I can book, modify and cancel my dining reservations

  Background:
    Given I am a guest user with email "guest@example.com" and password "password123"

  Scenario: Create three reservations (A, B, C)
    When I create reservation A with:
      | guestName        | John Doe A          |
      | phone            | +1234567890         |
      | email            | johndoea@example.com |
      | expectedArrivalTime | 2024-12-25T19:00:00Z |
      | tableSize        | 2                   |
      | specialRequests  | Window seat please  |
    Then reservation A should be created successfully
    And reservation A status should be "requested"

    When I create reservation B with:
      | guestName        | John Doe B          |
      | phone            | +1234567891         |
      | email            | johndoeb@example.com |
      | expectedArrivalTime | 2024-12-26T20:00:00Z |
      | tableSize        | 4                   |
      | specialRequests  | Quiet table         |
    Then reservation B should be created successfully
    And reservation B status should be "requested"

    When I create reservation C with:
      | guestName        | John Doe C          |
      | phone            | +1234567892         |
      | email            | johndoec@example.com |
      | expectedArrivalTime | 2024-12-27T18:30:00Z |
      | tableSize        | 6                   |
      | specialRequests  | Birthday celebration |
    Then reservation C should be created successfully
    And reservation C status should be "requested"

  Scenario: Modify reservation A table size
    Given I have created reservation A with 2 people
    When I update reservation A table size to 4
    Then reservation A should be updated successfully
    And reservation A table size should be 4
    And reservation A status should be "requested"

  Scenario: Cancel reservation A
    Given I have created reservation A with 2 people
    When I cancel reservation A
    Then reservation A should be cancelled successfully
    And reservation A status should be "cancelled"
