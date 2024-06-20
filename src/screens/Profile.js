import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, ImageBackground, Text } from "react-native";
import LinearGradient from 'react-native-linear-gradient';
import { colors, styles } from "../styles/global";
import Media from "../components/Media";
import ListView from "../components/ListView";
import Button from "../components/Button";
import Wallpaper from '../../assets/images/29.jpeg';
import axios from '../utils/axios';
import Storage from "../services/Storage";
import { useNotification } from "../NotificationProvider";
import Loading from "./Loading";
import { useFocusEffect } from "@react-navigation/native";

const Profile = ({ navigation, route }) => {
    const profileUser = route.params ? route.params.profileUser : null;
    const [user, setUser] = useState(null);
    const [cars, setCars] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            if (profileUser) {
                getUserData();
            } else {
                getMyData();
            }
        },[])
    );

    const { showNotification } = useNotification(); 

    const getUserData = async () => {
        const token = await Storage.get('auth_token');
        const getUser = axios.get('users/' + profileUser._id, token);
        const getUserCars = axios.get('cars?userId=' + profileUser._id, token);
        Promise.all([getUser, getUserCars])
        .then(responses => {
            setUser(responses[0].data);
            setCars(responses[1].data);
            setDocuments([
                {
                    ...responses[0].data.carLicence || {},
                    type:'Licencia',
                },
                {
                    ...responses[0].data.greenCard || {},
                    type:'Cédula Verde',
                },
                responses[0].data.blueCards.map(b=>{
                    return({
                        ...b || {},
                        type:'Cédula Azul',
                    })
                }),
            ])
            setLoading(false);
        })
        .catch(err=> {
            showNotification('Error', 'Ha ocurrido un error');
        })
    };

    const getMyData = async () => {
        const u = await Storage.get('user');
        const token = await Storage.get('auth_token');
        const currUser = JSON.parse(u);
        const getUser = axios.get('users/' + currUser._id, token);
        const getUserCars = axios.get('cars?userId=' + currUser._id, token);
        Promise.all([getUser, getUserCars])
        .then(responses => {
            setUser(responses[0].data);
            setCars(responses[1].data);
            setDocuments([
                {
                    ...responses[0].data.carLicence || {},
                    type:'Licencia',
                },
                {
                    ...responses[0].data.greenCard || {},
                    type:'Cédula Verde',
                },
                responses[0].data.blueCards.map(b=>{
                    return({
                        ...b || {},
                        type:'Cédula Azul',
                    })
                }),
            ])
            setLoading(false);
        })
        .catch(err=> {
            showNotification('Error', 'Ha ocurrido un error');
        })
    };

/*     const documents = [
        {
            type:'Cédula Verde',
            number:'20715465465465',
            expiry:2025,
        },
        {
            type:'Cédula Azul',
            number:'5454646546546',
            expiry:2028,
        },
    ] */

    return(
        <ImageBackground source={Wallpaper} style={StyleSheet.absoluteFillObject}>
            <Loading visible={loading}></Loading>
            {
                !loading && user ?
            <LinearGradient colors={['#rgba(0,0,0,0.7)', '#fff']} style={StyleSheet.absoluteFillObject}>
                <ScrollView vertical >
                    {/* HERO */}
                    <View style={profileStyles.hero}>
                        <View style={{flexDirection:'row', justifyContent:'center'}}>
                            <Media Component={ImageBackground} source={{uri: user.photo || 'https://freeiconshop.com/wp-content/uploads/edd/car-flat.png' }} style={profileStyles.image}></Media>
                        </View>
                        <Text style={[styles.text, {fontSize:25, textAlign:'center', color:'#fff', marginBottom:10}]}>{user.firstName} {user.lastName}</Text>
                        {
                            cars.map((car,i) => (
                                <Text key={i} style={[styles.small, {textAlign:'center', color:'#fff'}]}>{['brandName', 'modelName', 'year'].reduce((r,a) => {
                                    return r + car[a] + ' ';
                                }, '').trim()}</Text>
                            ))
                        }
                    </View>
                    <View style={{padding:10}}>
                        <View style={[styles.section, {padding:15}]}>
                            {/* Mis autos */}
                            <View style={profileStyles.profileSection}>
                                <Text style={styles.sectionTitle}>{profileUser ? 'Autos' : 'Mis autos'}</Text>
                                {
                                    !profileUser ? 
                                    <Button onPress={() => navigation.navigate('NewCar')} style={profileStyles.add} styleText={{fontSize:14}} color='primary'>+ AGREGAR</Button> : null
                                }
                                {
                                    cars.map((item,i) => {
                                        const car = {
                                            name:item.brandName + ' ' + item.modelName + ' ' + item.year,
                                            location:'Patente ' + item.plate,
                                            link:true,
                                            linkLabel:profileUser ? 'ver >' : 'editar >',
                                            image:'https://freeiconshop.com/wp-content/uploads/edd/car-flat.png'
                                        }
                                        return(
                                            <ListView  key={i} item={car} active={false} navigation={navigation} onPress={() => navigation.navigate((profileUser ? 'ViewCar' : 'NewCar'), { carId: item._id, carName: car.name })}/>
                                        )
                                    })
                                }
                            </View>
                            {/* Mis documentos */}
                            <View style={profileStyles.profileSection}>
                                <Text style={styles.sectionTitle}>{profileUser ? 'Documentos' : 'Mis documentos'}</Text>
                                {
                                    !profileUser ? 
                                    <Button onPress={() => navigation.navigate('NewDocument')} style={profileStyles.add} styleText={{fontSize:14}} color='primary'>+ AGREGAR</Button> : null
                                }
                                {
                                    documents.filter(d=>Object.keys(d).length>1).map((item,i) => {
                                        const doc = {
                                            name:item.type,
                                            location:(item.number || item.carPlate)  + ' - ' + 'Vence \n' + item.expiry.split('T')[0],
                                            link:true,
                                            linkLabel:profileUser ? 'ver >' : 'editar >',
                                            image:'https://cdn-icons-png.flaticon.com/512/2544/2544085.png'
                                        }
                                        return(
                                            <ListView key={i} item={doc} active={false} navigation={navigation} onPress={() => navigation.navigate('NewDocument', { docId: item._id, docType: item.type, userId: profileUser ? profileUser._id : null })}/>
                                        )
                                    })
                                }
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </LinearGradient> : null}
        </ImageBackground>
    )
};

const profileStyles = StyleSheet.create({
    hero: {
        paddingVertical:40,
        paddingHorizontal:20,
        ...styles.shadow
    },
    image: {
        width:100,
        height:100,
        borderRadius:99,
        overflow:'hidden',
        marginBottom:20
    },
    profileSection: {
        marginBottom:20,
        position:'relative'
    },
    add: {
        position:'absolute',
        right:0,
        top:0,
        paddingVertical:5,
        paddingHorizontal:10,
    }
});

export default Profile;