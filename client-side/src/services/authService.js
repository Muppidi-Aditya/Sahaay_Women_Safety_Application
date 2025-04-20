import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

export const register = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/auth/register`, userData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Registration failed' };
    }
}; 