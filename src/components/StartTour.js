import React, { useEffect } from "react";
import axios from '../utils/axios';

const StartTour = ({}) => {
    useEffect(() => {
        checkTourStatus();
    },[]);

    const checkTourStatus = async () => {
        const u = await Storage.get('user');
        const token = await Storage.get('auth_token');
        const user = JSON.parse(u);
        axios.get('users/' + user._id, token)
        .then(user => {
            if (user?.tourFinished) {
                return;
            } else {
                if (!user?.tourStep) {
                    startTour();
                } else {
                    continueFromStep(user?.tourStep);
                }
            }
        })
    };

    const startTour = async () => {

    };

    const continueFromStep = async (step) => {
    };
};

export default StartTour;