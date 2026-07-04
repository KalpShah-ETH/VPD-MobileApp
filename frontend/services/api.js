// Use your machine's local IP address or 10.0.2.2 for Android emulator testing
const BASE_URL = 'http://10.0.2.2:3000';

export const api = {
  salesmanLogin: (username, password) =>
    fetch(`${BASE_URL}/api/salesman/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(res => res.json()),

  salesmanPushToken: (token, sessionToken) =>
    fetch(`${BASE_URL}/api/salesman/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ token })
    }).then(res => res.json()),

  getStock: (token, page, search) =>
    fetch(`${BASE_URL}/api/salesman/stock?page=${page}&search=${search}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.json()),

  retailerLogin: (phone) =>
    fetch(`${BASE_URL}/api/retailer/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    }).then(res => res.json()),

  placeOrder: (token, items) =>
    fetch(`${BASE_URL}/api/retailer/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ items })
    }).then(res => res.json()),
};
