const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/register', async (req, res) => {
    try {
        const response = await axios.post('http://user-service:5000/api/register', req.body);
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const response = await axios.post('http://user-service:5000/api/login', req.body);
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

router.get('/allusers', async (req, res) => {
    try {
        const response = await axios.get('http://user-service:5000/api/allusers', { params: req.query });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

router.get('/profile', async (req, res) => {
    try {
        const response = await axios.get('http://user-service:5000/api/profile', {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Request failed' });
    }
});

module.exports = router;
