import React, { useState, useEffect, useRef } from "react";
import { ScrollView, View, StyleSheet, Image, Text, TouchableOpacity, BackHandler, Linking } from "react-native";
import { styles, colors } from '../styles/global';
import ParkIcon from '../../assets/icons/park.png';
import MeIcon from '../../assets/icons/me.png';
import Config from "react-native-config";
import Divider from "../components/Divider";
import Table from "../components/Table";
import Button from "../components/Button";
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import MapViewDirections from "react-native-maps-directions";
import { requestLocationPermission } from '../services/ClientPermission';
import Loading from './Loading';
import axios from '../utils/axios';
import Storage from "../services/Storage";
import Geolocation from 'react-native-geolocation-service';
import { useNotification } from "../NotificationProvider";
import socket from '../services/SocketIO';
import Geocoder from "../utils/geocoder";
import StaticMapView from "../components/StaticMapView";

const Summary = ({ route, navigation }) => {
    const { matchId } = route.params;
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [region, setRegion] = useState(null);
    const [open, setOpen] = useState(false);
    const [summary, setSummary] = useState(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isCancelled, setIsCancelled] = useState(false);

    const { showNotification } = useNotification();

    const mapRef = useRef(null);

    const getData = async () => {
        const u = await Storage.get('user');
        const token = await Storage.get('auth_token');
        axios.get('matches/' + matchId, token)
        .then(response=>{
            if (response.data) {
                axios.get('places/' + response.data.parkingId, token)
                .then(response2=>{
                    setSummary(response2.data);
                    setIsCancelled(response.data.cancelled);
                    setIsConfirmed(response.data.accepted);
                    setUser(JSON.parse(u));
                    setLoading(false);
                    if (response.data.cancelled) {
                        navigation.navigate('Home');
                        showNotification('Error', 'Lo sentimos. El encuentro ya fue cancelado');
                    }
                })
                .catch(err=>{
                    showNotification('Error', err.message);
                })
            }
        })
        .catch(err=>{
            showNotification('Error', err.message);
        })
    };

    useEffect(() => {
        if (summary && region && mapRef.current) {
            handleZoomAndCenter([region, {
                latitude:summary.latitude,
                longitude:summary.longitude,
            }]);

            const distance = calculateDistance(region.latitude, region.longitude, summary.latitude, summary.longitude);
        };
        console.log('A ver... ', summary != null, region != null, mapRef.current != null)
    },[summary, region, mapRef.current]);

    const handleZoomAndCenter = (coordinates) => {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
    };

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180; // Convert latitude from degrees to radians
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
    
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
        const distance = R * c; // Distance in meters
        return distance;
    };

    useEffect(() => {
        const handleTakenMatch = (takenMatchId) => {
            setIsConfirmed(takenMatchId === matchId);
            setIsCancelled(takenMatchId !== matchId);
        };

        const handleCancelMatch = (takenMatchId) => {
            setIsConfirmed(false);
            setIsCancelled(takenMatchId === matchId);
        };

        const handleDeletedPlace = (placeId) => {
            showNotification('Lo sentimos...', 'El usuario canceló el encuentro.', null, 'alert', () => {
                navigation.navigate('Home');
            })
        };

        const handleFinishMatch = () => {
            showNotification('¡Llegaste a destino!', summary.paymentMethod == 'efectivo' && summary.price ? 'Asegurate de dar a quien te ofreció el lugar su propina correspondiente de ' + summary.currency + ' ' + summary.price : summary.price ? 'Tu pago ya fue efectuado. ¡Muchas gracias!' : 'Gracias por utilizar nuestra aplicación. Esperamos que te haya sido de utilidad.', null, 'alert', () => {
                navigation.navigate('Home');
            });
        };

        if (summary && user) {
            socket.on('cancelledMatch_' + user._id, handleCancelMatch)
            socket.on('takenMatch_' + user._id, handleTakenMatch); // A new match is saved in database
            socket.on('deletePlace_' + user._id, handleDeletedPlace);
            socket.on('matchFinished_' + user._id, handleFinishMatch);
            return () => {
                socket.off('cancelledMatch_' + user._id, handleCancelMatch);
                socket.off('takenMatch_' + user._id, handleTakenMatch);
                socket.off('deletePlace_' + user._id, handleDeletedPlace);
                socket.off('matchFinished_' + user._id, handleFinishMatch);
            };
        }
    },[summary, user])

    // Add event listener for hardware back button press
    useEffect(() => {
        BackHandler.addEventListener('hardwareBackPress', cancelEverything);

        // Clean up event listener when the component unmounts
        return () => {
            BackHandler.removeEventListener('hardwareBackPress', cancelEverything);
        };
    }, []);

    useEffect(() => {
        const getLocation = async () => {
          // Request location permission
          const locationPermissionGranted = await requestLocationPermission();
          if (!locationPermissionGranted) {
            console.log('Location permission denied ', locationPermissionGranted);
            return;
          }

          // Token
          const token = await Storage.get('auth_token');
          getData();
          
          const positionHandler = (cb1, cb2) => {
            Geolocation.getCurrentPosition(cb1, cb2);
            Geolocation.watchPosition(cb1, cb2);
          };

          // Get user's current location
          positionHandler(
              ({ coords }) => {
                console.log('Getting location');
                Geocoder.from(coords)
                .then(json => {
                    var location = json.results[0].formatted_address;
                    setRegion({
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        location: location,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    });

                    axios.put('matches/' + matchId, {
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }, token)
                    .then(res=>res)
                    .catch(err=> {
                        showNotification('Error updating position', err.message);
                    })
                })
            },
            (error) => console.error(error),
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
          );

          return () => {
            Geolocation.clearWatch(watcher);
          };
        };
    
        getLocation();
    }, []);

    const initNavegation = () => {
        const item = summary;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${region.latitude},${region.longitude}&destination=${item.latitude},${item.longitude}`;
        Linking.openURL(url).then((supported) => {
          if (!supported) {
            showNotification('Error', 'Opening Google Maps is not supported on this device');
          }
        }).catch((err) => showNotification('Error opening Google Maps:', err));
    };

    const cancelEverything = () => {
        showNotification('Confirmar', '¿Seguro que quieres cancelar el encuentro? No se te cargarán costos adicionales', null, 'alert', null, [
            { text: 'VOLVER', onPress: () => null },
            { text: 'CONFIRMAR', onPress: async () => {
                const token = await Storage.get('auth_token');
                axios.put('matches/' + matchId, {
                    cancelled:true,
                }, token)
                .then(response=>{
                    navigation.navigate('Home');
                    showNotification('OK', 'Se canceló tu encuentro.')
                })
                .catch(err=>showNotification('Error', err.message));
            }},
        ]);
        return true;
    };

    const goToChat = () => {
        axios.get('chats?matchId=' + matchId)
        .then(response => {
            //console.log('Chat! ', response.data[0], user._id)
            const chat = response.data[0];
            navigation.navigate('Chat', { chatId:chat._id, userName:chat.titles[user._id] })
        })
        .catch(err => showNotification('Error', err.message));
    };

    const goToProfile = () => {
        navigation.navigate('UserProfile', { profileUser: summary.userId })
    };

    if (loading) {
        return(
            <Loading visible={loading}></Loading>
        )
    } else {
        return(
            <>
                {
                    loading ?
                    <Loading visible={loading}></Loading>
                    :
                    <ScrollView showsVerticalScrollIndicator={false} vertical>
                        <View style={[styles.container, { padding: 20, display: 'grid', gap: 20 }]}>
                            <View style={[styles.section, { padding: 10}]}>
                                {
                                    isConfirmed ?
                                    <>
                                    <View style={summaryStyles.imageContainer}>
                                        <Image
                                            source={{ uri: 'https://cdn0.iconfinder.com/data/icons/social-messaging-ui-color-shapes-3/3/31-512.png' }}
                                            style={summaryStyles.image}
                                        />
                                    </View>
                                    <Text style={{ textAlign: 'center', marginBottom: 20 }}>
                                        <Text style={styles.text}>¡Tu lugar para estacionar está esperandote!</Text>
                                    </Text>
                                    </> :
                                    null
                                }
                                {
                                    isCancelled ?
                                    <>
                                    <View style={summaryStyles.imageContainer}>
                                        <Image
                                            source={{ uri: 'https://cdn3.iconfinder.com/data/icons/shadcon/512/circle_-_corss-512.png' }}
                                            style={summaryStyles.image}
                                        />
                                    </View>
                                    <Text style={{ textAlign: 'center', marginBottom: 20 }}>
                                        <Text style={styles.text}>El usuario rechazó tu solicitud o el lugar ya fue tomado por otro conductor</Text>
                                    </Text>
                                    </> :
                                    null
                                }
                                {
                                    !isConfirmed && !isCancelled ? 
                                    <>
                                        <Text style={{...styles.text, textAlign:"center"}}>Esperando respuesta...</Text>
                                        <Loading style={{paddingVertical:50}} visible={!isConfirmed} text={'Esperando confirmación...'}></Loading>
                                    </> : null
                                }
                                <Divider></Divider>
                                <View>
                                    <TouchableOpacity onPress={() => setOpen(!open)} style={summaryStyles.dropdown}>
                                        <Text style={{...styles.sectionTitle}}>Tu resumen:</Text>
                                        <Text style={styles.sectionTitle}>{open ? '︿' : '﹀'}</Text>
                                    </TouchableOpacity>
                                    <Table rows={summary} type="obj" showRows={open ? null : 3}></Table>
                                </View>
                            </View>

                            {
                                isConfirmed ?
                                <>
                                    {/* Go to chat or to profile */}
                                    <View style={{flexDirection:'row', gap:10, justifyContent:'center'}}>
                                        <Button color='secondary' title='IR AL CHAT' onPress={goToChat}></Button>
                                        <Button color='secondary' title='IR AL PERFIL' onPress={goToProfile}></Button>
                                    </View>
                    
                                    {/* Map */}
                                    <View style={{position:'relative'}}>
                                        <MapView ref={mapRef} style={summaryStyles.map} region={region} provider={PROVIDER_GOOGLE}>
                                            {
                                            region && summary ?
                                            <MapViewDirections
                                                origin={region}
                                                destination={{latitude:summary.latitude, longitude:summary.longitude}}
                                                apikey={Config.GOOGLE_MAPS_PLATFORM_API_KEY || 'AIzaSyCYMeIWU7pSQbh8C_Hc7ZMRXPqQyduVP8s'}
                                                strokeWidth={5}
                                                onError={() => showNotification(null, "No fue posible trazar la ruta para esta dirección.")}
                                                strokeColor={colors.complementary.main}
                                            /> : null
                                            } 
                                            {region && <Marker coordinate={region} image={MeIcon}/>}
                                            {summary && <Marker coordinate={summary} image={ParkIcon}/>}
                                        </MapView>
                                        <View style={styles.mapOverlay}></View> 
                                    </View>
                                        
                                    {/* Go to chat */}
                                    <Button color='primary' title='INICIAR NAVEGACIÓN' onPress={initNavegation}></Button>
                                    <Button color='complementary' title='CANCELAR ENCUENTRO' onPress={cancelEverything}></Button>
                                </> : 
                                null
                            }
                            {
                                isCancelled ?
                                <Button color='complementary' title='VOLVER' onPress={() => navigation.navigate('Home')}></Button> : null
                            }
                        </View>
                    </ScrollView>
                }
            </>
        )
    }
};

const summaryStyles = StyleSheet.create({
    imageContainer: {
        display: 'flex',
        margin: 20,
        alignItems: 'center'
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:'space-between',
    },
    map: {
        height:250,
        width:'100%',
        position:'relative'
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

export default Summary;