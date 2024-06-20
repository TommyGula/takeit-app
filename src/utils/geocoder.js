import Geocoder from 'react-native-geocoding';
import Config from "react-native-config";

Geocoder.init(Config.GOOGLE_MAPS_PLATFORM_API_KEY)

export default Geocoder;