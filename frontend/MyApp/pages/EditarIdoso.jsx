import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MaskedTextInput } from "react-native-mask-text";
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

export default function EditarIdoso({ route, navigation }) {
  const { idoso } = route.params;

  const [nomeCompleto, setNomeCompleto] = useState(idoso.nome_completo);
  const [dataNascimento, setDataNascimento] = useState(new Date(idoso.data_nascimento + 'T12:00:00'));
  const [peso, setPeso] = useState(idoso.peso.toString());
  const [genero, setGenero] = useState(idoso.genero);
  const [cpf, setCpf] = useState(idoso.cpf);
  const [rg, setRg] = useState(idoso.rg || '');
  const [cartaoSus, setCartaoSus] = useState(idoso.cartao_sus);
  const [possuiPlano, setPossuiPlano] = useState(idoso.possui_plano_saude);
  const [planoSaude, setPlanoSaude] = useState(idoso.plano_saude || '');
  const [numCarteirinha, setNumCarteirinha] = useState(idoso.numero_carteirinha_plano || '');
  const [doencas, setDoencas] = useState(idoso.doencas || '');
  const [condicoes, setCondicoes] = useState(idoso.condicoes || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDataNascimento(selectedDate);
    }
  };

  const handleSalvar = async () => {
    if (!nomeCompleto.trim() || !cpf.trim() || !cartaoSus.trim()) {
      Alert.alert('Erro', 'Nome, CPF e Cartão SUS são obrigatórios.');
      return;
    }
    setCarregando(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const groupId = await AsyncStorage.getItem('selectedGroupId');
      if (!token || !groupId) throw new Error("Sessão inválida.");
      
      const dataFormatada = dataNascimento.toISOString().split('T')[0];
      const payload = {
        nome_completo: nomeCompleto, data_nascimento: dataFormatada,
        peso: parseFloat(peso) || 0, genero: genero, cpf: cpf, rg: rg,
        cartao_sus: cartaoSus, possui_plano_saude: possuiPlano,
        plano_saude: possuiPlano ? planoSaude : null,
        numero_carteirinha_plano: possuiPlano ? numCarteirinha : null,
        doencas: doencas, condicoes: condicoes,
      };

      await axios.patch(`${baseURL}/api/grupos/${groupId}/idosos/${idoso.id}/`, payload, {
        headers: { 'Authorization': `Token ${token}` }
      });

      Alert.alert('Sucesso', 'Dados do idoso atualizados!');
      navigation.navigate('Dados', { idosoId: idoso.id });

    } catch (error) {
      console.error("Erro ao atualizar idoso:", error.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível atualizar os dados. Verifique as informações.');
    } finally {
      setCarregando(false);
    }
  };

  const handleDelete = async () => {
    const deleteAction = async () => {
        setCarregando(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            const groupId = await AsyncStorage.getItem('selectedGroupId');
            await axios.delete(`${baseURL}/api/grupos/${groupId}/idosos/${idoso.id}/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            Alert.alert("Sucesso", "Idoso excluído do sistema.");
            
            navigation.navigate('Main');

        } catch (error) {
            Alert.alert("Erro", "Não foi possível excluir o idoso.");
            setCarregando(false);
        }
    };

    if (Platform.OS === 'web') {
        if(window.confirm("Tem certeza que deseja excluir este idoso? Esta ação é permanente e removerá também todas as suas prescrições.")) {
            deleteAction();
        }
    } else {
        Alert.alert(
            "Excluir Idoso", 
            "Tem certeza que deseja excluir este idoso? Esta ação é permanente e removerá também todas as suas prescrições.", 
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Excluir", style: "destructive", onPress: deleteAction }
            ]
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Dados do Idoso</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          <TextInput style={styles.input} placeholder="Nome Completo*" value={nomeCompleto} onChangeText={setNomeCompleto} />
          
          <Text style={styles.label}>Data de Nascimento*</Text>
          
          {Platform.OS !== 'web' ? (
            <>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInputButton}>
                <Text style={styles.dateInputText}>{dataNascimento.toLocaleDateString('pt-BR')}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dataNascimento}
                  mode={'date'}
                  display="default"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
            </>
          ) : (
            <DateTimePicker
              value={dataNascimento}
              mode={'date'}
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
              style={styles.datePickerWeb}
            />
          )}

          <TextInput style={styles.input} placeholder="Peso (kg)" value={peso} onChangeText={setPeso} keyboardType="numeric" />
          
          <Text style={styles.label}>Gênero</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity onPress={() => setGenero('M')} style={[styles.genderButton, genero === 'M' && styles.genderActive]}><Text style={[styles.genderText, genero === 'M' && styles.genderTextActive]}>Masculino</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setGenero('F')} style={[styles.genderButton, genero === 'F' && styles.genderActive]}><Text style={[styles.genderText, genero === 'F' && styles.genderTextActive]}>Feminino</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setGenero('O')} style={[styles.genderButton, genero === 'O' && styles.genderActive]}><Text style={[styles.genderText, genero === 'O' && styles.genderTextActive]}>Outro</Text></TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Documentos</Text>
          <MaskedTextInput style={styles.input} mask="999.999.999-99" placeholder="CPF*" keyboardType="numeric" value={cpf} onChangeText={(formatted, extracted) => setCpf(extracted)} />
          <MaskedTextInput style={styles.input} mask="99.999.999-9" placeholder="RG" keyboardType="numeric" value={rg} onChangeText={(formatted, extracted) => setRg(extracted)} />
          <TextInput style={styles.input} placeholder="Cartão SUS*" value={cartaoSus} onChangeText={setCartaoSus} keyboardType="numeric" />
          
          <Text style={styles.sectionTitle}>Saúde</Text>
          <View style={styles.switchContainer}><Text style={styles.label}>Possui Plano de Saúde?</Text><Switch value={possuiPlano} onValueChange={setPossuiPlano} /></View>
          {possuiPlano && (
            <>
              <TextInput style={styles.input} placeholder="Nome do Plano de Saúde" value={planoSaude} onChangeText={setPlanoSaude} />
              <TextInput style={styles.input} placeholder="Número da Carteirinha" value={numCarteirinha} onChangeText={setNumCarteirinha} />
            </>
          )}
          <TextInput style={[styles.input, styles.inputMulti]} placeholder="Doenças pré-existentes" value={doencas} onChangeText={setDoencas} multiline />
          <TextInput style={[styles.input, styles.inputMulti]} placeholder="Alergias e outras condições" value={condicoes} onChangeText={setCondicoes} multiline />

          <TouchableOpacity onPress={handleSalvar} style={[styles.button, carregando && styles.buttonDisabled]} disabled={carregando}>
            {carregando ? <ActivityIndicator color="#fff"/> : <Text style={styles.buttonText}>Salvar Alterações</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDelete} style={[styles.button, styles.deleteButton, carregando && styles.buttonDisabled]} disabled={carregando}>
            <Text style={styles.buttonText}>Excluir Idoso</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#2c3e50' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  scrollContainer: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginTop: 20, marginBottom: 15 },
  label: { fontSize: 16, color: '#34495e', marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e1e5e8' },
  dateInputButton: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#e1e5e8', justifyContent: 'center', height: 52 },
  dateInputText: { fontSize: 16, color: '#333' },
  datePickerWeb: { height: 52, marginBottom: 12, width: '100%', justifyContent: 'center' },
  inputMulti: { minHeight: 80, textAlignVertical: 'top', paddingVertical: 15 },
  genderContainer: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  genderButton: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e1e5e8' },
  genderActive: { backgroundColor: '#3498db', borderColor: '#3498db' },
  genderText: { fontSize: 16, color: '#34495e' },
  genderTextActive: { color: '#fff' },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, backgroundColor: '#fff', borderRadius: 10, padding: 15, borderWidth: 1, borderColor: '#e1e5e8' },
  button: { backgroundColor: '#f39c12', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  buttonDisabled: { backgroundColor: '#bdc3c7' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  deleteButton: {
    backgroundColor: '#e74c3c',
    marginTop: 10,
    marginBottom: 40,
  },
});
