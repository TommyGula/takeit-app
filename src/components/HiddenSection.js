import React, {useEffect, useRef, useState} from 'react';
import {TouchableOpacity, View} from 'react-native';
import {StyleSheet, PanResponder, Animated} from 'react-native';
import {colors, styles} from '../styles/global';
import FloatingButton from './FloatingButton';

const HiddenSection = ({children, open, setOpen}) => {
    const [drag, setDrag] = useState(0);
    const oh = 500;
    const ch = 0;

    const height = useRef(new Animated.Value(ch)).current;

    useEffect(() => {
      if (!open) {
        Animated.timing(height, {
          toValue: ch, // height of expanded height sheet
          duration: 300,
          useNativeDriver: false,
        }).start();
      } else {
        Animated.timing(height, {
          toValue: oh, // height of expanded height sheet
          duration: 300,
          useNativeDriver: false,
        }).start();
      };
    },[open])

    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (evt, gestureState) => {
          // Update dragging state based on the distance of the drag
          const {dy} = gestureState;
          setDrag(dy);

          if (dy >= 100) {
            setDrag(0);
            setOpen(false);
          } else if (dy <= -100) {
            setDrag(0);
            setOpen(true);
          };
        },
      }),
    ).current;

    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[hiddenSectionStyles.section, {height: height, backgroundColor: colors.primary.main, zIndex:3 }]}>
        <View
          style={{width:'100%'}}>
          <View style={{...hiddenSectionStyles.topBar, backgroundColor:(open ? colors.primary.dark : '#666')}}></View>
        </View>
        <View style={{paddingTop:10}}>{children}</View>
      </Animated.View>
    );
};

const hiddenSectionStyles = StyleSheet.create({
  topBar: {
    width: '10%',
    paddingTop: 0,
    borderTopLeftRadius:20,
    borderTopRightRadius:20,
    height: 3,
    marginTop:15,
    height:3,
    marginHorizontal:'44.5%'
  },
  section: {
    ...styles.section,
    position: 'absolute',
    alignItems: 'flex-start',
    bottom: 0,
    left: 0,
    right: 0,
    width:'100%',
    maxHeight:'100vh',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 5,
  },
});

export default HiddenSection;
