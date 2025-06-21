import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

export default function CriarLar({ navigation }) {
  // Estado para os campos do formulário
  const [nomeLar, setNomeLar] = useState('');
  const [senha, setSenha] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');
  const [telefone, setTelefone] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [codigoAcesso, setCodigoAcesso] = useState('');
  
  // Estado para controle da UI
  const [carregando, setCarregando] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('criar'); // 'criar' ou 'entrar'

  const handleCriarLar = async () => {
    if (!nomeLar.trim() || !senha.trim() || !responsavel.trim()) {
      Alert.alert('Erro de Validação', 'Nome do Lar, Senha e Nome do Responsável são obrigatórios.');
      return;
    }

    setCarregando(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error("Token de autenticação não encontrado.");

      const payload = {
        nome: nomeLar,
        senha: senha,
        endereco: endereco,
        telefone: telefone,
        cidade: cidade,
        estado: estado,
        cep: cep,
        nome_responsavel: responsavel,
      };

      await axios.post(`${baseURL}/api/grupos/`, payload, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      // CORREÇÃO: Navegação ocorre ANTES do alerta.
      navigation.goBack();
      Alert.alert(
        'Sucesso!',
        'Lar criado com sucesso. Você já pode selecioná-lo na tela anterior.'
      );

    } catch (error) {
      const errorMsg = error.response?.data?.nome?.[0] || 'Falha ao criar o lar. Verifique os dados e tente novamente.';
      Alert.alert('Erro na Criação', errorMsg);
    } finally {
      setCarregando(false);
    }
  };

  const handleEntrarComCodigo = async () => {
    if (!codigoAcesso.trim()) {
      Alert.alert('Erro', 'Por favor, informe o código de acesso.');
      return;
    }
    setCarregando(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error("Token não encontrado.");

      await axios.post(`${baseURL}/api/grupos/entrar-com-codigo/`, {
        codigo_acesso: codigoAcesso,
      }, {
        headers: { 'Authorization': `Token ${token}` }
      });

      // CORREÇÃO: Navegação ocorre ANTES do alerta.
      navigation.goBack();
      Alert.alert(
        'Sucesso!',
        'Você entrou no lar com sucesso!'
      );
      
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Código inválido ou falha na conexão.';
      Alert.alert('Erro', errorMsg);
    } finally {
      setCarregando(false);
    }
  };

  // --- RENDERIZAÇÃO CONDICIONAL DOS FORMULÁRIOS ---

  const renderFormularioCriar = () => (
    <>
      <Text style={styles.sectionTitle}>Informações do Lar</Text>
      <TextInput style={styles.input} placeholder="Nome do Lar*" value={nomeLar} onChangeText={setNomeLar} />
      <TextInput style={styles.input} placeholder="Senha do Lar*" value={senha} onChangeText={setSenha} secureTextEntry />
      <TextInput style={styles.input} placeholder="Nome do Responsável*" value={responsavel} onChangeText={setResponsavel} />
      <Text style={styles.sectionTitle}>Endereço e Contato (Opcional)</Text>
      <TextInput style={styles.input} placeholder="Endereço completo" value={endereco} onChangeText={setEndereco} />
      <TextInput style={styles.input} placeholder="Cidade" value={cidade} onChangeText={setCidade} />
      <TextInput style={styles.input} placeholder="Estado (UF)" value={estado} onChangeText={setEstado} maxLength={2} autoCapitalize="characters" />
      <TextInput style={styles.input} placeholder="CEP" value={cep} onChangeText={setCep} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Telefone" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
      <TouchableOpacity
        style={[styles.actionButton, carregando && styles.buttonDisabled]}
        onPress={handleCriarLar}
        disabled={carregando}
      >
        {carregando ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Criar Lar</Text>}
      </TouchableOpacity>
    </>
  );

  const renderFormularioEntrar = () => (
    <>
      <Text style={styles.sectionTitle}>Entrar com Código</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite o código de acesso do lar"
        value={codigoAcesso}
        onChangeText={setCodigoAcesso}
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={[styles.actionButton, carregando && styles.buttonDisabled]}
        onPress={handleEntrarComCodigo}
        disabled={carregando}
      >
        {carregando ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Entrar no Lar</Text>}
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Gerenciar Lares</Text>
            <View style={{ width: 40 }} />
        </View>

        <View style={styles.tabContainer}>
            <TouchableOpacity 
                style={[styles.tabButton, abaAtiva === 'criar' && styles.tabActive]}
                onPress={() => setAbaAtiva('criar')}
            >
                <Text style={[styles.tabText, abaAtiva === 'criar' && styles.tabTextActive]}>CRIAR LAR</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.tabButton, abaAtiva === 'entrar' && styles.tabActive]}
                onPress={() => setAbaAtiva('entrar')}
            >
                <Text style={[styles.tabText, abaAtiva === 'entrar' && styles.tabTextActive]}>ENTRAR COM CÓDIGO</Text>
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            {abaAtiva === 'criar' ? renderFormularioCriar() : renderFormularioEntrar()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#2c3e50',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -15,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#3498db',
    borderRadius: 12,
  },
  tabText: { color: '#7f8c8d', fontWeight: 'bold' },
  tabTextActive: { color: '#fff' },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10 },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginTop: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 20, textAlign: 'center' },
  input: {
    backgroundColor: '#f0f4f7',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e5e8',
    color: '#333'
  },
  actionButton: {
    backgroundColor: '#27ae60',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { backgroundColor: '#bdc3c7' },
  actionButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});