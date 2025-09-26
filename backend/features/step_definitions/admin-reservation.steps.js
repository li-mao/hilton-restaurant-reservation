const { Given, When, Then } = require('@cucumber/cucumber');
const axios = require('axios');
const { expect } = require('expect');

// 存储预订数据的全局变量（与reservation.steps.js共享）
let reservationData = {};

// Background: 创建管理员用户
Given('I am an admin user with email {string} and password {string}', async function (email, password) {
  // 先注册管理员用户
  const registerUrl = `${this.baseUrl}/graphql`;
  const registerMutation = {
    query: `
      mutation Register($name: String!, $email: String!, $password: String!, $phone: String!, $role: String) {
        register(name: $name, email: $email, password: $password, phone: $phone, role: $role) {
          token
          user {
            id
            name
            email
            role
          }
        }
      }
    `,
    variables: {
      name: 'Admin User',
      email: email,
      password: password,
      phone: '+1234567899',
      role: 'admin'
    }
  };

  try {
    const response = await axios.post(registerUrl, registerMutation);
    if (response.data.data && response.data.data.register) {
      this.adminToken = response.data.data.register.token;
      this.adminUser = response.data.data.register.user;
    }
  } catch (error) {
    // 管理员可能已存在，尝试登录
    const loginUrl = `${this.baseUrl}/graphql`;
    const loginMutation = {
      query: `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            token
            user {
              id
              name
              email
              role
            }
          }
        }
      `,
      variables: {
        email: email,
        password: password
      }
    };

    const loginResponse = await axios.post(loginUrl, loginMutation);
    this.adminToken = loginResponse.data.data.login.token;
    this.adminUser = loginResponse.data.data.login.user;
  }
});

// 假设存在预订A、B、C
Given('there are existing reservations A, B, and C created by guests', async function () {
  // 创建三个测试预订
  const reservations = [
    {
      key: 'A',
      data: {
        guestName: 'John Doe A',
        phone: '+1234567890',
        email: 'johndoea@example.com',
        expectedArrivalTime: '2024-12-25T19:00:00Z',
        tableSize: 2,
        specialRequests: 'Window seat please'
      }
    },
    {
      key: 'B',
      data: {
        guestName: 'John Doe B',
        phone: '+1234567891',
        email: 'johndoeb@example.com',
        expectedArrivalTime: '2024-12-26T20:00:00Z',
        tableSize: 4,
        specialRequests: 'Quiet table'
      }
    },
    {
      key: 'C',
      data: {
        guestName: 'John Doe C',
        phone: '+1234567892',
        email: 'johndoec@example.com',
        expectedArrivalTime: '2024-12-27T18:30:00Z',
        tableSize: 6,
        specialRequests: 'Birthday celebration'
      }
    }
  ];

  // 为每个预订创建客户用户并创建预订
  for (const reservation of reservations) {
    // 创建客户用户
    const guestEmail = `guest${reservation.key.toLowerCase()}@example.com`;
    const registerMutation = {
      query: `
        mutation Register($name: String!, $email: String!, $password: String!, $phone: String!, $role: String) {
          register(name: $name, email: $email, password: $password, phone: $phone, role: $role) {
            token
            user {
              id
              name
              email
              role
            }
          }
        }
      `,
      variables: {
        name: `Guest User ${reservation.key}`,
        email: guestEmail,
        password: 'password123',
        phone: reservation.data.phone,
        role: 'guest'
      }
    };

    let guestToken;
    try {
      const registerResponse = await axios.post(`${this.baseUrl}/graphql`, registerMutation);
      guestToken = registerResponse.data.data.register.token;
    } catch (error) {
      // 用户可能已存在，尝试登录
      const loginMutation = {
        query: `
          mutation Login($email: String!, $password: String!) {
            login(email: $email, password: $password) {
              token
            }
          }
        `,
        variables: {
          email: guestEmail,
          password: 'password123'
        }
      };
      const loginResponse = await axios.post(`${this.baseUrl}/graphql`, loginMutation);
      guestToken = loginResponse.data.data.login.token;
    }

    // 创建预订
    const createReservationMutation = {
      query: `
        mutation CreateReservation($input: CreateReservationInput!) {
          createReservation(input: $input) {
            id
            guestName
            status
            tableSize
          }
        }
      `,
      variables: {
        input: reservation.data
      }
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${guestToken}`
    };

    const response = await axios.post(`${this.baseUrl}/graphql`, createReservationMutation, { headers });
    reservationData[reservation.key] = response.data.data.createReservation;
  }
});

// 验证预订存在且状态正确
Given(/^reservation (\w+) exists with status "([^"]*)"$/, function (reservationKey, expectedStatus) {
  expect(reservationData[reservationKey]).toBeDefined();
  expect(reservationData[reservationKey].status).toBe(expectedStatus);
});

// 管理员取消预订
When(/^I as admin cancel reservation (\w+)$/, async function (reservationKey) {
  const reservation = reservationData[reservationKey];
  
  const cancelReservationMutation = {
    query: `
      mutation CancelReservation($id: ID!) {
        cancelReservation(id: $id) {
          id
          status
          updatedAt
        }
      }
    `,
    variables: {
      id: reservation.id
    }
  };

  const url = `${this.baseUrl}/graphql`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.adminToken}`
  };

  try {
    this.response = await axios.post(url, cancelReservationMutation, { headers });
    if (this.response.data.data && this.response.data.data.cancelReservation) {
      reservationData[reservationKey] = { ...reservationData[reservationKey], ...this.response.data.data.cancelReservation };
    }
  } catch (error) {
    this.response = { data: { errors: error.response?.data?.errors || [{ message: error.message }] } };
  }
});

// 管理员批准预订
When(/^I as admin approve reservation (\w+)$/, async function (reservationKey) {
  const reservation = reservationData[reservationKey];
  
  const approveReservationMutation = {
    query: `
      mutation ApproveReservation($id: ID!) {
        approveReservation(id: $id) {
          id
          status
          updatedAt
        }
      }
    `,
    variables: {
      id: reservation.id
    }
  };

  const url = `${this.baseUrl}/graphql`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.adminToken}`
  };

  try {
    this.response = await axios.post(url, approveReservationMutation, { headers });
    if (this.response.data.data && this.response.data.data.approveReservation) {
      reservationData[reservationKey] = { ...reservationData[reservationKey], ...this.response.data.data.approveReservation };
    }
  } catch (error) {
    this.response = { data: { errors: error.response?.data?.errors || [{ message: error.message }] } };
  }
});

// 管理员完成预订
When(/^I as admin complete reservation (\w+)$/, async function (reservationKey) {
  const reservation = reservationData[reservationKey];
  
  const completeReservationMutation = {
    query: `
      mutation CompleteReservation($id: ID!) {
        completeReservation(id: $id) {
          id
          status
          updatedAt
        }
      }
    `,
    variables: {
      id: reservation.id
    }
  };

  const url = `${this.baseUrl}/graphql`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.adminToken}`
  };

  try {
    this.response = await axios.post(url, completeReservationMutation, { headers });
    if (this.response.data.data && this.response.data.data.completeReservation) {
      reservationData[reservationKey] = { ...reservationData[reservationKey], ...this.response.data.data.completeReservation };
    }
  } catch (error) {
    this.response = { data: { errors: error.response?.data?.errors || [{ message: error.message }] } };
  }
});

// 验证步骤已移至 shared-reservation.steps.js