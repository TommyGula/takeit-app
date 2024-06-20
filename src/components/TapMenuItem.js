import React, { useEffect, useRef } from "react";
import { Animated, TouchableOpacity } from "react-native";

const TapMenuItem = ({ children, open, delayOpen, delayClose, duration, onPress }) => {
    const animation = useRef(new Animated.Value(0)).current;
    const translateX = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [500, 0], // Adjust the initial and final positions as needed
    });

    useEffect(() => {
        Animated.timing(animation, {
            toValue: open ? 1 : 0, 
            duration: duration,
            delay: open ? delayOpen : delayClose,
            useNativeDriver: false,
        }).start();
    },[open]);

    return(
        <Animated.View style={{ transform: [{ translateX }], marginBottom:20 }}>
            <TouchableOpacity onPress={onPress}>
                {children}
            </TouchableOpacity>
        </Animated.View>
    );
};

export default TapMenuItem;

