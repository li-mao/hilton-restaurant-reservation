Feature: Admin Reservation Management
  As an admin user
  I want to manage restaurant reservations
  So that I can approve, cancel and complete customer reservations

  Background:
    Given I am an admin user with email "admin@hilton.com" and password "admin123"
    And there are existing reservations A, B, and C created by guests

  Scenario: Admin cancels reservation B
    Given reservation B exists with status "requested"
    When I as admin cancel reservation B
    Then reservation B should be cancelled successfully
    And reservation B status should be "cancelled"

  Scenario: Admin approves reservation C
    Given reservation C exists with status "requested"
    When I as admin approve reservation C
    Then reservation C should be approved successfully
    And reservation C status should be "approved"

  Scenario: Admin completes reservation C
    Given reservation C exists with status "requested"
    When I as admin approve reservation C
    And I as admin complete reservation C
    Then reservation C should be completed successfully
    And reservation C status should be "completed"

  Scenario: Complete admin workflow for reservation management
    Given reservation B exists with status "requested"
    And reservation C exists with status "requested"
    When I as admin cancel reservation B
    And I as admin approve reservation C
    And I as admin complete reservation C
    Then reservation B status should be "cancelled"
    And reservation C status should be "completed"
