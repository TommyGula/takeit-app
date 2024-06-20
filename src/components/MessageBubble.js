import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, styles } from '../styles/global';

const MessageBubble = ({ message, isMyMessage, time }) => {
  return (
    <View style={[messageStyles.container, isMyMessage ? messageStyles.myMessage : messageStyles.otherMessage]}>
      <View style={messageStyles.time}>
        <Text style={styles.small}>{time} hs</Text>
      </View>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const messageStyles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    minWidth: '30%',
    padding: 10,
    borderRadius: 10,
    paddingBottom: 30,
    marginBottom: 10,
    position:'relative'
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary.light,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary.light,
  },
  time: {
    position: 'absolute',
    bottom:5,
    right:5
  }
});

export default MessageBubble;
