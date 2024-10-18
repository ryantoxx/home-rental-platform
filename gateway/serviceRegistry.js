const express = require('express');
const router = express.Router();

const services = {};

const registerService = (serviceName, serviceUrl) => {
    if (!serviceName || !serviceUrl) {
        console.error('Service name and URL are required for registration.');
        return;
    }
    
    services[serviceName] = serviceUrl;
    console.log(`Service registered: ${serviceName} at ${serviceUrl}`);
};

router.get('/services', (req, res) => {
    return res.status(200).json(services);
});

router.get('/status', (req, res) => {
    return res.status(200).json({ status: 'Service Discovery is running', services });
});

registerService('user-service', 'http://user-service:5000');
registerService('booking-service', 'http://booking-service:5001'); 

module.exports = router;
