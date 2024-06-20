import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Table = ({rows, header=null, type='rows', showRows=null}) => {
  return (
    <View style={styles.table}>
      {/* Table Header */}
      {
        header &&
        <View style={styles.row}>
            {
                header.map((h,i) => {
                    return(
                        <View key={i} style={styles.cell}>
                            <Text style={styles.headerText}>{h}</Text>
                        </View>
                    )
                })
            }
        </View>
      }


      {/* Table Body */}
      {
        type == 'rows' ?
        <>
        {
            rows.slice(0, (showRows || 1000000000000)).map((r,i) => {
                return(
                    <View key={i} style={styles.row}>
                        {
                            Object.keys(r).map((k,i2) => {
                                if (typeof r[k] == 'string' || typeof r[k] == 'number') {
                                  return(
                                      <View key={i2} style={styles.cell}>
                                          <Text>{r[k]}</Text>
                                      </View>
                                  )
                                }
                            })
                        }
                    </View>
                )
            })
        }
        {showRows && <Text>...</Text>}
        </> :
        <>
        {
            Object.keys(rows).slice(0, (showRows || 1000000000000)).map((k,i) => {
              if (typeof rows[k] == 'string' || typeof rows[k] == 'number') {
                return(
                    <View key={i} style={styles.row}>
                        <View style={styles.cell}>
                            <Text>{k}</Text>
                        </View>
                        <View style={styles.cell}>
                            <Text>{rows[k]}</Text>
                        </View>
                    </View>
                )
              }
            })
        }
        {showRows && <Text>...</Text>}
        </> 
      }
    </View>
  );
};

const styles = StyleSheet.create({
  table: {
    borderRadius: 5,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent:'space-between',
  },
  cell: {
    flex: 1,
    paddingVertical: 5,
  },
  headerText: {
    fontWeight: 'bold',
  },
});

export default Table;
