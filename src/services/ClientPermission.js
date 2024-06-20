import { PermissionsAndroid } from 'react-native';

export const requestLocationPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'This app needs access to your location to function properly.',
        buttonPositive: 'OK',
      }
    );
    console.log('Granted ' + granted);
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Location permission granted');
      return true;
    } else {
      console.log('Location permission denied');
      return false;
    }
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};
