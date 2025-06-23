import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MaskedText, MaskedTextInput } from "react-native-mask-text";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

export default function CadastroIdoso({ navigation }) {
  // Estados do formulário
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [peso, setPeso] = useState('');
  const [genero, setGenero] = useState('M');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [cartaoSus, setCartaoSus] = useState('');
  const [possuiPlano, setPossuiPlano] = useState(false);
  const [planoSaude, setPlanoSaude] = useState('');
  const [numCarteirinha, setNumCarteirinha] = useState('');
  const [doencas, setDoencas] = useState('');
  const [condicoes, setCondicoes] = useState('');
  const [carregando, setCarregando] = useState(false);

  //Estados separados para dia, mês e ano
  const [diaNascimento, setDiaNascimento] = useState('');
  const [mesNascimento, setMesNascimento] = useState('');
  const [anoNascimento, setAnoNascimento] = useState('');

  const handleCadastro = async () => {
    //Lógica de validação e formatação da data
    const dataFormatada = `${anoNascimento}-${mesNascimento}-${diaNascimento}`;
    const dataObj = new Date(dataFormatada + 'T12:00:00'); // Adiciona hora para evitar problemas de fuso horário

    if (isNaN(dataObj.getTime()) || dataObj.getFullYear() != anoNascimento || (dataObj.getMonth() + 1) != mesNascimento || dataObj.getDate() != diaNascimento) {
        Alert.alert('Erro', 'A data de nascimento inserida é inválida. Verifique os campos.');
        return;
    }

    if (!nomeCompleto.trim() || !cpf.trim() || !cartaoSus.trim()) {
      Alert.alert('Erro', 'Nome, CPF e Cartão SUS são obrigatórios.');
      return;
    }

    setCarregando(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const groupId = await AsyncStorage.getItem('selectedGroupId');
      if (!token || !groupId) throw new Error("Sessão inválida. Faça o login novamente.");

      const payload = {
        nome_completo: nomeCompleto,
        data_nascimento: dataFormatada,
        peso: parseFloat(peso) || 0,
        genero: genero,
        cpf: cpf,
        rg: rg,
        cartao_sus: cartaoSus,
        possui_plano_saude: possuiPlano,
        plano_saude: possuiPlano ? planoSaude : null,
        numero_carteirinha_plano: possuiPlano ? numCarteirinha : null,
        doencas: doencas,
        condicoes: condicoes,
      };

      await axios.post(`${baseURL}/api/grupos/${groupId}/idosos/`, payload, {
        headers: { 'Authorization': `Token ${token}` }
      });

      Alert.alert('Sucesso', 'Idoso cadastrado com sucesso!');
      navigation.goBack();

    } catch (error) {
      console.error("Erro ao cadastrar idoso:", error.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível cadastrar o idoso. Verifique os dados.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cadastrar Novo Idoso</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          <TextInput style={styles.input} placeholder="Nome Completo*" value={nomeCompleto} onChangeText={setNomeCompleto} />
          
          {/*Inputs separados para Dia, Mês e Ano */}
          <Text style={styles.label}>Data de Nascimento*</Text>
          <View style={styles.dateContainer}>
            <TextInput
              style={[styles.input, styles.dateInput]}
              placeholder="DD"
              keyboardType="numeric"
              maxLength={2}
              value={diaNascimento}
              onChangeText={setDiaNascimento}
            />
            <TextInput
              style={[styles.input, styles.dateInput]}
              placeholder="MM"
              keyboardType="numeric"
              maxLength={2}
              value={mesNascimento}
              onChangeText={setMesNascimento}
            />
            <TextInput
              style={[styles.input, styles.dateInput, { flex: 2 }]}
              placeholder="AAAA"
              keyboardType="numeric"
              maxLength={4}
              value={anoNascimento}
              onChangeText={setAnoNascimento}
            />
          </View>

          <TextInput style={styles.input} placeholder="Peso (kg)" value={peso} onChangeText={setPeso} keyboardType="numeric" />
          
          <Text style={styles.label}>Gênero</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity onPress={() => setGenero('M')} style={[styles.genderButton, genero === 'M' && styles.genderActive]}><Text style={[styles.genderText, genero === 'M' && styles.genderTextActive]}>Masculino</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setGenero('F')} style={[styles.genderButton, genero === 'F' && styles.genderActive]}><Text style={[styles.genderText, genero === 'F' && styles.genderTextActive]}>Feminino</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setGenero('O')} style={[styles.genderButton, genero === 'O' && styles.genderActive]}><Text style={[styles.genderText, genero === 'O' && styles.genderTextActive]}>Outro</Text></TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Documentos</Text>
          <MaskedTextInput style={styles.input} mask="999.999.999-99" placeholder="CPF*" keyboardType="numeric" onChangeText={(formatted, extracted) => setCpf(extracted)} />
          <MaskedTextInput style={styles.input} mask="99.999.999-9" placeholder="RG" keyboardType="numeric" onChangeText={(formatted, extracted) => setRg(extracted)} />
          <MaskedTextInput style={styles.input} mask="999 999 999 999" placeholder="Cartão SUS*" keyboardType="numeric" onChangeText={(formatted, extracted) => setCartaoSus(extracted)} />
          
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

          <TouchableOpacity onPress={handleCadastro} style={[styles.button, carregando && styles.buttonDisabled]} disabled={carregando}>
            {carregando ? <ActivityIndicator color="#fff"/> : <Text style={styles.buttonText}>Salvar Cadastro</Text>}
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
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  dateInput: {
    flex: 1,
    textAlign: 'center',
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top', paddingVertical: 15 },
  genderContainer: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  genderButton: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e1e5e8' },
  genderActive: { backgroundColor: '#3498db', borderColor: '#3498db' },
  genderText: { fontSize: 16, color: '#34495e' },
  genderTextActive: { color: '#fff' },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, backgroundColor: '#fff', borderRadius: 10, padding: 15, borderWidth: 1, borderColor: '#e1e5e8'},
  button: { backgroundColor: '#27ae60', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  buttonDisabled: { backgroundColor: '#bdc3c7' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
