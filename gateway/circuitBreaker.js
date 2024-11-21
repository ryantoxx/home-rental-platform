const axios = require('axios');
const { roundRobin } = require('./serviceRegistry');

const circuitState = {}; 

const MAX_RETRIES = 3;           
const FAILURE_THRESHOLD = 3;      
const TIMEOUT = 10000;            
const BLOCK_TIME = 10000;         

const circuitBreaker = async (serviceName, requestFn) => {
    if (!circuitState[serviceName]) {
        circuitState[serviceName] = {
            failures: 0,
            lastAttempt: Date.now(),
            isOpen: false,
            blockUntil: null, 
        };
    }

    const serviceState = circuitState[serviceName];

    if (serviceState.blockUntil && Date.now() < serviceState.blockUntil) {
        console.log(`${serviceName} service is blocked. Please try again later.`);
        throw new Error(`${serviceName} service is blocked. Please try again later.`);
    }

    if (serviceState.isOpen && Date.now() - serviceState.lastAttempt < TIMEOUT) {
        throw new Error(`${serviceName} circuit is open. Try again later.`);
    }

    let retries = 0;
    let attemptFailed = false; 

    while (retries < MAX_RETRIES) {
        const instance = roundRobin(serviceName);
        let instanceFailures = 0;
        while (instanceFailures < FAILURE_THRESHOLD) {
            try {
                const response = await requestFn(instance.url);
                serviceState.failures = 0;
                serviceState.isOpen = false;

                return response; 
            } catch (error) {
                instanceFailures++;
                serviceState.failures++;
                console.error(`Attempt ${retries + 1}, instance ${instance.instanceName}, failure ${instanceFailures}:`, error.message);

                if (instanceFailures >= FAILURE_THRESHOLD) {
                    console.log(`Instance ${instance.instanceName} failed ${FAILURE_THRESHOLD} times, switching instance.`);
                    break; 
                }
            }
        }

        retries++;
        console.log(`Attempt ${retries} for service ${serviceName}`);

        if (retries >= MAX_RETRIES) {
            serviceState.blockUntil = Date.now() + 10000; 
            console.log(`All 3 retries used for service ${serviceName}. Blocking for 10 seconds.`);
            throw new Error(`${serviceName} request failed after ${MAX_RETRIES} attempts. Service is now blocked for 10 seconds.`);
        }
    }

    if (attemptFailed) {
        throw new Error(`${serviceName} request failed after ${MAX_RETRIES} attempts.`);
    }
};

module.exports = { circuitBreaker };


