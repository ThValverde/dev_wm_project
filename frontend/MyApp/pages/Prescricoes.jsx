import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import baseURL from '../config/api';

const Dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const DiasBoolFalse = [false,false,false,false,false,false,false];

const PrescriptionInitialState = {
    id: 1,
    idoso: "Jose Alberto",
    medicamento: {
    id: 1,
    nome_marca: "Paracetamol",
    principio_ativo: "paracetamol",
    generico: false,
    fabricante: "",
    concentracao_valor: null,
    concentracao_unidade: null,
    forma_farmaceutica: "COMP",
    quantidade_estoque: 30,
    grupo: 1
  },
    horario_previsto: "08:00:00",
    dosagem: "1 comprimido azul",
    instrucoes: "",
    ativo: true
}

function Prescricoes({route, navigation}){
    const {idoso} = route.params;
    const [prescricoes, setPrescricoes] = useState([]);
    const [edit,setEdit] = useState(false);
    const [erro,setErro] = useState();
    const [carregando,setCarregando] = useState(true);

    useEffect(() => {
    const buscarPrescricoes = async () => {
      try {
        // 1. Pega o token salvo no dispositivo durante o login
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          throw new Error('Token de autenticação não encontrado. Faça o login novamente.');
        }

        // 2. Faz a requisição GET para a API, enviando o token no cabeçalho (Header)
        const response = await axios.get(`${baseURL}/api/prescricoes/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });

         // 3. Salva a lista de idosos recebida no estado do componente

        const newPrescricoes1 = response.data.filter(P => 
            P.id===idoso.id
        )

        if(newPrescricoes1.length===0) return;

        const newPrescricoes = newPrescricoes1.map(P => ({
        ...P,
        dias : [0,1,2,3,4,5,6],
        diasBool : DiasBoolFalse
        }))

        setPrescricoes(newPrescricoes);

      } catch (err) {
        console.error("Erro ao buscar prescricoes:", err.response ? err.response.data : err.message);
        setErro('Não foi possível carregar os dados das prescricoes.');
      } finally {
        setCarregando(false);
      }
    };

    buscarPrescricoes();
  }, []);

    const daysTitle = () => {
        return(
            <View
            style={styles.prescriptionDaysFlex}
            >
                {Dias.map((d,id) => {
                    return(
                        <Text
                    key={id}
                    style={{...styles.prescriptionCardTitleText,
                    flex: '1 1 0',
                    textAlign: 'center',
                        }}
                    >
                        {d}
                    </Text>
                )})} 
            </View>
        )
    }

    const daysCheckBox = (prescription, idx) => {
        return(
            <View
            style={styles.prescriptionDaysFlex}
            >
        
                {prescription.diasBool.map( (d, idy) => (
                    <View
                    key={idy}
                    style={{...styles.checkBoxStyle, flex:'1 1 0'}}
                    >
                        {edit? <Checkbox
                    style= {{alignSelf: 'center'}}
                    color={"#2c3e50"}
                    value={d}
                    onChange={() => changeCheckBox(idx,idy)}
                    /> : <Checkbox
                    style= {{alignSelf: 'center'}}
                    color={"#2c3e50"}
                    disabled
                    value={d}
                    onChange={() => changeCheckBox(idx,idy)}
                    />}
                    </View>
                ))}
            </View>
        )
    }

    const changeCheckBox = (idx,idy) => {
        const prescription = {...prescricoes[idx],
            diasBool: prescricoes[idx].diasBool.map( (d, j) => (
                idy===j? !d : d
            ))
        }

        const newPrescricoes = [
            ...prescricoes.slice(0,idx),
            prescription,
            ...prescricoes.slice(idx+1)
        ]

        setPrescricoes(newPrescricoes)
    }

    const addPrescription = () => {
        const newPrescription = { 
            ...PrescriptionInitialState,
            dias : [],
            diasBool : DiasBoolFalse
        }

        const newPrescricoes = [
            ...prescricoes,
            newPrescription
        ]

        setPrescricoes(newPrescricoes);
    }

    const editButton = () => {
        if(edit) saveChanges();
        setEdit(!edit)
    }

    const saveChanges = () => {

    }

    const renderPrescription = (prescription, idx) => {
        if(edit) return(
            <View
            key={idx}
            style={styles.prescriptionComponent}
            >
                <Text
                style={{...styles.infoLabel,
                    flex: '1 1 0'
                }}
                >
                    Remedeo
                </Text>
                <Text
                style={{...styles.infoLabel,
                    flex: '1 1 0'
                }}
                >   
                    horareo
                </Text>

                <View
                style={{flex:'6 1 0'}}
                >
                    {daysCheckBox(prescription,idx)}
                </View>

            </View>
        )
        else return(
            <View
            key={idx}
            style={styles.prescriptionComponent}
            >
                <Text
                style={{...styles.infoLabel,
                    flex: '1 1 0'
                }}
                >
                    Remedeo
                </Text>
                <Text
                style={{...styles.infoLabel,
                    flex: '1 1 0'
                }}
                >   
                    horareo
                </Text>

                <View
                style={{flex:'6 1 0'}}
                >
                    {daysCheckBox(prescription,idx)}
                </View>

            </View>
        )
    }

    return(
        <SafeAreaView
        style={styles.safeArea}
        >
            <ScrollView
                style={styles.container}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                    <Text style={styles.backText}>Voltar</Text>
                </TouchableOpacity>

                <View style={styles.profileHeader}>
                    <Image
                        source={{ uri: `https://avatar.iran.liara.run/public/boy?username=${idoso.nome_completo}` }}
                        style={styles.profileImage}
                    />
                    <Text style={styles.profileName}>{idoso.nome_completo}</Text>
                </View>

                <View style={styles.screenView}>
                    <TouchableOpacity
                        style={styles.screenViewButtons}
                        onPress={() =>
                            navigation.navigate('Dados',
                                { idoso: idoso }
                            )}
                    >
                        <Text style={styles.screenViewText}>
                            Dados
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.screenViewButtons}
                        onPress={() =>
                            navigation.navigate('Prescricoes',
                                { idoso: idoso }
                            )}
                    >
                        <Text style={styles.screenViewText}>
                            Prescricoes
                        </Text>
                    </TouchableOpacity>
                </View>

                <View
                    style={styles.prescriptionCard}
                >
                    <View
                    style={styles.prescriptionCardLineBox}
                    >
                        <Text
                        style={{...styles.prescriptionCardTitleText,
                            flex: '1 1 0'}}
                        >
                            Remedios
                        </Text>
                        <Text
                        style={{...styles.prescriptionCardTitleText,
                            flex: '1 1 0'
                        }}
                        >
                            Horarios
                        </Text>
                        <View
                        style={{flex: '6 1 0'}}
                        >
                            {daysTitle()}
                        </View>
                    </View>

                    <View
                    style={styles.prescriptionList}
                    >
                        {(prescricoes.map((P,idx) => (
                            renderPrescription(P,idx)
                        )))}
                    </View>

                    <View>
                    <TouchableOpacity
                    onPress={() => {addPrescription()}}
                    >
                        <Text>Add</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                    onPress={() => {editButton()}}
                    >
                        <Text>{edit? "Salvar alterações" : "Editar"}</Text>
                    </TouchableOpacity>
                    </View>

                </View>

            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#2c3e50',
    },
    container: {
      flex: 1,
      padding: 16,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    backText: {
      color: '#fff',
      marginLeft: 8,
      fontSize: 16,
    },
    profileHeader: {
      alignItems: 'center',
      marginBottom: 24,
    },
    profileImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
      marginBottom: 12,
      borderWidth: 3,
      borderColor: '#fff',
      backgroundColor: '#e0e0e0',
    },
    profileName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#fff',
    },
    prescriptionCard: {
        flexDirection: 'column',
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    prescriptionCardLineBox: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'flex-start',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1',
        paddingBottom: 8,
    },
    prescriptionDaysFlex: {
        flexDirection: 'row',
        gap:4,
        justifyContent: 'flex-start',
    },
    prescriptionCardTitleText : {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginHorizontal: 8,
        textAlign: 'center'
    },
    prescriptionList: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        gap: 20
    },
    prescriptionComponent: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'flex-start',
        marginBottom: 12,
        paddingBottom: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#ecf0f1',
      paddingBottom: 8,
    },
    infoRow: {
      flexDirection: 'row',
      marginBottom: 8,
      alignItems: 'flex-start',
    },
    infoLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#34495e',
      marginHorizontal: 8,
      textAlign: 'center'
    },
    infoValue: {
      fontSize: 16,
      color: '#2c3e50',
      flex: '1 1'
    },
    checkBoxStyle: {
        boxSizing: 'border-box',
        margin: '20'
    },
    noDataText: {
      fontSize: 16,
      color: '#7f8c8d',
      fontStyle: 'italic',
      textAlign: 'center'
    },
    screenView: {
      flexDirection: 'row',
      margin: 8,
      justifyContent: 'center',
      gap: 20
    },
    screenViewButtons: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      width: 180,
    },
    screenViewText: {
      fontSize: 18,
      fontWeight: 'bold', 
      color: "#2c3e50",
      alignSelf: 'center'
    }
});

export default Prescricoes;