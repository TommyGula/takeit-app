import React, { useRef, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useNavigationContainerRef } from '@react-navigation/native';
import AppNavigator from './src/AppNavigator';
import { NotificationProvider } from './src/NotificationProvider';

const App = () => {
  const navRef = useNavigationContainerRef();
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const state = navRef.getRootState();
    setCurrent(state ? state.routes[state.index].name : null);
  }, []);

  const onScreenChange = async () => {
    const currentRoute = navRef.getCurrentRoute();
    if (currentRoute) {
      setCurrent(currentRoute.name);
    }
  };

  return (
    <NavigationContainer ref={navRef} onStateChange={onScreenChange}>
      <NotificationProvider screen={current}>
        <AppNavigator />
      </NotificationProvider>
    </NavigationContainer>
  );
};

export default App;
