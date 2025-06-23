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

function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erroLogin, setErroLogin] = useState(''); 

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
        setErroLogin('Por favor, preencha todos os campos.'); // Mostra o erro na tela
        return;
    }

    setErroLogin('');
    setCarregando(true);
    try {
      const loginResponse = await axios.post(`${baseURL}/api/auth/login/`, {
        email: email,
        password: senha,
      });

      const token = loginResponse.data.key;
      if (!token) throw new Error("Token não recebido do servidor.");

      await AsyncStorage.setItem('authToken', token);
      
      // Após salvar o token, buscar e salvar os dados do perfil do usuário
      const profileResponse = await axios.get(`${baseURL}/api/auth/profile/`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      // Salva o perfil do usuário como uma string JSON no AsyncStorage
      await AsyncStorage.setItem('userData', JSON.stringify(profileResponse.data));

      navigation.navigate('SelecionarLar');

    } catch (error) {
        let errorMessage = 'Falha na conexão. Tente novamente.';
        if (error.response && error.response.data) {
            const nonFieldErrors = error.response.data.non_field_errors;
            if (nonFieldErrors && nonFieldErrors.length > 0) {
                errorMessage = nonFieldErrors[0];
            }
        }
        
        setErroLogin(errorMessage); // Define a mensagem de erro no estado
        console.error("Erro no login:", errorMessage);
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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>E-doso</Text>
          <Text style={styles.subtitleText}>Abrigo de Idosos</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.titleText}>Entrar</Text>

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
              autoCorrect={false}
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
              onSubmitEditing={handleLogin}
              autoCapitalize="none"
              autoCorrect={false}
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

          {erroLogin ? <Text style={styles.errorText}>{erroLogin}</Text> : null}

          <TouchableOpacity
            style={[styles.loginButton, carregando && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={carregando}
          >
             {carregando ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Entrar</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotPasswordButton}>
            <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
          </TouchableOpacity>

           <TouchableOpacity 
            style={styles.signupButton}
            onPress={() => navigation.navigate('Cadastro')}
          >
            <Text style={styles.signupText}>
              Não tem uma conta? <Text style={{fontWeight: 'bold'}}>Cadastre-se</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Sistema de Gerenciamento para Abrigo de Idosos
          </Text>
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
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 18,
    color: '#ecf0f1',
    fontWeight: '300',
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
  loginButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
        color: '#e74c3c', // Cor vermelha para erros
        textAlign: 'center',
        marginBottom: 10,
        fontSize: 16,
        fontWeight: '600',
    },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  forgotPasswordText: {
    color: '#3498db',
    fontSize: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#ecf0f1',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  signupButton: {
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
  },
  signupText: {
    color: '#7f8c8d',
    fontSize: 16,
  },
});

export default Login;
