import React from 'react';
import { View, StyleSheet } from 'react-native';

const BlueDotMarker = () => {
  return (
    <View style={styles.dot} />
  );
};

const styles = StyleSheet.create({
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'blue', // Customize the color here
    borderWidth: 2,
    borderColor: 'white',
  },
});

export default BlueDotMarker;