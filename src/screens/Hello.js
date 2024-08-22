import React, { useEffect } from "react";
import { StyleSheet, View, Image } from "react-native";
import { styles } from "../styles/global";
import Logo from '../../assets/images/logo.png';

const Hello = ({ isAuth, navigation }) => {

    useEffect(() => {
        if (isAuth == null) {
            console.log('Waiting...')
        } else {
            console.log('Is auth? ', isAuth)
            if (isAuth == false) {
                navigation.navigate('Login');
            } else {
                navigation.navigate('Home');
            }
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