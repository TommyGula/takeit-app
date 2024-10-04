import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { styles } from '../styles/global';
import Button from '../components/Button';
import NoConn from '../../assets/images/no-conn.jpg';

const Error = ({ navigation, title, description }) => {
  return (
    <View style={[errorStyles.container]}>
      <View style={errorStyles.innerContainer}>
        <View style={errorStyles.imageContainer}>
          <Image
            source={{
              uri: 'https://cdn3.iconfinder.com/data/icons/shadcon/512/circle_-_corss-512.png',
            }}
            style={errorStyles.image}
          />
        </View>
        <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>{title ? title : 'Ha ocurrido un error'}</Text>
        <Text style={[errorStyles.text, { paddingBottom: 20 }]}>{description ? description : 'Intentaremos solucionarlo.'}</Text>
        <Button title="Retry" color={'secondary'} onPress={() => navigation.navigate('Home')} >VOLVER AL INICIO</Button>
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
    position: 'absolute',
    zIndex: 20,
    width: '100%',
  },
  innerContainer: {
    paddingHorizontal: 20
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    textAlign: 'center'
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


export default Error;
