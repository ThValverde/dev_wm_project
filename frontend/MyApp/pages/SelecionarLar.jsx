import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert, 
  Platform,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import SearchBar from '../components/SearchBar';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

export default function SelecionarLar({ navigation }) {
  const [todosLares, setTodosLares] = useState([]);
  const [laresFiltrados, setLaresFiltrados] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [termoDebounced, setTermoDebounced] = useState('');
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
      setTodosLares(response.data);
    } catch (err) {
      console.error("Erro ao carregar lares:", err.response ? err.response.data : err.message);
      setErro('Erro ao carregar seus lares. Verifique sua conexão.');
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(useCallback(() => { carregarLares(); }, []));
  useEffect(() => { const handler = setTimeout(() => { setTermoDebounced(termoBusca); }, 300); return () => clearTimeout(handler); }, [termoBusca]);
  useEffect(() => {
    if (termoDebounced.trim() === '') {
      setLaresFiltrados(todosLares);
    } else {
      const filtrados = todosLares.filter(lar => lar.nome.toLowerCase().includes(termoDebounced.toLowerCase()));
      setLaresFiltrados(filtrados);
    }
  }, [termoDebounced, todosLares]);

  const handleAction = () => navigation.navigate('CriarLar');

  const handleSelecionarLar = async (lar) => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) throw new Error("Dados do usuário não encontrados. Faça o login novamente.");
      const currentUser = JSON.parse(userDataString);
      const isUserAdmin = currentUser.id === lar.admin.id;
      await AsyncStorage.setItem('selectedGroupId', lar.id.toString());
      await AsyncStorage.setItem('isCurrentUserAdmin', String(isUserAdmin));
      navigation.navigate('Main');
    } catch (error) {
      console.error("Erro ao selecionar lar:", error);
      Alert.alert('Erro', error.message || 'Não foi possível selecionar o lar.');
    }
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      await AsyncStorage.multiRemove(['authToken', 'selectedGroupId', 'userData', 'isCurrentUserAdmin']);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Tem certeza que deseja sair?')) await performLogout();
    } else {
      Alert.alert('Sair', 'Tem certeza que deseja sair?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: performLogout }]);
    }
  };

  const getRandomColor = () => {
    const colors = ['#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f1c40f', '#1abc9c'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const renderLarItem = ({ item }) => (
    <TouchableOpacity style={[styles.larCard, { borderLeftColor: getRandomColor() }]} onPress={() => handleSelecionarLar(item)}>
      <View style={styles.larHeader}>
        <Text style={styles.larNome}>{item.nome}</Text>
        <Ionicons name="chevron-forward" size={20} color="#7f8c8d" />
      </View>
      <View style={styles.larStats}>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={16} color="#7f8c8d" />
          <Text style={styles.statText}>{item.membros.length} Membro(s)</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContentList = () => {
    if (carregando) return <View style={styles.feedbackContainer}><ActivityIndicator size="large" color="#2c3e50" /></View>;
    if (erro) return <View style={styles.feedbackContainer}><Ionicons name="alert-circle-outline" size={48} color="#e74c3c" /><Text style={styles.errorText}>{erro}</Text></View>;
    return (
      <FlatList
        data={laresFiltrados}
        renderItem={renderLarItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.feedbackContainer}>
            <Ionicons name="home-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>{todosLares.length > 0 ? 'Nenhum lar encontrado.' : 'Você ainda não faz parte de nenhum lar.'}</Text>
          </View>
        }
      />
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
          {/* --- BOTÕES DE AÇÃO NO CABEÇALHO --- */}
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('PerfilUsuario')}>
              <Ionicons name="person-circle-outline" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <SearchBar onSearch={setTermoBusca} placeholder="Buscar por nome do lar..." />
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
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#ecf0f1', marginTop: 4 },
  // --- NOVOS ESTILOS PARA OS BOTÕES DO CABEÇALHO ---
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { padding: 8, marginLeft: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  actionCardContainer: { paddingHorizontal: 16, paddingTop: 16, backgroundColor: 'white' },
  actionCard: { flexDirection: 'row', backgroundColor: '#3498db', borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
  actionCardIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  actionCardText: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  actionCardSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  listContainer: { flex: 1, backgroundColor: 'white' },
  scrollContainer: { padding: 16, flexGrow: 1 },
  larCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 5, shadowColor: '#999', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  larHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  larNome: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', flex: 1 },
  larStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  statItem: { flexDirection: 'row', alignItems: 'center' },
  statText: { marginLeft: 6, fontSize: 14, color: '#7f8c8d' },
  feedbackContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  errorText: { marginTop: 16, fontSize: 16, color: '#e74c3c', textAlign: 'center' },
  emptyText: { marginTop: 16, fontSize: 18, fontWeight: '600', color: '#7f8c8d', textAlign: 'center' },
});
