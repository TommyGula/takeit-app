// styles.js
import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  // Global
  fontFamily: {
    fontFamily:'Quicksand-Regular',
  },
  app: {
    fontFamily:'Quicksand-Regular',
    fontSize:16,
    position:'relative'
  },  
  // Containers
  container: {
    flex: 1,
    position: 'relative',
  },
  sectionContainer: {
    paddingHorizontal:20
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    position:'absolute',
    width:'100%',
    height:'100%',
    zIndex:2,
  },
  mapCenter: {
    position:'absolute',
    marginHorizontal:30,
    marginVertical:50,
    padding:5,
    bottom:0,
    left:0,
    zIndex:2,
    height:45,
    width:45,
    backgroundColor:'#fff',
    borderRadius:99999,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2, // Negative value for vertical offset to show shadow at the top
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5, // Elevation for Android shadows
  },
  mapCenterIcon:{
    height:'100%',
    width:'100%',
  },

  // Sections
  section: {
    backgroundColor: '#fff',
    borderRadius:10,
    overflow:'visible',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2, // Negative value for vertical offset to show shadow at the top
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5, // Elevation for Android shadows
  },
  scrollViewContainer:{
    backgroundColor:'#fff',
    borderTopLeftRadius:10,
    borderTopRightRadius: 10,
    overflow:'scroll',
    position:'relative',
  },
  scrollView: {
    display: 'grid',
    gap: 10,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2, // Negative value for vertical offset to show shadow at the top
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5, // Elevation for Android shadows
  },

  // Form
  textInput: {
    backgroundColor:'#fff',
    borderBottomWidth:1,
    borderColor:'#c2c2c2',
    fontFamily:'Quicksand-Regular',
  },

  // Text
  lightTitle: {
    fontSize: 16,
    fontFamily:'Quicksand-Regular',
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 15,
    color: '#000',
    fontFamily:'Quicksand-Bold',
  },
  text: {
    fontSize:16,
    color:"#000",
    fontFamily:'Quicksand-Regular',
  },
  bold: {
    fontFamily:'Quicksand-Bold',
  },
  small: {
    fontSize: 12,
    fontFamily:'Quicksand-Regular',
  }
});

export const colors = {
    primary: {
        light: '#39fac2',
        main: '#30c697',
        dark: '#3f9377',
        contrastText: '#fff',
    },
    secondary: {
        light: '#dc3af5',
        main: '#A032B7',
        dark: '#6d317c',
        contrastText: '#fff',
    },
    complementary: {
        light: '#fa7380',
        main: '#c66374',
        dark: '#995967',
        contrastText: '#fff',
    },
    gray: {
        main:'#c2c2c2',
        dark:'#606060'
    }
};
