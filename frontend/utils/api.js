import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ==========================================
// DEPLOYMENT CONFIGURATION
// ==========================================
// TEST_MODE: 
//   true  = Use local development server (localhost/10.0.2.2)
//   false = Use Railway production server
const TEST_MODE = process.env.EXPO_PUBLIC_TEST_MODE === 'true';

// Production URL (Railway)
const PRODUCTION_URL = 'https://mindnest-production-a1a7.up.railway.app';
// ==========================================

const getBaseUrl = () => {
    // Use local development URLs when in test mode
    if (TEST_MODE) {
        if (Platform.OS === 'android') {
            return 'http://10.0.2.2:8000';
        }
        return 'http://localhost:8000';
    }

    // Production mode - use Railway
    return PRODUCTION_URL;
};

export const API_BASE = getBaseUrl();

const api = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add Auth Token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('user_id'); // Using user_id as token for now
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (e) {
            console.log('Error reading token', e);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
