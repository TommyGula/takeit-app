import React from "react";
import { StyleSheet, TouchableOpacity, Image } from "react-native";
import AnimatedView from "./AnimatedView";
import Search from '../../assets/icons/search.png';

const FloatingButton = ({onPress}) => {
    return(
        <AnimatedView style={floatingStyles.container}>
            <TouchableOpacity onPress={onPress} style={floatingStyles.container}>
                <Image style={floatingStyles.floating} source={Search} />
            </TouchableOpacity>
        </AnimatedView>
    )
};

export default FloatingButton;

const floatingStyles = StyleSheet.create({
    container: {
        position:'absolute',
        zIndex:2,
        left:10,
        bottom:10,
    },
    touchable: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -2, // Negative value for vertical offset to show shadow at the top
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    floating: {
        height: 60,
        width: 60,
        borderRadius: 30, // Half of the height and width for a circle
        borderWidth: 1,
        borderColor: '#fff',
    },
});