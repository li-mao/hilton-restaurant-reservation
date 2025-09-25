Feature: Health API
  As a system observer
  I want to check backend health
  So that I know the API is running

  Scenario: Backend health endpoint returns healthy
    When I request "GET" "/api/health"
    Then the response status should be 200
    And the response JSON should contain "status" healthy

  Scenario: Backend root health endpoint returns success
    When I request "GET" "/health"
    Then the response status should be 200
    And the response JSON should contain "success" true
