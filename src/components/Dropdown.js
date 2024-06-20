import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Divider from './Divider';
import { styles } from '../styles/global';

const Dropdown = ({ title, options, Component, childProps, startsOpen=false }) => {
    const [open, setOpen] = useState(startsOpen);
  
    return (
      <View>
        <TouchableOpacity onPress={() => setOpen(!open)} style={dropdownStyles.dropdown}>
          <Text style={{...styles.text}}>{title}</Text>
          <Text style={styles.sectionTitle}>{open ? '︿' : '﹀'}</Text>
        </TouchableOpacity>
        {open && (
          <View style={{ marginTop: 5 }}>
            {options.map((option, i) => (
                <Component {...childProps(option.id)} key={i} name={option.id} item={option}></Component>
            ))}
          </View>
        )}
        <Divider></Divider>
      </View>
    );
  };

const dropdownStyles = StyleSheet.create({
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'space-between',
  },
});

export default Dropdown;
