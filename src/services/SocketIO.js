import io from 'socket.io-client';
import Config from 'react-native-config';

const socket = io(Config.API_URL);

module.exports = socket;
