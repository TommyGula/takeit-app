import React, { useState } from 'react';
import Button from './Button';
import { Platform, TextInput, messageInputStylesheet, Keyboard, KeyboardAvoidingView, TouchableWithoutFeedback, View, Text, StyleSheet } from 'react-native';
import { styles } from '../styles/global';

const MessageInput = ({ onSubmit }) => {
  const [message, setMessage] = useState('');

  const handleMessageSubmit = () => {
    if (message.trim() !== '') {
      onSubmit(message);
      setMessage('');
    }
  };

  return (
    <KeyboardAvoidingView style={messageInputStyles.container} keyboardVerticalOffset={Platform.OS === "android" ? 500 : 0} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={messageInputStyles.inner}>
          <TextInput
            style={messageInputStyles.input}
            placeholder="Type your message..."
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <Button title="Enviar" color={'primary'} onPress={handleMessageSubmit} />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const messageInputStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    position:'absolute',
    width:'100%',
    bottom:0,
    backgroundColor:'#fff',
    ...styles.shadow
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginRight: 10,
    minHeight: 40,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
});

export default MessageInput;
