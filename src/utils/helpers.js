import {Dimensions} from 'react-native';

export const {width: WINDOW_WIDTH, height: WINDOW_HEIGHT} =
  Dimensions.get('window');

export const shortText = (str, maxStr, show) => {
    if (show) return str;
    if (!str) return;
    if (str.length < maxStr) return str;

    return str.toString().slice(0, maxStr) + "...";
};

export const prettyPrice = (price) => {
    price = price.toString().split(".");
    var number = price[0];
    var decimal = price.length > 1 ? price[1] : "00";
    return [number, decimal];
};

export const handleLayout = (ref, callback) => {
    ref.current.measure((x, y, width, height, pageX, pageY) => {
        callback({x, y, width, height, pageX, pageY});
    });
}