import React, { useState } from 'react';
import { View, TextInput, Alert, Text, ScrollView } from 'react-native';
import Button from '../components/Button';
import Storage from '../services/Storage';
import axios from 'axios';
import { styles } from '../styles/global';
import Divider from '../components/Divider';
import GoogleAuth from '../components/GoogleAuth';
import Config from 'react-native-config';
import { useNotification } from '../NotificationProvider';

const Login = ({ route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newUser, setNewUser] = useState({});

  const { showNotification} = useNotification();

  const handleLogin = async () => {
    try {
      const response = await axios.post(Config.API_URL + 'users/login', { email:email, password:password });
      const token = response.data.token;
      const user = response.data.user;
      if (!token) {
        showNotification('Error', 'Hubo un error interno en el servidor. Intente nuevamente', null, 'alert');
      } else {
        console.log('Token:', token);
        await Storage.set('auth_token', token);
        await Storage.set('user', JSON.stringify(user));

        // Re-check authentication in Navigator
        route.params.setIsAuth(true);
      }
    } catch (error) {
      console.log(error)
      showNotification('Error', 'Usuario o contraseña incorrecta', null, 'alert');
    }
  };

  const handleRegister = async () => {
    try {
      const response = await axios.post(Config.API_URL + 'users', newUser);
      //console.log(JSON.stringify(response, null, 2))
      if (response.data._id) {
        setEmail(response.data.email);
        setPassword(newUser.password);
        handleLogin();
      } else {
        showNotification('Error', 'Hubo un error interno en el servidor. Intente nuevamente', null, 'alert');
      }
    } catch (error) {
      console.log(Config.API_URL + 'users' + error)
      showNotification('Error', 'Hubo un error interno en el servidor. Intente nuevamente', null, 'alert');
    }
  };

  return (
    <View style={[styles.container, {padding:20, flexDirection:'row', alignItems:'center'}]}>
      <ScrollView vertical showsVerticalScrollIndicator={false}>

        <Text style={[styles.sectionTitle, {textAlign:'center'}]}>Inicio de Sesión</Text>
        {/* Simple Login */}
        <View style={{marginBottom:20, display:'grid', gap:10}}>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.textInput}
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.textInput}
          />
          <Button title="Login" color={'primary'} onPress={handleLogin} />
        </View>
        <Divider></Divider>
        {/* Google Login */}
        <View style={{marginBottom:20, display:'grid', gap:10}}>
          <GoogleAuth text={'Iniciar con Google'}></GoogleAuth>
        </View>
        <Divider></Divider>
        {/* Registro */}
        <View style={{marginBottom:20}}>
          <Text style={[styles.text, {textAlign:'center', marginBottom:20}]}>¿No registrado aún?</Text>
          <View style={{display:'grid', gap:10}}>
            <View style={{flexDirection:'row', gap:10}}>
              <TextInput
                placeholder="Nombre"
                value={newUser.firstName}
                onChangeText={(value) => setNewUser({...newUser, firstName:value})}
                style={[styles.textInput, {width:'50%'}]}
              />
              <TextInput
                placeholder="Apellido"
                value={newUser.lastName}
                onChangeText={(value) => setNewUser({...newUser, lastName:value})}
                style={[styles.textInput, {width:'50%'}]}
              />
            </View>
            <TextInput
              placeholder="Documento"
              value={newUser.document}
              onChangeText={(value) => setNewUser({...newUser, document:value})}
              style={styles.textInput}
            />
            <TextInput
              placeholder="Email"
              value={newUser.email}
              onChangeText={(value) => setNewUser({...newUser, email:value})}
              style={styles.textInput}
            />
            <TextInput
              placeholder="Password"
              value={newUser.password}
              onChangeText={(value) => setNewUser({...newUser, password:value})}
              secureTextEntry
              style={styles.textInput}
            />
            <Button title="Registro" color={'primary'} onPress={handleRegister} />
          </View>
        </View>
        <Divider></Divider>
        {/* Google Register */}
        <View style={{marginBottom:20, display:'grid', gap:10}}>
          <GoogleAuth text={'Registro con Google'}></GoogleAuth>
        </View>
      </ScrollView>
    </View>
  );
};

export default Login;
