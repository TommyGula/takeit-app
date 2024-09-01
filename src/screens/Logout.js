import React, { useEffect } from "react";
import Loading from "./Loading";
import AuthService from "../services/AuthService";

const Logout = ({ route }) => {
    useEffect(() => {
        AuthService.logOut().then(success => {
            if (success) {
                route.params.setIsAuth(false);
            };
        })
    });
    return (
        <Loading></Loading>
    );
};

export default Logout;