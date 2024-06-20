import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { colors } from '../styles/global';

const Notification = ({ title, message, duration = 3000 }) => {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Fade in and slide up
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Wait for the duration
      Animated.delay(duration),
      // Fade out and slide up to disappear
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 10,
    zIndex:10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2, // Negative value for vertical offset to show shadow at the top
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5, // Elevation for Android shadows
  },
  title: {
    color: colors.secondary.dark,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  message: {
    color: colors.gray.dark,
  },
});

export default Notification;
