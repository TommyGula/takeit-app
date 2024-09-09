import React, { useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, ScrollView, Text } from "react-native";
import { styles } from "../styles/global";
import axios from '../utils/axios';
import Storage from "../services/Storage";
import Loading from "./Loading";
import { useNotification } from "../NotificationProvider";
import ListView from "../components/ListView";

const History = ({ navigation }) => {
    const [matchesAsBuyer, setMatchesAsBuyer] = useState(null);
    const [matchesAsSeller, setMatchesAsSeller] = useState(null);
    const [loading, setLoading] = useState(true);
    const [me, setMe] = useState(null);

    const { showNotification } = useNotification();

    useFocusEffect(
        React.useCallback(() => {

            if (me) {
                getHistoricalMatches();
            } else {
                getUser();
            };
        }, [me])
    );

    const getHistoricalMatches = async () => {
        const token = await Storage.get('auth_token');
        const getAsBuyer = axios.get('matches?buyerId=' + me._id, token);
        const getAsSeller = axios.get('matches?sellerId=' + me._id, token);
        const promises = new Promise.all([getAsBuyer, getAsSeller]);
        promises
            .then(response => {
                if (response.length) {
                    setMatchesAsBuyer(response[0].data);
                    setMatchesAsSeller(response[1].data);
                } else {
                    showNotification('Error', response.message);
                }
                setLoading(false);
            })
            .catch(err => {
                showNotification('Error', err.message);
                setLoading(false);
            });
    };

    const getUser = async () => {
        const user = await Storage.get('user');
        setMe(JSON.parse(user));
    };

    return (
        <View style={styles.container}>
            <Loading visible={loading}></Loading>
            {
                !loading && matchesAsBuyer && matchesAsSeller && me ?
                    <>
                        <View style={styles.scrollViewContainer}>
                            <ScrollView vertical showsVerticalScrollIndicator={false} style={[styles.scrollView, { height: '100%' }]}>
                                <Text style={[styles.sectionTitle, { paddingHorizontal: 20, marginTop: 20 }]}>Intercambios realizados</Text>
                                {matchesAsBuyer.filter(m => m.parkingId).map((match, i) => { // nearByUsers will be the fetched data of type "parking"
                                    match['name'] = match.sellerId.firstName + ' ' + match.sellerId.lastName;
                                    match['location'] = match.location;
                                    return (
                                        // The card will show the price, the user picture and pictures if there are
                                        <ListView style={{ paddingHorizontal: 20 }} pre='$ ' key={i} item={match} navigation={navigation} onPress={() => navigation.navigate('Summary', { matchId: match._id })}></ListView>
                                    )
                                })}
                                {
                                    !matchesAsBuyer.length ?
                                        <View style={{ paddingHorizontal: 20 }}>
                                            <Text style={styles.text}>No tenés ningún intercambio realizado en el momento</Text>
                                        </View> : null
                                }
                                <Text style={[styles.sectionTitle, { paddingHorizontal: 20, marginTop: 20 }]}>Intercambios ofrecidos</Text>
                                {matchesAsSeller.filter(m => m.parkingId).map((match, i) => { // nearByUsers will be the fetched data of type "parking"
                                    match['name'] = match.sellerId.firstName + ' ' + match.sellerId.lastName;
                                    match['location'] = match.location;
                                    return (
                                        // The card will show the price, the user picture and pictures if there are
                                        <ListView style={{ paddingHorizontal: 20 }} pre='$ ' key={i} item={match} navigation={navigation} onPress={() => navigation.navigate('Summary', { matchId: match._id })}></ListView>
                                    )
                                })}
                                {
                                    !matchesAsSeller.length ?
                                        <View style={{ paddingHorizontal: 20 }}>
                                            <Text style={styles.text}>No tenés ningún intercambio ofrecido en el momento</Text>
                                        </View> : null
                                }
                            </ScrollView>
                        </View>
                    </> : null
            }
        </View>
    )
};

export default History;