import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableWithoutFeedback } from 'react-native';
import { styles, colors } from "../styles/global";
import { RadioButton } from 'react-native-paper';

const Payment = ({ name, item, active, onPress }) => {
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={[(active ? listViewStyles.itemCardActive : {}), listViewStyles.itemCard]}>
        <RadioButton value={name}/>
        <View style={{...listViewStyles.itemCardContent}}>
          <View style={listViewStyles.description}>
            <Text style={{...styles.text}}>{item.name}</Text>
          </View>
        </View>
        <View style={listViewStyles.imageContainer}>
            <Image
              source={typeof(item.thumbnail) == 'string' ? { uri: item.thumbnail } : item.thumbnail}
              style={listViewStyles.image}
            />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const listViewStyles = StyleSheet.create({
  itemCard: {
    paddingHorizontal: 20, 
    paddingVertical: 12,
    width: '100%', // Adjust the width as needed
    flexDirection:'row',
    alignItems:'center',
    borderColor:colors.gray.main,
    borderTopWidth:1,
  },
  itemCardActive: {
    backgroundColor: colors.primary.light,
    borderBottomColor: colors.primary.main,
    borderBottomWidth: 3
  },
  itemCardContent: {
    overflow: 'visible',
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: '20%',
    marginRight: 12,
  },
  image: {
    height: 40,
    margin:'auto',
    resizeMode: 'contain',
  },
  description: {
    width:'70%'
  },
});

export default Payment;