import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, styles } from '../styles/global';

const Button = ({ title, children, onPress, color, style={}, styleText={}, disabled=false }) => {
  return (
    <TouchableOpacity disabled={disabled} style={[buttonStyles.button, { backgroundColor: colors[disabled ? 'gray' : color]['main'] }, style]} onPress={onPress}>
      <Text style={[styles.app, styles.bold, buttonStyles.buttonText, styleText]}>{title || children}</Text>
    </TouchableOpacity>
  );
};

const buttonStyles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#FFF', // Default text color
    fontSize: 16,
    textAlign:'center'
  },
});

export default Button;
