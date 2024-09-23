import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { styles } from '../styles/global';
import Button from '../components/Button';
import NoConn from '../../assets/images/no-conn.jpg';

interface ConnectionErrorScreenProps {
  onRetry: () => void;
}

const ConnError: React.FC<ConnectionErrorScreenProps> = ({ onRetry }) => {
  return (
    <View style={[errorStyles.container]}>
      <View style={errorStyles.innerContainer}>
        <View style={errorStyles.imageContainer}>
          <Image
            source={NoConn}
            style={errorStyles.image}
          />
        </View>
        <Text style={[styles.sectionTitle, {textAlign:'center'}]}>No Internet Connection</Text>
        <Text style={[errorStyles.text, {paddingBottom:20}]}>Please check your internet settings and try again later.</Text>
        <Button title="Retry" color={'secondary'} onPress={onRetry} >REINTENTAR</Button>
      </View>
    </View>
  );
};

const errorStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff', // White background with some transparency
    justifyContent: 'center',
    alignItems: 'center',
    position:'absolute',
    zIndex:20,
    width:'100%',
  },
  innerContainer: {
    paddingHorizontal:20
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    textAlign:'center'
  },
  imageContainer: {
    display: 'flex',
    margin: 20,
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    margin: 'auto',
    resizeMode: 'contain',
  },
});


export default ConnError;
