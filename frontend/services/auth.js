import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const saveToken = async (key, token) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, token);
  } else {
    await SecureStore.setItemAsync(key, token);
  }
};

export const getToken = async (key) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
};

export const removeToken = async (key) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};
