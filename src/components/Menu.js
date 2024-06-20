import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Text, Animated } from 'react-native';

const Menu = () => {
  const menuAnimation = new Animated.Value(0);

  const translateY = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  useEffect(() => {
    Animated.timing(menuAnimation, {
        toValue: 1, // height of expanded height sheet
        duration: 700,
        useNativeDriver: false,
    }).start();
    
    setTimeout(() => {
        Animated.timing(menuAnimation, {
            toValue: 0, // height of expanded height sheet
            duration: 700,
            useNativeDriver: false,
        }).start();
    }, 7000); // Hide menu after 7 seconds of inactivity
    }, []);

  return (
      <Animated.View style={[styles.menu, { transform: [{translateY}] }]}>
        <TouchableOpacity style={styles.menuItem}>
          <Image source={{uri:'https://cdn-icons-png.flaticon.com/512/2805/2805366.png'}} style={styles.icon} />
          <Text>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Image source={{uri:'https://cdn-icons-png.flaticon.com/512/8990/8990015.png'}} style={styles.icon} />
          <Text>Menu</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Image source={{uri:'https://cdn-icons-png.flaticon.com/512/589/589708.png'}} style={styles.icon} />
          <Text>Chat</Text>
        </TouchableOpacity>
      </Animated.View>
  );
};

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection:'row',
    justifyContent:'space-around',
    zIndex: 2,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    elevation: 5
  },
  menuItem: {
    flexDirection: 'column',
    justifyContent:'center',
    alignItems: 'center',
    width:'33.333333%'
  },
  icon: {
    width: 30,
    height: 30,
  },
});

export default Menu;
