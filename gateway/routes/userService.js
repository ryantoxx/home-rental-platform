const express = require('express');
const router = express.Router();
const axios = require('axios');
const { roundRobin } = require('../serviceRegistry');
const { circuitBreaker } = require('../circuitBreaker');

const makeRequestWithCircuitBreaker = async (serviceName, method, path, options = {}) => {
    try {
        return await circuitBreaker(serviceName, async (instanceUrl) => {
            const url = `${instanceUrl}${path}`;
            return await axios({ method, url, ...options });
        });
    } catch (error) {
        throw error;
    }
};

router.get('/test', async (req, res) => {
    try {
        const response = await makeRequestWithCircuitBreaker('user-service', 'get', '/api/test');
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Service is currently unavailable' });
    }
});

router.post('/register', async (req, res) => {
    try {
        const response = await makeRequestWithCircuitBreaker('user-service', 'post', '/api/register', { data: req.body });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Service is currently unavailable' });
    }
});


router.post('/login', async (req, res) => {
    try {
        const response = await makeRequestWithCircuitBreaker('user-service', 'post', '/api/login', { data: req.body });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

router.get('/allusers', async (req, res) => {
    try {
        
        const response = await makeRequestWithCircuitBreaker('user-service', 'get', '/api/allusers', { data: req.body });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

router.get('/profile', async (req, res) => {
    try {
        const response = await makeRequestWithCircuitBreaker('user-service', 'get', '/api/profile', {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});


module.exports = router;
