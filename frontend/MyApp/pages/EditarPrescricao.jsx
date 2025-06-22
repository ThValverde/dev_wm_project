import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

const DIAS_MAP = [
    { label: 'D', key: 'dia_domingo' }, { label: 'S', key: 'dia_segunda' },
    { label: 'T', key: 'dia_terca' }, { label: 'Q', key: 'dia_quarta' },
    { label: 'Q', key: 'dia_quinta' }, { label: 'S', key: 'dia_sexta' },
    { label: 'S', key: 'dia_sabado' }
];

export default function EditarPrescricao({ route, navigation }) {
    const { prescricao } = route.params;

    // Estados do formulário, inicializados com os dados da prescrição existente
    const [medicamentos, setMedicamentos] = useState([]);
    const [medicamentoId, setMedicamentoId] = useState(prescricao.medicamento.id);
    const [horario, setHorario] = useState(prescricao.horario_previsto.substring(0, 5));
    const [dosagem, setDosagem] = useState(prescricao.dosagem);
    const [instrucoes, setInstrucoes] = useState(prescricao.instrucoes);
    const [carregando, setCarregando] = useState(true);

    const [diasSemana, setDiasSemana] = useState({
        dia_domingo: prescricao.dia_domingo,
        dia_segunda: prescricao.dia_segunda,
        dia_terca: prescricao.dia_terca,
        dia_quarta: prescricao.dia_quarta,
        dia_quinta: prescricao.dia_quinta,
        dia_sexta: prescricao.dia_sexta,
        dia_sabado: prescricao.dia_sabado,
    });

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

    const handleToggleDia = (diaKey) => {
        setDiasSemana(prev => ({ ...prev, [diaKey]: !prev[diaKey] }));
    };
    
    const handleToggleTodosDias = (value) => {
        setDiasSemana({
            dia_domingo: value, dia_segunda: value, dia_terca: value,
            dia_quarta: value, dia_quinta: value, dia_sexta: value, dia_sabado: value,
        });
    };
    
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
                ...diasSemana,
            };
            await axios.patch(`${baseURL}/api/grupos/${groupId}/prescricoes/${prescricao.id}/`, payload, {
                headers: { 'Authorization': `Token ${token}` }
            });
            Alert.alert("Sucesso", "Prescrição atualizada com sucesso.");
            navigation.goBack();
        } catch (error) {
            console.error("Erro ao atualizar prescrição:", error.response?.data || error.message);
            Alert.alert("Erro", "Não foi possível atualizar a prescrição.");
        } finally {
            setCarregando(false);
        }
    };
    
    if (carregando && medicamentos.length === 0) {
        return <ActivityIndicator size="large" style={{flex: 1, justifyContent: 'center'}} />;
    }

    const todosSelecionados = Object.values(diasSemana).every(Boolean);

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
            <TextInput style={styles.input} value={horario} onChangeText={setHorario} maxLength={5} keyboardType="numeric" />
            
            <Text style={styles.label}>Dosagem*</Text>
            <TextInput style={styles.input} placeholder="Ex: 1 comprimido, 10ml" value={dosagem} onChangeText={setDosagem} />

            <Text style={styles.label}>Instruções Adicionais</Text>
            <TextInput style={[styles.input, {height: 100, textAlignVertical: 'top'}]} multiline value={instrucoes} onChangeText={setInstrucoes} />

            <Text style={styles.label}>Dias da Semana</Text>
            <View style={styles.switchContainer}>
                <Text style={{fontSize: 16}}>Todos os dias</Text>
                <Switch value={todosSelecionados} onValueChange={handleToggleTodosDias} />
            </View>
            <View style={styles.diasContainer}>
                {DIAS_MAP.map(dia => (
                    <TouchableOpacity
                        key={dia.key}
                        style={[styles.diaButton, diasSemana[dia.key] && styles.diaButtonActive]}
                        onPress={() => handleToggleDia(dia.key)}
                    >
                        <Text style={[styles.diaText, diasSemana[dia.key] && styles.diaTextActive]}>
                            {dia.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity onPress={handleSave} style={styles.button} disabled={carregando}>
                {carregando ? <ActivityIndicator color="#fff"/> : <Text style={styles.buttonText}>Salvar Alterações</Text>}
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
        padding: 12,
        fontSize: 16,
        color: '#333',
        marginBottom: 12,
    },
    button: {
        backgroundColor: '#f39c12', // Cor diferente para edição
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 12,
    },
    diasContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    diaButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
    },
    diaButtonActive: {
        backgroundColor: '#007bff',
    },
    diaText: {
        color: '#000',
        fontWeight: 'bold',
    },
    diaTextActive: {
        color: '#fff',
    },
});