import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ==========================================
// DEPLOYMENT CONFIGURATION
// ==========================================
// TEST_MODE: 
//   true  = Use local development server (localhost/10.0.2.2)
//   false = Use Railway production serverr
const TEST_MODE = false;
const LOCAL_DEV_PORT = 8000;
const LOCAL_DEV_IP = '192.168.0.167';
const USE_LOCALHOST_ON_IOS_SIMULATOR = true;

// Production URL (Railway)
const PRODUCTION_URL = 'https://mindnestapp-production.up.railway.app';
// ==========================================

const getExpoHost = () => {
    const hostUri =
        Constants?.expoConfig?.hostUri
        || Constants?.manifest2?.extra?.expoClient?.hostUri
        || Constants?.manifest?.debuggerHost;

    if (!hostUri || typeof hostUri !== 'string') return null;
    return hostUri.split(':')[0];
};

const getBaseUrl = () => {
    // Use local development URLs when in test mode
    if (TEST_MODE) {
        if (Platform.OS === 'android') {
            return `http://10.0.2.2:${LOCAL_DEV_PORT}`;
        }

        // iOS Simulator runs on the same Mac, so localhost is the most reliable target.
        if (Platform.OS === 'ios' && USE_LOCALHOST_ON_IOS_SIMULATOR) {
            return `http://localhost:${LOCAL_DEV_PORT}`;
        }

        const expoHost = getExpoHost();
        const host = expoHost || LOCAL_DEV_IP || 'localhost';
        return `http://${host}:${LOCAL_DEV_PORT}`;
    }

    // Production mode - use Railway
    return PRODUCTION_URL;
};

export const API_BASE = getBaseUrl();

const api = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
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
