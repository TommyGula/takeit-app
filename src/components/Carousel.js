import React from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import Carousel from 'react-native-snap-carousel';
import Media from './Media';
import Config from 'react-native-config';

const { width: screenWidth } = Dimensions.get('window');

const CarouselComponent = ({ images, current=0 }) => {
    const renderItem = ({ item }) => {
        return (
            <View key={images.indexOf(item)} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Media 
                source={{uri: !item.includes('http') ? Config.API_URL + (item[0] == '/' ? item.slice(1) : item) : item}}
                style={{ width: screenWidth - 40, height: 200, borderRadius: 10 }}
                ></Media>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Carousel
                data={images}
                renderItem={renderItem}
                sliderWidth={screenWidth}
                itemWidth={screenWidth - 40}
                loop={true}
                autoplay={false}
                autoplayInterval={3000}
                layout="default"
                firstItem={current}
            />
        </View>
    );
};

export default CarouselComponent;
