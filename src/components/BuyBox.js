import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Image, TouchableOpacity, ScrollView } from "react-native";
import { prettyPrice } from "../utils/helpers";
import { styles, colors } from "../styles/global";
import Button from "./Button";

const BuyBox = ({item, setItem, onPress}) => {
    const slideAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(slideAnimation, {
            toValue: item ? 1 : 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [item]);

    const translateY = slideAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [300, 0], // Adjust the initial and final positions as needed
    });

    const close = () => {
        setItem(null);
    };

    return(
        <Animated.View style={[buyBoxStyles.box, { transform: [{ translateY }] }]}>
            <TouchableOpacity onPress={close} style={{position:'absolute', top:0, left:0, zIndex:3, paddingVertical:10, paddingHorizontal:20}}>
                <Text style={buyBoxStyles.number}>X</Text>
            </TouchableOpacity>
            <ScrollView vertical showsVerticalScrollIndicator={false} style={styles.scrollView}>
                <View style={{display:'flex'}}>
                    <Text style={{textAlign:'center'}}>
                        {
                            item?
                            <>
                                <Text style={buyBoxStyles.number}>${prettyPrice(item.price)[0]}</Text>
                                <Text style={buyBoxStyles.decimal}>{prettyPrice(item.price)[1]}</Text>
                            </> : null
                        }
                    </Text>
                    <View style={buyBoxStyles.imageContainer}>
                        <Image
                            source={{ uri: 'https://freeiconshop.com/wp-content/uploads/edd/car-flat.png' }}
                            style={buyBoxStyles.image}
                        />
                    </View>
                    <Text style={{textAlign:'center', marginBottom:20}}>
                        {
                            item &&
                        <Text style={buyBoxStyles.decimal}>{item.location}</Text>
                        }
                    </Text>
                    <Button title="Contactar" onPress={onPress} color={'secondary'}/>
                </View>
            </ScrollView>
        </Animated.View>
    )
};

const buyBoxStyles = StyleSheet.create({
    box: {
        width:'100%',
        paddingVertical:10,
        paddingHorizontal:20,
        height:300,
        textAlign:'center',
        position:'absolute',
        bottom:0,
        zIndex:2,
        ...styles.section,
    },
    number:{
        ...styles.text,
        fontSize:24,
        color:'#000'
    },
    decimal: {
        ...styles.text,
        fontSize:16,
        color:'#000'
    },
    imageContainer: {
        display:'flex',
        margin:20,
        alignItems:'center'
    },
    image: {
        width: 100,
        height: 100,
        margin:'auto',
        resizeMode: 'contain',
    },
});

export default BuyBox;