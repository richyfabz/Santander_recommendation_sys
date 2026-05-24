import axios from 'axios'

// All API calls route through Flask on port 5000
// The baseURL is set to the environment variable REACT_APP_API_URL if it exists, otherwise it defaults to 'http://localhost:5000'. This allows for flexibility in different deployment environments. The timeout is set to 15000 milliseconds (15 seconds) to prevent hanging requests, and the Content-Type header is set to 'application/json' for all requests made through this instance.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// RECOMMENDATIONS 
// Get personalized product recommendations for a specific customer by their ID, returning a list of recommended products with associated details and probabilities.
export const getRecommendations = async (customerId) => {
  const res = await api.get(`/api/v1/recommend/${customerId}`)
  return res.data
}

// FEEDBACK 
// Post user feedback on product recommendations, including customer ID, product code, product name, and whether the recommendation was clicked, to the backend for analysis and model improvement.
export const postFeedback = async (customerId, productCode, productName, clicked) => {
  const res = await api.post('/api/v1/feedback', {
    customer_id : customerId,
    product_code: productCode,
    product_name: productName,
    clicked     : clicked,
  })
  return res.data
}
// Get aggregated feedback statistics for all products, including total clicks and impressions, to evaluate recommendation performance.
export const getFeedbackStats = async () => {
  const res = await api.get('/api/v1/feedback/stats')
  return res.data
}

// HEALTH 
// Get the health status of the backend API, including uptime and version information, to monitor service availability and performance.
export const getHealth = async () => {
  const res = await api.get('/api/v1/health')
  return res.data
}