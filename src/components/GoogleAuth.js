import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet, View, Text, Image } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Config from 'react-native-config';
import auth from '@react-native-firebase/auth';

export default function GoogleAuth({text}) {

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: Config.GOOGLE_OAUTH_CLIENT_ID, 
    });    
  },[]);

  const onGoogleButtonPress = async () => {
    console.log('Google Client ID ', Config.GOOGLE_OAUTH_CLIENT_ID)
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const signInResult = await GoogleSignin.signIn();
  
    idToken = signInResult.data?.idToken;
    if (!idToken) {
      idToken = signInResult.idToken;
    }
    if (!idToken) {
      throw new Error('No ID token found');
    }
  
    const googleCredential = auth.GoogleAuthProvider.credential(signInResult.data.token);
    return auth().signInWithCredential(googleCredential);
  };

  return(
    <TouchableOpacity onPress={onGoogleButtonPress} style={googleStyles.button}>
        <View style={googleStyles.iconContainer}>
            <Image source={{uri:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png'}} style={googleStyles.icon} />
        </View>
        <View style={googleStyles.textContainer}>
            <Text style={googleStyles.text}>{text}</Text>
        </View>
    </TouchableOpacity>
  )     
};

const googleStyles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2, // Negative value for vertical offset to show shadow at the top
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5, // Elevation for Android shadows
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    width: 24,
    height: 24,
  },
  textContainer: {},
  text: {
    fontSize: 16,
    color: '#000', // Adjust text color as needed
    fontFamily:'Quicksand-Bold',
  },
});
