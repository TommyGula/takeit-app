import React from "react";
import { Modal, View, Text } from "react-native";
import { StyleSheet, TouchableOpacity } from "react-native";
import { styles } from "../styles/global";

const ModalComponent = ({children, visible, setVisible}) => {
    return(
        <Modal transparent visible={visible} animationType="fade" style={{position:'absolute'}}>
            <TouchableOpacity onPress={() => setVisible(false)} style={modalStyles.closeButton}>
                <Text style={[styles.text, {textAlign:'right', color:'#fff'}]}>CERRAR</Text>
            </TouchableOpacity>
            <View style={modalStyles.modalContainer}>
                {children}
            </View>
        </Modal>
    )
};

const modalStyles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor:'rgba(0,0,0,0.85)'
    },
    closeButton: {
        position: 'absolute',
        top: 20, // Adjust top position for better visibility
        right: 20, // Adjust right position for better visibility
        padding: 10,
        zIndex:40,
        color:'#fff'
    },
});

export default ModalComponent;