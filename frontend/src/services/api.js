// api.js — API service functions for the RecSys frontend
// All calls route through Flask on port 5000
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 15000,
});

// Fetch recommendations for a customer by ID
// Now uses the updated /api/v1/recommend/:id endpoint
export async function getRecommendations(customerId) {
  const response = await api.get(`/api/v1/recommend/${customerId}`);
  return response.data;
}

// Post feedback for a recommendation
export async function postFeedback(customerId, productCode, productName, isRelevant) {
  const response = await api.post('/api/v1/feedback', {
    customer_id : customerId,
    product_code: productCode,
    product_name: productName,
    is_relevant : isRelevant,
  });
  return response.data;
}

export default api;