const express = require('express');
const axios = require('axios');
const client = require('prom-client'); // Prometheus client
const bookingRoutes = require('./routes/bookingService');
const userRoutes = require('./routes/userService');
const { router: serviceDiscoveryRoutes } = require('./serviceRegistry');

const app = express();
const PORT = process.env.PORT || 4000;
const TIMEOUT = 5000;

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const requestCount = new client.Counter({
    name: 'http_request_count',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

app.use((req, res, next) => {
    res.on('finish', () => {
        requestCount.inc({ method: req.method, route: req.path, status_code: res.statusCode });
    });
    next();
});

const timeout = (req, res, next) => {
    res.setTimeout(TIMEOUT, () => {
        if (!res.headersSent) {
            res.status(408).send({ message: 'Request timeout' });
        }
    });
    next();
};

app.use(express.json());
app.use(timeout);

app.use('/api/discovery', serviceDiscoveryRoutes);

app.get('/status', (req, res) => {
    res.status(200).json({
        status: 'Gateway is running',
        port: PORT,
        uptime: process.uptime()
    });
});

app.get('/test-timeout', (req, res) => {
    const delay = req.query.delay ? parseInt(req.query.delay) : 6000;
    setTimeout(() => {}, delay);
});

app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
});
