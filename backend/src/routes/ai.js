import express from 'express';
import axios from 'axios';
import { protectedRoute, adminRoute } from '../middleware/auth.js'; // Note the .js extension

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Helper to forward requests
const fetchFromAI = async (res, method, endpoint, data = {}) => {
  try {
    const response = method === 'POST' 
      ? await axios.post(`${AI_SERVICE_URL}${endpoint}`, data)
      : await axios.get(`${AI_SERVICE_URL}${endpoint}`, { params: data });
    return res.json(response.data);
  } catch (error) {
    console.error(`AI Service Error (${endpoint}):`, error.message);
    return res.json({ error: "AI Service unavailable", data: null });
  }
};

// Routes
router.get('/suggest', protectedRoute, async (req, res) => {
  const { type } = req.query;
  await fetchFromAI(res, 'GET', '/suggest', { type });
});

router.post('/match', protectedRoute, async (req, res) => {
  await fetchFromAI(res, 'POST', '/match', req.body);
});

router.post('/fraud-check', adminRoute, async (req, res) => {
  await fetchFromAI(res, 'POST', '/fraud-check', req.body);
});

router.get('/forecast', adminRoute, async (req, res) => {
  await fetchFromAI(res, 'GET', '/forecast');
});

router.get('/clusters', adminRoute, async (req, res) => {
  await fetchFromAI(res, 'GET', '/clusters');
});

router.get('/trends', protectedRoute, async (req, res) => {
  await fetchFromAI(res, 'GET', '/trends');
});

export default router;