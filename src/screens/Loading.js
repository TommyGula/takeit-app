import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { colors } from '../styles/global';

const Loading = ({ visible, text, style=null }) => {
  const translateY = new Animated.Value(visible ? 0 : 1000); // Initial translateY off the screen

  // Slide animation to bring loading screen in from the bottom
  Animated.timing(translateY, {
    toValue: visible ? 0 : 1000,
    duration: 300,
    useNativeDriver: true,
  }).start();

  return (
    <Animated.View style={[(style || styles.container), { transform: [{ translateY }] }]}>
      <View style={styles.innerContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.text}>{text ? text : 'Cargando...'}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff', // White background with some transparency
    justifyContent: 'center',
    alignItems: 'center',
    position:'absolute',
    zIndex:20,
    width:'100%',
    height:'100vh'
  },
  innerContainer: {
    alignItems: 'center',
    paddingHorizontal:20
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    textAlign:'center'
  },
});

export default Loading;
