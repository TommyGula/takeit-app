import React, { useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, ScrollView, Text } from "react-native";
import { styles } from "../styles/global";
import ChatView from "../components/ChatView";
import axios from '../utils/axios';
import Storage from "../services/Storage";
import Loading from "./Loading";
import socket from '../services/SocketIO';
import { useNotification } from "../NotificationProvider";

const ChatList = ({ navigation }) => {
    const [chats, setChats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [me, setMe] = useState(null);

    const { showNotification } = useNotification();

    useFocusEffect(
        React.useCallback(() => {

            if (me) {
                getChats();
            } else {
                getUser();
            };
            if (me) {
                socket.on('receivedMessage_' + me._id, getChats);
                socket.on('newMessage_' + me._id, getChats);
                return () => {
                    socket.off('receivedMessage_' + me._id, getChats);
                    socket.off('newMessage_' + me._id, getChats);
                };
            }
        }, [me])
    );
    
    const getChats = async () => {
        const token = await Storage.get('auth_token');
        axios.get('chats/user/' + me._id, token)
        .then(response => {
            if (response.data) {
                setChats(response.data);
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

    return(
        <View>
            <Loading visible={loading}></Loading>
            {
                !loading && chats && me ?
                <>
                    <View style={styles.scrollViewContainer}>
                    <ScrollView vertical showsVerticalScrollIndicator={false} style={[styles.scrollView, {height:'100%'}]}>
                        {chats.map((chat,i) => { // nearByUsers will be the fetched data of type "parking"
                            chat['name'] = chat.titles[me._id];
                            return(
                                // The card will show the price, the user picture and pictures if there are
                                <ChatView key={i} item={chat} active={chat.hasUnread} navigation={navigation} onPress={() => navigation.navigate('Chat', { userName: chat['name'], chatId: chat['_id'] })}/>
                            )
                        })}
                        {
                            !chats.length ? 
                            <View style={{paddingHorizontal:20}}>
                                <Text style={styles.text}>No tenés ningún chat activo en el momento</Text>
                            </View> : null
                        }
                    </ScrollView>
                    </View>
                </> : null
            }
        </View>
    )
};

export default ChatList;