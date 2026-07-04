import * as SecureStore from 'expo-secure-store';

export const saveToken = async (key, token) => {
  await SecureStore.setItemAsync(key, token);
};

export const getToken = async (key) => {
  return await SecureStore.getItemAsync(key);
};

export const removeToken = async (key) => {
  await SecureStore.deleteItemAsync(key);
};
