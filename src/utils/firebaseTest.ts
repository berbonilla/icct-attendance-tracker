
import { ref, get } from 'firebase/database';
import { database } from '@/config/firebase';

export const testFirebaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Test connection by trying to read from the root
    const testRef = ref(database, '/');
    await get(testRef);
    
    return {
      success: true,
      message: "Connected: 200 OK - Firebase Database Connected"
    };
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return {
      success: false,
      message: "Connection Failed - Unable to reach Firebase Database"
    };
  }
};
