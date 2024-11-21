const express = require('express');
const router = express.Router();
const axios = require('axios');
const { roundRobin } = require('../serviceRegistry')
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

router.post('/book', async (req, res) => {
    try {
        const response = await makeRequestWithCircuitBreaker('booking-service', 'post', '/api/book', {
            data: req.body,
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

router.get('/properties', async (req, res) => {
    try {
        const response = await makeRequestWithCircuitBreaker('booking-service', 'get', '/api/properties', {
            params: req.query
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

router.get('/seed-properties', async (req, res) => {
    try {
        const response = await makeRequestWithCircuitBreaker('booking-service', 'get', '/seed-properties');
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

router.get('/booking/:bookingId', async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const response = await makeRequestWithCircuitBreaker('booking-service', 'get', `/api/booking/${bookingId}`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

router.delete('/cancel-booking/:bookingId', async (req, res) => {
    const { bookingId } = req.params;
    try {
        const response = await makeRequestWithCircuitBreaker('booking-service', 'delete', `/api/cancel-booking/${bookingId}`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});


module.exports = router;
