import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { styles } from "../styles/global";

const NotificationBubble = ({ n, color }) => {
    return(
        <View style={[bubbleStyles.bubble, { backgroundColor: color ? color : 'red' }]}>
            <Text style={bubbleStyles.text}>{n}</Text>
        </View>
    )
};

export default NotificationBubble;

const bubbleStyles = StyleSheet.create({
    bubble: {
        position: 'absolute',
        top: -5,
        right: 0,
        width: 20,
        height: 20,
        zIndex: 2,
        borderRadius: 50
    },
    text: {
        color:'#fff',
        textAlign:'center'
    }
})