import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ImageBackground } from "react-native";
import { prettyPrice } from "../utils/helpers";
import { styles, colors } from "../styles/global";
import MPIcon from '../../assets/icons/mp.png';
import { requestLocationPermission } from '../services/ClientPermission';
import Geolocation from 'react-native-geolocation-service';
import Button from "../components/Button";
import Divider from "../components/Divider";
import { RadioButton } from 'react-native-paper';
import MP from '../utils/mercadopago';
import { useNotification } from "../NotificationProvider";
import axios from '../utils/axios';
import Payment from "../components/Payment";
import Dropdown from "../components/Dropdown";
import ModalComponent from "../components/Modal";
import CarouselComponent from "../components/Carousel";
import Loading from "./Loading";
import Storage from "../services/Storage";
import Media from "../components/Media";

const Selection = ({ navigation, route }) => {
    const { itemId } = route.params;
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [method, setMethod] = useState('mercadopago');
    const [modalVisible, setModalVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    const { showNotification } = useNotification();

    const [item, setItem] = useState(null);
    const [currUser, setCurrUser] = useState(null);

    useEffect(() => {
        getPlaceAndSetUser();
    },[]);

    const cash = [{
        id:'efectivo',
        name:"Efectivo",
        payment_type_id:'efectivo',
        thumbnail:'https://cdn-icons-png.freepik.com/512/2997/2997145.png'
    }];

    const getPlaceAndSetUser = () => {
        axios.get('places/' + itemId + '?taken=false', route.params.token)
        .then(async (placeResponse) => {
            // Handle responses here
            const placeData = placeResponse.data;
            const userData = await Storage.get('user');

            setItem(placeData);
            setCurrUser(JSON.parse(userData));
            setLoading(false);
        })
        .catch(err => {
            console.log(err)
            showNotification('Error', 'Hubo un error interno del sistema. Intenta más tarde.');
            navigation.navigate('Home');
        });
    };

    const getPaymentMethods = () => {
        axios.get('mp/payment/methods/' + item.userId._id, route.params.token)
            .then(data => {
                if (!data.data.length) {
                    setMethod('efectivo');
                };
                data = [...cash, ...data.data];
/*                 setPaymentMethods(data.reduce((r, a) => {
                    if (r[a.payment_type_id]) {
                        r[a.payment_type_id].push(a);
                    } else {
                        r[a.payment_type_id] = [a];
                    }
                    return r;
                }, { })); */
                setPaymentMethods(data);
            })
            .catch (err => {
                console.log('MP ERROR: ' ,err);
                showNotification('Error', err.message);
            })
    };

    const handleSubmit = async () => {
        if (method) {
            const token = await Storage.get('auth_token')
            if (!token) {
                showNotification('Error', 'Tu sesión expiró. Por favor inicia sesión nuevamente', null, 'alert', () => {
                    navigation.navigate('Logout');
                })
            };

            // Request location permission
            const locationPermissionGranted = await requestLocationPermission();
            if (!locationPermissionGranted) {
                console.log('Location permission denied ', locationPermissionGranted);
                return;
            };
        
            // Get user's current location
            Geolocation.getCurrentPosition(
                ({ coords }) => {
                axios.post('matches', {
                    sellerId: item.userId,
                    buyerId: currUser._id,
                    parkingId: item._id,
                    price: item.price,
                    currency: item.currency,
                    paymentMethod: method,
                    latitude:coords.latitude,
                    longitude:coords.longitude
                }, token)
                .then(response => {
                    console.log(JSON.stringify(response.data));
                    navigation.navigate('Summary', { matchId: response.data._id });
                })
                .catch(err => {
                    showNotification('Error', err.message, null, 'alert', () => {
                        navigation.navigate('Home');
                    });
                })
                },
            (error) => console.error(error),
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
            );
        }
    };

    useEffect(() => {
        if (item) {
            getPaymentMethods();
        }
    }, [item]);

    const openCarousel = (i) => {
        setModalVisible(true);
        setCurrentIndex(i);
    };

    return (
        <ScrollView showsVerticalScrollIndicator={false} vertical>
            <Loading visible={loading}></Loading>
            {
                !loading && item ?
                <>
                    {
                        item.pictures.length ? 
                        <ModalComponent visible={modalVisible} setVisible={setModalVisible}>
                            <CarouselComponent images={item.pictures} current={currentIndex}></CarouselComponent>
                        </ModalComponent> : null
                    }
                    <View style={[styles.container, { padding: 20, display: 'grid', gap: 20 }]}>

                        {/* Header Section */}
                        <View style={[styles.section, { padding: 10 }]}>
                            <View style={{ display: 'flex' }}>
                                <View style={selectionStyles.imageContainer}>
                                    <Image
                                        source={{ uri: 'https://freeiconshop.com/wp-content/uploads/edd/car-flat.png' }}
                                        style={selectionStyles.image}
                                    />
                                </View>
                                <Text style={{ textAlign: 'center', marginBottom: 20 }}>
                                    <Text style={selectionStyles.decimal}>{item.userId.firstName + ' ' + item.userId.lastName + (item.location ? '\n' + item.location : '')}</Text>
                                </Text>
                            </View>
                            {
                                item.pictures && item.pictures.length ?
                                <View style={{paddingHorizontal:10}}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{paddingVertical:10}}>
                                        <View style={{ flexDirection: 'row', gap:10 }}>
                                            {
                                                item.pictures.map((img, i) => {
                                                    return(
                                                        <TouchableOpacity key={i} onPress={() => openCarousel(i)}>
                                                            <Media Component={ImageBackground} source={{uri: img}} key={i} style={selectionStyles.galleryItem}></Media>
                                                        </TouchableOpacity>
                                                    )
                                                })
                                            }
                                        </View>
                                    </ScrollView>
                                </View> : null
                            }
                        </View>

                        {/* Payment Section */}
                        <View style={[styles.section, { padding: 10 }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <View>
                                    <Text>
                                        <Text style={{ fontSize: 18, color: '#000' }}>Total:</Text>
                                    </Text>
                                </View>
                                <View>
                                    <Text>
                                        <Text style={selectionStyles.number}>${prettyPrice(item.price)[0]}</Text>
                                        <Text style={selectionStyles.decimal}>{prettyPrice(item.price)[1]}</Text>
                                    </Text>
                                </View>
                            </View>
                            <Divider></Divider>
                            <View>
                                <Text style={styles.sectionTitle}>Medio de pago:</Text>
                                <View>
                                    <RadioButton.Group onValueChange={value => setMethod(value)} value={method}>
                                        {
/*                                             Object.keys(paymentMethods).map((type, i) => {
                                                return (
                                                    <View key={i} style={{marginBottom:0}}>
                                                        <Dropdown index={i} startsOpen={true} childProps={(x) => {
                                                            return(
                                                                {
                                                                    onPress:() => setMethod(x),
                                                                    active:method == x
                                                                }
                                                            )
                                                        }} Component={Payment} options={paymentMethods[type]} title={type.replace("_", " ").toLocaleUpperCase()}></Dropdown>
                                                    </View>
                                                )
                                            }) */
                                            paymentMethods.map((type, i) => {
                                                return(
                                                    <Payment key={i} onPress={() => setMethod(x)} active={method == type.id} item={type} name={type.id}></Payment>
                                                )
                                            })
                                        }
                                    </RadioButton.Group>
                                </View>
                            </View>
                        </View>
                        <Button title="Aceptar" onPress={handleSubmit} color={'secondary'} />
                    </View>
                </> : null
            }
        </ScrollView>
    )
};

const selectionStyles = StyleSheet.create({
    number: {
        ...styles.text,
        fontSize: 24,
        color: '#000'
    },
    decimal: {
        ...styles.text,
        fontSize: 16,
        color: '#000'
    },
    imageContainer: {
        display: 'flex',
        margin: 20,
        alignItems: 'center'
    },
    image: {
        width: 100,
        height: 100,
        margin: 'auto',
        resizeMode: 'contain',
    },
    galleryItem: {
        height: 80,
        width: 80,
        borderRadius:10,
        backgroundSize:'cover',
        backgroundPosition:'center center',
    }
});

export default Selection;