const request = require('supertest');
const express = require('express');
const axios = require('axios');

// Mock axios to avoid calling real AI service during basic tests
jest.mock('axios');

describe('AI Integration Tests', () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        
        // Create a simple proxy route similar to your real app
        app.post('/api/ai/match-donations', async (req, res) => {
            try {
                const response = await axios.post('http://localhost:8000/api/ai/match-donations', req.body);
                res.json(response.data);
            } catch (error) {
                res.status(500).json({ error: 'AI Service Failed' });
            }
        });
    });

    it('should forward matching request to AI service', async () => {
        // Mock successful AI response
        axios.post.mockResolvedValue({
            data: {
                success: true,
                matches: [{ ngo_name: "Test NGO", match_score: 95 }]
            }
        });

        const res = await request(app)
            .post('/api/ai/match-donations')
            .send({
                type: "Winter Wear",
                quantity: 10,
                latitude: 19.07,
                longitude: 72.87
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.matches[0].ngo_name).toBe("Test NGO");
    });

    it('should handle AI service errors', async () => {
        // Mock failed AI response
        axios.post.mockRejectedValue(new Error('Connection refused'));

        const res = await request(app)
            .post('/api/ai/match-donations')
            .send({});

        expect(res.statusCode).toEqual(500);
        expect(res.body.error).toBe('AI Service Failed');
    });
});
