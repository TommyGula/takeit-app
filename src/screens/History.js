import React, { useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, ScrollView, Text } from "react-native";
import { styles } from "../styles/global";
import axios from '../utils/axios';
import Storage from "../services/Storage";
import Loading from "./Loading";
import { useNotification } from "../NotificationProvider";
import ListView from "../components/ListView";

const History = ({ navigation, route }) => {
    const keyWord = route.params.keyWord || 'Intercambios';
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
        const getAsSellerMatches = axios.get('matches?cancelled=false&finished=true&sellerId=' + me._id, token);
        const getAsSeller = axios.get('places?includeTaken=true&userId=' + me._id, token);
        const promises = new Promise.all([getAsBuyer, getAsSellerMatches, getAsSeller]);
        promises
            .then(response => {
                if (response.length) {
                    response[2].data = response[2].data.reduce((r, a) => {
                        const placeFinishedMatches = response[1].data.filter(m => m.parkingId == a._id);
                        a.finished = placeFinishedMatches.length > 0;
                        r.push(a);
                        return r;
                    }, []);
                    setMatchesAsBuyer(route.params.showOnlyAsBuyer ? route.params.showOnlyAsBuyer(response[0].data) : response[0].data);
                    setMatchesAsSeller(route.params.showOnlyAsSeller ? route.params.showOnlyAsSeller(response[2].data) : response[2].data);
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
                                <Text style={[styles.sectionTitle, { paddingHorizontal: 20, marginTop: 20 }]}>{keyWord} buscados</Text>
                                {matchesAsBuyer.filter(m => m.parkingId)
                                    .map((match, i) => { // nearByUsers will be the fetched data of type "parking"
                                        match['name'] = match.sellerId.firstName + ' ' + match.sellerId.lastName;
                                        match['location'] = match.location;
                                        match['status'] = match.cancelled ? 'Cancelado' : match.finished ? 'Completado' : 'Pendiente';
                                        match['statusOrder'] = match.status == 'Pendiente' ? 0 : match.status == 'Completado' ? 1 : 2;
                                        match['statusColor'] = match.status === 'Completado' ? 'green' : match.status === 'Pendiente' ? '#FFA500' : 'red';
                                        return match;
                                    })
                                    .sort((a, b) => a.statusOrder - b.statusOrder)
                                    .map((match, i) => {
                                        var onPress = () => navigation.navigate('Summary', { matchId: match._id });
                                        if (match.finished) {
                                            onPress = () => null;
                                        };
                                        return (
                                            // The card will show the price, the user picture and pictures if there are
                                            <ListView style={{ paddingHorizontal: 20 }} pre='$ ' key={i} item={match} navigation={navigation} onPress={onPress}></ListView>
                                        )
                                    })}
                                {
                                    !matchesAsBuyer.length ?
                                        <View style={{ padding: 20, paddingTop: 0 }}>
                                            <Text style={styles.text}>No tenés ningún intercambio buscado en el momento</Text>
                                        </View> : null
                                }
                                <Text style={[styles.sectionTitle, { paddingHorizontal: 20, marginTop: 20 }]}>{keyWord} ofrecidos</Text>
                                {matchesAsSeller
                                    .sort((a, b) => b.createdAt - a.createdAt)
                                    .map((place, i) => { // nearByUsers will be the fetched data of type "parking"
                                        place['name'] = place.userId.firstName + ' ' + place.userId.lastName;
                                        place['location'] = place.location;
                                        place['status'] = place.cancelled ? 'Cancelado' : place.finished ? 'Completado' : 'Pendiente';
                                        place['statusColor'] = place.status === 'Completado' ? 'green' : place.status === 'Pendiente' ? '#FFA500' : 'red';
                                        var onPress = () => navigation.navigate('LivePlace', { parkingId: place._id });
                                        if (place.finished) {
                                            onPress = () => null;
                                        };
                                        return (
                                            // The card will show the price, the user picture and pictures if there are
                                            <ListView style={{ paddingHorizontal: 20 }} pre='$ ' key={i} item={place} navigation={navigation} onPress={onPress}></ListView>
                                        )
                                    })}
                                {
                                    !matchesAsSeller.length ?
                                        <View style={{ padding: 20, paddingTop: 0 }}>
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