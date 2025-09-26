const { Given, When, Then } = require('@cucumber/cucumber');
const axios = require('axios');
const { expect } = require('expect');

// 存储预订数据的全局变量
global.reservationData = global.reservationData || {};

// Background: 创建客户用户
Given('I am a guest user with email {string} and password {string}', async function (email, password) {
  // 先注册用户
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
      name: 'Guest User',
      email: email,
      password: password,
      phone: '+1234567890',
      role: 'guest'
    }
  };

  try {
    const response = await axios.post(registerUrl, registerMutation);
    // console.log('Register response:', JSON.stringify(response.data, null, 2));
    if (response.data.data && response.data.data.register) {
      this.guestToken = response.data.data.register.token;
      this.guestUser = response.data.data.register.user;
      console.log('Guest token set:', this.guestToken);
    } else if (response.data.errors) {
      // 注册失败，尝试登录
      throw new Error('Registration failed: ' + response.data.errors[0].message);
    }
  } catch (error) {
    // console.log('Register error:', error.response?.data || error.message);
    // console.log('Attempting login for existing user...');
    // 用户可能已存在，尝试登录
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
      // console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
      if (loginResponse.data.data && loginResponse.data.data.login) {
        this.guestToken = loginResponse.data.data.login.token;
        this.guestUser = loginResponse.data.data.login.user;
        // console.log('Guest token from login:', this.guestToken);
      }
    } catch (loginError) {
      console.log('Login error:', loginError.response?.data || loginError.message);
      throw loginError;
    }
  }
});

// 创建预订的步骤 - 使用更通用的模式
When(/^I create reservation (\w+) with:$/, async function (reservationKey, dataTable) {
  // 使用raw()方法获取原始数据，然后手动解析
  const rows = dataTable.raw();
  // console.log('Raw data table:', rows);
  
  // 手动解析数据表格
  const data = {};
  for (let i = 0; i < rows.length; i++) { // 包含所有行
    const row = rows[i];
    if (row.length >= 2) {
      data[row[0].trim()] = row[1].trim();
    }
  }
  // console.log('Parsed data:', data);
  
  const createReservationMutation = {
    query: `
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
    `,
    variables: {
      input: {
        guestName: data.guestName,
        guestContactInfo: {
          phone: data.phone,
          email: data.email
        },
        expectedArrivalTime: data.expectedArrivalTime,
        tableSize: parseInt(data.tableSize),
        specialRequests: data.specialRequests
      }
    }
  };

  const url = `${this.baseUrl}/graphql`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.guestToken}`
  };
  
  // console.log('Using token:', this.guestToken);

  try {
    this.response = await axios.post(url, createReservationMutation, { headers });
    // console.log('Create reservation response:', JSON.stringify(this.response.data, null, 2));
    if (this.response.data.data && this.response.data.data.createReservation) {
      global.reservationData[reservationKey] = this.response.data.data.createReservation;
    }
  } catch (error) {
    console.log('Create reservation error:', error.response?.data || error.message);
    this.response = { data: { errors: error.response?.data?.errors || [{ message: error.message }] } };
  }
});

// 验证步骤已移至 shared-reservation.steps.js

// 假设已创建预订
Given(/^I have created reservation (\w+) with (\d+) people$/, function (reservationKey, tableSize) {
  // 这个步骤主要用于测试流程，实际数据应该在之前的步骤中创建
  expect(global.reservationData[reservationKey]).toBeDefined();
});

// 更新预订桌数
When(/^I update reservation (\w+) table size to (\d+)$/, async function (reservationKey, newTableSize) {
  const reservation = global.reservationData[reservationKey];
  
  const updateReservationMutation = {
    query: `
      mutation UpdateReservation($id: ID!, $input: UpdateReservationInput!) {
        updateReservation(id: $id, input: $input) {
          id
          tableSize
          status
          updatedAt
        }
      }
    `,
    variables: {
      id: reservation.id,
      input: {
        tableSize: parseInt(newTableSize)
      }
    }
  };

  const url = `${this.baseUrl}/graphql`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.guestToken}`
  };

  try {
    this.response = await axios.post(url, updateReservationMutation, { headers });
    if (this.response.data.data && this.response.data.data.updateReservation) {
      global.reservationData[reservationKey] = { ...global.reservationData[reservationKey], ...this.response.data.data.updateReservation };
    }
  } catch (error) {
    this.response = { data: { errors: error.response?.data?.errors || [{ message: error.message }] } };
  }
});

// 验证步骤已移至 shared-reservation.steps.js

// 取消预订
When(/^I cancel reservation (\w+)$/, async function (reservationKey) {
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
    'Authorization': `Bearer ${this.guestToken}`
  };

  try {
    this.response = await axios.post(url, cancelReservationMutation, { headers });
    if (this.response.data.data && this.response.data.data.cancelReservation) {
      global.reservationData[reservationKey] = { ...global.reservationData[reservationKey], ...this.response.data.data.cancelReservation };
    }
  } catch (error) {
    this.response = { data: { errors: error.response?.data?.errors || [{ message: error.message }] } };
  }
});

// 验证步骤已移至 shared-reservation.steps.js