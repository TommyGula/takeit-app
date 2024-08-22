import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { styles } from '../styles/global';

interface ConnectionErrorScreenProps {
  onRetry: () => void;
}

const ConnError: React.FC<ConnectionErrorScreenProps> = ({ onRetry }) => {
  return (
    <View style={styles.container}>
      <View style={{ ...styles.section, padding: 10}}>
        <Text style={connErrStyles.errorText}>No Internet Connection</Text>
        <Text style={connErrStyles.subText}>Please check your internet settings and try again.</Text>
        <Button title="Retry" onPress={onRetry} />
      </View>
    </View>
  );
};

const connErrStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default ConnError;
