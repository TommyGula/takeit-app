import AsyncStorage from "@react-native-async-storage/async-storage";

module.exports = {
    get: async (key) => {
        try {
            const val = await AsyncStorage.getItem('@'+key);
            return val;
        } catch (err) {
            console.error('Error retrieving value for ' + key + ': ' + err.message);
            return null;
        }
    },
    set: async (key, val) => {
        try {
            await AsyncStorage.setItem('@' + key, val);
        } catch (err) {
            console.error('Error saving ' + key + ':' + err.message);
        }
    },
    remove: async (key) => {
        try {
            await AsyncStorage.removeItem('@'+key);
        } catch (err) {
            console.error('Error removing ' + key + ':' + err.message);
        }
    }
}