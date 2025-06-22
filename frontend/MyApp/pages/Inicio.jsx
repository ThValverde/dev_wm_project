import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import SearchBar from '../components/SearchBar';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

function Inicio({ navigation }) {
  const [idosos, setIdosos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState(null);
  const [nextPageUrl, setNextPageUrl] = useState(null);

  // Função para buscar a primeira página ou carregar mais
  const buscarIdosos = async (url = null) => {
    // Se estiver carregando mais, não inicia uma nova busca
    if (url && carregandoMais) return;
    
    // Se não for 'carregar mais', é a busca inicial
    if (!url) {
      setCarregando(true);
      setIdosos([]); // Limpa a lista para a busca inicial
    } else {
      setCarregandoMais(true); // Ativa o loading do rodapé
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      const groupId = await AsyncStorage.getItem('selectedGroupId');
      if (!token || !groupId) throw new Error('Sessão inválida.');

      const finalUrl = url || `${baseURL}/api/grupos/${groupId}/idosos/`;

      const response = await axios.get(finalUrl, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      const novosIdosos = response.data.results;
      // Se for uma nova página (url não nula), adiciona ao final da lista, senão, substitui
      setIdosos(prevIdosos => url ? [...prevIdosos, ...novosIdosos] : novosIdosos);
      setNextPageUrl(response.data.next); // Guarda a URL da próxima página

    } catch (err) {
      setErro('Não foi possível carregar os dados dos idosos.');
    } finally {
      setCarregando(false);
      setCarregandoMais(false);
    }
  };
  
  // useFocusEffect para buscar os dados quando a tela é focada
  useFocusEffect(
    useCallback(() => {
      buscarIdosos(); // Busca a primeira página
    }, [])
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Dados', { idosoId: item.id })}
    >
      <Text style={styles.nome}>{item.nome_completo}</Text>
    </TouchableOpacity>
  );

  // Componente do rodapé que mostra o botão ou o loading
  const renderFooter = () => {
    if (carregandoMais) return <ActivityIndicator size="large" color="#2c3e50" style={{ marginVertical: 20 }} />;
    if (!nextPageUrl) return null; // Não mostra nada se não houver mais páginas
    
    return (
      <TouchableOpacity style={styles.loadMoreButton} onPress={() => buscarIdosos(nextPageUrl)}>
        <Text style={styles.loadMoreText}>Carregar Mais</Text>
      </TouchableOpacity>
    );
  };
  
  if (carregando && idosos.length === 0) {
    return (
      <View style={{flex: 1, justifyContent: 'center'}}>
        <ActivityIndicator size="large" color="#2c3e50" />
      </View>
    );
  }
  
  if (erro) {
    return <Text style={styles.infoText}>{erro}</Text>;
  }
  
  return (
    <View style={styles.appContainer}>
      <SearchBar />
      <FlatList
        data={idosos}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={<Text style={styles.infoText}>Nenhum idoso cadastrado neste grupo.</Text>}
        ListFooterComponent={renderFooter}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CadastroIdoso')}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: '#fff' },
  grid: { padding: 8, alignItems: 'center' },
  card: { backgroundColor: '#f8f9fa', borderRadius: 10, margin: 8, alignItems: 'center', width: 150, padding: 10, elevation: 2, borderWidth: 1, borderColor: '#eee' },
  infoText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#7f8c8d' },
  fab: { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center', right: 30, bottom: 30, backgroundColor: '#3498db', borderRadius: 30, elevation: 8 },
  loadMoreButton: { padding: 15, backgroundColor: '#3498db', borderRadius: 8, alignItems: 'center', margin: 16 },
  loadMoreText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default Inicio;