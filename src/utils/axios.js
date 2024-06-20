import axios from 'axios';
import Config from "react-native-config";

const getHeader = (token=null) => {
    if (token) {
        return(
            { headers: { Authorization: token } }
        )
    } else {
        return {}
    }
}

module.exports = {
    get: (query='', token=null) => {
        return axios.get(Config.API_URL + query, getHeader(token))
    },
    post:(query='', data={}, token=null) => {
        return axios.post(Config.API_URL + query, data, getHeader(token))
    },
    put:(query='', data={}, token=null) => {
        return axios.put(Config.API_URL + query, data, getHeader(token))
    },
    delete:(query='', token=null) => {
        return axios.delete(Config.API_URL + query, getHeader(token))
    }
}
