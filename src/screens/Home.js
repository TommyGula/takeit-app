import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Text, ScrollView, Image } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Geolocation from 'react-native-geolocation-service';
import { requestLocationPermission } from '../services/ClientPermission';
import ListView from '../components/ListView';
import { styles } from '../styles/global';
import ParkIcon from '../../assets/icons/park.png';
import MeIcon from '../../assets/icons/me.png';
import Config from "react-native-config";
import { colors } from '../styles/global';
import { useNotification } from '../NotificationProvider';
import Loading from './Loading';
import TapMenu from '../components/TapMenu';
import Storage from '../services/Storage';
import socket from '../services/SocketIO';
import Geocoder from '../utils/geocoder';
import { useFocusEffect } from '@react-navigation/native';
import ScrollViewContainer from '../components/ScrollViewContainer';

// Axios
import axios from '../utils/axios';
import DraggableBottomSheet from '../components/DraggableBottomSheet';

const Home = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [region, setRegion] = useState(null);
  const [parkingPlaces, setParkingPlaces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(0);
  const [centered, setCentered] = useState(false);
  const [loading, setLoading] = useState(true);

  const { showNotification } = useNotification();
  const mapRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      const getPlace = async (placeId) => {
        const token = await Storage.get('auth_token');
        axios.get('places/' + placeId, token)
          .then(response => {
            if (response.data) {
              setParkingPlaces(prevParkingPlaces => [...prevParkingPlaces, response.data])
            }
          })
          .catch(err => showNotification('Error', err.message));
      };

      const removePlace = (placeId) => {
        setParkingPlaces(parkingPlaces.filter(p => p._id !== placeId));
        if (selected && selected._id === placeId) setSelected(null);
      };

      if (region) {
        socket.on('newPlace', getPlace);
        socket.on('cancelledMatch', getPlace);
        socket.on('takenMatch', removePlace);
        socket.on('deletePlace', removePlace);

        return () => {
          socket.off('newPlace', getPlace);
          socket.off('cancelledMatch', getPlace);
          socket.off('takenMatch', removePlace);
          socket.off('deletePlace', removePlace);
        };
      }
    }, [region])
  )

  useFocusEffect(
    React.useCallback(() => {
      const getLocation = async () => {
        // Request location permission
        const locationPermissionGranted = await requestLocationPermission();
        if (!locationPermissionGranted) {
          console.log('Location permission denied ', locationPermissionGranted);
          return;
        };

        const u = await Storage.get('user');
        setUser(JSON.parse(u));

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
                  location: location
                });
                setCentered(true);

                getParkingPlaces(coords.latitude, coords.longitude);
              })
              .catch(error => console.warn(error));

          },
          (error) => console.error(error),
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
        );
      };

      getLocation();
    }, [])
  );

  const getParkingPlaces = (lat = null, long = null) => {
    axios.get('places?latitude=' + lat + '&longitude=' + long, null)
      .then(async data => {
        const u = await Storage.get('user');
        const user = JSON.parse(u);
        data = data.data.filter(d => d.userId._id != user._id);
        if (!data.length) {
          setParkingPlaces([]);
          setLoading(false);
        } else {
          setParkingPlaces(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.log('Error', err.message)
        showNotification('Error', err.message);
        setLoading(false);
      })
  };

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

  return (
    <View style={styles.container}>
      <Loading visible={loading}></Loading>
      {
        !loading && user &&
        <>
          {/*           <Menu></Menu> */}
          <TapMenu navigation={navigation}></TapMenu>
          <MapView ref={mapRef} style={styles.map} initialRegion={region} provider={PROVIDER_GOOGLE} onRegionChange={handleRegionChange}>
            {
              region && selected ?
                <MapViewDirections
                  origin={region}
                  destination={{ latitude: selected.latitude, longitude: selected.longitude }}
                  apikey={Config.GOOGLE_MAPS_PLATFORM_API_KEY || 'AIzaSyCYMeIWU7pSQbh8C_Hc7ZMRXPqQyduVP8s'}
                  strokeWidth={5}
                  onError={() => showNotification(null, "No fue posible trazar la ruta para esta dirección.")}
                  strokeColor={colors.complementary.main}
                /> : null
            }
            {region && <Marker coordinate={region} image={MeIcon} />}
            {parkingPlaces.map((coord, i) => (
              <Marker key={i} coordinate={coord} image={ParkIcon} onPress={() => setSelected(coord)} />
            ))}

          </MapView>
          {
            !centered &&
            <TouchableOpacity style={[styles.mapCenter, { bottom: open }]} onPress={handleCenter}>
              <Image style={styles.mapCenterIcon} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1278/1278806.png' }}></Image>
            </TouchableOpacity>
          }

          {/* Here I will display users offering their place near me */}
          <DraggableBottomSheet open={selected != null} setOpen={setOpen} selected={selected}>
            <View style={styles.sectionContainer}>
              <Text style={{ ...styles.lightTitle, color: "#000" }}>¡Hola {user.firstName}!</Text>
              <Text style={{ ...styles.sectionTitle, color: "#000" }}>¿Buscas lugar para estacionar?</Text>
            </View>
            <View style={styles.section}>
              <View style={styles.scrollViewContainer}>
                <ScrollViewContainer selected={selected}>
                  {parkingPlaces.map((parking, i) => { // nearByUsers will be the fetched data of type "parking"
                    return (
                      // The card will show the price, the user picture and pictures if there are
                      <ListView style={{ paddingHorizontal: 20 }} key={i} item={parking} pre='$ ' active={selected && selected._id == parking._id} navigation={navigation} onPress={(pos) => {
                        const selection = { ...parking, ...pos };
                        console.log('Selection ', selected && selected._id, parking._id)
                        setSelected(selected && selected._id == parking._id ? null : selection);
                      }} />
                    )
                  })}
                </ScrollViewContainer>
              </View>
            </View>
            {
              !parkingPlaces.length ?
                <View>
                  <Text style={[styles.text, { padding: 20 }]}>No se encontraron espacios disponibles en este momento. Intenta más tarde</Text>
                </View> : null
            }
          </DraggableBottomSheet>
        </>
      }
    </View>
  );
};

export default Home;
