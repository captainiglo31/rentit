import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5052/api', // Note: Port might change, check dotnet run output
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            // Optional: Redirect to login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
