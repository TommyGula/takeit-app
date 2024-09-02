import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { styles } from '../styles/global';
import Button from '../components/Button';

interface ConnectionErrorScreenProps {
  onRetry: () => void;
}

const ConnError: React.FC<ConnectionErrorScreenProps> = ({ onRetry }) => {
  return (
    <View style={styles.container}>
      <View style={{ ...styles.section, padding: 10}}>
        <Text style={styles.sectionTitle}>No Internet Connection</Text>
        <Text style={styles.text}>Please check your internet settings and try again.</Text>
        <Button title="Retry" color={'secondary'} onPress={onRetry} >REINTENTAR</Button>
      </View>
    </View>
  );
};

export default ConnError;
