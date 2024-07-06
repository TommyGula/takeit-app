import React, { useEffect, useState, useLayoutEffect, useRef } from "react";
import { View, Text, ScrollView } from "react-native";
import Button from "../components/Button";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";
import axios from '../utils/axios';
import Storage from "../services/Storage";
import Loading from "./Loading";
import socket from '../services/SocketIO';
import { useNotification } from "../NotificationProvider";

const Chat = ({ route, navigation }) => {
    const chatId = route.params.chatId;
    const [chat, setChat] = useState(null);
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);

    const scrollViewRef = useRef(null);

    const scrollToBottom = () => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    };

    const { showNotification } = useNotification();

    useLayoutEffect(() => {
        const getUserProfile = async () => {
            const profileUserId = chat.users.find(u => u != me._id);
            const profileUser = await axios.get('users/' + profileUserId);
            navigation.setOptions({
              headerRight: () => (
                <Button 
                onPress={() => navigation.navigate('UserProfile', { profileUser: profileUser.data })} 
                styleText={{fontSize:14}} color='primary'>
                    Ver Perfil
                </Button>
              ),
            });
        }
        if (chat && me) {
            getUserProfile();
        }
    }, [navigation, chat, me]);

    const handleMessageSubmit = async (text) => {
        const token = await Storage.get('auth_token');
        const newMessage = {
            chatId:chatId,
            senderId:me._id,
            message:text
        };
        axios.post('messages', newMessage, token)
        .then(response => {
            scrollToBottom();
        })
        .catch(err => {
            console.log('Error', err.message);
        })
    };

    useEffect(() => {
        if (me) {
            getChat();
            scrollToBottom();
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
                axios.put('messages/' + newMessageId, {read:true}, token)
                .then(updated => {
                    
                })
                .catch(err => {
                    console.log(err)
                })
            })
            .catch(err => {
                console.log(err)
            })
        };
        if (me) {
            socket.on('newMessage_' + me._id, getNewMessage);
            return () => {
                socket.off('newMessage_' + me._id, getNewMessage);
            };
        }
    },[me]);
        
    const getUser = async () => {
        const getMe = await Storage.get('user');
        setMe(JSON.parse(getMe));
    };

    const getChat = async () => {
        const token = await Storage.get('auth_token');
        axios.get('chats/' + chatId, token)
        .then(response => {
            if (response.data) {
                setChat(response.data);
                setMessages(response.data.messages);
                axios.put('messages/read/' + chatId + '/' + me._id, {read:true}, token)
                .then(updated => null)
                .catch(err => {
                    console.log(err)
                })
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
                <View style={{paddingHorizontal:20, paddingBottom:50, height:'100%'}}>
                    <ScrollView vertical showsVerticalScrollIndicator={false} ref={scrollViewRef} style={{paddingTop:20}}>
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
