import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/AppNavigator';
import { NotificationProvider } from './src/NotificationProvider';

const App = () => {
  return (
    <NavigationContainer>
      <NotificationProvider>
        <AppNavigator />
      </NotificationProvider>
    </NavigationContainer>
  );
};

export default App;
