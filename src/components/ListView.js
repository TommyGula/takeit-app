import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableWithoutFeedback } from 'react-native';
import { styles, colors } from "../styles/global";
import { handleLayout, shortText } from "../utils/helpers";
import Button from "./Button";

const ListView = ({ item, active, onPress, navigation, pre, style, leftButtonAction, leftButtonLabel, rightButtonAction, rightButtonLabel, maxLength }) => {
  const [position, setPosition] = useState(null);
  const ref = useRef(null);
  const handleBook = () => {
    navigation.navigate('Selection', { itemId: item._id });
  };

  const handleGoToProfile = () => {
    navigation.navigate('UserProfile', { profileUser: item.userId });
  };

  useEffect(() => {
    if (active && position) {
      onPress(position);
    };
  }, [position]);

  return (
    <TouchableWithoutFeedback onPress={() => onPress(position)}>
      <View ref={ref} onLayout={() => handleLayout(ref, (pos) => setPosition(pos))} style={[(active ? listViewStyles.itemCardActive : {}), listViewStyles.itemCard, style]}>
        <View style={{...listViewStyles.itemCardContent, justifyContent:'space-between'}}>
          <View style={{...listViewStyles.itemCardContent}}>
            <View style={listViewStyles.imageContainer}>
              <Image
                source={{ uri: (item.image || 'https://freeiconshop.com/wp-content/uploads/edd/car-flat.png') }}
                style={listViewStyles.image}
              />
            </View>
            <View style={listViewStyles.description}>
              {
                item.userId ? 
                <Text style={{...styles.text, ...styles.bold}}>{item.userId.firstName + ' ' + item.userId.lastName}</Text>:
                <Text style={{...styles.text, ...styles.bold}}>{item.name}</Text>
              }
              <Text style={{...styles.text, ...styles.small}}>{shortText(item.location, (maxLength || 35), active)}</Text>
            </View>
          </View>
          <View style={listViewStyles.price}>
              {
                item.price ?
                <Text style={{...styles.text}}>{pre}{item.price}</Text> : null
              }
              {
                item.link ?
                <Text style={{...styles.text, ...styles.small, ...{color:colors.secondary.main, textAlign:'right'}}}>{item.linkLabel || 'más info'}</Text> : null
              }
            </View>
        </View>
        {
          active &&
          <View style={listViewStyles.ctaSection}>
            <Button style={listViewStyles.cta} title={leftButtonLabel || 'Reservar'} onPress={leftButtonAction || handleBook} color={'secondary'}></Button>
            <Button style={listViewStyles.cta} title={rightButtonLabel || 'Ver perfil'} onPress={rightButtonAction || handleGoToProfile} color={'secondary'}></Button>
          </View>
        }
      </View>
    </TouchableWithoutFeedback>
  );
};

const listViewStyles = StyleSheet.create({
  itemCard: {
    paddingVertical: 12,
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
    flexDirection:'row',
    justifyContent:'center',
    marginRight: 20,
  },
  image: {
    width: '100%',
    height: 60,
    margin:'auto',
    resizeMode: 'contain',
  },
  description: {
    width:'60%'
  },
  price: {
    marginLeft:-20
  },
  ctaSection: {
    paddingTop:15,
    flexDirection: 'row', // Display children horizontally
    alignItems: 'center', // Align children vertically in the center
    justifyContent: 'space-around', 
    gap:30
  },
  cta: {
    width:'40%'
  }
});

export default ListView;