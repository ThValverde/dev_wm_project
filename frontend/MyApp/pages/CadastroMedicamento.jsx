import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

export default function CadastroMedicamento({ navigation }) {
    const [nomeMarca, setNomeMarca] = useState('');
    const [principioAtivo, setPrincipioAtivo] = useState('');
    const [generico, setGenerico] = useState(false);
    const [fabricante, setFabricante] = useState('');
    const [concentracaoValor, setConcentracaoValor] = useState('');
    const [concentracaoUnidade, setConcentracaoUnidade] = useState('mg/g');
    const [formaFarmaceutica, setFormaFarmaceutica] = useState('COMP');
    const [quantidadeEstoque, setQuantidadeEstoque] = useState('');
    const [carregando, setCarregando] = useState(false);

    const handleSave = async () => {
        if (!nomeMarca.trim() || !quantidadeEstoque.trim()) {
            Alert.alert("Erro", "Nome e Quantidade em Estoque são obrigatórios.");
            return;
        }
        setCarregando(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            const groupId = await AsyncStorage.getItem('selectedGroupId');
            const payload = {
                nome_marca: nomeMarca,
                principio_ativo: principioAtivo,
                generico: generico,
                fabricante: fabricante,
                concentracao_valor: concentracaoValor ? parseFloat(concentracaoValor) : null,
                concentracao_unidade: concentracaoUnidade,
                forma_farmaceutica: formaFarmaceutica,
                quantidade_estoque: parseInt(quantidadeEstoque, 10),
            };
            await axios.post(`${baseURL}/api/grupos/${groupId}/medicamentos/`, payload, {
                headers: { 'Authorization': `Token ${token}` }
            });
            Alert.alert("Sucesso", "Medicamento adicionado ao estoque.");
            navigation.goBack();
        } catch (error) {
            const errorMsg = error.response?.data?.nome_marca?.[0] || 'Não foi possível adicionar o medicamento.';
            Alert.alert("Erro", errorMsg);
        } finally {
            setCarregando(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.label}>Nome Comercial*</Text>
            <TextInput style={styles.input} value={nomeMarca} onChangeText={setNomeMarca} />

            <Text style={styles.label}>Princípio Ativo</Text>
            <TextInput style={styles.input} value={principioAtivo} onChangeText={setPrincipioAtivo} />
            
            <Text style={styles.label}>Fabricante</Text>
            <TextInput style={styles.input} value={fabricante} onChangeText={setFabricante} />

            <View style={styles.switchContainer}>
                <Text style={styles.label}>É Genérico?</Text>
                <Switch value={generico} onValueChange={setGenerico} />
            </View>
            
            <Text style={styles.label}>Concentração</Text>
            <View style={{flexDirection: 'row', gap: 10}}>
                <TextInput style={[styles.input, {flex: 1}]} placeholder="Valor" value={concentracaoValor} onChangeText={setConcentracaoValor} keyboardType="numeric" />
                <View style={[styles.input, styles.pickerContainer, {flex: 1}]}>
                    <Picker selectedValue={concentracaoUnidade} onValueChange={(itemValue) => setConcentracaoUnidade(itemValue)}>
                        <Picker.Item label="mcg/g" value="mcg/g" />
                        <Picker.Item label="mg/g" value="mg/g" />
                        <Picker.Item label="mg/ml" value="mg/ml" />
                        <Picker.Item label="Unidade" value="UN" />
                        <Picker.Item label="Outro" value="OUT" />
                    </Picker>
                </View>
            </View>

            <Text style={styles.label}>Forma Farmacêutica</Text>
            <View style={[styles.input, styles.pickerContainer]}>
                <Picker selectedValue={formaFarmaceutica} onValueChange={(itemValue) => setFormaFarmaceutica(itemValue)}>
                    <Picker.Item label="Comprimido" value="COMP" />
                    <Picker.Item label="Cápsula" value="CAP" />
                    <Picker.Item label="Líquido (ml)" value="LIQ_ML" />
                    <Picker.Item label="Creme (g)" value="CREME_G" />
                    <Picker.Item label="Gota" value="GOTA" />
                    <Picker.Item label="Outro" value="OUT" />
                </Picker>
            </View>

            <Text style={styles.label}>Quantidade em Estoque*</Text>
            <TextInput style={styles.input} value={quantidadeEstoque} onChangeText={setQuantidadeEstoque} keyboardType="numeric" />

            <TouchableOpacity onPress={handleSave} style={styles.button} disabled={carregando}>
                {carregando ? <ActivityIndicator color="#fff"/> : <Text style={styles.buttonText}>Salvar</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}
//... Estilos
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0f4f7' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#2c3e50' },
  label: { fontSize: 16, color: '#34495e', marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e1e5e8' },
  pickerContainer: { paddingHorizontal: 0, paddingVertical: 0, justifyContent: 'center' },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingVertical: 10 },
  button: { backgroundColor: '#27ae60', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});