import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import Button from "../components/Button";
import { styles } from "../styles/global";

const Payment = ({ route, navigation }) => {
    const { status } = route.params;
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (status === "success") {
            const timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);

            if (countdown === 0) {
                clearInterval(timer);
                navigation.navigate("Home");
            }

            return () => clearInterval(timer);
        }
    }, [countdown, status, navigation]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', ...styles.sectionContainer }}>
            <Text style={[styles.text, { marginBottom: 20 }]}>
                {status === "success" && `Pago exitoso. Redireccionando en ${countdown}...`}
                {status === "error" && "Pago fallido. Por favor intente nuevamente."}
                {status === "pending" && "Pago pendiente. Por favor espere."}
            </Text>
            <Button
                title="VOLVER"
                color={'primary'}
                onPress={() => navigation.goBack()}
                disabled={status === "success" && countdown > 0}
            />
        </View>
    );
};

export default Payment;
