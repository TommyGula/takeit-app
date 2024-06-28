import React, { useEffect } from "react";
import { StyleSheet, View, Image } from "react-native";
import { styles } from "../styles/global";
import Logo from '../../assets/images/logo.png';

const Hello = ({ isAuth, navigation }) => {

    useEffect(() => {
        switch (isAuth) {
            case false:
                navigation.navigate('Login');
            case true:
                navigation.navigate('Home');
            default:
                console.log('Waiting...')
        }
    },[isAuth]);

    return(
        <View style={[styles.container, {backgroundColor:'#fafafa', padding:20, flexDirection:'column', alignItems:'center', justifyContent:'center'}]}>
            <View style={{marginBottom:20, ...helloStyles.logoContainer}}>
                <Image style={helloStyles.logo} source={Logo}></Image>
            </View>
        </View>
    )
};

const helloStyles = StyleSheet.create({
    logoContainer: {
        width:209,
        padding:0,
        margin:'auto',
    },
    logo:{
        width:'100%',
    },
});

export default Hello;