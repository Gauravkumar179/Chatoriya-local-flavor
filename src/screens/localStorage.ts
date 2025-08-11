import AsyncStorage from '@react-native-async-storage/async-storage';

// Save role
export const saveUserRole = async (role: string) => {
  try {
    await AsyncStorage.setItem('userRole', role);
  } catch (error) {
    console.log('Error saving role:', error);
  }
};

export const saveUserName = async (name: string) => {
  try {
    await AsyncStorage.setItem('userName', name);
  } catch (error) {
    console.log('Error saving name:', error);
  }
};

// Get role
export const getUserRole = async (): Promise<string | null> => {
  try {
    const role = await AsyncStorage.getItem('userRole');
    return role;
  } catch (error) {
    console.log('Error reading role:', error);
    return null;
  }
};

export const getUserName = async (): Promise<string | null> => {
  try {
    const name = await AsyncStorage.getItem('userName');
    return name;
  } catch (error) {
    console.log('Error reading role:', error);
    return null;
  }
};

