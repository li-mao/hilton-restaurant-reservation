const { Given } = require('@cucumber/cucumber');
const axios = require('axios');

Given('a user exists with email {string} and password {string}', async function (email, password) {
  // Register user first
  const url = `${this.baseUrl}/api/auth/register`;
  const userData = {
    email,
    password,
    name: 'Test User',
    phone: '+1234567890'
  };
  
  try {
    await axios.post(url, userData);
  } catch (error) {
    // User might already exist, that's okay
    console.log('User might already exist:', error.message);
  }
});