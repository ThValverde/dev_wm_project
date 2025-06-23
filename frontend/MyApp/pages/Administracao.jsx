import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaskedTextInput } from "react-native-mask-text";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

// Função para formatar números com zero à esquerda (ex: 7 -> "07")
const pad = (num) => num.toString().padStart(2, '0');

export default function Administracao({ route, navigation }) {
    const { prescricao } = route.params;
    
    // Estado para mobile
    const [dataHora, setDataHora] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    
    // Estado para a web
    const now = new Date();
    const [dataWeb, setDataWeb] = useState(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
    const [horaWeb, setHoraWeb] = useState(`${pad(now.getHours())}:${pad(now.getMinutes())}`);

    const [status, setStatus] = useState('OK');
    const [observacoes, setObservacoes] = useState('');
    const [carregando, setCarregando] = useState(false);

    // Handler para o seletor de data do mobile
    const onDateChange = (event, selectedDate) => {
        setShowPicker(false);
        if (selectedDate) {
            setDataHora(selectedDate);
        }
    };

    const handleConfirmar = async () => {
        setCarregando(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            const groupId = await AsyncStorage.getItem('selectedGroupId');
            
            let dataParaEnviar;

            // Lógica para determinar qual data usar com base na plataforma
            if (Platform.OS === 'web') {
                if (!/^\d{4}-\d{2}-\d{2}$/.test(dataWeb) || !/^\d{2}:\d{2}$/.test(horaWeb)) {
                    Alert.alert("Erro", "Formato de data ou hora inválido. Use AAAA-MM-DD e HH:MM.");
                    setCarregando(false);
                    return;
                }
                // Combina a data e hora dos inputs da web
                dataParaEnviar = new Date(`${dataWeb}T${horaWeb}:00`).toISOString();
            } else {
                // Usa o estado do seletor de data do mobile
                dataParaEnviar = dataHora.toISOString();
            }
            
            const payload = {
                data_hora_administracao: dataParaEnviar,
                status: status,
                observacoes: observacoes,
            };

            await axios.post(`${baseURL}/api/grupos/${groupId}/prescricoes/${prescricao.id}/administrar/`, payload, {
                headers: { 'Authorization': `Token ${token}` }
            });

            Alert.alert("Sucesso", "Administração registrada.");
            navigation.goBack();
        } catch (error) {
            Alert.alert("Erro", "Falha ao registrar a administração. Verifique o estoque e os dados inseridos.");
        } finally {
            setCarregando(false);
        }
    };

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: '#f0f4f7'}}>
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Registrar Administração</Text>

            <View style={styles.card}>
                <Text style={styles.medName}>{prescricao.medicamento.nome_marca}</Text>
                <Text style={styles.detail}>Paciente: {prescricao.idoso}</Text>
                <Text style={styles.detail}>Dosagem: {prescricao.dosagem}</Text>
            </View>

            <Text style={styles.label}>Data e Hora da Administração</Text>
            
            {Platform.OS === 'web' ? (
                // Interface para Web com campos de texto separados
                <View style={styles.dateContainerWeb}>
                    <MaskedTextInput
                        mask="9999-99-99"
                        value={dataWeb}
                        onChangeText={(text) => setDataWeb(text)}
                        style={[styles.input, {flex: 2}]}
                        placeholder="AAAA-MM-DD"
                        keyboardType="numeric"
                    />
                    <MaskedTextInput
                        mask="99:99"
                        value={horaWeb}
                        onChangeText={(text) => setHoraWeb(text)}
                        style={[styles.input, {flex: 1}]}
                        placeholder="HH:MM"
                        keyboardType="numeric"
                    />
                </View>
            ) : (
                // Interface para Mobile com o DateTimePicker
                <>
                    <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.input}>
                        <Text>{dataHora.toLocaleString('pt-BR')}</Text>
                    </TouchableOpacity>
                    {showPicker && (
                        <DateTimePicker value={dataHora} mode="datetime" display="default" onChange={onDateChange} />
                    )}
                </>
            )}

            <Text style={styles.label}>Status</Text>
            <View style={styles.pickerContainer}>
                <Picker selectedValue={status} onValueChange={(itemValue) => setStatus(itemValue)}>
                    <Picker.Item label="Administrado" value="OK" />
                    <Picker.Item label="Recusado pelo paciente" value="REC" />
                    <Picker.Item label="Pulado / Esquecido" value="PUL" />
                </Picker>
            </View>

            <Text style={styles.label}>Observações</Text>
            <TextInput
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                multiline
                value={observacoes}
                onChangeText={setObservacoes}
                placeholder="Ex: paciente sentiu tontura após o medicamento."
            />

            <TouchableOpacity onPress={handleConfirmar} style={styles.button} disabled={carregando}>
                {carregando ? <ActivityIndicator color="#fff"/> : <Text style={styles.buttonText}>Confirmar Administração</Text>}
            </TouchableOpacity>
        </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
    medName: { fontSize: 18, fontWeight: 'bold' },
    detail: { fontSize: 16, color: '#555', marginTop: 4 },
    label: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 6 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12, justifyContent: 'center', minHeight: 48 },
    pickerContainer: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center' },
    button: { backgroundColor: '#27ae60', borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 20 },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    dateContainerWeb: {
        flexDirection: 'row',
        gap: 10,
    }
});
