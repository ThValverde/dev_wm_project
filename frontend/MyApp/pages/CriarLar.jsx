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
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function CriarLar({ navigation }) {
  const [nomeLar, setNomeLar] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');
  const [telefone, setTelefone] = useState('');
  const [capacidade, setCapacidade] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [emailResponsavel, setEmailResponsavel] = useState('');
  const [carregando, setCarregando] = useState(false);

  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validarCEP = (cep) => {
    const regex = /^\d{5}-?\d{3}$/;
    return regex.test(cep);
  };

  const formatarTelefone = (telefone) => {
    // Remove tudo que não é número
    const apenasNumeros = telefone.replace(/\D/g, '');
    
    // Aplica a máscara (xx) xxxxx-xxxx
    if (apenasNumeros.length <= 11) {
      return apenasNumeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  };

  const formatarCEP = (cep) => {
    const apenasNumeros = cep.replace(/\D/g, '');
    if (apenasNumeros.length <= 8) {
      return apenasNumeros.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return cep;
  };

  const handleCriarLar = async () => {
    // Validações
    if (!nomeLar.trim()) {
      Alert.alert('Erro', 'Por favor, informe o nome do lar');
      return;
    }

    if (!endereco.trim()) {
      Alert.alert('Erro', 'Por favor, informe o endereço');
      return;
    }

    if (!cidade.trim()) {
      Alert.alert('Erro', 'Por favor, informe a cidade');
      return;
    }

    if (!estado.trim()) {
      Alert.alert('Erro', 'Por favor, informe o estado');
      return;
    }

    if (!validarCEP(cep)) {
      Alert.alert('Erro', 'Por favor, informe um CEP válido');
      return;
    }

    if (!telefone.trim()) {
      Alert.alert('Erro', 'Por favor, informe o telefone');
      return;
    }

    if (!capacidade.trim() || isNaN(capacidade) || parseInt(capacidade) <= 0) {
      Alert.alert('Erro', 'Por favor, informe uma capacidade válida');
      return;
    }

    if (!responsavel.trim()) {
      Alert.alert('Erro', 'Por favor, informe o nome do responsável');
      return;
    }

    if (!validarEmail(emailResponsavel)) {
      Alert.alert('Erro', 'Por favor, informe um e-mail válido para o responsável');
      return;
    }

    setCarregando(true);

    try {
      // Simular chamada da API
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        'Sucesso!',
        'Lar criado com sucesso!',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Falha ao criar o lar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Criar Novo Lar</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            
            {/* Informações Básicas */}
            <Text style={styles.sectionTitle}>Informações Básicas</Text>
            
            <View style={styles.inputContainer}>
              <Ionicons name="home-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nome do Lar"
                placeholderTextColor="#bdc3c7"
                value={nomeLar}
                onChangeText={setNomeLar}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="people-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Capacidade (número de residentes)"
                placeholderTextColor="#bdc3c7"
                value={capacidade}
                onChangeText={setCapacidade}
                keyboardType="numeric"
              />
            </View>

            {/* Endereço */}
            <Text style={styles.sectionTitle}>Endereço</Text>
            
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Endereço completo"
                placeholderTextColor="#bdc3c7"
                value={endereco}
                onChangeText={setEndereco}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, styles.inputHalf]}>
                <Ionicons name="business-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Cidade"
                  placeholderTextColor="#bdc3c7"
                  value={cidade}
                  onChangeText={setCidade}
                  autoCapitalize="words"
                />
              </View>

              <View style={[styles.inputContainer, styles.inputHalf]}>
                <Ionicons name="map-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Estado"
                  placeholderTextColor="#bdc3c7"
                  value={estado}
                  onChangeText={setEstado}
                  autoCapitalize="characters"
                  maxLength={2}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="CEP"
                placeholderTextColor="#bdc3c7"
                value={cep}
                onChangeText={(text) => setCep(formatarCEP(text))}
                keyboardType="numeric"
                maxLength={9}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Telefone"
                placeholderTextColor="#bdc3c7"
                value={telefone}
                onChangeText={(text) => setTelefone(formatarTelefone(text))}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>

            {/* Responsável */}
            <Text style={styles.sectionTitle}>Responsável</Text>
            
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nome do responsável"
                placeholderTextColor="#bdc3c7"
                value={responsavel}
                onChangeText={setResponsavel}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-mail do responsável"
                placeholderTextColor="#bdc3c7"
                value={emailResponsavel}
                onChangeText={setEmailResponsavel}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.criarButton, carregando && styles.criarButtonDisabled]}
              onPress={handleCriarLar}
              disabled={carregando}
            >
              <Text style={styles.criarButtonText}>
                {carregando ? 'Criando...' : 'Criar Lar'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#2c3e50',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputHalf: {
    flex: 1,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#2c3e50',
  },
  criarButton: {
    backgroundColor: '#27ae60',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  criarButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  criarButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});