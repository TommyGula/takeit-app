import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableWithoutFeedback } from 'react-native';
import { styles, colors } from "../styles/global";
import { handleLayout, shortText } from "../utils/helpers";
import Button from "./Button";

const ChatView = ({ item, active, onPress, navigation }) => {
  const [position, setPosition] = useState(null);
  const ref = useRef(null);
  const handleBook = () => {
    navigation.navigate('Selection', { itemId: item._id });
  };

  return (
    <TouchableWithoutFeedback onPress={() => onPress(position)}>
      <View ref={ref} onLayout={() => handleLayout(ref, (pos) => setPosition(pos))} style={[chatViewStyles.itemCard]}>
        <View style={{...chatViewStyles.itemCardContent}}>
          <View style={chatViewStyles.imageContainer}>
            <Image
              source={{ uri: 'https://freeiconshop.com/wp-content/uploads/edd/car-flat.png' }}
              style={chatViewStyles.image}
            />
          </View>
          <View style={chatViewStyles.description}>
            <Text style={{...styles.text, ...styles.bold}}>{item.name}</Text>
            {
              item.latestMessage ?
              <Text style={{...styles.text, ...styles.small, fontWeight:(active ? 800 : 100)}}>{shortText(item.latestMessage.message, 25, active)}</Text> : 
              <Text style={{...styles.text, ...styles.small, fontWeight:(active ? 800 : 100)}}>Nuevo chat</Text>
            }
          </View>
          {
            item.latestMessage ?
            <View style={chatViewStyles.createdAt}>
              <Text style={{...styles.small, fontWeight:(active ? 800 : 100)}}>{new Date(item.latestMessage.createdAt).toLocaleDateString() + '\n'}{new Date(item.latestMessage.createdAt).getHours().toString().padStart(2, '0')}:{new Date(item.latestMessage.createdAt).getMinutes().toString().padStart(2, '0')} hs</Text>
            </View> : 
            <View style={chatViewStyles.createdAt}>
              <Text style={{...styles.small, fontWeight:(active ? 800 : 100)}}>{new Date(item.createdAt).toLocaleDateString() + '\n'}{new Date(item.createdAt).getHours().toString().padStart(2, '0')}:{new Date(item.createdAt).getMinutes().toString().padStart(2, '0')} hs</Text>
            </View>
          }
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const chatViewStyles = StyleSheet.create({
  itemCard: {
    paddingHorizontal: 20, 
    paddingVertical: 12,
    width: '100%', // Adjust the width as needed
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
    width: 80,
    height: 60,
    margin:'auto',
    resizeMode: 'contain',
  },
  description: {
    width:'55%'
  },
  createdAt: {
    width: '25%',
    marginLeft: 12,
  },
  ctaSection: {
    paddingTop:15,
    flexDirection: 'row', // Display children horizontally
    alignItems: 'center', // Align children vertically in the center
    justifyContent: 'space-around', 
    gap:30
  },
  cta: {
    width:'50%'
  }
});

export default ChatView;