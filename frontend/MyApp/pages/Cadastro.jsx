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
import baseURL from '../config/api';

function Cadastro({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erroCadastro, setErroCadastro] = useState('');

  const handleCadastro = async () => {
    setErroCadastro('');

    if (!nome.trim() || !email.trim() || !senha.trim()) {
      setErroCadastro('Por favor, preencha todos os campos.');
      return;
    }

    setCarregando(true);

    try {
      await axios.post(`${baseURL}/api/auth/register/`, {
        nome_completo: nome,
        email: email,
        password: senha,
      });

      Alert.alert('Sucesso', 'Cadastro realizado! Você já pode fazer o login.');
      navigation.navigate('Login');

    } catch (error) {
        let erroMsg = 'Não foi possível realizar o cadastro. Tente novamente.';
        if (error.response && error.response.data) {
          const data = error.response.data;
          console.error("Erro no cadastro:", data);
          if (data.password && data.password.length > 0) {
            erroMsg = data.password[0];
          } else if (data.email && data.email.length > 0) {
            erroMsg = data.email[0];
          }
        }
        setErroCadastro(erroMsg);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled" 
        >
          <View style={styles.formContainer}>
            <Text style={styles.titleText}>Criar Conta</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nome Completo"
                placeholderTextColor="#bdc3c7"
                value={nome}
                onChangeText={setNome}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                placeholderTextColor="#bdc3c7"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#bdc3c7"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!mostrarSenha}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setMostrarSenha(!mostrarSenha)}
              >
                <Ionicons 
                  name={mostrarSenha ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#7f8c8d" 
                />
              </TouchableOpacity>
            </View>

            {erroCadastro ? <Text style={styles.errorText}>{erroCadastro}</Text> : null}

            <TouchableOpacity
              style={[styles.actionButton, carregando && styles.buttonDisabled]}
              onPress={handleCadastro}
              disabled={carregando}
            >
              {carregando ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Cadastrar</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Já tem uma conta? Entre</Text>
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
    backgroundColor: '#2c3e50',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
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
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 30,
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#2c3e50',
  },
  eyeIcon: {
    padding: 8,
  },
  actionButton: {
    backgroundColor: '#27ae60',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    color: '#3498db',
    fontSize: 16,
  },
});

export default Cadastro;
