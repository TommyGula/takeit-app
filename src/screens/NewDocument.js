import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground } from "react-native";
import {Picker} from '@react-native-picker/picker';
import Button from "../components/Button";
import DatePicker from 'react-native-date-picker'
import { colors, styles } from "../styles/global";
import axios from '../utils/axios';
import Storage from '../services/Storage';
import { useNotification } from "../NotificationProvider";

const licenseTypes = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2', 'E', 'F', 'G', 'H', 'I'];
const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const documentTypes = {
    'Licencia':{
        required:['number', 'licenceType', 'bloodType', 'expiry']
    },
    'Cédula Verde':{
        required:['carId', 'expiry']
    },
    'Cédula Azul':{
        required:['carId', 'expiry']
    }
};
const keysDocumentTypes = {
    [Object.keys(documentTypes)[0]]: 'carLicence',
    [Object.keys(documentTypes)[1]]: 'greenCard',
    [Object.keys(documentTypes)[2]]: 'blueCards',
};

const NewDocument = ({ navigation, route }) => {
    const docId = route.params ? route.params.docId : null;
    const userId = route.params ? route.params.userId : null;
    const docType = route.params ? route.params.docType : null;
    const [open, setOpen] = useState(false);
    const [doc, setDoc] = useState(null);
    const [cars, setCars] = useState([]);
    const [type, setType] = useState(Object.keys(documentTypes)[0]);
    const [errors, setErrors] = useState([]);
    const [editable, setEditable] = useState(true);
    const [req, setReq] = useState('');

    const pickerRef = useRef();

    const { showNotification } = useNotification();
    
    const handleSelect = (key, val) => {
        setErrors(errors.filter(e=>e!=key));
        console.log(doc, key, val)
        setDoc({...doc, [key]:val});
    };

    useEffect(() => {
        if (docId) {
            getExistingDoc(docType, userId);
            setType(docType);
        };
        getCars(userId);
    },[]);

    useEffect(() => {
        setReq(editable ? '(*)' : '');
    },[editable]);

    const getCars = async (userId=null) => {
        const token = await Storage.get('auth_token');
        const u = await Storage.get('user');
        const user = JSON.parse(u);
        axios.get('cars?userId=' + (userId || user._id), token)
        .then(response=>{
            setCars(response.data);
            if (userId) setEditable(false);
        })
        .catch(err=>showNotification('Error cars','Cars: ' +  err.message));
    };

    const getExistingDoc = async (type, userId=null) => {
        const token = await Storage.get('auth_token');
        const u = await Storage.get('user');
        const user = JSON.parse(u);
        axios.get('users/' + (userId || user._id), token)
        .then(response=>{
            if (response.data) {
                var sType = keysDocumentTypes[type || Object.keys(documentTypes)[0]];
                console.log('Doc ID ' + JSON.stringify(response.data[sType], null, 2))
                if (response.data[sType] && response.data[sType].length) {
                    setDoc(response.data[sType].find(d=>d._id == docId));
                } else {
                    setDoc(response.data[sType]);
                };
            };
        })
        .catch(err=>{
            showNotification('Error', 'Doc: ' + err.message);
        })
    };

    const handleSubmit = async () => {
        const token = await Storage.get('auth_token');
        const currUser = await Storage.get('user');
        if (!currUser || !token) {
            showNotification('Error', 'Sesión expirada');
            return;
        };
        const user = JSON.parse(currUser);

        const validation = documentTypes[type].required.reduce((r,a) => {
            if (!doc[a]) {
                r.push(a);
                return r;
            } else {
                return r;
            }
        },[]);
        if (validation.length) {
            setErrors(validation)
        } else {
            if (type === 'Licencia') {
                axios.put('users/' + user._id, {carLicence:doc}, token)
                .then(response=>{
                    if (!response.data) {
                        showNotification('Error', 'Ha ocurrido un error');
                    } else if (response.data && response.data.message) {
                        showNotification('Error', response.data.message);
                    } else {
                        navigation.navigate('Settings');
                    }
                })
                .catch(err=> {
                    showNotification('Error', err.message);
                })
            } else if (type === 'Cédula Verde') {
                axios.put('users/' + user._id, {greenCard:doc}, token)
                .then(response=>{
                    if (!response.data) {
                        showNotification('Error', 'Ha ocurrido un error');
                    } else if (response.data && response.data.message) {
                        showNotification('Error', response.data.message);
                    } else {
                        navigation.navigate('Settings');
                    }
                })
                .catch(err=> {
                    showNotification('Error', err.message);
                })
            } else if (type === 'Cédula Azul') {
                axios.put('users/' + user._id, {blueCards:doc}, token)
                .then(response=>{
                    if (!response.data) {
                        showNotification('Error', 'Ha ocurrido un error');
                    } else if (response.data && response.data.message) {
                        showNotification('Error', response.data.message);
                    } else {
                        navigation.navigate('Settings');
                    }
                })
                .catch(err=> {
                    showNotification('Error', err.message);
                })
            }
        }
    };

    const handleUpload = (newFileName) => {
        if (newFileName[0] == '/') {
            newFileName = newFileName.replace('/uploads', 'uploads')
        }
        setDoc({...doc, pictures:(doc && doc.pictures ? [...doc.pictures, newFileName] : [newFileName])});
    };

    return(
        <View style={{padding:20}}>
            <ScrollView vertical>
            <Text style={[styles.sectionTitle, {marginBottom:10}]}>Información </Text>
                <View style={[styles.section, {padding:10}]}>
                    <View style={{marginBottom:20}}>
                        <View style={docStyles.grid}>
                            <View style={docStyles.row}>
                                <View style={docStyles.gridItem}>
                                    <Text style={styles.text}>Tipo Documento {req}</Text>
                                    {
                                        editable ? 
                                        <View style={docStyles.selector}>
                                        <Picker ref={pickerRef} selectedValue={type} onValueChange={(val, i) => setType(val)}>
                                            {
                                                Object.keys(documentTypes).map((type, i) => {
                                                    return(
                                                        <Picker.Item key={i} label={type} value={type}></Picker.Item>
                                                    )
                                                })
                                            }
                                        </Picker>
                                        </View> :
                                        <Text style={[styles.text, styles.bold]}>{type}</Text>
                                    }
                                </View>
                            </View>
                        </View>
                    </View>
                    <View style={{marginBottom:type ? 20 : 0}}>
                        {
                            type === 'Licencia' ? 
                            <View style={docStyles.grid}>
                                <View style={docStyles.row}>
                                    <View style={docStyles.gridItem}>
                                        <Text style={[{marginBottom:10}, styles.text]}>N° de Licencia {req}</Text>
                                        {
                                            editable ?
                                            <>
                                            <TextInput
                                                style={docStyles.input}
                                                keyboardType="numeric"
                                                placeholder="11111111"
                                                value={doc && doc.number ? doc.number.toString() : null}
                                                onChangeText={(val) => handleSelect('number', val)}
                                                multiline
                                            />
                                            {
                                                errors.includes('number') ?
                                                <Text style={[styles.small, docStyles.error]}>Campo requerido</Text> : null
                                            }
                                            </> : 
                                            <Text style={[styles.text, styles.bold]}>{doc && doc.number ? doc.number.toString() : null}</Text>
                                        }
                                    </View>
                                    <View style={docStyles.gridItem}>
                                        <Text style={styles.text}>Tipo de Licencia {req}</Text>
                                        {
                                            editable ?
                                            <>
                                                <View style={docStyles.selector}>
                                                <Picker ref={pickerRef} selectedValue={doc && doc.licenceType ? doc.licenceType : null} onValueChange={(val, i) => handleSelect('licenceType', val)}>
                                                    <Picker.Item label={'Selecciona...'} value={null}></Picker.Item>
                                                    {
                                                        licenseTypes.map((type, i) => {
                                                            return(
                                                                <Picker.Item key={i} label={type} value={type}></Picker.Item>
                                                            )
                                                        })
                                                    }
                                                </Picker>
                                                </View>
                                                {
                                                    errors.includes('licenceType') ?
                                                    <Text style={[styles.small, docStyles.error]}>Campo requerido</Text> : null
                                                }
                                            </> : <Text style={[styles.text, styles.bold]}>{doc && doc.licenceType ? doc.licenceType : null}</Text>
                                        }
                                    </View>
                                </View>
                                <View style={docStyles.row}>
                                    <View style={docStyles.gridItem}>
                                        <Text style={styles.text}>Grupo Sanguíneo {req}</Text>
                                        {
                                            editable ? 
                                            <>
                                                <View style={docStyles.selector}>
                                                <Picker ref={pickerRef} selectedValue={doc && doc.bloodType ? doc.bloodType : null} onValueChange={(val, i) => handleSelect('bloodType', val)}>
                                                    <Picker.Item label={'Selecciona...'} value={null}></Picker.Item>
                                                    {
                                                        bloodTypes.map((type, i) => {
                                                            return(
                                                                <Picker.Item key={i} label={type} value={type}></Picker.Item>
                                                            )
                                                        })
                                                    }
                                                </Picker>
                                                </View>
                                                {
                                                    errors.includes('bloodType') ?
                                                    <Text style={[styles.small, docStyles.error]}>Campo requerido</Text> : null
                                                }
                                            </> : <Text style={[styles.text, styles.bold]}>{doc && doc.bloodType ? doc.bloodType : null}</Text>
                                        }
                                    </View>
                                    <View style={docStyles.gridItem}>
                                        <Text style={styles.text}>Vencimiento {req}</Text>
                                        {
                                            editable ?
                                            <>
                                                <View style={docStyles.selector}>
                                                <TouchableOpacity style={{flexDirection:'row', alignItems:'center', height:'100%'}} onPress={() => setOpen(!open)}>
                                                    <Text style={[styles.text, {textAlign:'center', width:'80%'}]}>{doc && doc.expiry ? new Date(doc.expiry).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}</Text>
                                                    <View style={{width:'20%'}}>
                                                    <Image style={docStyles.datePickerIcon} source={{uri:'https://cdn-icons-png.flaticon.com/512/10615/10615192.png'}}></Image>
                                                    </View>
                                                    <DatePicker
                                                        modal
                                                        style={{height:50}}
                                                        open={open}
                                                        mode='date'
                                                        date={doc && doc.expiry ? new Date(doc.expiry) : new Date()}
                                                        onConfirm={(date) => {
                                                            setOpen(false)
                                                            handleSelect('expiry', date)
                                                        }}
                                                        onCancel={() => {
                                                            setOpen(false)
                                                        }}
                                                    />
                                                </TouchableOpacity>
                                                </View>
                                                {
                                                    errors.includes('expiry') ?
                                                    <Text style={[styles.small, docStyles.error]}>Campo requerido</Text> : null
                                                }
                                            </> : <Text style={[styles.text, styles.bold]}>{doc && doc.expiry ? new Date(doc.expiry).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}</Text>
                                        }
                                    </View>
                                </View>
                            </View> : null
                        }
                        {
                            type === 'Cédula Verde' || type === 'Cédula Azul' ? 
                            <View style={docStyles.grid}>
                                <View style={docStyles.row}>
                                    <View style={docStyles.gridItem}>
                                        <Text style={styles.text}>Vencimiento {req}</Text>
                                        {
                                            editable ?
                                            <>
                                                <View style={docStyles.selector}>
                                                    <TouchableOpacity style={{flexDirection:'row', alignItems:'center', height:'100%'}} onPress={() => setOpen(!open)}>
                                                        <Text style={[styles.text, {textAlign:'center', width:'80%'}]}>{doc && doc.expiry ? new Date(doc.expiry).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}</Text>
                                                        <View style={{width:'20%'}}>
                                                            <Image style={docStyles.datePickerIcon} source={{uri:'https://cdn-icons-png.flaticon.com/512/10615/10615192.png'}}></Image>
                                                        </View>
                                                        <DatePicker
                                                            modal
                                                            style={{height:50}}
                                                            open={open}
                                                            mode='date'
                                                            date={doc && doc.expiry ? new Date(doc.expiry) : new Date()}
                                                            onConfirm={(date) => {
                                                                setOpen(false)
                                                                handleSelect('expiry', date)
                                                            }}
                                                            onCancel={() => {
                                                                setOpen(false)
                                                            }}
                                                        />
                                                    </TouchableOpacity>
                                                </View>
                                                {
                                                    errors.includes('expiry') ?
                                                    <Text style={[styles.small, docStyles.error]}>Campo requerido</Text> : null
                                                }
                                            </> :  <Text style={[styles.text, styles.bold]}>{doc && doc.expiry ? new Date(doc.expiry).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}</Text>
                                        }
                                    </View>
                                    <View style={docStyles.gridItem}>
                                        <Text style={styles.text}>Auto {req}</Text>
                                        {
                                            editable ?
                                            <>
                                                {
                                                    cars.length && (doc ? !doc.carPlate : !doc) ?
                                                    <>
                                                    <View style={docStyles.selector}>
                                                    <Picker ref={pickerRef} selectedValue={doc && doc.carId ? doc.carId : null} onValueChange={(val, i) => handleSelect('carId', val)}>
                                                        <Picker.Item label={'Selecciona...'} value={doc && doc.carId ? doc.carId : null}></Picker.Item>
                                                        {
                                                            cars.map((car, i) => {
                                                                return(
                                                                    <Picker.Item key={i} label={['brandName', 'modelName', 'year'].reduce((r,a) => {
                                                                        return r + car[a] + ' ';
                                                                    }, '').trim()} value={car._id}></Picker.Item>
                                                                )
                                                            })
                                                        }
                                                    </Picker>
                                                    </View>
                                                    </> : 
                                                    <>
                                                    <TextInput
                                                        style={docStyles.input}
                                                        placeholder="AAA-556"
                                                        value={doc ? doc.carPlate : null}
                                                        onChangeText={(val) => handleSelect('carPlate', val)}
                                                    
                                                    />
                                                    </>
                                                }
                                                {
                                                    errors.includes('car') ?
                                                    <Text style={[styles.small, docStyles.error]}>Campo requerido</Text> : null
                                                }
                                            </> :  <Text style={[styles.text, styles.bold]}>{doc && doc.carId ? ['brandName', 'modelName', 'year'].reduce((r,a) => {
                                                    return r + cars.find(c=>c._id == doc.carId)[a] + ' ';
                                                    }, '').trim() : null}</Text>
                                        }
                                    </View>
                                </View>
                            </View> : null
                        }
                    </View>
                </View>
                <View style={{marginTop:20, paddingHorizontal:'30%'}}>
                    <Button disabled={doc == null} style={styles.shadow} color='primary' onPress={handleSubmit}>GUARDAR</Button>
                </View>
            </ScrollView>
        </View>
    );
};

const docStyles = StyleSheet.create({
    input: {
        borderWidth:1,
        flex: 1,
        width:'auto',
        borderRadius: 5,
        paddingHorizontal: 10,
        borderColor:colors.gray.main,
    },
    datePickerIcon: {
        width:25,
        height:25,
    },
    selector: {
        borderWidth:1,
        flex: 1,
        width:'auto',
        borderRadius: 5,
        paddingVertical:0,
        borderColor:colors.gray.main,
        marginTop:10
    },
    grid: {
        flex:1,
        gap:10,
        flexDirection: 'column'
    },
    row: {
        maxWidth:'100%',
        flexDirection: 'row', // Each row will contain items horizontally
        justifyContent: 'space-between', // Items are spaced evenly in each row
    },
    gridItem: {
        width:'48.375%',
        minHeight:70
    },
    error: {
        color:'red'
    }
});

export default NewDocument;