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

    const scrollRef = useRef(null);
    const mapRef = useRef(null);

    useEffect(() => {
      if (matched.length && region) {
        handleZoomAndCenter([region, {
          latitude:matched[matched.length-1].latitude,
          longitude:matched[matched.length-1].longitude,
        }])
      }
    },[matched]);

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
            latitude:selected.latitude,
            longitude:selected.longitude,
          }])
        } else {
          handleCenter();
        }
      }
    },[selected]);

    useFocusEffect(
      React.useCallback(() => {
        const getMatches = async () => {
          const token = await Storage.get('auth_token');
          axios.get('matches?parkingId=' + parkingId, token)
          .then(response => {
              console.log('Matches? ' + parkingId)
              setMatched(response.data);
          })
          .catch(err => {
              console.log(err)
          })
        };
        getMatches();
      },[])
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
              setMatched(prevMatches => [...prevMatches.filter(i=>i._id !== movedMatchId), response.data]);
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
            { text: 'CONFIRMAR', onPress: async () => {
                const token = await Storage.get('auth_token');
                axios.put('matches/' + myMatch._id, {
                    payed:true,
                }, token)
                .then(response2=>{
                    navigation.navigate('Home');
                    showNotification('OK', 'Se completó tu encuentro.')
                })
                .catch(err=>showNotification('Error', err.message));
            }},
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
    },[]);
    
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
    
    const handleCenter = () => {
        mapRef.current.animateToRegion(region);
    };

    const handleAccept = async () => {
      const match = selected;
      const token = await Storage.get('auth_token');
      axios.put('matches/' + match._id, { accepted: true }, token)
      .then(response=>{
        if (response.data) initTracking(match._id);
      })
      .catch(err=>showNotification('Error', err.message))
    };

    const handleCancelAccept = async () => {
      const match = selected;
      const token = await Storage.get('auth_token');
      axios.put('matches/' + match._id, { accepted: false, cancelled: true }, token)
      .then(async response=>{
        if (response.data) {
          const token = await Storage.get('auth_token');
          axios.get('matches?cancelled=false&parkingId=' + parkingId, token)
          .then(response => {
            setMatched(response.data);
            setSelected(null);
            setAcceptedMatch(false);
          })
          .catch(err=>showNotification('Error', err.message))
        };
      })
      .catch(err=>showNotification('Error', err.message))
    };

    const handleCancel = async () => {
      const token = await Storage.get('auth_token');
      axios.delete('places/' + parkingId, token)
      .then(response=>{
        navigation.navigate('Home');
      })
      .catch(err=>showNotification('Error', err.message))
    };
    
    const initTracking = (matchId) => {
      const trackedMatch = matched.filter(m=>m._id===matchId);
      setMatched(trackedMatch);
      setAcceptedMatch(true);
      //setOpen(false);
    };

    return(
        <View style={styles.container}>
            {
                loading || !region ?
                <Loading visible={loading}></Loading> : 
                <MapView ref={mapRef} style={styles.map} initialRegion={region} provider={PROVIDER_GOOGLE} onRegionChange={handleRegionChange}>
                    {region && <Marker coordinate={region} image={MeIcon}/>}
                    {matched.map((coord, i) => {
                      if (coord.latitude && coord.longitude) {
                        return(
                          <Marker key={i} coordinate={{latitude:coord.latitude, longitude:coord.longitude}} image={ParkIcon} onPress={() => setSelected(coord)}/>
                        )
                      }
                    })}
                </MapView>
            }
            {
                !centered && 
            <TouchableOpacity style={[styles.mapCenter, {bottom:120 + (90 * matched.length)}]} onPress={handleCenter}>
                <Image style={[styles.mapCenterIcon]} source={{uri:'https://cdn-icons-png.flaticon.com/512/1278/1278806.png'}}></Image>
            </TouchableOpacity>
            }
            <DraggableBottomSheet isStatic={false}>
              {
                !acceptedMatch ?
                <>
                  {
                    !matched.length ? 
                    <View style={{paddingTop:100}}>
                        <Loading visible={true} text={'Esperando conductores...'}></Loading>
                    </View> : 
                    <View >
                      <Text style={[styles.text, {textAlign:'center', marginTop:20}]}>{`¡Tienes ${matched.length > 1 ? 'una ' : matched.length + ' '}coincidencia${matched.length > 1 ? 's' : ''}!`}</Text>
                      <View style={styles.scrollViewContainer}>
                        <ScrollView ref={scrollRef} vertical showsVerticalScrollIndicator={false} style={[styles.scrollView, {marginTop:10}]}>
                            {matched.map((match,i) => { // nearByUsers will be the fetched data of type "match"
                              //match['location'] = match['carName'];
                              match['userId'] = match['buyerId'];
                              return(
                                // The card will show the price, the user picture and pictures if there are
                                <ListView leftButtonLabel={'Aceptar'} pre='$ ' leftButtonAction={handleAccept} style={{paddingHorizontal:20}} key={i} item={match} active={selected && selected._id == match._id} navigation={navigation} onPress={(pos) => setSelected({...match, ...pos})}/>
                              )
                            })}
                        </ScrollView>
                      </View>
                    </View>
                  }
                </> : 
                <View >
                  <View style={{paddingTop:100, marginBottom:20}}>
                    <Loading visible={true} text={'¡Espera al conductor mientras\nllega a tu sitio!'}></Loading>
                  </View>
                  <View style={styles.scrollViewContainer}>
                      {matched.map((match,i) => { // nearByUsers will be the fetched data of type "match"
                        //match['location'] = match['carName'];
                        match['userId'] = match['buyerId']
                        return(
                          // The card will show the price, the user picture and pictures if there are
                          <ListView pre='$ ' style={{paddingHorizontal:20}} key={i} item={match} active={false} navigation={navigation} onPress={() => null}/>
                        )
                      })}
                  </View>
                </View>
              }
                <View style={{flexDirection:'row', justifyContent:'center', paddingVertical:20}}>
                  <Button color={'complementary'} onPress={acceptedMatch ? handleCancelAccept : handleCancel}>CANCELAR</Button>
                </View>
            </DraggableBottomSheet>
        </View>
    )
};

export default LivePlace;