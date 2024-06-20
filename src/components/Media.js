import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';

const Media = ({ source, style, Component=Image }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <>
      {imageError ? (
        <Component
          source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png' }} // Path to your custom error image
          style={style}
          resizeMode='cover'
        />
      ) : (
        <Component
          source={source} // URL of the original image
          style={style}
          onError={(err) => setImageError(true)}
          resizeMode='cover' // Set imageError state to true if original image fails to load
        />
      )}
    </>
  );
};

export default Media;
