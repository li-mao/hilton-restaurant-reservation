const { When, Then, setWorldConstructor } = require('@cucumber/cucumber');
const axios = require('axios');
const { expect } = require('expect');

class CustomWorld {
  constructor({ parameters }) {
    this.baseUrl = parameters.baseUrl;
    this.response = null;
    this.authToken = null;
  }
}
setWorldConstructor(CustomWorld);

When('I request {string} {string}', async function (method, path) {
  const url = `${this.baseUrl}${path}`;
  this.response = await axios.request({ method, url, validateStatus: () => true });
});

When('I request {string} {string} with body:', async function (method, path, body) {
  const url = `${this.baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (this.authToken) {
    headers['Authorization'] = `Bearer ${this.authToken}`;
  }
  
  // Replace dynamic values in body
  const processedBody = body.replace(/\$\{Date\.now\(\)\}/g, Date.now());
  
  this.response = await axios.request({ 
    method, 
    url, 
    data: JSON.parse(processedBody),
    headers,
    validateStatus: () => true 
  });
});

Then('the response status should be {int}', function (code) {
  expect(this.response.status).toBe(code);
});

Then('the response JSON should contain {string}', function (key) {
  expect(this.response.data).toHaveProperty(key);
});

// 只保留一个模式来避免冲突
Then('the response JSON should contain {string} {word}', function (key, valueWord) {
  const value = valueWord === 'true' ? true : valueWord === 'false' ? false : valueWord;
  expect(this.response.data[key]).toBe(value);
});