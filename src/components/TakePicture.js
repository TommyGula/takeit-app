import React, { useState } from 'react';
import { PermissionsAndroid } from 'react-native';
import Button from './Button';
import { launchCamera } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import { useNotification } from '../NotificationProvider';
import Config from 'react-native-config';
import axios from 'axios';

const TakePicture = (props) => {
    const { showNotification } = useNotification();

    const requestCameraPermission = async () => {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Camera Permission',
              message: 'App needs access to your camera.',
              buttonPositive: 'OK',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
          console.warn(err);
          return false;
        }
    };
    
    const captureImage = async () => {
        const hasCameraPermission = await requestCameraPermission();
        if (!hasCameraPermission) {
            console.error('Camera permission denied');
            return;
        }
    
        const options = {
            mediaType: 'photo',
            quality: 1,
        };
    
        console.log("Launching camera")
        launchCamera(options, (response) => {
            if (response.didCancel) {
            console.log('User cancelled image picker');
            } else if (response.error) {
            console.error('ImagePicker Error:', response.error);
            } else {
                console.log('Taken picture ' + JSON.stringify(response))
            saveImage(response.assets[0].uri);
            }
        });
    };
    
    const saveImage = async (imageUri) => {
        try {
            const filename = imageUri.split('/').pop();
        
            // Create a FormData object to send the file as multipart form data
            console.log('New file: ', imageUri, filename)
            const formData = new FormData();
            formData.append('media', {
              uri: imageUri,
              type: 'image/jpeg',
              name: filename,
            });
        
            // Make a POST request to your backend API to upload the image
            const response = await axios.post(Config.API_URL + 'upload', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
        
            if (!response.data.filename) {
              showNotification('Error', 'No se pudo subir la imágen.')
            } else {
                props.onUpload(response.data.filename);
                console.log('Image uploaded successfully');
            }

        
        } catch (error) {
          console.error('Error saving image:' + Config.API_URL + 'upload' + error);
        }
    };

    return (
        <Button {...props} onPress={captureImage}></Button>
    );
};
  
export default TakePicture;
  
  
  