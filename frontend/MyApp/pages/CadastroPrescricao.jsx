import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

// Mapeia os dias da semana para renderização e para as chaves da API
const DIAS_MAP = [
    { label: 'D', key: 'dia_domingo' },
    { label: 'S', key: 'dia_segunda' },
    { label: 'T', key: 'dia_terca' },
    { label: 'Q', key: 'dia_quarta' },
    { label: 'Q', key: 'dia_quinta' },
    { label: 'S', key: 'dia_sexta' },
    { label: 'S', key: 'dia_sabado' }
];

export default function CadastroPrescricao({ route, navigation }) {
    const { idosoId } = route.params;

    // Estados do formulário
    const [medicamentos, setMedicamentos] = useState([]);
    const [medicamentoId, setMedicamentoId] = useState(null);
    const [horario, setHorario] = useState('08:00');
    const [doseValor, setDoseValor] = useState('');
    const [doseUnidade, setDoseUnidade] = useState('comprimido(s)');
    const [instrucoes, setInstrucoes] = useState('');
    const [carregando, setCarregando] = useState(true);

    // Estado para os dias da semana, com 'true' como padrão para todos
    const [diasSemana, setDiasSemana] = useState({
        dia_domingo: true, dia_segunda: true, dia_terca: true,
        dia_quarta: true, dia_quinta: true, dia_sexta: true, dia_sabado: true,
    });

    // Busca os medicamentos disponíveis no estoque para preencher o seletor
    useEffect(() => {
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

    // Função para alternar um dia específico
    const handleToggleDia = (diaKey) => {
        setDiasSemana(prev => ({ ...prev, [diaKey]: !prev[diaKey] }));
    };
    
    // Função para marcar ou desmarcar todos os dias de uma vez
    const handleToggleTodosDias = (value) => {
        setDiasSemana({
            dia_domingo: value, dia_segunda: value, dia_terca: value,
            dia_quarta: value, dia_quinta: value, dia_sexta: value, dia_sabado: value,
        });
    };
    
    // Função para salvar a nova prescrição
    const handleSave = async () => {
    // Validação CORRIGIDA: usa 'doseValor' em vez de 'dosagem'
    if (!medicamentoId || !doseValor.trim()) {
        Alert.alert("Erro", "Selecione um medicamento e informe o valor da dosagem.");
        return;
    }
    setCarregando(true);
    try {
        const token = await AsyncStorage.getItem('authToken');
        const groupId = await AsyncStorage.getItem('selectedGroupId');
        
        // Payload enviado para a API
        const payload = {
            idoso_id: idosoId,
            medicamento_id: medicamentoId,
            horario_previsto: horario,
            dosagem: `${doseValor} ${doseUnidade}`, // Combina valor e unidade em uma única string
            instrucoes: instrucoes,
            ativo: true,
            frequencia: 'DI',
            ...diasSemana,
        };
        
        await axios.post(`${baseURL}/api/grupos/${groupId}/prescricoes/`, payload, {
            headers: { 'Authorization': `Token ${token}` }
        });
        
        Alert.alert("Sucesso", "Prescrição adicionada.");
        navigation.goBack();

    } catch (error) {
        // Bloco de erro aprimorado para dar mais detalhes
        let errorMessage = "Não foi possível salvar a prescrição.";
        if (error.response && error.response.data) {
            const errors = error.response.data;
            // Pega a primeira mensagem de erro retornada pela API
            const firstErrorKey = Object.keys(errors)[0];
            if (firstErrorKey && Array.isArray(errors[firstErrorKey])) {
                errorMessage = `${firstErrorKey}: ${errors[firstErrorKey][0]}`;
            } else if (errors.detail) {
                errorMessage = errors.detail;
            }
        } else if (error.message) {
            // Caso seja um erro de referência ou de rede
            errorMessage = error.message;
        }
        
        console.error("Erro ao salvar prescrição:", error.response?.data || error.message);
        Alert.alert("Erro", errorMessage);

    } finally {
        setCarregando(false);
    }
};
    
    if (carregando && medicamentos.length === 0) {
        return <ActivityIndicator size="large" style={{flex: 1, justifyContent: 'center'}} />;
    }

    // Variável para controlar o estado do interruptor "Todos os dias"
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
            <View style={{flexDirection: 'row', gap: 10}}>
                <TextInput
                    style={[styles.input, {flex: 1}]}
                    placeholder="Valor"
                    value={doseValor}
                    onChangeText={setDoseValor}
                    keyboardType="numeric"
                />
                <TextInput
                    style={[styles.input, {flex: 2}]}
                    placeholder="Unidade (ex: comprimido, ml, g)"
                    value={doseUnidade}
                    onChangeText={setDoseUnidade}
                />
            </View>
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
        padding: 12,
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