import React, { useRef, useState, useEffect } from "react";
import LinearGradient from "react-native-linear-gradient";
import { ScrollView, TextInput, View, Text, ImageBackground, TouchableOpacity, StyleSheet } from "react-native";
import Loading from "./Loading";
import Media from "../components/Media";
import TakePicture from "../components/TakePicture";
import { colors, styles } from "../styles/global";
import { useNotification } from "../NotificationProvider";
import { Picker } from "@react-native-picker/picker";
import axios from '../utils/axios';
import Storage from '../services/Storage';
import Config from "react-native-config";
import ModalComponent from "../components/Modal";
import CarouselComponent from "../components/Carousel";
import { requestLocationPermission } from '../services/ClientPermission';
import Geolocation from 'react-native-geolocation-service';
import Geocoder from "../utils/geocoder";
import MeIcon from '../../assets/icons/me.png';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import Button from "../components/Button";
import { useFocusEffect } from "@react-navigation/native";

const NewPlace = ({ navigation, route }) => {
    const placeId = route.params && route.params.parkingId;
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(true);
    const [place, setPlace] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [errors, setErrors] = useState([]);
    const [cars, setCars] = useState(null);
    const [region, setRegion] = useState(null);

    useEffect(() => {
        if (placeId) navigation.navigate('LivePlace', { parkingId: placeId });
        getData();
    },[]);

    useEffect(() => {
        const getLocation = async () => {
          // Request location permission
          const locationPermissionGranted = await requestLocationPermission();
          if (!locationPermissionGranted) {
            console.log('Location permission denied ', locationPermissionGranted);
            return;
          }
    
          // Get user's current location
          Geolocation.getCurrentPosition(
            ({ coords }) => {
                Geocoder.from(coords)
                .then(json => {
                  var location = json.results[0].formatted_address;
                  setRegion({
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                    location:location
                  });
                })
                .catch(error => console.warn(error));
      
              },
            (error) => console.error(error),
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
          );
        };
    
        getLocation();
      }, []);

    const { showNotification } = useNotification(); 

    const getData = async () => {
        const u = await Storage.get('user');
        const token = await Storage.get('auth_token');
        const currUser = JSON.parse(u);
        setUser(currUser);
        axios.get('cars?userId=' + currUser._id, token)
        .then(response => {
            setCars(response.data);
            console.log('RESPONSE ', response.data)
            setLoading(false);
        })
        .catch(err=> {
            showNotification('Error', err.message);
        })
    };

    useFocusEffect(
        React.useCallback(() => {
            if (cars && !cars.length) {
                showNotification('Atención', 'Antes de intercambiar tu lugar con alguien más, te recomendamos agregar información sobre tu coche y tus licencias en tu perfil, para así hacer un intercambio más seguro.', null, 'alert', null, [
                    { text: 'Volver', onPress: () => navigation.navigate('Home') },
                    { text: 'Ir a mi perfil', onPress: () => navigation.navigate('Settings') },
                ], null, () => navigation.navigate('Home'))
            }
        },[cars])
    )

    const pickerRef = useRef(null);
    
    const handleSelect = (key, val) => {
        setErrors(errors.filter(e=>e!=key));
        setPlace({...place, [key]:val});
    };
    
    const handleUpload = (newFileName) => {
        if (newFileName[0] == '/') {
            newFileName = newFileName.replace('/uploads', 'uploads')
        }
        setPlace({...place, pictures:(place && place.pictures ? [...place.pictures, newFileName] : [newFileName])});
    };

    const handleSubmit = async () => {
        const token = await Storage.get('auth_token');
        const validation = ['carId', 'price'].reduce((r,a) => {
            if (!place[a]) {
                r.push(a);
                return r;
            } else {
                return r;
            }
        },[]);
        if (validation.length) {
            setErrors(validation)
        } else {
            axios.post('places', {
                ...region,
                ...place,
                userId:user._id
            }, token)
            .then(response=>{
                if (response.data) {
                    const newId = response.data._id;
                    navigation.navigate('LivePlace', { parkingId: newId });
                }
            })
            .catch(err=>{
                showNotification('Error', err.message);
            })
        };
    };

    const openCarousel = (i) => {
        setModalVisible(true);
        setCurrentIndex(i);
    };

    return(
        <View style={StyleSheet.absoluteFillObject}>
        <Loading visible={loading}></Loading>
        {
            !loading && user ?
            <LinearGradient colors={[colors.primary.main, '#fff']} style={StyleSheet.absoluteFillObject}>
                {
                    place && place.pictures && place.pictures.length ? 
                    <ModalComponent visible={modalVisible} setVisible={setModalVisible}>
                        <CarouselComponent images={place.pictures} current={currentIndex}></CarouselComponent>
                    </ModalComponent> : null
                }
                <ScrollView vertical >
                    <View style={{padding:10}}>
                        <View style={[styles.section, {padding:15}]}>
                            <Text style={[styles.sectionTitle]}>¡Estás a solo un paso!</Text>
                            <View style={newPlaceStyles.grid}>
                                <View style={newPlaceStyles.row}>
                                    <View style={newPlaceStyles.gridItem}>
                                        <Text style={[styles.text, {marginBottom:10}]}>Indica un precio (*)</Text>
                                        <TextInput
                                            style={newPlaceStyles.input}
                                            keyboardType="numeric"
                                            placeholder="1000"
                                            value={(place && place.price ? place.price : null)}
                                            onChangeText={(val) => handleSelect('price', val)}
                                            multiline
                                        />
                                        {
                                            errors.includes('price') ?
                                            <Text style={[styles.small, {color:'red'}]}>Campo requerido</Text> : null
                                        }
                                    </View>
                                    <View style={newPlaceStyles.gridItem}>
                                        <Text style={[styles.text, {marginBottom:10}]}></Text>
                                        <Button style={styles.shadow} color='primary' onPress={() => setPlace({...place, price:'0.00'})}>GRÁTIS</Button>
                                    </View>
                                </View>
                                <View >
                                    <Text style={[styles.text]}>¿Qué auto estás usando? (*)</Text>
                                    <View style={newPlaceStyles.selector}>
                                        <Picker ref={pickerRef} selectedValue={place && place.carId ? place.carId : null} onValueChange={(val, i) => handleSelect('carId', val)}>
                                            <Picker.Item label={'Selecciona...'} value={null}></Picker.Item>
                                            {
                                                cars && cars.map((car,i) => {
                                                    return(
                                                        <Picker.Item key={i} label={car.brandName + ' ' + car.modelName + ' ' + car.year} value={car._id}></Picker.Item>
                                                    )
                                                })
                                            }
                                        </Picker>
                                    </View>
                                    {
                                        errors.includes('carId') ?
                                        <Text style={[styles.small, {color:'red'}]}>Campo requerido</Text> : null
                                    }
                                </View>
                            </View>
                            <Text style={[styles.text, styles.bold, {marginVertical:20}]}>Añadí alguna foto</Text>
                            <View>
                                <View>
                                {
                                    place && place.pictures && place.pictures.length ?
                                    <View style={{paddingHorizontal:10}}>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{paddingVertical:10}}>
                                            <View style={{ flexDirection: 'row', gap:10 }}>
                                                {
                                                    place.pictures.map((img, i) => {
                                                        img = img[0] == '/' ? img.slice(1) : img;
                                                        return(
                                                            <TouchableOpacity key={i} onPress={() => openCarousel(i)}>
                                                                <Media Component={ImageBackground} source={{uri: Config.API_URL + img}} key={i} style={newPlaceStyles.galleryItem}></Media>
                                                            </TouchableOpacity>
                                                        )
                                                    })
                                                }
                                            </View>
                                        </ScrollView>
                                    </View> :
                                    <View>
                                        <Text style={styles.text}>No hay fotos cargadas.</Text>
                                    </View>
                                }
                                <TakePicture disabled={place && place.pictures && place.pictures.length >= 4} onUpload={handleUpload} color='primary' style={{width:'30%', paddingVertical:5, marginTop:20, paddingHorizontal:5}} styleText={{fontSize:14}} onPress={() => null}>+ AÑADIR</TakePicture>
                                </View>
                            </View>
                            <View style={{paddingVertical:20}}>
                                {/* Map */}
                                <MapView style={newPlaceStyles.map} region={region} provider={PROVIDER_GOOGLE}>
                                    {region && <Marker coordinate={region} image={MeIcon}/>}
                                </MapView>
                            </View>
                            {
                                region ?
                                <Text style={styles.small}>{region.location}</Text> : null
                            }
                        </View>
                    </View>
                    <View style={{marginTop:10, paddingHorizontal:'30%'}}>
                        <Button style={styles.shadow} disabled={!place || !place.carId || errors.length > 0} color='primary' onPress={handleSubmit}>INICIAR</Button>
                    </View>
                </ScrollView>
            </LinearGradient> : null
        }
        </View>
    )
};

const newPlaceStyles = StyleSheet.create({
    input: {
        borderWidth:1,
        flex: 1,
        width:'auto',
        borderRadius: 5,
        paddingHorizontal: 10,
        borderColor:colors.gray.main,
    },
    galleryItem: {
        height: 80,
        width: 80,
        borderRadius:10,
        backgroundSize:'cover',
        backgroundPosition:'center center',
    },
    map: {
        height:200,
        width:'100%'
    },
    selector: {
        borderWidth:1,
        flex: 1,
        width:'auto',
        borderRadius: 5,
        paddingVertical:0,
        borderColor:colors.gray.main,
        marginTop:10
    },
    galleryItem: {
        height: 80,
        width: 80,
        borderRadius:10,
        backgroundSize:'cover',
        backgroundPosition:'center center',
    },
    grid: {
        flex:1,
        gap:10,
        flexDirection: 'column'
    },
    row: {
        maxWidth:'100%',
        flexDirection: 'row', // Each row will contain items horizontally
        justifyContent: 'space-between', // Items are spaced evenly in each row
    },
    gridItem: {
        width:'48.375%'
    },
    error: {
        color:'red'
    }
});

export default NewPlace;