const express = require('express');
const router = express.Router();
const axios = require('axios');
const { roundRobin } = require('../serviceRegistry')

router.post('/register', async (req, res) => {
    try {
        const SERVICE_1_URL = await roundRobin('user-service');
        const response = await axios.post(`${SERVICE_1_URL.url}/api/register`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const SERVICE_1_URL = await roundRobin('user-service');
        const response = await axios.post(`${SERVICE_1_URL.url}/api/login`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

router.get('/allusers', async (req, res) => {
    try {
        const SERVICE_1_URL = await roundRobin('user-service');
        const response = await axios.get(`${SERVICE_1_URL.url}/api/allusers`, { params: req.query });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

router.get('/profile', async (req, res) => {
    try {
        const SERVICE_1_URL = await roundRobin('user-service');
        const response = await axios.get(`${SERVICE_1_URL.url}/api/profile`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

module.exports = router;
