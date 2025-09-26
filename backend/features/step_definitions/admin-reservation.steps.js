const { Given, When, Then } = require('@cucumber/cucumber');
const axios = require('axios');
const { expect } = require('expect');

// 存储预订数据的全局变量（与reservation.steps.js共享）
global.reservationData = global.reservationData || {};

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
      // console.log('Admin token set from registration');
    } else if (response.data.errors) {
      // 注册失败，尝试登录
      throw new Error('Registration failed: ' + response.data.errors[0].message);
    }
  } catch (error) {
    // 管理员可能已存在，尝试登录
    try {
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
      if (loginResponse.data.data && loginResponse.data.data.login) {
        this.adminToken = loginResponse.data.data.login.token;
        this.adminUser = loginResponse.data.data.login.user;
        // console.log('Admin token set from login');
      }
    } catch (loginError) {
      console.log('Admin login error:', loginError.response?.data || loginError.message);
      throw loginError;
    }
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
    // console.log(`Creating reservation ${reservation.key}...`);
    // 创建客户用户
    const guestEmail = `guest${reservation.key.toLowerCase()}@example.com`;
    // console.log(`Guest email: ${guestEmail}`);
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
      if (registerResponse.data.data && registerResponse.data.data.register) {
        guestToken = registerResponse.data.data.register.token;
      } else if (registerResponse.data.errors) {
        // 注册失败，尝试登录
        throw new Error('Registration failed: ' + registerResponse.data.errors[0].message);
      }
    } catch (error) {
      // 用户可能已存在，尝试登录
      try {
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
        if (loginResponse.data.data && loginResponse.data.data.login) {
          guestToken = loginResponse.data.data.login.token;
        }
      } catch (loginError) {
        console.log(`Failed to authenticate guest user ${guestEmail}:`, loginError.message);
        throw loginError;
      }
    }
    
    // console.log(`Guest token for ${reservation.key}:`, guestToken ? 'obtained' : 'failed');

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
        input: {
          guestName: reservation.data.guestName,
          guestContactInfo: {
            phone: reservation.data.phone,
            email: reservation.data.email
          },
          expectedArrivalTime: reservation.data.expectedArrivalTime,
          tableSize: parseInt(reservation.data.tableSize),
          specialRequests: reservation.data.specialRequests
        }
      }
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${guestToken}`
    };

    // console.log(`Creating reservation ${reservation.key} with token:`, guestToken ? 'valid' : 'invalid');
    try {
      const response = await axios.post(`${this.baseUrl}/graphql`, createReservationMutation, { headers });
      // console.log(`Create reservation ${reservation.key} response:`, JSON.stringify(response.data, null, 2));
      if (response.data.data && response.data.data.createReservation) {
        global.reservationData[reservation.key] = response.data.data.createReservation;
        // console.log(`Successfully created reservation ${reservation.key}`);
      } else {
        console.log(`Failed to create reservation ${reservation.key}:`, response.data);
        throw new Error(`Failed to create reservation ${reservation.key}`);
      }
    } catch (error) {
      console.log(`Error creating reservation ${reservation.key}:`, error.response?.data || error.message);
      throw error;
    }
  }
});

// 验证预订存在且状态正确
Given(/^reservation (\w+) exists with status "([^"]*)"$/, function (reservationKey, expectedStatus) {
  expect(global.reservationData[reservationKey]).toBeDefined();
  expect(global.reservationData[reservationKey].status).toBe(expectedStatus);
});

// 管理员取消预订
When(/^I as admin cancel reservation (\w+)$/, async function (reservationKey) {
  const reservation = global.reservationData[reservationKey];
  
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
    // console.log(`Cancel reservation ${reservationKey} response:`, JSON.stringify(this.response.data, null, 2));
    if (this.response.data.data && this.response.data.data.cancelReservation) {
      global.reservationData[reservationKey] = { ...global.reservationData[reservationKey], ...this.response.data.data.cancelReservation };
    }
  } catch (error) {
    console.log(`Cancel reservation ${reservationKey} error:`, error.response?.data || error.message);
    this.response = { data: { errors: error.response?.data?.errors || [{ message: error.message }] } };
  }
});

// 管理员批准预订
When(/^I as admin approve reservation (\w+)$/, async function (reservationKey) {
  const reservation = global.reservationData[reservationKey];
  
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
    // console.log(`Approve reservation ${reservationKey} response:`, JSON.stringify(this.response.data, null, 2));
    if (this.response.data.data && this.response.data.data.approveReservation) {
      global.reservationData[reservationKey] = { ...global.reservationData[reservationKey], ...this.response.data.data.approveReservation };
    }
  } catch (error) {
    this.response = { data: { errors: error.response?.data?.errors || [{ message: error.message }] } };
  }
});

// 管理员完成预订
When(/^I as admin complete reservation (\w+)$/, async function (reservationKey) {
  const reservation = global.reservationData[reservationKey];
  
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
      global.reservationData[reservationKey] = { ...global.reservationData[reservationKey], ...this.response.data.data.completeReservation };
    }
  } catch (error) {
    this.response = { data: { errors: error.response?.data?.errors || [{ message: error.message }] } };
  }
});

// 验证步骤已移至 shared-reservation.steps.js