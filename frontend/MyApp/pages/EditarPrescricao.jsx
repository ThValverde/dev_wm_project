import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Alert, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

export default function EditarPrescricao({ route, navigation }) {
    const { prescricao, idosoId } = route.params;

    const [medicamentos, setMedicamentos] = useState([]);
    const [medicamentoId, setMedicamentoId] = useState(prescricao.medicamento.id);
    const [horario, setHorario] = useState(prescricao.horario_previsto.substring(0, 5));
    const [dosagem, setDosagem] = useState(prescricao.dosagem);
    const [instrucoes, setInstrucoes] = useState(prescricao.instrucoes);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        const fetchMedicamentos = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                const groupId = await AsyncStorage.getItem('selectedGroupId');
                const response = await axios.get(`${baseURL}/api/grupos/${groupId}/medicamentos/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                setMedicamentos(response.data);
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
                medicamento_id: medicamentoId,
                horario_previsto: horario,
                dosagem: dosagem,
                instrucoes: instrucoes,
            };
            await axios.patch(`${baseURL}/api/grupos/${groupId}/prescricoes/${prescricao.id}/`, payload, {
                headers: { 'Authorization': `Token ${token}` }
            });
            Alert.alert("Sucesso", "Prescrição atualizada com sucesso.");
            navigation.goBack();
        } catch (error) {
            Alert.alert("Erro", "Não foi possível atualizar a prescrição.");
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
                {carregando ? <ActivityIndicator color="#fff"/> : <Text style={styles.buttonText}>Atualizar Prescrição</Text>}
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