import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import Snackbar from 'react-native-snackbar';
import socket from './services/SocketIO';
import Storage from './services/Storage';
import axios from './utils/axios';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const [socketOn, setSocketOn] = useState(false);

  const showNotification = (title, message, duration=3000, type = 'snackbar', callback = null, buttons = null, cancelable = true, onDismiss = () => null) => {
    setNotification({ title, message, duration });

    switch (type) {
      case 'snackbar':
        Snackbar.show({
          text: message,
          duration: Snackbar.LENGTH_LONG,
        });
        break;
      case 'alert':
        Alert.alert(
          title,
          message,
          buttons ? buttons : [
            { text: 'OK', onPress: () => (callback ? callback() : null) }
          ],
          { cancelable: cancelable, onDismiss: onDismiss }
        );
        break;
      default:
        console.log(`Sorry, we are out of ${type}.`);
    }
  };

  useEffect(() => {
    
  },[]);

  socket.on('connection', (date) => {
    showNotification('Socket IO', 'Connected with server at: ' + date, null);
    socket.off('connection');
  });

  const hideNotification = () => {
    setNotification(null);
  };

  useEffect(() => {
    if (!socketOn) {
      initSocket();
    };
  },[socketOn]);

  const initSocket = async () => {
    console.log('Socket on? ', socketOn)
    const token = await Storage.get('auth_token');
    const user = await Storage.get('user');
    if (token && user) {
      setSocketOn(true);
      socket.on('receivedMessage_' + JSON.parse(user)._id, async (id) => {
        const message = await axios.get('messages/' + id + '?populate=senderId', token);
        if (message) {
          showNotification('New message', message.data.senderId.firstName + ' ' + message.data.senderId.lastName + ': ' + message.data.message, null);
        }
      });
      return () => {
        socket.off('receivedMessage_' + JSON.parse(user)._id);
      }
    };
  };

  return (
    <NotificationContext.Provider value={{ notification, showNotification, hideNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
