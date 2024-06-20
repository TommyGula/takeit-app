import React, { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";
import axios from '../utils/axios';
import Storage from "../services/Storage";
import Loading from "./Loading";
import socket from '../services/SocketIO';
import { useNotification } from "../NotificationProvider";

const Chat = ({ route }) => {
    const chatId = route.params.chatId;
    const [chat, setChat] = useState(null);
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);

    const { showNotification } = useNotification();

    const handleMessageSubmit = async (text) => {
        const token = await Storage.get('auth_token');
        const newMessage = {
            chatId:chatId,
            senderId:me._id,
            message:text
        };
        axios.post('messages', newMessage, token)
        .then(response => {
            //console.log(response)
        })
        .catch(err => {
            console.log('Error', err.message);
        })
    };

    useEffect(() => {
        if (me) {
            getChat();
        } else {
            getUser();
        };
    },[me]);

    useEffect(() => {
        const getNewMessage = async (newMessageId) => {
            const token = await Storage.get('auth_token');
            axios.get('messages/' + newMessageId, token)
            .then(response => {
                setMessages(prevMessages => [...prevMessages, response.data]);
            })
            .catch(err => {
                console.log(err)
            })
        }
        socket.on('newMessage', getNewMessage);
        return () => {
            socket.off('newMessage', getNewMessage);
        };
    },[]);
        
    const getUser = async () => {
        const getMe = await Storage.get('user');
        console.log(getMe)
        setMe(JSON.parse(getMe));
    };

    const getChat = async () => {
        const token = await Storage.get('auth_token');
        axios.get('chats/' + chatId, token)
        .then(response => {
            if (response.data) {
                setChat(response.data);
                setMessages(response.data.messages);
            } else {
                showNotification('Error', response.message);
            };
            setLoading(false);
        })
        .catch(err => {
            showNotification('Error', err.message);
            setLoading(false);
        }) 
    };

    return(
        <>
        <Loading visible={loading}></Loading>
        {
            !loading && chat && me ?
            <>
                <View style={{padding:20,height:'100%'}}>
                    <ScrollView vertical showsVerticalScrollIndicator={false}>
                        {
                            messages.map((m,i) => {
                                const time = new Date(m.createdAt).getHours() + ":" + new Date(m.createdAt).getMinutes();
                                return(
                                    <MessageBubble key={i} isMyMessage={m['senderId'] == me._id} time={time} message={m.message}></MessageBubble>
                                )
                            })
                        }
                    </ScrollView>
                </View>
                <MessageInput onSubmit={handleMessageSubmit}></MessageInput>
            </> : null
        }
        </>
    );
};

export default Chat;
