import React, { useRef, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useNavigationContainerRef } from '@react-navigation/native';
import AppNavigator from './src/AppNavigator';
import { NotificationProvider } from './src/NotificationProvider';

const App = () => {
  const navRef = useNavigationContainerRef();
  const [current, setCurrent] = useState<string | null>(null);
  const [linking, setLinking] = useState(null);

  useEffect(() => {
    const handleDeepLink = (event: any) => {
      const url = event.url;
      console.log('Received URL:', url);
    };

    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url } as any);
      }
    });

    return () => {
      linkingSubscription.remove();
    };
  }, []);

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
    <NavigationContainer ref={navRef} onStateChange={onScreenChange} {...(linking ? { linking } : {})} >
      <NotificationProvider screen={current}>
        <AppNavigator setLinking={setLinking}/>
      </NotificationProvider>
    </NavigationContainer>
  );
};

export default App;
