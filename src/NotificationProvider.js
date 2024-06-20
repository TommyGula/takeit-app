import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import Snackbar from 'react-native-snackbar';
import socket from './services/SocketIO';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

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

  socket.on('connection', (date) => {
    showNotification('Socket IO', 'Connected with server at: ' + date, null);
    socket.off('connection');
  });

  const hideNotification = () => {
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={{ notification, showNotification, hideNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
