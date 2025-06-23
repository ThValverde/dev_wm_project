import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import SearchBar from '../components/SearchBar';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

function Inicio({ navigation }) {
  // --- ESTADOS PARA O FILTRO, DEBOUNCE E DADOS ---
  const [todosIdosos, setTodosIdosos] = useState([]); // Guarda a lista original completa
  const [idososFiltrados, setIdososFiltrados] = useState([]); // Guarda a lista a ser exibida
  const [termoBusca, setTermoBusca] = useState(''); // Termo de busca instantâneo do input
  const [termoDebounced, setTermoDebounced] = useState(''); // Termo usado para o filtro, após o delay

  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState(null);
  const [nextPageUrl, setNextPageUrl] = useState(null);

  const buscarIdosos = async (url) => {
    if (url && carregandoMais) return;
    
    if (!url) {
      setCarregando(true);
    } else {
      setCarregandoMais(true);
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      const groupId = await AsyncStorage.getItem('selectedGroupId');
      if (!token || !groupId) throw new Error('Sessão inválida.');

      const finalUrl = url || `${baseURL}/api/grupos/${groupId}/idosos/`;
      const response = await axios.get(finalUrl, { headers: { 'Authorization': `Token ${token}` } });
      
      const novosIdosos = response.data.results || [];
      
      setTodosIdosos(prevIdosos => url ? [...prevIdosos, ...novosIdosos] : novosIdosos);
      
      setNextPageUrl(response.data.next);
      setErro(null);

    } catch (err) {
      setErro('Não foi possível carregar os dados dos idosos.');
    } finally {
      setCarregando(false);
      setCarregandoMais(false);
    }
  };
  
  useFocusEffect(
    useCallback(() => {
      buscarIdosos();
    }, [])
  );

  // --- LÓGICA DE DEBOUNCE ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setTermoDebounced(termoBusca);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [termoBusca]);

  // --- LÓGICA DE FILTRAGEM ---
  useEffect(() => {
    if (termoDebounced.trim() === '') {
      setIdososFiltrados(todosIdosos);
    } else {
      const filtrados = todosIdosos.filter(idoso =>
        idoso.nome_completo.toLowerCase().includes(termoDebounced.toLowerCase())
      );
      setIdososFiltrados(filtrados);
    }
  }, [termoDebounced, todosIdosos]);


  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Dados', { idosoId: item.id })}
    >
      <Text style={styles.nome}>{item.nome_completo}</Text>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (carregandoMais) return <ActivityIndicator size="large" color="#2c3e50" style={{ marginVertical: 20 }} />;
    // Oculta o botão se não houver mais páginas ou se uma busca estiver ativa
    if (!nextPageUrl || termoDebounced.trim() !== '') return null;
    
    return (
      <TouchableOpacity style={styles.loadMoreButton} onPress={() => buscarIdosos(nextPageUrl)}>
        <Text style={styles.loadMoreText}>Carregar Mais</Text>
      </TouchableOpacity>
    );
  };
  
  if (carregando && todosIdosos.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2c3e50" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <SearchBar onSearch={setTermoBusca} placeholder="Buscar por nome do idoso..." />

      {erro ? (
        <View style={styles.centered}><Text style={styles.infoText}>{erro}</Text></View>
      ) : (
        <FlatList
          data={idososFiltrados}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.grid}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.infoText}>
              {todosIdosos.length > 0 ? 'Nenhum resultado encontrado.' : 'Nenhum idoso cadastrado neste grupo.'}
            </Text>
          }
          ListFooterComponent={renderFooter}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CadastroIdoso')}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  grid: { padding: 8 },
  card: { backgroundColor: '#f8f9fa', borderRadius: 10, margin: 8, alignItems: 'center', justifyContent: 'center', flex: 1, padding: 10, elevation: 2, borderWidth: 1, borderColor: '#eee' },
  nome: { fontWeight: 'bold', fontSize: 16, textAlign: 'center', color: '#333' },
  infoText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#7f8c8d' },
  fab: { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center', right: 30, bottom: 30, backgroundColor: '#3498db', borderRadius: 30, elevation: 8 },
  loadMoreButton: { padding: 15, backgroundColor: '#3498db', borderRadius: 8, alignItems: 'center', margin: 16 },
  loadMoreText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default Inicio;
