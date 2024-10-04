import React, { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Linking } from 'react-native';

// Screens
import Home from './screens/Home';
import Selection from './screens/Selection';
import Summary from './screens/Summary';
import Chat from './screens/Chat';
import Logout from './screens/Logout';
import ChatList from './screens/ChatList';
import Profile from './screens/Profile';
import NewCar from './screens/NewCar';
import NewDocument from './screens/NewDocument';
import NewPlace from './screens/NewPlace';
import LivePlace from './screens/LivePlace';
import Login from './screens/Login';
import Hello from './screens/Hello';
import ConnError from './screens/ConnError';
import AuthService from './services/AuthService';
import Payment from './screens/Payment';
import Error from './screens/Error';

// Navigatior
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Styles
import { styles } from './styles/global';
import History from './screens/History';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const AppNavigator = ({ setLinking, setInitialMessage }) => {
  const navigation = useNavigation();
  const [isAuth, setIsAuth] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  const handleDeepLink = (url) => {
    const params = extractQueryParams(url);

    if (params) {
      const { message } = params;
      if (message) {
        setInitialMessage(decodeURIComponent(message)); // Decode the message
      } else setInitialMessage(null);
    } else setInitialMessage(null);
  };

  const extractQueryParams = (url) => {
    const queryString = url.split('?')[1];
    if (!queryString) return null;

    const params = queryString.split('&').reduce((acc, param) => {
      const [key, value] = param.split('=');
      acc[key] = value;
      return acc;
    }, {});

    return params;
  };

  useFocusEffect(
    React.useCallback(() => {
      Linking.getInitialURL().then((url) => {
        if (url) {
          handleDeepLink(url);
        }
      });

      const subscription = Linking.addEventListener('url', (event) => {
        handleDeepLink(event.url);
      });

      return () => {
        subscription.remove();
      };
    }, [])
  );

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected !== null && state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAuth !== null) {
      navigation.navigate('Hello'); // Redirect to "Hello" when isAuth changes
    }
  }, [isAuth, navigation]);

  const handleRetry = () => {
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected !== null && state.isConnected);
    });
  };

  useEffect(() => {
    setLinking({
      prefixes: ['busytownapp://'],
      config: {
        screens: {
          Settings: 'profile',
          Summary: 'summary:matchId',
        },
      },
    })
  }, [isAuth]);

  const checkAuthentication = async () => {
    const data = await AuthService.getUserAndTokenIfAuthenticated();
    if (data) {
      setIsAuth(true);
    } else {
      setIsAuth(false);
    }
  };

  if (!isConnected) {
    return <ConnError onRetry={handleRetry} />;
  }

  return (
    <Stack.Navigator initialRouteName="Hello" style={styles.app}>
      <Stack.Screen name="Hello" options={{ title: 'Hello', headerShown: false }} >
        {props => <Hello {...props} isAuth={isAuth} />}
      </Stack.Screen>
      <Stack.Screen name="Home" component={Home} options={{ title: 'Home', headerShown: false }} />
      <Stack.Screen name="Error" component={Error} options={{ title: 'Error' }} />
      <Stack.Screen name="Selection" component={Selection} options={{ title: 'Confirmación' }} />
      <Stack.Screen name="Summary" component={Summary} options={{ title: 'Resumen' }} />
      <Stack.Screen name="Chats" component={ChatList} options={{ title: 'Chats' }} />
      <Stack.Screen name="History" component={History} options={({ route }) => ({ title: route.params.keyWord ? 'Mis ' + route.params.keyWord : 'Mis Intercambios' })} />
      <Stack.Screen name="Settings" component={Profile} options={{ title: 'Mi Perfil' }} />
      <Stack.Screen name="UserProfile" component={Profile} options={({ route }) => ({ title: route.params.profileUser.firstName + ' ' + route.params.profileUser.lastName })} />
      <Stack.Screen name="NewCar" component={NewCar} options={({ route }) => ({ title: route.params && route.params.carId ? 'Editar Auto' : 'Nuevo Auto' })} />
      <Stack.Screen name="ViewCar" component={NewCar} options={({ route }) => ({ title: route.params.carName })} />
      <Stack.Screen name="NewDocument" component={NewDocument} options={({ route }) => ({ title: route.params && route.params.docId && route.params.userId ? 'Ver Documento' : route.params && route.params.docId ? 'Editar Documento' : 'Nuevo Documento' })} />
      <Stack.Screen name="NewPlace" component={NewPlace} options={{ title: 'Iniciar Búsqueda' }} />
      <Stack.Screen name="LivePlace" component={LivePlace} options={{ title: 'Búsqueda', headerShown: true }} />
      <Stack.Screen name="Chat" component={Chat} options={({ route }) => ({ title: route.params.userName })} />
      <Stack.Screen name="Logout" component={Logout} options={{ title: 'Logout' }} initialParams={{ setIsAuth: setIsAuth }} />
      {/* <Stack.Screen name="PaymentSuccess" component={Payment} options={{ title: 'Pago Exitoso' }} initialParams={{ status: 'success' }} />
      <Stack.Screen name="PaymentError" component={Payment} options={{ title: 'Pago Fallido' }} initialParams={{ status: 'error' }} />
      <Stack.Screen name="PaymentPending" component={Payment} options={{ title: 'Pago Pendiente' }} initialParams={{ status: 'pending' }} /> */}
      <Stack.Screen
        name="Login"
        component={Login}
        options={{
          title: 'Login',
          headerShown: false,
        }}
        initialParams={{
          setIsAuth: setIsAuth
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
