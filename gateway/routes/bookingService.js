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

router.post('/book', async (req, res) => {
    try {
        const SERVICE_2_URL = await getServiceUrl('booking-service');
        const response = await axios.post(`${SERVICE_2_URL}/api/book`, req.body, {
            headers: { Authorization: req.headers.authorization } 
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

router.get('/properties', async (req, res) => {
    try {
        const SERVICE_2_URL = await getServiceUrl('booking-service');
        const response = await axios.get(`${SERVICE_2_URL}/api/properties`, { params: req.query });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

router.get('/booking/:bookingId', async (req, res) => {
    try {
        const SERVICE_2_URL = await getServiceUrl('booking-service');
        const bookingId = req.params.bookingId; 
        const response = await axios.get(`${SERVICE_2_URL}api/booking/${bookingId}`, {
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
        const SERVICE_2_URL = await getServiceUrl('booking-service');
        const response = await axios.delete(`${SERVICE_2_URL}/api/cancel-booking/${bookingId}`, {
            headers: { Authorization: req.headers.authorization } 
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});


module.exports = router;
