import { Linking } from 'react-native';
import Button from './Button';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import Config from 'react-native-config';
import mercadopago from '../utils/mercadopago';
import { useState } from 'react';

const CheckoutPro = ({ preference, payment }) => {
  const [show, setShow] = useState(true);
  const handlePay = async () => {
    if (payment) {
      setShow(false);
    } else {
      console.log('Payment does not exist');
      openUrl(preference.response.response[Config.MP_INIT_POINT])
    }
  };

  const openUrl = async url => {
    if (await InAppBrowser.isAvailable()) {
      InAppBrowser.open(url, {
        // iOS Properties
        dismissButtonStyle: 'cancel',
        preferredBarTintColor: '#453AA4',
        preferredControlTintColor: 'white',
        readerMode: false,
        animated: true,
        modalEnabled: true,
        // Android Properties
        showTitle: true,
        toolbarColor: '#6200EE',
        secondaryToolbarColor: 'black',
        enableUrlBarHiding: true,
        enableDefaultShare: true,
        forceCloseOnRedirection: false, // Animation
        animations: {
          startEnter: 'slide_in_right',
          startExit: 'slide_out_left',
          endEnter: 'slide_in_left',
          endExit: 'slide_out_right',
        },
      });
    } else {
      Linking.openURL(url);
    }
  };
  return (
    <>
      {
        show ?
        <Button
          title="&#128274; PAGAR"
          color="#4287F5"
          onPress={handlePay}
          style={{display: payment ? 'none' : 'block'}}
        /> : null
      }
    </>
  );
};
export default CheckoutPro;
