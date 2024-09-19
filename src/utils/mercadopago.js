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
    },
    payments: {
        find: (externalReference) => {
            return axios.get('https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&external_reference=' + externalReference + '&range=date_created&begin_date=NOW-30DAYS&end_date=NOW', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + Config.MP_ACCESS_TOKEN
                }
            })
        }
    }
}