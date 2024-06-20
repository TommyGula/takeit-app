import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Modal, ImageBackground } from "react-native";
import {Picker} from '@react-native-picker/picker';
import Button from "../components/Button";
import Media from "../components/Media";
import { colors, styles } from "../styles/global";
import axios from '../utils/axios';
import Storage from '../services/Storage';
import { useNotification } from "../NotificationProvider";
import TakePicture from "../components/TakePicture";
import Config from "react-native-config";
import ModalComponent from "../components/Modal";
import CarouselComponent from "../components/Carousel";

const NewCar = ({ navigation, route }) => {
    const carId = route.params ? route.params.carId : null;
    const [car, setCar] = useState(null);
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [errors, setErrors] = useState([]);
    const [editable, setEditable] = useState(false);
    const [req, setReq] = useState('');

    const pickerRefBrand = useRef();
    const pickerRefModel = useRef();

    const { showNotification } = useNotification();
    
    const handleSelect = (key, val) => {
        setErrors(errors.filter(e=>e!=key));
        if (key === 'brand') {
            getModels(val);
        }
        setCar({...car, [key]:val});
    };

    useEffect(() => {
        if (carId) {
            getExistingCar();
        } else {
            setEditable(true);
        };
        getBrands();
    },[]);

    useEffect(() => {
        setReq(editable ? '(*)' : '');
    },[editable]);

    const getExistingCar = async () => {
        const user = await Storage.get('user');
        const token = await Storage.get('auth_token');
        const currUser = JSON.parse(user);
        axios.get('cars/' + carId, token)
        .then(response=>{
            if (response.data) {
                setCar(response.data);
                getModels(response.data.brand);
                setEditable(currUser._id == response.data.userId);
            };
        })
        .catch(err=>{
            showNotification('Error', err.message);
        })
    };

    const getBrands = async () => {
        const token = await Storage.get('auth_token')
        axios.get('cars/brands', token)
        .then(response=>{
            if (response.data) {
                setBrands(response.data);
            };
        })
        .catch(err=>{
            showNotification('Error', err.message);
        })
    };
    
    const getModels = async (brandId) => {
        const token = await Storage.get('auth_token')
        axios.get('cars/brands/' + brandId + '/models', token)
        .then(response=>{
            if (response.data) {
                setModels(response.data);
            };
        })
        .catch(err=>{
            showNotification('Error', err.message);
        })
    };

    const openCarousel = (i) => {
        setModalVisible(true);
        setCurrentIndex(i);
    };

    const handleSubmit = async () => {
        const token = await Storage.get('auth_token');
        const currUser = await Storage.get('user');
        if (!currUser || !token) {
            showNotification('Error', 'Sesión expirada');
            return;
        };
        const user = JSON.parse(currUser);
        const required = ['plate', 'year', 'brand', 'model']
        const validation = required.reduce((r,a) => {
            if (!car[a]) {
                r.push(a);
                return r;
            } else {
                return r;
            }
        },[]);
        if (validation.length) {
            setErrors(validation)
        } else {
            if (car.pitures && car.pictures.length) {
                car.pictures = car.pictures.reduce((r,a) => {
                    r.push(a.replace(Config.API_URL, ""));
                },[]);
            };
            car['userId'] = user._id;
            const method = carId ? 'put' : 'post';
            axios[method]('cars' + (carId ? '/' + carId : ''), car, token)
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
    };

    const handleUpload = (newFileName) => {
        if (newFileName[0] == '/') {
            newFileName = newFileName.replace('/uploads', 'uploads')
        }
        setCar({...car, pictures:(car && car.pictures ? [...car.pictures, newFileName] : [newFileName])});
    };

    return(
        <View style={{padding:20}}>
            {
                car && car.pictures && car.pictures.length ? 
                <ModalComponent visible={modalVisible} setVisible={setModalVisible}>
                    <CarouselComponent images={car.pictures} current={currentIndex}></CarouselComponent>
                </ModalComponent> : null
            }
            <ScrollView vertical>
            <Text style={[styles.sectionTitle, {marginBottom:10}]}>Información General</Text>
                <View style={[styles.section, {padding:10}]}>
                    <View style={{marginBottom:20}}>
                        <View style={carStyles.grid}>
                            <View style={carStyles.row}>
                                <View style={carStyles.gridItem}>
                                    <Text style={[styles.text, {marginBottom:(editable ? 10: 0)}]}>Placa {req}</Text>
                                    {
                                        editable ? 
                                        <>
                                            <TextInput
                                                style={carStyles.input}
                                                placeholder="XXX-000"
                                                value={car ? car.plate : null}
                                                onChangeText={(val) => handleSelect('plate', val)}
                                                multiline
                                                name='plate'
                                            />
                                            {
                                                errors.includes('plate') ?
                                                <Text style={[styles.small, carStyles.error]}>Campo requerido</Text> : null
                                            }
                                        </> : <Text style={[styles.text, styles.bold]}>{car && car.plate}</Text>
                                    }
                                </View>
                                <View style={carStyles.gridItem}>
                                    <Text style={styles.text}>Año {req}</Text>
                                    {
                                        editable?
                                        <>
                                        <View style={carStyles.selector}>
                                        <Picker ref={pickerRefBrand} selectedValue={car ? parseInt(car.year) : '0'} onValueChange={(val, i) => handleSelect('year', val)}>
                                            <Picker.Item label={'Selecciona...'} value={'0'}></Picker.Item>
                                            {
                                                Array.from({ length: new Date().getFullYear() - 1950 + 1 }, (_, index) => new Date().getFullYear() - index).map((year, i) => {
                                                    return(
                                                        <Picker.Item key={i} label={year} value={year}></Picker.Item>
                                                    )
                                                })
                                            }
                                        </Picker>
                                        </View>
                                        {
                                            errors.includes('year') ?
                                            <Text style={[styles.small, carStyles.error]}>Campo requerido</Text> : null
                                        }
                                        </> : <Text style={[styles.text, styles.bold]}>{car && car.year}</Text>
                                    }
                                </View>
                            </View>
                            <View style={carStyles.row}>
                                <View style={carStyles.gridItem}>
                                    <Text style={styles.text}>Marca {req}</Text>
                                    {
                                        editable?
                                        <>
                                        <View style={carStyles.selector}>
                                            <Picker ref={pickerRefBrand} selectedValue={car ? car.brand : '0'} onValueChange={(val, i) => handleSelect('brand', val)}>
                                                <Picker.Item label={'Selecciona...'} value={'0'}></Picker.Item>
                                                {
                                                    brands.map((brand) => {
                                                        return(
                                                            <Picker.Item key={brand.id} label={brand.make} value={brand.id}></Picker.Item>
                                                        )
                                                    })
                                                }
                                            </Picker>
                                        </View>
                                        {
                                            errors.includes('brand') ?
                                            <Text style={[styles.small, carStyles.error]}>Campo requerido</Text> : null
                                        }
                                        </> : <Text style={[styles.text, styles.bold]}>{car && brands.length && brands.find(i=>i.id == car.brand).make}</Text>
                                    }
                                </View>
                                <View style={carStyles.gridItem}>
                                    <Text style={styles.text}>Modelo {req}</Text>
                                    {
                                        editable?
                                        <>
                                        <View style={carStyles.selector}>
                                            <Picker ref={pickerRefModel} selectedValue={car ? car.model : '0'} onValueChange={(val, i) => handleSelect('model', val)}>
                                                <Picker.Item label={'Selecciona una marca...'} value={'0'}></Picker.Item>
                                                {
                                                    models.map((model) => {
                                                        return(
                                                            <Picker.Item key={model.id} label={model.model} value={model.id}></Picker.Item>
                                                        )
                                                    })
                                                }
                                            </Picker>
                                        </View>
                                        {
                                            errors.includes('model') ?
                                            <Text style={[styles.small, carStyles.error]}>Campo requerido</Text> : null
                                        }
                                        </> : <Text style={[styles.text, styles.bold]}>{car && models.length && models.find(i=>i.id == car.model).model}</Text>
                                    }
                                </View>
                            </View>
                            <View style={carStyles.row}>
                            </View>
                        </View>
                    </View>
                </View>
                <Text style={[styles.sectionTitle, {marginVertical:20}]}>Fotos Del Vehiculo</Text>
                <View style={[styles.section, {padding:10}]}>
                    <View style={{marginBottom:20}}>
                        {
                            car && car.pictures && car.pictures.length ?
                            <View style={{paddingHorizontal:10}}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{paddingVertical:10}}>
                                    <View style={{ flexDirection: 'row', gap:10 }}>
                                        {
                                            car.pictures.map((img, i) => {
                                                img = img[0] == '/' ? img.slice(1) : img;
                                                return(
                                                    <TouchableOpacity key={i} onPress={() => openCarousel(i)}>
                                                        <Media Component={ImageBackground} source={{uri: Config.API_URL + img}} key={i} style={carStyles.galleryItem}></Media>
                                                    </TouchableOpacity>
                                                )
                                            })
                                        }
                                    </View>
                                </ScrollView>
                            </View> :
                            <View>
                                <Text style={styles.text}>No hay fotos cargadas.</Text>
                            </View>
                        }
                        {
                            editable ?
                            <TakePicture disabled={car && car.pictures && car.pictures.length >= 4} onUpload={handleUpload} color='primary' style={{width:'30%', paddingVertical:5, marginTop:20, paddingHorizontal:5}} styleText={{fontSize:14}} onPress={() => null}>+ AÑADIR</TakePicture> : null
                        }
                    </View>
                </View>
                {/* <Text style={[styles.sectionTitle, {marginVertical:20}]}>Documentos Asignados</Text>
                <View style={[styles.section, {padding:10}]}>
                    <View style={{marginBottom:20}}>
                        {
                            car && car.documents && car.documents.length ?
                            <View></View> : 
                            <View>
                                <Text style={styles.text}>No hay documentos asignados.</Text>
                            </View>
                        }
                        <Button color='primary' style={{width:'60%', paddingVertical:5, marginTop:20, paddingHorizontal:5}} styleText={{fontSize:14}} onPress={() => null}>+ AÑADIR DOCUMENTO</Button>
                    </View>
                </View> */}
                {
                    editable ?
                    <View style={{marginTop:20, paddingHorizontal:'30%'}}>
                        <Button style={styles.shadow} color='primary' onPress={handleSubmit}>GUARDAR</Button>
                    </View> : null
                }
            </ScrollView>
        </View>
    );
};

const carStyles = StyleSheet.create({
    input: {
        borderWidth:1,
        flex: 1,
        width:'auto',
        borderRadius: 5,
        paddingHorizontal: 10,
        borderColor:colors.gray.main,
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
    galleryItem: {
        height: 80,
        width: 80,
        borderRadius:10,
        backgroundSize:'cover',
        backgroundPosition:'center center',
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
        width:'48.375%'
    },
    error: {
        color:'red'
    }
});

export default NewCar;