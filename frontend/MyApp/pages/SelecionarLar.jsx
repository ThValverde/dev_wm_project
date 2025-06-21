import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert, 
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import SearchBar from '../components/SearchBar';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

export default function SelecionarLar({ navigation }) {
  const [lares, setLares] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregarLares = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert("Erro", "Você não está autenticado. Faça o login novamente.");
        navigation.navigate('Login');
        return;
      }
      
      const response = await axios.get(`${baseURL}/api/grupos/meus-grupos/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      setLares(response.data);

    } catch (err) {
      console.error("Erro ao carregar lares:", err.response ? err.response.data : err.message);
      setErro('Erro ao carregar seus lares. Verifique sua conexão.');
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarLares();
    }, [])
  );

  const handleAction = () => {
    navigation.navigate('CriarLar');
  };

  // ### CORREÇÃO PRINCIPAL AQUI ###
  const handleSelecionarLar = async (lar) => {
    try {
      // 1. Pega os dados do usuário logado (salvos no login)
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        throw new Error("Dados do usuário não encontrados. Por favor, faça o login novamente.");
      }
      const currentUser = JSON.parse(userDataString);

      // 2. Encontra o perfil do usuário atual dentro da lista de membros do lar selecionado
      const perfilDoUsuarioNoLar = lar.membros.find(membro => membro.user.id === currentUser.id);

      // 3. Verifica se o perfil foi encontrado e se a permissão é 'ADMIN'
      let isUserAdmin = false; // Começa como falso por segurança
      if (perfilDoUsuarioNoLar) {
        isUserAdmin = perfilDoUsuarioNoLar.permissao === 'ADMIN';
      }

      // 4. Salva o ID do grupo e o status de admin (true ou false)
      await AsyncStorage.setItem('selectedGroupId', lar.id.toString());
      await AsyncStorage.setItem('isCurrentUserAdmin', JSON.stringify(isUserAdmin));
      
      navigation.navigate('Main');

    } catch (error) {
      Alert.alert('Erro', error.message || 'Não foi possível selecionar o lar. Tente novamente.');
    }
  };

  const handleLogout = async () => {
    const logout = async () => {
      // Garante que todos os dados de sessão sejam limpos
      await AsyncStorage.multiRemove(['authToken', 'selectedGroupId', 'userData', 'isCurrentUserAdmin']);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      });
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Tem certeza que deseja sair do aplicativo?')) {
        await logout();
      }
    } else {
      Alert.alert('Sair', 'Tem certeza que deseja sair do aplicativo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sair', style: 'destructive', onPress: logout }
        ]
      );
    }
  };
  
  const getRandomColor = () => {
    const colors = ['#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f1c40f', '#1abc9c'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const renderContentList = () => {
    if (carregando) {
      return <View style={styles.feedbackContainer}><ActivityIndicator size="large" color="#2c3e50" /></View>;
    }
    if (erro) {
      return (
        <View style={styles.feedbackContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
          <Text style={styles.errorText}>{erro}</Text>
        </View>
      );
    }
    if (lares.length === 0) {
      return (
        <View style={styles.feedbackContainer}>
          <Ionicons name="home-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Você ainda não faz parte de nenhum lar.</Text>
        </View>
      );
    }
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {lares.map((lar) => (
          <TouchableOpacity
            key={lar.id}
            style={[styles.larCard, { borderLeftColor: getRandomColor() }]}
            onPress={() => handleSelecionarLar(lar)}
          >
            <View style={styles.larHeader}>
              <Text style={styles.larNome}>{lar.nome}</Text>
              <Ionicons name="chevron-forward" size={20} color="#7f8c8d" />
            </View>
            <View style={styles.larStats}>
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={16} color="#7f8c8d" />
                <Text style={styles.statText}>{lar.membros.length} Membro(s)</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTexts}>
            <Text style={styles.title}>Meus Lares</Text>
            <Text style={styles.subtitle}>Escolha um lar para gerenciar</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      <SearchBar />
      <View style={styles.actionCardContainer}>
        <TouchableOpacity style={styles.actionCard} onPress={handleAction}>
          <View style={styles.actionCardIcon}><Ionicons name="add" size={32} color="#fff" /></View>
          <View>
            <Text style={styles.actionCardText}>Criar ou Entrar em um Lar</Text>
            <Text style={styles.actionCardSubtext}>Adicionar novo lar ou usar código</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.listContainer}>{renderContentList()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, backgroundColor: '#2c3e50' },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTexts: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#ecf0f1', textAlign: 'center', marginTop: 8 },
  logoutButton: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', marginLeft: 16 },
  actionCardContainer: { paddingHorizontal: 16, paddingTop: 16, backgroundColor: 'white' },
  actionCard: { flexDirection: 'row', backgroundColor: '#3498db', borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
  actionCardIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  actionCardText: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  actionCardSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  listContainer: { flex: 1, backgroundColor: 'white' },
  scrollContainer: { padding: 16, flexGrow: 1 },
  larCard: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  larHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  larNome: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', flex: 1 },
  larStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statItem: { flexDirection: 'row', alignItems: 'center' },
  statText: { marginLeft: 4, fontSize: 14, color: '#7f8c8d' },
  feedbackContainer: { justifyContent: 'center', alignItems: 'center', paddingVertical: 50, paddingHorizontal: 20 },
  feedbackText: { marginTop: 16, fontSize: 16, color: '#7f8c8d' },
  errorText: { marginTop: 16, fontSize: 16, color: '#e74c3c', textAlign: 'center' },
  retryButton: { marginTop: 20, backgroundColor: '#2c3e50', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16 },
  emptyText: { marginTop: 16, fontSize: 18, fontWeight: 'bold', color: '#7f8c8d', textAlign: 'center' },
  emptySubText: { marginTop: 8, fontSize: 14, color: '#95a5a6', textAlign: 'center' },
});