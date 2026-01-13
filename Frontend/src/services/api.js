import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api', // Replace with your actual API URL
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        // Example: Get token from localStorage or AuthContext if needed
        // const token = localStorage.getItem('token');
        // if (token) {
        //     config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling 429s and other errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 429 Too Many Requests
        if (error.response && error.response.status === 429) {
            console.warn('Rate limit exceeded. Retrying...');

            // Default retry count
            originalRequest._retryCount = originalRequest._retryCount || 0;
            const maxRetries = 3;

            if (originalRequest._retryCount < maxRetries) {
                originalRequest._retryCount += 1;

                // Exponential backoff: 1s, 2s, 4s...
                const delay = Math.pow(2, originalRequest._retryCount) * 1000;

                await new Promise(resolve => setTimeout(resolve, delay));

                return api(originalRequest);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
