import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import baseURL from '../config/api';


function Prescricoes({route, navigation}){
    const {idoso} = route.params;
    const [prescricoes, setPrescricoes] = useState([]);
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

        const newPrescricoes = response.data.filter(P => {
            P.id===idoso.id
        })

        // 3. Salva a lista de idosos recebida no estado do componente
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
                
                {prescricoes.length>0?  prescricoes.map( (P,idx) =>{
                    return (
                        <Text
                        key={idx}
                        >
                            {P.id} eba {idoso.id}
                        </Text>
                    )
                }): <Text>EBass</Text>}

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
    infoCard: {
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
      width: '45%',
    },
    infoValue: {
      fontSize: 16,
      color: '#2c3e50',
      flex: 1,
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