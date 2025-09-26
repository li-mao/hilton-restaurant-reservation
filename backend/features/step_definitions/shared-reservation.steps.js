const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('expect');

// 共享的预订数据存储
global.reservationData = global.reservationData || {};

// 验证预订状态 - 共享步骤
Then(/^reservation (\w+) status should be "([^"]*)"$/, function (reservationKey, expectedStatus) {
  expect(global.reservationData[reservationKey].status).toBe(expectedStatus);
});

// 验证预订取消成功 - 共享步骤
Then(/^reservation (\w+) should be cancelled successfully$/, function (reservationKey) {
  expect(this.response.data.data).toBeDefined();
  expect(this.response.data.data.cancelReservation).toBeDefined();
});

// 验证预订批准成功 - 共享步骤
Then(/^reservation (\w+) should be approved successfully$/, function (reservationKey) {
  // 检查全局数据中的预订状态
  expect(global.reservationData[reservationKey]).toBeDefined();
  expect(global.reservationData[reservationKey].status).toBe('approved');
});

// 验证预订完成成功 - 共享步骤
Then(/^reservation (\w+) should be completed successfully$/, function (reservationKey) {
  expect(this.response.data.data).toBeDefined();
  expect(this.response.data.data.completeReservation).toBeDefined();
});

// 验证预订创建成功 - 共享步骤
Then(/^reservation (\w+) should be created successfully$/, function (reservationKey) {
  expect(this.response.data.data).toBeDefined();
  expect(this.response.data.data.createReservation).toBeDefined();
  expect(global.reservationData[reservationKey]).toBeDefined();
  expect(global.reservationData[reservationKey].id).toBeDefined();
});

// 验证预订更新成功 - 共享步骤
Then(/^reservation (\w+) should be updated successfully$/, function (reservationKey) {
  expect(this.response.data.data).toBeDefined();
  expect(this.response.data.data.updateReservation).toBeDefined();
});

// 验证预订桌数 - 共享步骤
Then(/^reservation (\w+) table size should be (\d+)$/, function (reservationKey, expectedTableSize) {
  expect(global.reservationData[reservationKey].tableSize).toBe(parseInt(expectedTableSize));
});
