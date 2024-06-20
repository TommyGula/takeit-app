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

  useEffect(() => {
    if (active && position) {
      onPress(position);
    };
  }, [position]);

  return (
    <TouchableWithoutFeedback onPress={() => onPress(position)}>
      <View ref={ref} onLayout={() => handleLayout(ref, (pos) => setPosition(pos))} style={[(active ? chatViewStyles.itemCardActive : {}), chatViewStyles.itemCard]}>
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
              item.messages.length ?
              <Text style={{...styles.text, ...styles.small}}>{shortText(item.messages[item.messages.length-1].message, 25, active)}</Text> : 
              <Text style={{...styles.text, ...styles.small}}>Nuevo chat</Text>
            }
          </View>
          {
            item.messages.length ?
            <View style={chatViewStyles.createdAt}>
              <Text style={{...styles.text}}>{new Date(item.messages[0].createdAt).getHours()}:{new Date(item.messages[item.messages.length-1].createdAt).getMinutes()} hs</Text>
            </View> : 
            <View style={chatViewStyles.createdAt}>
              <Text style={{...styles.text}}>{new Date(item.createdAt).getHours()}:{new Date(item.createdAt).getMinutes()} hs</Text>
            </View>
          }
        </View>
        {
          active &&
          <View style={chatViewStyles.ctaSection}>
            <Button style={chatViewStyles.cta} title={'Reservar'} onPress={handleBook} color={'secondary'}></Button>
            <Button style={chatViewStyles.cta} title={'Ir al chat'} onPress={handleBook} color={'secondary'}></Button>
          </View>
        }
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