import axios from 'axios';
import Config from 'react-native-config';

module.exports = {
    paymentMethods: () => {
        return axios.get('https://api.mercadopago.com/v1/payment_methods', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + Config.MP_ACCESS_TOKEN
            }
        })
    }
}