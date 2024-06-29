import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import PushNotification from 'react-native-push-notification'
import Snackbar from 'react-native-snackbar';
import socket from './services/SocketIO';
import Storage from './services/Storage';
import axios from './utils/axios';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const [socketOn, setSocketOn] = useState(false);
  const [currentPage, setCurrentPage] = useState(null);

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
      case 'notification':
        const key = Date.now().toString(); // Key must be unique everytime
        PushNotification.createChannel(
          {
            channelId: key, // (required)
            channelName: title,
            channelDescription: message,
            importance: 4, 
              vibrate: true, 
          },
          (created) => console.log(`createChannel returned '${created}'`)
        );
        PushNotification.localNotification({
          channelId: key,
          title: title,
          message: message,
        })
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

  useEffect(() => {
    if (!socketOn) {
      initNotificationSocket();
    };
  },[socketOn]);

  const initNotificationSocket = async () => {
    const token = await Storage.get('auth_token');
    const user = await Storage.get('user');
    if (token && user) {
      setSocketOn(true);

      const receiveNewMessage = async (id) => {
        const message = await axios.get('messages/' + id + '?populate=senderId', token);
        if (message) {
          showNotification(message.data.senderId.firstName + ' ' + message.data.senderId.lastName,  message.data.message, null, 'notification');
        };
      };
      const getNewMatch = async (newMatchId) => {
        const token = await Storage.get('auth_token');
        axios.get('matches/' + newMatchId, token)
        .then(response => {
          showNotification('Nueva solicitud', response.data.buyerId.firstName + ' está solicitando tu lugar. Ingresa aquí para aceptar o rechazar su solicitud', null, 'notification');
        })
        .catch(err => {
            console.log(err)
        })
      };
      const cancelMatch = async (matchId) => {
        const token = await Storage.get('auth_token');
        axios.get('matches/' + matchId, token)
        .then(response => {
          showNotification('Solicitud cancelada', response.data.buyerId.firstName + ' ha cancelado su solicitud', null, 'notification');
        })
        .catch(err => {
            console.log(err)
        })
      };
      const handleFinishMatch = async (matchId) => {
        const token = await Storage.get('auth_token');
        axios.get('matches/' + matchId, token)
        .then(response => {
          const myMatch = response.data;
          showNotification('¡El usuario llegó a destino!', 'Confirmanos si recibiste tus ' + myMatch.currency + ' ' + myMatch.price + ' antes de ceder tu lugar.', null, 'notification');
        })
        .catch(err => {
            console.log(err)
        })
      }

      // Chat
      socket.on('receivedMessage_' + JSON.parse(user)._id, receiveNewMessage);
      // LivePlace & Summary
      socket.on('newMatch_' + JSON.parse(user)._id, getNewMatch);
      socket.on('cancelledMatch_' + JSON.parse(user)._id, cancelMatch);
      socket.on('deletedMatch_' + JSON.parse(user)._id, cancelMatch);
      socket.on('matchFinished_' + JSON.parse(user)._id, handleFinishMatch);
      return () => {
        socket.off('receivedMessage_' + JSON.parse(user)._id);
        socket.off('newMatch_' + JSON.parse(user)._id, getNewMatch);
        socket.off('cancelledMatch_' + JSON.parse(user)._id, cancelMatch);
        socket.off('deletedMatch_' + JSON.parse(user)._id, cancelMatch);
        socket.off('matchFinished_' + JSON.parse(user)._id, handleFinishMatch);
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
