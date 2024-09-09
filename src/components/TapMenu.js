import React, { useState, useEffect, useRef } from "react";
import { TouchableOpacity, Image, StyleSheet, View, Text, Animated } from "react-native";
import { styles } from "../styles/global";
import TapMenuItem from "./TapMenuItem";
import Divider from "./Divider";
import axios from '../utils/axios';
import Storage from '../services/Storage';
import Config from "react-native-config";
import Logo from '../../assets/images/logo.png';
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import NotificationBubble from "./NotificationBubble";

const defaultMenuItems = [
    {
        label: 'Mi Perfil',
        route: 'Settings',
        icon: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png'
    },
    {
        label: 'Mis Chats',
        route: 'Chats',
        icon: 'https://cdn-icons-png.flaticon.com/512/566/566718.png'
    },
    {
        label: 'Mis Intercambios',
        route: 'History',
        icon: 'https://cdn-icons-png.flaticon.com/512/5582/5582302.png'
    },
    {
        label: 'Compartir',
        route: 'NewPlace',
        icon: 'https://cdn-icons-png.flaticon.com/512/67/67994.png',
        params: (item) => {
            if (item) {
                return ({
                    parkingId: item.parkingId ? item.parkingId : item._id
                })
            } else return {}
        }
    },
    {
        label: 'Cerrar Sesión',
        route: 'Logout',
        icon: 'https://cdn-icons-png.flaticon.com/512/59/59399.png'
    },
    {
        label: 'Admin: Pago Exitoso',
        route: 'PaymentSuccess',
        protected: true,
        icon: 'https://cdn-icons-png.flaticon.com/512/1388/1388990.png'
    },
    {
        label: 'Admin: Pago Fallido',
        route: 'PaymentError',
        protected: true,
        icon: 'https://cdn-icons-png.flaticon.com/512/1388/1388990.png'
    },
    {
        label: 'Admin: Pago Pendiente',
        route: 'PaymentPending',
        protected: true,
        icon: 'https://cdn-icons-png.flaticon.com/512/1388/1388990.png'
    }
];

const TapMenu = () => {
    const navigation = useNavigation();
    const [open, setOpen] = useState(false);
    const [menuItems, setMenuItems] = useState(defaultMenuItems);
    const [currentConnections, setCurrentConnections] = useState({});
    const [currUser, setCurrUser] = useState(null);
    const [routes, setRoutes] = useState([]);

    const getCurrentConnections = async () => {
        const token = await Storage.get('auth_token');
        const u = await Storage.get('user');
        const user = JSON.parse(u);
        console.log(user)

        setCurrUser(user);
        const isBuyer = axios.get('matches?cancelled=false&payed=false&buyerId=' + user._id, token);
        const isSeller = axios.get('matches?cancelled=false&payed=false&sellerId=' + user._id, token);
        const isNewPlace = axios.get('places?taken=false&userId=' + user._id, token)
        Promise.all([isBuyer, isSeller, isNewPlace])
            .then(results => {
                // console.log('Buyer connections ' + results[0].data.length);
                // console.log('Seller connections ' + results[1].data.length);
                if (results[0].data.length || results[1].data.length || results[2].data.length) {
                    console.log(JSON.stringify(results[0].data.length))
                    console.log(JSON.stringify(results[1].data.length))
                    console.log(JSON.stringify(results[2].data.length))
                    setCurrentConnections({
                        Pendientes: [...results[0].data, ...results[1].data, ...results[2].data]
                    });
                    setMenuItems([...defaultMenuItems, {
                        label: 'Pendientes',
                        route: 'History',
                        icon: 'https://cdn-icons-png.flaticon.com/512/5063/5063764.png',
                        params: () => {
                            return {
                                showOnly:(all) => all.filter((m) => !m.cancelled && !m.payed), 
                                keyWord:'Pendientes'
                            }
                        }
                    }])
                } else {
                    setCurrentConnections({});
                };
            })
    };

    const handlers = {
        overlay: {
            handler: useRef(new Animated.Value(0)).current,
            delayOpen: 0,
            delayClose: 500,
            duration: 500
        },
        overlayOpacity: {
            handler: useRef(new Animated.Value(0)).current,
            delayOpen: 500,
            delayClose: 0,
            duration: 500
        },
        menu: {
            handler: useRef(new Animated.Value(0)).current,
            delayOpen: 250,
            delayClose: 250,
            duration: 500
        },
    };

    const interpolations = {
        overlay: {
            translateX: handlers.overlay.handler.interpolate({
                inputRange: [0, 1],
                outputRange: [500, 0], // Adjust the initial and final positions as needed
            }),
            opacity: handlers.overlayOpacity.handler.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.7], // Adjust the initial and final positions as needed
            }),
        },
        menu: {
            translateX: handlers.menu.handler.interpolate({
                inputRange: [0, 1],
                outputRange: [500, 0], // Adjust the initial and final positions as needed
            }),
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            setOpen(false);
            getCurrentConnections();
        }, [])
    );

    useEffect(() => {
        const unsubscribeFocus = navigation.addListener('blur', () => {
            setOpen(false);
        });

        const unsubscribeNavigation = navigation.addListener('beforeRemove', () => {
            setOpen(false);
        });

        return () => {
            unsubscribeFocus();
            unsubscribeNavigation();
        };
    }, [navigation]);

    useEffect(() => {
        Object.values(handlers).map(h => {
            Animated.timing(h.handler, {
                toValue: open ? 1 : 0,
                duration: h.duration,
                delay: open ? h.delayOpen : h.delayClose,
                useNativeDriver: false,
            }).start();
        })
    }, [open])

    return (
        <>
            <TouchableOpacity style={tapMenuStyles.button} onPress={() => setOpen(true)}>
                {
                    Object.keys(currentConnections).length ?
                        // <Image style={tapMenuStyles.alert} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1632/1632646.png' }}></Image>
                        <NotificationBubble n={Object.values(currentConnections).reduce((r,a) => r + a.length, 0)}></NotificationBubble>
                        : null
                }
                <Image style={tapMenuStyles.icon} source={{ uri: 'https://cdn-icons-png.flaticon.com/256/1215/1215141.png' }}></Image>
            </TouchableOpacity>
            <Animated.View style={[tapMenuStyles.overlay, { transform: [{ translateX: interpolations.overlay.translateX }], opacity: interpolations.overlay.opacity }]}>
            </Animated.View>
            <Animated.View style={[tapMenuStyles.menu, { transform: [{ translateX: interpolations.menu.translateX }] }]}>
                <View style={{ marginBottom: 20, ...tapMenuStyles.logoContainer }}>
                    <Image style={tapMenuStyles.logo} source={Logo}></Image>
                </View>
                <TouchableOpacity style={tapMenuStyles.close} onPress={() => setOpen(false)}>
                    <Text style={[styles.text, { textAlign: 'center' }]}>X</Text>
                </TouchableOpacity>
                <View style={{ marginBottom: 0 }}>
                    <Text style={styles.sectionTitle}>¡Hola {currUser ? currUser.firstName : ''}!</Text>
                    <Text style={styles.text}>¿Qué estás buscando hoy?</Text>
                </View>
                <Divider></Divider>
                <View style={{ paddingVertical: 20 }}>
                    {
                        menuItems.map((item, i) => {
                            const itemParams = item.params && Object.keys(currentConnections).includes(item.route) && item.params(currentConnections[item.route][0]);

                            if (item.protected && currUser && !currUser.email.includes('gula')) return;

                            return (
                                <TapMenuItem onPress={() => navigation.navigate(item.route, {itemParams})} key={i} open={open} duration={500} delayOpen={500 + (100 * i)} delayClose={0 + (50 * (menuItems.length - 1 - i))}>
                                    <View style={tapMenuStyles.item}>
                                        <View style={tapMenuStyles.itemIcon}>
                                            <Image style={tapMenuStyles.icon} source={{ uri: item.icon }}></Image>
                                            {
                                                Object.keys(currentConnections).includes(item.label) && currentConnections[item.label] && currentConnections[item.label].length ?
                                                    // <Image style={[tapMenuStyles.alert, { marginTop: 2 }]} source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1632/1632646.png' }}></Image> :
                                                    <NotificationBubble n={currentConnections[item.label].length}></NotificationBubble> :
                                                    null
                                            }
                                        </View>
                                        <View>
                                            <Text style={styles.text}> {item.label}</Text>
                                        </View>
                                    </View>
                                </TapMenuItem>
                            )
                        })
                    }
                </View>
            </Animated.View>
        </>
    )
};

const tapMenuStyles = StyleSheet.create({
    button: {
        position: 'absolute',
        margin: 30,
        top: 0,
        right: 0,
        zIndex: 3,
        height: 45,
        width: 45,
        backgroundColor: '#fff',
        borderRadius: 99999,
        ...styles.shadow,
    },
    close: {
        position: 'absolute',
        margin: 30,
        top: 0,
        right: 0,
        zIndex: 3,
        height: 45,
        width: 45,
    },
    logoContainer: {
        width: 209 / 2,
        height: 143 / 2,
        padding: 0
    },
    logo: {
        height: '100%',
        width: '100%',
    },
    item: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center'
    },
    itemIcon: {
        width: 40,
        height: 40,
        padding: 5
    },
    itemAlert: {
        width: 15,
        height: 15,
    },
    icon: {
        height: '100%',
        width: '100%',
    },
    overlay: {
        height: '100%',
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        position: 'absolute',
        zIndex: 4
    },
    menu: {
        height: '100%',
        width: '70%',
        backgroundColor: '#fff',
        position: 'absolute',
        zIndex: 4,
        right: 0,
        padding: 30,
        ...styles.shadow
    }
});

export default TapMenu;