import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text, Image } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Config from 'react-native-config';


GoogleSignin.configure({
  webClientId: Config.GOOGLE_CLIENT_ID, // client ID of type WEB for your server. Required to get the `idToken` on the user object, and for offline access.
  scopes: ['https://www.googleapis.com/auth/business.manage'], // what API you want to access on behalf of the user, default is email and profile
  offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
  profileImageSize: 120, // [iOS] The desired height (and width) of the profile image. Defaults to 120px
});

export default function GoogleAuth({text}) {
  const handleLoginPress = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('GOOGLE LOGIN: ', JSON.stringify(userInfo, null, 2));
    } catch (error) {
      console.log('GOOGLE LOGIN ERROR: ', error)
      if (error.code) {
        switch (error.code) {
          case statusCodes.NO_SAVED_CREDENTIAL_FOUND:
            // no saved credential found, try calling `createAccount`
            break;
          case statusCodes.SIGN_IN_CANCELLED:
            // sign in was cancelled
            break;
          case statusCodes.ONE_TAP_START_FAILED:
            // Android and Web only, you probably have hit rate limiting.
            // On Android, you can still call `presentExplicitSignIn` in this case.
            // On the web, user needs to click the `WebGoogleSigninButton` to sign in.
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            // Android-only: play services not available or outdated
            break;
          default:
          // something else happened
        }
      } else {
        // an error that's not related to google sign in occurred
      }
    }
  };

  return(
    <TouchableOpacity onPress={handleLoginPress} style={googleStyles.button}>
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
