import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

export default function PerfilUsuario() {
    // Estados para o formulário de dados pessoais
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [carregandoPerfil, setCarregandoPerfil] = useState(true);

    // Estados para o formulário de alteração de senha
    const [senhaAntiga, setSenhaAntiga] = useState('');
    const [novaSenha1, setNovaSenha1] = useState('');
    const [novaSenha2, setNovaSenha2] = useState('');
    const [carregandoSenha, setCarregandoSenha] = useState(false);

    // Busca os dados do perfil do usuário sempre que a tela é focada
    useFocusEffect(
        useCallback(() => {
            const fetchProfile = async () => {
                try {
                    setCarregandoPerfil(true);
                    const token = await AsyncStorage.getItem('authToken');
                    const response = await axios.get(`${baseURL}/api/auth/profile/`, {
                        headers: { 'Authorization': `Token ${token}` }
                    });
                    setNome(response.data.nome_completo);
                    setEmail(response.data.email);
                } catch (error) {
                    Alert.alert("Erro", "Não foi possível carregar os dados do perfil.");
                } finally {
                    setCarregandoPerfil(false);
                }
            };
            fetchProfile();
        }, [])
    );

    // Função para salvar as alterações do perfil (nome e e-mail)
    const handleUpdateProfile = async () => {
        if (!nome.trim() || !email.trim()) {
            Alert.alert("Erro", "Nome e e-mail não podem ficar em branco.");
            return;
        }
        try {
            const token = await AsyncStorage.getItem('authToken');
            await axios.put(`${baseURL}/api/auth/profile/`, 
                { nome_completo: nome, email: email },
                { headers: { 'Authorization': `Token ${token}` } }
            );
            Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
        } catch (error) {
            const errorMsg = error.response?.data?.email?.[0] || "Não foi possível atualizar o perfil.";
            Alert.alert("Erro", errorMsg);
        }
    };

    // Função para alterar a senha
    const handleChangePassword = async () => {
        if (!senhaAntiga || !novaSenha1 || !novaSenha2) {
            Alert.alert("Erro", "Todos os campos de senha são obrigatórios.");
            return;
        }
        if (novaSenha1 !== novaSenha2) {
            Alert.alert("Erro", "As novas senhas não coincidem.");
            return;
        }
        setCarregandoSenha(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            await axios.post(`${baseURL}/api/auth/password/change/`, 
                { old_password: senhaAntiga, new_password1: novaSenha1, new_password2: novaSenha2 },
                { headers: { 'Authorization': `Token ${token}` } }
            );
            Alert.alert("Sucesso", "Senha alterada com sucesso!");
            // Limpa os campos após o sucesso
            setSenhaAntiga('');
            setNovaSenha1('');
            setNovaSenha2('');
        } catch (error) {
            const errorMsg = error.response?.data?.old_password?.[0] || "Não foi possível alterar a senha.";
            Alert.alert("Erro", errorMsg);
        } finally {
            setCarregandoSenha(false);
        }
    };
    
    if (carregandoPerfil) {
        return <ActivityIndicator size="large" style={{ flex: 1 }} />;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.title}>Meus Dados</Text>
                    <Text style={styles.label}>Nome Completo</Text>
                    <TextInput style={styles.input} value={nome} onChangeText={setNome} />
                    <Text style={styles.label}>E-mail</Text>
                    <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                    <TouchableOpacity style={styles.button} onPress={handleUpdateProfile}>
                        <Text style={styles.buttonText}>Salvar Alterações</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Text style={styles.title}>Alterar Senha</Text>
                    <Text style={styles.label}>Senha Antiga</Text>
                    <TextInput style={styles.input} secureTextEntry value={senhaAntiga} onChangeText={setSenhaAntiga} />
                    <Text style={styles.label}>Nova Senha</Text>
                    <TextInput style={styles.input} secureTextEntry value={novaSenha1} onChangeText={setNovaSenha1} />
                    <Text style={styles.label}>Confirmar Nova Senha</Text>
                    <TextInput style={styles.input} secureTextEntry value={novaSenha2} onChangeText={setNovaSenha2} />
                    <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleChangePassword} disabled={carregandoSenha}>
                        {carregandoSenha ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Alterar Senha</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f4f7' },
    container: { flex: 1, padding: 16 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        color: '#34495e',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e1e5e8',
    },
    button: {
        backgroundColor: '#3498db',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonSecondary: {
        backgroundColor: '#f39c12',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});