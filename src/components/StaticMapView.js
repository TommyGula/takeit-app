import React, { useEffect } from "react";
import { Image, View } from "react-native";
import Config from "react-native-config";
import { styles } from "../styles/global";

function encodePolyline(points) {
    console.log("POINTS ", points)
    let encoded = '';
    let prevLat = 0;
    let prevLng = 0;

    for (const point of points) {
        const lat = Math.round(point.latitude * 1e5);
        const lng = Math.round(point.longitude * 1e5);

        const dLat = lat - prevLat;
        const dLng = lng - prevLng;

        prevLat = lat;
        prevLng = lng;

        encoded += encodeSignedNumber(dLat) + encodeSignedNumber(dLng);
    }

    return encoded;
}

// Function to encode a signed number into the polyline format
function encodeSignedNumber(num) {
    let sgnNum = num << 1;

    if (num < 0) {
        sgnNum = ~sgnNum;
    }

    return encodeNumber(sgnNum);
}

// Function to encode a number into the polyline format
function encodeNumber(num) {
    let encoded = '';

    while (num >= 0x20) {
        encoded += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
        num >>= 5;
    }

    encoded += String.fromCharCode(num + 63);
    return encoded;
}

const StaticMapView = ({origin, destination, style}) => {
    const apiKey = Config.GOOGLE_MAPS_STATIC_API_KEY;
    const polyline = encodePolyline([origin, destination]);

    // Construct the URL for the static map image with polyline for directions
    const imageUrl = `https://maps.googleapis.com/maps/api/staticmap?size=400x400&path=color:0x0000ff|weight:5|enc:${polyline}&key=${apiKey}`;
    
    useEffect(() => {
        console.log('Static map: ', imageUrl);
    },[]);

    return (
        <View style={[styles.shadow, style]}>
            <Image
              source={{ uri: imageUrl }}
              style={style}
            />
        </View>
    );
};

export default StaticMapView;