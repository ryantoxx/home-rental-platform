const express = require('express');
const router = express.Router();
const Docker = require('dockerode');

const docker = new Docker();
const services = {};


const registerService = (serviceType, serviceUrl, instanceName) => {
    if (!serviceType || !serviceUrl || !instanceName) {
        console.error('Service type, URL, and instance name are required for registration.');
        return;
    }

    if (!services[serviceType]) {
        services[serviceType] = [];
    }

    services[serviceType].push({ url: serviceUrl, instance: instanceName });
};

const discoverServices = async () => {
    try {
        const containers = await docker.listContainers({ all: true });

        for (const service in services) {
            services[service] = [];
        }

        for (const container of containers) {
            const labels = container.Labels;
            const containerName = container.Names[0].substring(1); 
            
            const privatePort = container.Ports ? container.Ports[0]?.PrivatePort : null;
    
            if (labels['service_type'] === 'user-service') {
                registerService('user-service', `http://${containerName}:${privatePort}`, labels['instance']);
            }

            if (labels['service_type'] === 'booking-service') {
                registerService('booking-service', `http://${containerName}:${privatePort}`, labels['instance']);
            }
            
        }
    } catch (error) {
        console.error('Error discovering services:', error);
    }
};


const listNetworks = async () => {
    try {
        const networks = await docker.listNetworks();
        networks.forEach(network => {
            console.log('Network name:', network.Name);
        });
    } catch (error) {
        console.error('Error fetching networks:', error);
    }
};

listNetworks();
setInterval(discoverServices, 10000);
discoverServices(); 

router.get('/services', (req, res) => {
    return res.status(200).json(services);
});

router.get('/status', (req, res) => {
    return res.status(200).json({ status: 'Service Discovery is running', services });
});

const serviceIndices = {
    'user-service': 0,
    'booking-service': 0
};

// round robin
const roundRobin = (serviceName) => {
    if (!services[serviceName] || services[serviceName].length === 0) {
        throw new Error(`Service ${serviceName} not found or has no registered instances`);
    }

    const urls = services[serviceName];
    const index = serviceIndices[serviceName];

    const { url: nextUrl, instance } = urls[index];
    serviceIndices[serviceName] = (index + 1) % urls.length;

    return { instanceName: instance, url: nextUrl }; 
};


module.exports = {
    router,
    roundRobin
};
