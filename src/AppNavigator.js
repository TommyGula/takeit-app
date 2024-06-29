import React, { useEffect, useState } from 'react';

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

// Navigatior
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Styles
import { styles } from './styles/global';
import AuthService from './services/AuthService';


const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const AppNavigator = () => {
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    checkAuthentication();
  },[]);

  useEffect(() => {
    console.log('Is Auth changed ' + isAuth)
  },[isAuth]);
  
  const checkAuthentication = async () => {
    const data = await AuthService.getUserAndTokenIfAuthenticated();
    if (data) {
      setIsAuth(true);
    } else {
      setIsAuth(false);
    }
  };

  return (
    <Stack.Navigator initialRouteName="Hello" style={styles.app}>
      <Stack.Screen name="Hello" options={{ title: 'Hello', headerShown: false }} >
        {props => <Hello {...props} isAuth={isAuth} />}
      </Stack.Screen>
      {
        isAuth ? 
        <>
          <Stack.Screen name="Home" component={Home} options={{ title: 'Home', headerShown: false }} />
          <Stack.Screen name="Selection" component={Selection} options={{ title: 'Confirmación' }} />
          <Stack.Screen name="Summary" component={Summary} options={{ title: 'Resumen' }} />
          <Stack.Screen name="Chats" component={ChatList} options={{ title: 'Chats' }} />
          <Stack.Screen name="Settings" component={Profile} options={{ title: 'Mi Perfil' }} />
          <Stack.Screen name="UserProfile" component={Profile} options={({ route }) => ({ title: route.params.profileUser.firstName + ' ' + route.params.profileUser.lastName })} />
          <Stack.Screen name="NewCar" component={NewCar} options={({ route }) => ({ title: route.params && route.params.carId ? 'Editar Auto' : 'Nuevo Auto' })} />
          <Stack.Screen name="ViewCar" component={NewCar} options={({ route }) => ({ title: route.params.carName })} />
          <Stack.Screen name="NewDocument" component={NewDocument} options={({route}) => ({ title: route.params && route.params.docId && route.params.userId ? 'Ver Documento' : route.params && route.params.docId ? 'Editar Documento' : 'Nuevo Documento' })} />
          <Stack.Screen name="NewPlace" component={NewPlace} options={{ title: 'Iniciar Búsqueda' }} />
          <Stack.Screen name="LivePlace" component={LivePlace} options={{ title: 'Búsqueda', headerShown: false }} />
          <Stack.Screen name="Chat" component={Chat} options={({ route }) => ({ title: route.params.userName })} />
          <Stack.Screen name="Logout" component={Logout} options={{ title: 'Logout' }} initialParams={{ setIsAuth:setIsAuth }}/>
        </> : 
        <Stack.Screen 
        name="Login" 
        component={Login} 
        options={{ 
          title: 'Login', 
          headerShown: false, 
        }} 
        initialParams={{
          setIsAuth:setIsAuth
        }}
        />
      }
    </Stack.Navigator>
  );
};

export default AppNavigator;
