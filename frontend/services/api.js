// Use your machine's local IP address or 10.0.2.2 for Android emulator testing
const BASE_URL = 'http://192.168.1.7:3000';

export const api = {
  baseURL: BASE_URL,
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

  retailerBrowse: (token, page, search, companyId) => {
    let url = `${BASE_URL}/api/retailer/browse?page=${page}&search=${search}`;
    if (companyId) url += `&companyId=${companyId}`;
    return fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());
  },

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

  adminOrders: (token) =>
    fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.json()),
};
