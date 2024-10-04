const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/book', async (req, res) => {
    try {
        const response = await axios.post('http://booking-service:5001/api/book', req.body, {
            headers: { Authorization: req.headers.authorization } 
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

router.get('/properties', async (req, res) => {
    try {
        const response = await axios.get('http://booking-service:5001/api/properties', { params: req.query });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

router.get('/booking/:bookingId', async (req, res) => {
    try {
        const bookingId = req.params.bookingId; 
        const response = await axios.get(`http://booking-service:5001/api/booking/${bookingId}`, {
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
        const response = await axios.delete(`http://booking-service:5001/api/cancel-booking/${bookingId}`, {
            headers: { Authorization: req.headers.authorization } 
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});


module.exports = router;
