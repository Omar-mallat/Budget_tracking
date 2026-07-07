import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your computer's local IP when testing on a physical device
// Android emulator: http://10.0.2.2:5000
// iOS simulator:    http://localhost:5000
// Physical device:  http://YOUR_LOCAL_IP:5000
export const API_BASE_URL = 'http://10.0.2.2:5000';

const client = axios.create({ baseURL: API_BASE_URL });

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
