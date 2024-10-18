const express = require('express');
const router = express.Router();
const axios = require('axios');

const GATEWAY_URL = 'http://gateway:4000/api/discovery';

const getServiceUrl = async (serviceName) => {
    try {
        const response = await axios.get(`${GATEWAY_URL}/services`);
        return response.data[serviceName];
    } catch (error) {
        console.error('Error fetching service URL:', error);
        throw new Error('Service not available');
    }
};

router.post('/register', async (req, res) => {
    try {
        const SERVICE_1_URL = await getServiceUrl('user-service');
        const response = await axios.post(`${SERVICE_1_URL}/api/register`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const SERVICE_1_URL = await getServiceUrl('user-service');
        const response = await axios.post(`${SERVICE_1_URL}/api/login`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

router.get('/allusers', async (req, res) => {
    try {
        const SERVICE_1_URL = await getServiceUrl('user-service');
        const response = await axios.get(`${SERVICE_1_URL}/api/allusers`, { params: req.query });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

router.get('/profile', async (req, res) => {
    try {
        const SERVICE_1_URL = await getServiceUrl('user-service');
        const response = await axios.get(`${SERVICE_1_URL}api/profile`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

module.exports = router;
