import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

export default function CadastroPrescricao({ route, navigation }) {
    const { idosoId } = route.params;
    const [medicamentos, setMedicamentos] = useState([]);
    const [medicamentoId, setMedicamentoId] = useState(null);
    const [horario, setHorario] = useState('08:00');
    const [dosagem, setDosagem] = useState('');
    const [instrucoes, setInstrucoes] = useState('');
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        // Busca os medicamentos disponíveis no estoque para preencher o Picker
        const fetchMedicamentos = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                const groupId = await AsyncStorage.getItem('selectedGroupId');
                const response = await axios.get(`${baseURL}/api/grupos/${groupId}/medicamentos/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                setMedicamentos(response.data);
                if (response.data.length > 0) {
                    setMedicamentoId(response.data[0].id); // Seleciona o primeiro por padrão
                }
            } catch (error) {
                Alert.alert("Erro", "Não foi possível carregar a lista de medicamentos.");
            } finally {
                setCarregando(false);
            }
        };
        fetchMedicamentos();
    }, []);

    const handleSave = async () => {
        if (!medicamentoId || !dosagem.trim()) {
            Alert.alert("Erro", "Selecione um medicamento e informe a dosagem.");
            return;
        }
        setCarregando(true);
        try {
                    const token = await AsyncStorage.getItem('authToken');
                    const groupId = await AsyncStorage.getItem('selectedGroupId');
                    const payload = {
                        // CORREÇÃO: O idoso_id é enviado no corpo da requisição
                        idoso_id: idosoId,
                        medicamento_id: medicamentoId,
                        horario_previsto: horario,
                        dosagem: dosagem,
                        instrucoes: instrucoes,
                    };
                    // CORREÇÃO: A URL aponta para o endpoint de prescrições do grupo
                    await axios.post(`${baseURL}/api/grupos/${groupId}/prescricoes/`, payload, {
                        headers: { 'Authorization': `Token ${token}` }
                    });
                    Alert.alert("Sucesso", "Prescrição adicionada.");
                    navigation.goBack();
                } catch (error) {
            Alert.alert("Erro", "Não foi possível salvar a prescrição.");
        } finally {
            setCarregando(false);
        }
    };

    if (carregando) return <ActivityIndicator size="large" />;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.label}>Medicamento*</Text>
            <View style={styles.pickerContainer}>
                <Picker selectedValue={medicamentoId} onValueChange={itemValue => setMedicamentoId(itemValue)}>
                    {medicamentos.map(med => (
                        <Picker.Item key={med.id} label={med.nome_marca} value={med.id} />
                    ))}
                </Picker>
            </View>

            <Text style={styles.label}>Horário da Dose (HH:MM)*</Text>
            <TextInput style={styles.input} value={horario} onChangeText={setHorario} />
            
            <Text style={styles.label}>Dosagem*</Text>
            <TextInput style={styles.input} placeholder="Ex: 1 comprimido, 10ml" value={dosagem} onChangeText={setDosagem} />

            <Text style={styles.label}>Instruções Adicionais</Text>
            <TextInput style={[styles.input, {height: 100}]} multiline value={instrucoes} onChangeText={setInstrucoes} />

            <TouchableOpacity onPress={handleSave} style={styles.button} disabled={carregando}>
                {carregando ? <ActivityIndicator color="#fff"/> : <Text style={styles.buttonText}>Salvar Prescrição</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginTop: 12,
        marginBottom: 6,
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 12,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        color: '#333',
        marginBottom: 12,
    },
    button: {
        backgroundColor: '#007bff',
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});