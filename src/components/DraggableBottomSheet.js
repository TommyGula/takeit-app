import React, { useState, useRef, useEffect } from 'react';
import { View, Animated, PanResponder, StyleSheet, Platform } from 'react-native';
import {WINDOW_HEIGHT} from '../utils/helpers';

const DraggableBottomSheet = ({ children, open, selected, isStatic = false, maxHeight = null, minHeight = null, setOpen }) => {
  const BOTTOM_SHEET_MAX_HEIGHT = maxHeight || WINDOW_HEIGHT;
  const BOTTOM_SHEET_MIN_HEIGHT = minHeight || WINDOW_HEIGHT * 0.04;
  const SEMI_OPEN_HEIGHT = BOTTOM_SHEET_MAX_HEIGHT * 0.4;

  const MAX_UPWARD_TRANSLATE_Y = BOTTOM_SHEET_MIN_HEIGHT - BOTTOM_SHEET_MAX_HEIGHT;
  const SEMI_OPEN_TRANSLATE_Y = BOTTOM_SHEET_MIN_HEIGHT - SEMI_OPEN_HEIGHT;
  const MAX_DOWNWARD_TRANSLATE_Y = 0;
  const DRAG_THRESHOLD = 50;

  const [current, setCurrent] = useState(null);
  const animatedValue = useRef(new Animated.Value(open ? MAX_UPWARD_TRANSLATE_Y : MAX_DOWNWARD_TRANSLATE_Y)).current;
  const lastGestureDy = useRef(open ? MAX_UPWARD_TRANSLATE_Y : MAX_DOWNWARD_TRANSLATE_Y);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        if (!isStatic) {
          //animatedValue.setOffset(lastGestureDy.current * (lastGestureDy.current == SEMI_OPEN_TRANSLATE_Y ? 0 : 1));
        }
      },
      onPanResponderMove: (e, gesture) => {
        if (!isStatic && gesture.dy !== 0) {
          animatedValue.setValue(gesture.dy + lastGestureDy.current);
        }
      },
      onPanResponderRelease: (e, gesture) => {
        animatedValue.flattenOffset();
        lastGestureDy.current += gesture.dy;

        if (!isStatic) {
          if (gesture.dy > 0) {
            // dragging down
            if (gesture.dy <= DRAG_THRESHOLD) {
              springAnimation('semi');
            } else if (gesture.dy > DRAG_THRESHOLD && lastGestureDy.current > SEMI_OPEN_TRANSLATE_Y) {
              springAnimation('down');
            } else {
              springAnimation('semi');
            }
          } else {
            // dragging up
            if (gesture.dy >= -DRAG_THRESHOLD) {
              springAnimation('semi');
            } else if (gesture.dy < -DRAG_THRESHOLD && lastGestureDy.current < SEMI_OPEN_TRANSLATE_Y) {
              springAnimation('up');
            } else {
              springAnimation('semi');
            }
          }
        }
      },
    })
  ).current;

  useEffect(() => {
    if (current !== selected || isStatic) {
      setCurrent(selected);
    };
    springAnimation('semi');
  }, [open, selected, isStatic]);

  const springAnimation = (direction) => {
    let toValue;
    if (direction === 'down') {
      toValue = MAX_DOWNWARD_TRANSLATE_Y;
    } else if (direction === 'semi') {
      toValue = SEMI_OPEN_TRANSLATE_Y;
    } else {
      toValue = MAX_UPWARD_TRANSLATE_Y;
    }
    lastGestureDy.current = toValue;

    if (direction !== 'down') {
      setOpen(toValue * -1);
    } else {
      setOpen(0);
    };

    Animated.spring(animatedValue, {
      toValue: toValue,
      useNativeDriver: true,
    }).start();
  };

  const bottomSheetAnimation = {
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [MAX_UPWARD_TRANSLATE_Y, MAX_DOWNWARD_TRANSLATE_Y],
          outputRange: [MAX_UPWARD_TRANSLATE_Y, MAX_DOWNWARD_TRANSLATE_Y],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    bottomSheet: {
      position: 'absolute',
      width: '100%',
      height: BOTTOM_SHEET_MAX_HEIGHT,
      bottom: BOTTOM_SHEET_MIN_HEIGHT - BOTTOM_SHEET_MAX_HEIGHT,
      ...Platform.select({
        android: { elevation: 3 },
        ios: {
          shadowColor: '#a8bed2',
          shadowOpacity: 1,
          shadowRadius: 6,
          shadowOffset: {
            width: 2,
            height: 2,
          },
        },
      }),
      zIndex: 3,
      backgroundColor: 'white',
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
    },
    draggableArea: {
      width: 132,
      height: 32,
      alignSelf: 'center',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dragHandle: {
      width: 100,
      height: 6,
      backgroundColor: '#d3d3d3',
      borderRadius: 10,
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bottomSheet, bottomSheetAnimation]}>
        <View style={styles.draggableArea} {...panResponder.panHandlers}>
          <View style={styles.dragHandle} />
        </View>
        <View style={{ width: '100%' }}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

export default DraggableBottomSheet;