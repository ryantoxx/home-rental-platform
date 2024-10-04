const express = require('express');
const axios = require('axios');
const bookingRoutes = require('./routes/bookingService');
const userRoutes = require('./routes/userService');

const app = express();
const PORT = process.env.PORT || 4000;

const TIMEOUT = 5000;

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

app.get('/test-timeout', (req, res) => {
    const delay = req.query.delay ? parseInt(req.query.delay) : 6000;

    setTimeout(() => {
    }, delay);
});

app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
});
