import React from "react";
import { StyleSheet, View } from "react-native";

const Divider = () => {
    return(
        <View style={styles.divider} />
    )
};

export default Divider;

const styles = StyleSheet.create({
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0, 0, 0, 0.1)', // or any other color you prefer
      marginBottom: 20, // adjust this value to set the spacing above and below the line
    },
});
  