import React, { useEffect, useState, useRef } from "react";
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { requestLocationPermission } from '../services/ClientPermission';
import Geolocation from 'react-native-geolocation-service';
import { useNotification } from '../NotificationProvider';
import { styles } from "../styles/global";
import { TouchableOpacity, View, Image, Text, ScrollView, BackHandler } from "react-native";
import Loading from "./Loading";
import ListView from "../components/ListView";
import ParkIcon from '../../assets/icons/park.png';
import MeIcon from '../../assets/icons/me.png';
import DraggableBottomSheet from "../components/DraggableBottomSheet";
import Config from "react-native-config";
import Button from "../components/Button";
import Storage from '../services/Storage';
import socket from '../services/SocketIO';
import axios from '../utils/axios';
import { useFocusEffect } from "@react-navigation/native";
import ScrollViewContainer from "../components/ScrollViewContainer";

const LivePlace = ({ navigation, route }) => {
    const { parkingId } = route.params;
    const [region, setRegion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [centered, setCentered] = useState(true);
    const [matched, setMatched] = useState([]);
    const [acceptedMatch, setAcceptedMatch] = useState(false);
    const [selected, setSelected] = useState(null);
    const [open, setOpen] = useState(true);

    const { showNotification } = useNotification();

    const mapRef = useRef(null);

    useEffect(() => {
        if (matched.length && region) {
            handleZoomAndCenter([region, {
                latitude: matched[matched.length - 1].latitude,
                longitude: matched[matched.length - 1].longitude,
            }])
        }
    }, [matched]);

    // Add event listener for hardware back button press
    useEffect(() => {
        const handleBackPress = () => {
            showNotification('Atención', '¿Seguro quieres abandonar?', null, 'alert', () => {
                handleCancel();
            });
            return true;
        };

        BackHandler.addEventListener('hardwareBackPress', handleBackPress);

        // Clean up event listener when the component unmounts
        return () => {
            BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
        };
    }, []);

    useEffect(() => {
        if (region) {
            if (selected) {
                handleZoomAndCenter([region, {
                    latitude: selected.latitude,
                    longitude: selected.longitude,
                }])
            } else {
                handleCenter();
            }
        }
    }, [selected]);

    useFocusEffect(
        React.useCallback(() => {
            const getMatches = async () => {
                const token = await Storage.get('auth_token');
                axios.get('matches?parkingId=' + parkingId, token)
                    .then(response => {
                        setMatched(response.data);
                    })
                    .catch(err => {
                        console.log(err)
                    })
            };
            getMatches();
        }, [])
    );

    useEffect(() => {
        const getNewMatch = async (newMatchId) => {
            const token = await Storage.get('auth_token');
            axios.get('matches/' + newMatchId, token)
                .then(response => {
                    setMatched(prevMatches => [...prevMatches, response.data]);
                })
                .catch(err => {
                    console.log(err)
                })
        };

        const getUserPosition = async (movedMatchId) => {
            if ((acceptedMatch && matched.length === 1 && movedMatchId === matched[0]._id) || !acceptedMatch) {
                const token = await Storage.get('auth_token');
                axios.get('matches/' + movedMatchId, token)
                    .then(response => {
                        setMatched(prevMatches => [...prevMatches.filter(i => i._id !== movedMatchId), response.data]);
                    })
                    .catch(err => {
                        console.log(err)
                    })
            };
        };

        const cancelMatch = async (matchId) => {
            if ((acceptedMatch && selected._id == matchId) || !acceptedMatch) {
                const token = await Storage.get('auth_token');
                axios.get('matches?cancelled=false&parkingId=' + parkingId, token)
                    .then(response => {
                        setMatched(response.data);
                        setSelected(null);
                        setAcceptedMatch(false);
                    })
                    .catch(err => {
                        console.log(err)
                    })
            }
        };

        const handleDeletedMatch = async (parkingId) => {
            const token = await Storage.get('auth_token');
            axios.get('matches?cancelled=false&parkingId=' + parkingId, token)
                .then(response => {
                    setMatched(response.data);
                    setSelected(null);
                    setAcceptedMatch(false);
                })
                .catch(err => {
                    console.log(err)
                })
        };

        const handleFinishMatch = async (matchId) => {
            const token = await Storage.get('auth_token');
            axios.get('matches/' + matchId, token)
                .then(response => {
                    const myMatch = response.data;
                    showNotification('¡El usuario llegó a destino!', 'Confirmanos si recibiste tus ' + myMatch.currency + ' ' + myMatch.price + ' antes de ceder tu lugar.', null, 'alert', null, [
                        {
                            text: 'CONFIRMAR', onPress: async () => {
                                const token = await Storage.get('auth_token');
                                axios.put('matches/' + myMatch._id, {
                                    paymentConfirmed: true,
                                }, token)
                                    .then(response2 => {
                                        navigation.navigate('Home');
                                        showNotification('OK', 'Se completó tu encuentro.')
                                    })
                                    .catch(err => showNotification('Error', err.message));
                            }
                        },
                    ], false);
                })
                .catch(err => {
                    console.log(err)
                })
        };

        const initLivePlaceSocket = async () => {
            const user = await Storage.get('user');
            socket.on('newMatch_' + JSON.parse(user)._id, getNewMatch); // A new match is saved in database
            socket.on('cancelledMatch_' + JSON.parse(user)._id, cancelMatch); // A match is cancelled by user or seller
            socket.on('deletedMatch_' + JSON.parse(user)._id, handleDeletedMatch); // A match is cancelled by user
            socket.on('userMoved_' + parkingId, getUserPosition); // Once a match is created, user position is tracked
            socket.on('matchFinished_' + JSON.parse(user)._id, handleFinishMatch);
            return () => {
                socket.off('newMatch_' + JSON.parse(user)._id, getNewMatch);
                socket.off('cancelledMatch_' + JSON.parse(user)._id, cancelMatch);
                socket.off('deletedMatch_' + JSON.parse(user)._id, handleDeletedMatch);
                socket.off('userMoved_' + parkingId, getUserPosition);
                socket.off('matchFinished_' + JSON.parse(user)._id, handleFinishMatch);
            };
        };
        initLivePlaceSocket();
    }, []);

    const handleZoomAndCenter = (coordinates) => {
        mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
        });
    };

    useEffect(() => {
        const getLocation = async () => {
            // Request location permission
            const locationPermissionGranted = await requestLocationPermission();
            if (!locationPermissionGranted) {
                console.log('Location permission denied ', locationPermissionGranted);
                return;
            };

            // Get user's current location
            Geolocation.getCurrentPosition(
                ({ coords }) => {
                    setRegion({
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    });
                    setCentered(true);
                    setLoading(false);
                },
                (error) => console.error(error),
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
            );
        };

        getLocation();
    }, []);

    const handleRegionChange = (newRegion) => {
        const latDiff = Math.abs(region.latitude - newRegion.latitude);
        const lonDiff = Math.abs(region.longitude - newRegion.longitude);

        // Check if the absolute difference exceeds the threshold
        if (latDiff > 0.01 || lonDiff > 0.01) {
            setCentered(false);
        } else {
            setCentered(true);
        }
    };

    const matchedDefault = [
        {
            "_id": "664421fdf3dc0c1d73cb3c0f",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "parkingId": "664421ecf3dc0c1d73cb3c06",
            "price": 500,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": false,
            "accepted": false,
            "createdAt": "2024-05-15T02:46:21.179Z",
            "updatedAt": "2024-05-23T01:36:34.270Z",
            "__v": 0
        },
        {
            "_id": "664e8374901a124bc99f0cce",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "parkingId": "664421ecf3dc0c1d73cb3c06",
            "price": 500,
            "currency": "ARS",
            "cancelled": false,
            "paymentMethod": "efectivo",
            "payed": true,
            "accepted": true,
            "createdAt": "2024-05-22T23:44:52.319Z",
            "updatedAt": "2024-05-23T01:36:34.311Z",
            "__v": 0,
            "distance": 0,
            "latitude": -34.585860586309,
            "longitude": -58.59593004199605
        },
        {
            "_id": "666a57658c2e2e3ee14f7111",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "666a562d8c2e2e3ee14f70da",
            "price": 1800,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": true,
            "accepted": false,
            "createdAt": "2024-06-13T02:20:21.649Z",
            "updatedAt": "2024-06-13T02:21:43.617Z",
            "__v": 0,
            "distance": 5.960055098423928,
            "latitude": -34.5863895,
            "longitude": -58.5912537
        },
        {
            "_id": "666a57f95b0f5ed88722b076",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "666a57f05b0f5ed88722b06d",
            "price": 1800,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": false,
            "accepted": false,
            "createdAt": "2024-06-13T02:22:49.069Z",
            "updatedAt": "2024-06-13T02:40:13.998Z",
            "__v": 0,
            "distance": 5.050955541504394,
            "latitude": -34.5863895,
            "longitude": -58.5912537
        },
        {
            "_id": "666a58a75b0f5ed88722b0aa",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "666a57f05b0f5ed88722b06d",
            "price": 1800,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": false,
            "accepted": false,
            "createdAt": "2024-06-13T02:25:43.296Z",
            "updatedAt": "2024-06-13T02:40:13.998Z",
            "__v": 0,
            "distance": 5.050955541504394,
            "latitude": -34.5863895,
            "longitude": -58.5912537
        },
        {
            "_id": "666a58f65b0f5ed88722b0d4",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "666a57f05b0f5ed88722b06d",
            "price": 1800,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": false,
            "accepted": false,
            "createdAt": "2024-06-13T02:27:02.356Z",
            "updatedAt": "2024-06-13T02:40:13.998Z",
            "__v": 0,
            "distance": 5.050955541504394,
            "latitude": -34.5863895,
            "longitude": -58.5912537
        },
        {
            "_id": "666a59a60eb328dc2596551b",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "666a57f05b0f5ed88722b06d",
            "price": 1800,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": false,
            "accepted": false,
            "createdAt": "2024-06-13T02:29:58.513Z",
            "updatedAt": "2024-06-13T02:40:13.998Z",
            "__v": 0,
            "distance": 5.050955541504394,
            "latitude": -34.5863895,
            "longitude": -58.5912537
        },
        {
            "_id": "666a5a3df6df5ae447982a2e",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "666a57f05b0f5ed88722b06d",
            "price": 1800,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": true,
            "accepted": false,
            "createdAt": "2024-06-13T02:32:29.719Z",
            "updatedAt": "2024-06-13T02:40:13.998Z",
            "__v": 0,
            "distance": 5.050955541504394,
            "latitude": -34.5863895,
            "longitude": -58.5912537
        },
        {
            "_id": "666a5b45247ce3b9a2581f72",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "666a57f05b0f5ed88722b06d",
            "price": 1800,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": true,
            "accepted": true,
            "createdAt": "2024-06-13T02:36:53.361Z",
            "updatedAt": "2024-06-13T02:40:13.998Z",
            "__v": 0,
            "distance": 5.050955541504394,
            "latitude": -34.5863895,
            "longitude": -58.5912537
        },
        {
            "_id": "6673430daafef7964540b34f",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "667342eaaafef7964540b337",
            "price": 2000,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": true,
            "accepted": true,
            "createdAt": "2024-06-19T20:43:57.109Z",
            "updatedAt": "2024-06-19T20:48:53.242Z",
            "__v": 0,
            "distance": 3.05789638248625,
            "latitude": -34.5863814,
            "longitude": -58.591243
        },
        {
            "_id": "6673444faafef7964540b38a",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "66734448aafef7964540b381",
            "price": 2800,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": true,
            "accepted": true,
            "createdAt": "2024-06-19T20:49:19.697Z",
            "updatedAt": "2024-06-19T20:50:09.766Z",
            "__v": 0,
            "distance": 0.9842690044119815,
            "latitude": -34.5863814,
            "longitude": -58.591243
        },
        {
            "_id": "6673449aaafef7964540b3b6",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "66734491aafef7964540b3ad",
            "price": 2800,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": false,
            "accepted": false,
            "createdAt": "2024-06-19T20:50:34.158Z",
            "updatedAt": "2024-06-19T20:58:49.466Z",
            "__v": 0,
            "distance": 1.6305698701731344,
            "latitude": -34.5863814,
            "longitude": -58.591243
        },
        {
            "_id": "667345dbaafef7964540b3d0",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "66734491aafef7964540b3ad",
            "price": 2800,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": false,
            "latitude": -34.5863814,
            "longitude": -58.591243,
            "accepted": false,
            "createdAt": "2024-06-19T20:55:55.301Z",
            "updatedAt": "2024-06-19T20:58:49.466Z",
            "__v": 0,
            "distance": 1.6305698701731344
        },
        {
            "_id": "6673467baafef7964540b3f0",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "66734491aafef7964540b3ad",
            "price": 2800,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": false,
            "latitude": -34.5863814,
            "longitude": -58.591243,
            "accepted": false,
            "createdAt": "2024-06-19T20:58:35.631Z",
            "updatedAt": "2024-06-19T20:58:49.466Z",
            "__v": 0,
            "distance": 1.6305698701731344
        },
        {
            "_id": "667346ecaafef7964540b418",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "667346dfaafef7964540b40f",
            "price": 2800,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": true,
            "latitude": -34.5863814,
            "longitude": -58.591243,
            "accepted": true,
            "createdAt": "2024-06-19T21:00:28.418Z",
            "updatedAt": "2024-06-19T21:24:58.539Z",
            "__v": 0,
            "distance": 2.099024385732729
        },
        {
            "_id": "66734710aafef7964540b42a",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "667346dfaafef7964540b40f",
            "price": 2800,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": false,
            "latitude": -34.5863814,
            "longitude": -58.591243,
            "accepted": false,
            "createdAt": "2024-06-19T21:01:04.018Z",
            "updatedAt": "2024-06-19T21:24:58.539Z",
            "__v": 0,
            "distance": 2.099024385732729
        },
        {
            "_id": "66734ccfaafef7964540b5a4",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "66734cc3aafef7964540b59a",
            "price": 2800,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": true,
            "latitude": -34.5863814,
            "longitude": -58.591243,
            "accepted": true,
            "createdAt": "2024-06-19T21:25:35.626Z",
            "updatedAt": "2024-06-19T21:27:04.969Z",
            "__v": 0,
            "distance": 4.021825056026061
        },
        {
            "_id": "66734dbeaafef7964540b5d4",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "66734db0aafef7964540b5ca",
            "price": 54800,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": true,
            "latitude": -34.5863814,
            "longitude": -58.591243,
            "accepted": true,
            "createdAt": "2024-06-19T21:29:34.535Z",
            "updatedAt": "2024-06-19T21:30:23.773Z",
            "__v": 0,
            "distance": 1.175604081168437
        },
        {
            "_id": "66734e2caafef7964540b606",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "66734e26aafef7964540b5fc",
            "price": 64664,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": true,
            "latitude": -34.5863814,
            "longitude": -58.591243,
            "accepted": true,
            "createdAt": "2024-06-19T21:31:24.830Z",
            "updatedAt": "2024-06-19T21:33:24.631Z",
            "__v": 0,
            "distance": 1.7400396004552159
        },
        {
            "_id": "66734ebdaafef7964540b639",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "66734eb1aafef7964540b62f",
            "price": 5368,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": true,
            "latitude": -34.5863814,
            "longitude": -58.591243,
            "accepted": true,
            "createdAt": "2024-06-19T21:33:49.143Z",
            "updatedAt": "2024-06-19T21:38:16.586Z",
            "__v": 0,
            "distance": 3.449489853155669
        },
        {
            "_id": "66735038aafef7964540b671",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "66735029aafef7964540b667",
            "price": 1111,
            "currency": "ARS",
            "cancelled": false,
            "paymentMethod": "efectivo",
            "payed": true,
            "latitude": -34.5863814,
            "longitude": -58.591243,
            "accepted": true,
            "createdAt": "2024-06-19T21:40:08.064Z",
            "updatedAt": "2024-06-19T21:40:24.248Z",
            "__v": 0,
            "distance": 4.105537042078069
        },
        {
            "_id": "667352dd5b1ae12485488a07",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "667352d35b1ae124854889fd",
            "price": 2554,
            "currency": "ARS",
            "cancelled": false,
            "paymentMethod": "efectivo",
            "payed": true,
            "latitude": -34.5863814,
            "longitude": -58.591243,
            "accepted": true,
            "createdAt": "2024-06-19T21:51:25.534Z",
            "updatedAt": "2024-06-19T21:51:34.806Z",
            "__v": 0,
            "distance": 6.050757017082813
        },
        {
            "_id": "667359e85b1ae12485488a4b",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "667359d75b1ae12485488a41",
            "price": 0,
            "currency": "ARS",
            "cancelled": false,
            "paymentMethod": "efectivo",
            "payed": true,
            "latitude": -34.5863814,
            "longitude": -58.591243,
            "accepted": true,
            "createdAt": "2024-06-19T22:21:28.765Z",
            "updatedAt": "2024-06-19T22:21:51.189Z",
            "__v": 0,
            "distance": 1.939334863088485
        },
        {
            "_id": "667a264bdb88b4227255ddf5",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "667a2509db88b4227255ddcd",
            "price": 2500,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": false,
            "latitude": -34.5862359,
            "longitude": -58.5913751,
            "accepted": false,
            "createdAt": "2024-06-25T02:07:07.316Z",
            "updatedAt": "2024-06-25T02:22:05.532Z",
            "__v": 0,
            "distance": 21.15956867211382
        },
        {
            "_id": "667a27e7db88b4227255de2e",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "667a2509db88b4227255ddcd",
            "price": 2500,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": false,
            "latitude": -34.5862359,
            "longitude": -58.5913751,
            "accepted": false,
            "createdAt": "2024-06-25T02:13:59.113Z",
            "updatedAt": "2024-06-25T02:22:05.532Z",
            "__v": 0,
            "distance": 21.15956867211382
        },
        {
            "_id": "667a28aca33e1537d50b1264",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "667a2509db88b4227255ddcd",
            "price": 2500,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": false,
            "latitude": -34.5862359,
            "longitude": -58.5913751,
            "accepted": false,
            "createdAt": "2024-06-25T02:17:16.992Z",
            "updatedAt": "2024-06-25T02:22:05.532Z",
            "__v": 0,
            "distance": 21.15956867211382
        },
        {
            "_id": "667a294eac8cd616d212177c",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "667a2509db88b4227255ddcd",
            "price": 2500,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": false,
            "latitude": -34.5862182,
            "longitude": -58.591294,
            "accepted": false,
            "createdAt": "2024-06-25T02:19:58.179Z",
            "updatedAt": "2024-06-25T02:22:05.532Z",
            "__v": 0,
            "distance": 19.162394703381317
        },
        {
            "_id": "667a2a3cac8cd616d21217ae",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "667a2a27ac8cd616d21217a4",
            "price": 2500,
            "currency": "ARS",
            "cancelled": false,
            "paymentMethod": "efectivo",
            "payed": true,
            "latitude": -34.5863093,
            "longitude": -58.5911696,
            "accepted": true,
            "createdAt": "2024-06-25T02:23:56.445Z",
            "updatedAt": "2024-06-25T02:33:43.133Z",
            "__v": 0,
            "distance": 12.83447696177991
        },
        {
            "_id": "668047deda0ef582c87299c6",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "668046fdda0ef582c872999e",
            "price": 2500,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": true,
            "latitude": -34.5863628,
            "longitude": -58.5912545,
            "accepted": false,
            "createdAt": "2024-06-29T17:43:58.877Z",
            "updatedAt": "2024-06-29T17:48:21.298Z",
            "__v": 0,
            "distance": 2.7158854254717997
        },
        {
            "_id": "66804852aec026ee86650923",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "668046fdda0ef582c872999e",
            "price": 2500,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": true,
            "latitude": -34.5863628,
            "longitude": -58.5912545,
            "accepted": false,
            "createdAt": "2024-06-29T17:45:54.497Z",
            "updatedAt": "2024-06-29T17:48:21.298Z",
            "__v": 0,
            "distance": 2.7158854254717997
        },
        {
            "_id": "6680489b68be1fd22aea5990",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "668046fdda0ef582c872999e",
            "price": 2500,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "efectivo",
            "payed": true,
            "latitude": -34.5863442,
            "longitude": -58.5912838,
            "accepted": false,
            "createdAt": "2024-06-29T17:47:07.741Z",
            "updatedAt": "2024-06-29T17:48:21.298Z",
            "__v": 0,
            "distance": 5.976067807381201
        },
        {
            "_id": "668048d51f55609aefa81cf1",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "668046fdda0ef582c872999e",
            "price": 2500,
            "currency": "ARS",
            "cancelled": false,
            "paymentMethod": "efectivo",
            "payed": true,
            "latitude": -34.5863442,
            "longitude": -58.5912838,
            "accepted": true,
            "createdAt": "2024-06-29T17:48:05.220Z",
            "updatedAt": "2024-06-29T17:48:21.300Z",
            "__v": 0,
            "distance": 5.976067807381201
        },
        {
            "_id": "668752bdd43f1138ee3b8e90",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "668752acd43f1138ee3b8e86",
            "price": 1500,
            "currency": "ARS",
            "cancelled": false,
            "paymentMethod": "efectivo",
            "payed": true,
            "latitude": -34.5863121,
            "longitude": -58.5912154,
            "accepted": true,
            "createdAt": "2024-07-05T01:56:13.087Z",
            "updatedAt": "2024-07-05T01:56:40.363Z",
            "__v": 0,
            "distance": 8.269380608346028
        },
        {
            "_id": "66bd738fb52e47aeb8be68a0",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "66bac17eef02f253a07efea0",
            "price": 500,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "mercadopago",
            "payed": null,
            "latitude": -34.585860586309,
            "longitude": -58.59593004199605,
            "accepted": true,
            "createdAt": "2024-08-15T03:18:39.181Z",
            "updatedAt": "2024-08-29T03:39:22.185Z",
            "__v": 0
        },
        {
            "_id": "66bd746939fe619116bcb54d",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "66bac17eef02f253a07efea0",
            "price": 500,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "mercadopago",
            "payed": false,
            "latitude": -34.585860586309,
            "longitude": -58.59593004199605,
            "accepted": false,
            "createdAt": "2024-08-15T03:22:17.607Z",
            "updatedAt": "2024-08-29T03:39:22.185Z",
            "__v": 0
        },
        {
            "_id": "66c404cdbe3a372bc20cf999",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "66bac17eef02f253a07efea0",
            "price": 500,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "mercadopago",
            "payed": false,
            "latitude": -34.585860586309,
            "longitude": -58.59593004199605,
            "accepted": false,
            "createdAt": "2024-08-20T02:51:57.576Z",
            "updatedAt": "2024-08-29T03:39:22.185Z",
            "__v": 0
        },
        {
            "_id": "66c4057d6f43c98f0e9d9830",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "66bac17eef02f253a07efea0",
            "price": 500,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "mercadopago",
            "payed": false,
            "latitude": -34.585860586309,
            "longitude": -58.59593004199605,
            "accepted": false,
            "createdAt": "2024-08-20T02:54:53.671Z",
            "updatedAt": "2024-08-29T03:39:22.185Z",
            "__v": 0
        },
        {
            "_id": "66c406ad9f7bfa67f54666a8",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "66bac17eef02f253a07efea0",
            "price": 500,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "mercadopago",
            "payed": false,
            "latitude": -34.585860586309,
            "longitude": -58.59593004199605,
            "accepted": false,
            "createdAt": "2024-08-20T02:59:57.653Z",
            "updatedAt": "2024-08-29T03:39:22.185Z",
            "__v": 0
        },
        {
            "_id": "66c406e1900eda30b60d6150",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "66bac17eef02f253a07efea0",
            "price": 500,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "mercadopago",
            "payed": false,
            "latitude": -34.585860586309,
            "longitude": -58.59593004199605,
            "accepted": false,
            "createdAt": "2024-08-20T03:00:49.126Z",
            "updatedAt": "2024-08-29T03:39:22.185Z",
            "__v": 0
        },
        {
            "_id": "66c4071c7f99ed70a83625cd",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "66bac17eef02f253a07efea0",
            "price": 500,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "mercadopago",
            "payed": false,
            "latitude": -34.585860586309,
            "longitude": -58.59593004199605,
            "accepted": false,
            "createdAt": "2024-08-20T03:01:48.188Z",
            "updatedAt": "2024-08-29T03:39:22.185Z",
            "__v": 0
        },
        {
            "_id": "66c407635e2c2f9dd0c5f804",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "66bac17eef02f253a07efea0",
            "price": 500,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "mercadopago",
            "payed": false,
            "latitude": -34.585860586309,
            "longitude": -58.59593004199605,
            "accepted": false,
            "createdAt": "2024-08-20T03:02:59.490Z",
            "updatedAt": "2024-08-29T03:39:22.185Z",
            "__v": 0
        },
        {
            "_id": "66c407a52268dfed459d6b66",
            "sellerId": {
                "_id": "66442046f3dc0c1d73cb3bfc",
                "firstName": "Tomas",
                "lastName": "Gula"
            },
            "buyerId": {
                "_id": "666a555f8c2e2e3ee14f70c5",
                "firstName": "joaquin",
                "lastName": "gula"
            },
            "parkingId": "66bac17eef02f253a07efea0",
            "price": 500,
            "currency": "ARS",
            "cancelled": true,
            "paymentMethod": "mercadopago",
            "payed": false,
            "latitude": -34.585860586309,
            "longitude": -58.59593004199605,
            "accepted": false,
            "createdAt": "2024-08-20T03:04:05.988Z",
            "updatedAt": "2024-08-29T03:39:22.185Z",
            "__v": 0,
            "preferenceId": "66c407a62268dfed459d6b6c"
        }
    ]

    const handleCenter = () => {
        mapRef.current.animateToRegion(region);
    };

    const handleAccept = async () => {
        const match = selected;
        const token = await Storage.get('auth_token');
        axios.put('matches/' + match._id, { accepted: true }, token)
            .then(response => {
                if (response.data) initTracking(match._id);
            })
            .catch(err => showNotification('Error', err.message))
    };

    const handleCancelAccept = async () => {
        const match = selected;
        const token = await Storage.get('auth_token');
        axios.put('matches/' + match._id, { accepted: false, cancelled: true }, token)
            .then(async response => {
                if (response.data) {
                    const token = await Storage.get('auth_token');
                    axios.get('matches?cancelled=false&parkingId=' + parkingId, token)
                        .then(response => {
                            setMatched(response.data);
                            setSelected(null);
                            setAcceptedMatch(false);
                        })
                        .catch(err => showNotification('Error', err.message))
                };
            })
            .catch(err => showNotification('Error', err.message))
    };

    const handleCancel = async () => {
        const token = await Storage.get('auth_token');
        axios.delete('places/' + parkingId, token)
            .then(response => {
                navigation.navigate('Home');
            })
            .catch(err => showNotification('Error', err.message))
    };

    const initTracking = (matchId) => {
        const trackedMatch = matched.filter(m => m._id === matchId);
        setMatched(trackedMatch);
        setAcceptedMatch(true);
        //setOpen(false);
    };

    return (
        <View style={styles.container}>
            {
                loading || !region ?
                    <Loading visible={loading}></Loading> :
                    <MapView ref={mapRef} style={styles.map} initialRegion={region} provider={PROVIDER_GOOGLE} onRegionChange={handleRegionChange}>
                        {region && <Marker coordinate={region} image={MeIcon} />}
                        {matched.map((coord, i) => {
                            if (coord.latitude && coord.longitude) {
                                return (
                                    <Marker key={i} coordinate={{ latitude: coord.latitude, longitude: coord.longitude }} image={ParkIcon} onPress={() => setSelected(coord)} />
                                )
                            }
                        })}
                    </MapView>
            }
            {
                !centered &&
                <TouchableOpacity style={[styles.mapCenter, { bottom: 120 + (90 * matched.length) }]} onPress={handleCenter}>
                    <Image style={[styles.mapCenterIcon]} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1278/1278806.png' }}></Image>
                </TouchableOpacity>
            }
            <DraggableBottomSheet isStatic={false} setOpen={setOpen}>
                {
                    !acceptedMatch ?
                        <>
                            {
                                !matched.length ?
                                    <View style={{ paddingTop: 100 }}>
                                        <Loading visible={true} text={'Esperando conductores...'}></Loading>
                                    </View> :
                                    <View >
                                        <Text style={[styles.text, { textAlign: 'center', marginTop: 20, marginBottom: 20 }]}>{`¡Tienes ${matched.length > 1 ? 'una ' : matched.length + ' '}coincidencia${matched.length > 1 ? 's' : ''}!`}</Text>
                                        <ScrollViewContainer selected={selected}>
                                            {matched.map((match, i) => { // nearByUsers will be the fetched data of type "match"
                                                //match['location'] = match['carName'];
                                                match['userId'] = match['buyerId'];
                                                return (
                                                    // The card will show the price, the user picture and pictures if there are
                                                    <ListView leftButtonLabel={'Aceptar'} pre='$ ' leftButtonAction={handleAccept} style={{ paddingHorizontal: 20 }} key={i} item={match} active={selected && selected._id == match._id} navigation={navigation} onPress={(pos) => setSelected({ ...match, ...pos })} />
                                                )
                                            })}
                                        </ScrollViewContainer>
                                    </View>
                            }
                        </> :
                        <View >
                            <View style={{ paddingTop: 100, marginBottom: 20 }}>
                                <Loading visible={true} text={'¡Espera al conductor mientras\nllega a tu sitio!'}></Loading>
                            </View>
                            <View style={styles.section}>
                                <View style={styles.scrollViewContainer}>
                                    {matched.map((match, i) => { // nearByUsers will be the fetched data of type "match"
                                        //match['location'] = match['carName'];
                                        match['userId'] = match['buyerId']
                                        return (
                                            // The card will show the price, the user picture and pictures if there are
                                            <ListView pre='$ ' style={{ paddingHorizontal: 20 }} key={i} item={match} active={false} navigation={navigation} onPress={() => null} />
                                        )
                                    })}
                                </View>
                            </View>
                        </View>
                }
                <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: 20 }}>
                    <Button color={'complementary'} onPress={acceptedMatch ? handleCancelAccept : handleCancel}>CANCELAR</Button>
                </View>
            </DraggableBottomSheet>
        </View>
    )
};

export default LivePlace;