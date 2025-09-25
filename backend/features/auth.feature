Feature: Authentication API
  As a user
  I want to authenticate with the system
  So that I can access protected resources

  Scenario: User can register with valid credentials
    When I request "POST" "/api/auth/register" with body:
      """
      {
        "email": "newuser-${Date.now()}@example.com",
        "password": "password123",
        "name": "Test User",
        "phone": "+1234567890"
      }
      """
    Then the response status should be 201
    And the response JSON should contain "success" true

  Scenario: User can login with valid credentials
    Given a user exists with email "loginuser@example.com" and password "password123"
    When I request "POST" "/api/auth/login" with body:
      """
      {
        "email": "loginuser@example.com",
        "password": "password123"
      }
      """
    Then the response status should be 200
    And the response JSON should contain "token"

  Scenario: User cannot login with invalid credentials
    When I request "POST" "/api/auth/login" with body:
      """
      {
        "email": "wrong@example.com",
        "password": "wrongpassword"
      }
      """
    Then the response status should be 401
