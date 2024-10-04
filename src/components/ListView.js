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
      //onPress(position);
    };
  }, [position]);

  return (
    <TouchableWithoutFeedback onPress={() => onPress(position)}>
      <View ref={ref} onLayout={() => handleLayout(ref, (pos) => setPosition(pos))} style={[(active ? listViewStyles.itemCardActive : {}), style]}>
        <View style={listViewStyles.itemCard}>
          <View style={{ ...listViewStyles.itemCardContent, justifyContent: 'space-between' }}>
            <View style={{ ...listViewStyles.itemCardContent }}>
              <View style={listViewStyles.imageContainer}>
                <Image
                  source={{ uri: (item.image || 'https://freeiconshop.com/wp-content/uploads/edd/car-flat.png') }}
                  style={listViewStyles.image}
                />
              </View>
              <View style={listViewStyles.description}>
                <Text style={{ ...styles.text, ...styles.bold }}>
                  {
                    item.userId ?
                      item.userId.firstName + ' ' + item.userId.lastName :
                      item.name
                  }
                  {' '}
                  {
                    item.status ?
                      <View style={[listViewStyles.status, { backgroundColor: item.statusColor || styles.color.secondary }]}><Text style={[styles.small, { color: '#fff' }]}>{item.status}</Text></View> : null
                  }
                </Text>
                <Text style={{ ...styles.text, ...styles.small }}>{shortText(item.location, (maxLength || 35), active)}</Text>
              </View>
            </View>
            <View style={listViewStyles.price}>
              {
                item.price ?
                  <Text style={{ ...styles.text }}>{pre}{item.price}</Text> : null
              }
              {
                item.link ?
                  <Text style={{ ...styles.text, ...styles.small, ...{ color: colors.secondary.main, textAlign: 'right' } }}>{item.linkLabel || 'más info'}</Text> : null
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
      </View>
    </TouchableWithoutFeedback>
  );
};

const listViewStyles = StyleSheet.create({
  itemCard: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#c2c2c2'
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
    flexDirection: 'row',
    justifyContent: 'center',
    marginRight: 20,
  },
  image: {
    width: '100%',
    height: 60,
    margin: 'auto',
    resizeMode: 'contain',
  },
  status: {
    borderRadius: 10,
    paddingHorizontal: 10,
    marginLeft: 10
  },
  description: {
    width: '60%'
  },
  price: {
    marginLeft: -20
  },
  ctaSection: {
    paddingTop: 15,
    flexDirection: 'row', // Display children horizontally
    alignItems: 'center', // Align children vertically in the center
    justifyContent: 'space-around',
    gap: 30
  },
  cta: {
    width: '40%'
  }
});

export default ListView;