import React, { useEffect, useState } from "react";
import { StyleSheet, View, Image, TouchableOpacity } from "react-native";
import { styles } from "../styles/global";
import Logo from '../../assets/images/logo.png';
import { useFocusEffect } from "@react-navigation/native";

const Hello = ({ isAuth, navigation }) => {
    const [next, setNext] = useState('Login');

    useFocusEffect(
        React.useCallback(() => {
            const checkAuthAndNavigate = () => {
                if (isAuth == null) {
                    console.log('Waiting...');
                } else {
                    if (isAuth === false) {
                        navigation.navigate('Login');
                    } else {
                        navigation.navigate('Home');
                        setNext('Home');
                    }
                }
            };

            // Set up an interval to keep checking every 3 seconds if navigation wasn't successful
            const intervalId = setInterval(() => {
                checkAuthAndNavigate();
            }, 3000);

            return () => clearInterval(intervalId); // Clear interval when component unmounts

        }, [isAuth])
    );

    return (
        <View style={[styles.container, { backgroundColor: '#fafafa', padding: 20, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }]}>
            <View style={{ marginBottom: 20, ...helloStyles.logoContainer }}>
                <TouchableOpacity onPress={() => navigation.navigate(next)}>
                    <Image style={helloStyles.logo} source={Logo}></Image>
                </TouchableOpacity>
            </View>
        </View>
    )
};

const helloStyles = StyleSheet.create({
    logoContainer: {
        width: 209,
        padding: 0,
        margin: 'auto',
    },
    logo: {
        width: '100%',
    },
});

export default Hello;