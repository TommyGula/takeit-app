import axios from "../utils/axios";
import Storage from "../services/Storage";

class AuthService {
    static async getUserAndTokenIfAuthenticated() {
        const user = await Storage.get('user');
        const token = await Storage.get('auth_token');
    
        if (!token || !user) {
            return false;
        } else {
            const jsonUser = JSON.parse(user);
            try {
                const userData = await axios.get('users/' + jsonUser._id, token);
                return userData.data;
            } catch (err) {
                console.log('Not authenticated ', err);
                return false;
            }
        }
    };

    static async logOut() {
        try {
            // Remove user and token from storage
            await Storage.remove('user');
            await Storage.remove('auth_token');

            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    };
}
  
export default AuthService;
  