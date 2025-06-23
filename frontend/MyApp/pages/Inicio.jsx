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

  // Função para buscar dados, agora preparada para paginação
  const buscarIdosos = async (url) => {
    // Se for para carregar mais e já estiver carregando, não faz nada
    if (url && carregandoMais) return;
    
    // Define o estado de loading apropriado
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

      const response = await axios.get(finalUrl, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      // CORREÇÃO: Pega os dados de dentro da chave "results"
      const novosIdosos = response.data.results;

      // Se for uma nova página, adiciona ao final da lista, senão, substitui a lista
      setIdosos(prevIdosos => url ? [...prevIdosos, ...novosIdosos] : novosIdosos);
      
      // Guarda a URL da próxima página para o botão "Carregar Mais"
      setNextPageUrl(response.data.next);
      setErro(null);

    } catch (err) {
      setErro('Não foi possível carregar os dados dos idosos.');
    } finally {
      setCarregando(false);
      setCarregandoMais(false);
    }
  };
  
  // useFocusEffect para garantir que a busca seja feita sempre que a tela for focada
  useFocusEffect(
    useCallback(() => {
      buscarIdosos(); // Busca a primeira página de resultados
    }, [])
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Dados', { idosoId: item.id })}
    >
      {/* <Image 
        source={{ uri: `https://avatar.iran.liara.run/public/boy?username=${item.nome_completo}` }} 
        style={styles.image}
      /> */}
      <Text style={styles.nome}>{item.nome_completo}</Text>
    </TouchableOpacity>
  );

  // Componente do rodapé que mostra o botão ou o indicador de carregamento
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2c3e50" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <SearchBar />
      {erro ? (
        <View style={styles.centered}><Text style={styles.infoText}>{erro}</Text></View>
      ) : (
        <FlatList
          data={idosos}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={<Text style={styles.infoText}>Nenhum idoso cadastrado neste grupo.</Text>}
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
  container: { 
    flex: 1, 
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  grid: { 
    padding: 8,
  },
  card: { 
    backgroundColor: '#f8f9fa', 
    borderRadius: 10, 
    margin: 8, 
    alignItems: 'center', 
    justifyContent: 'center',
    flex: 1,
    padding: 10, 
    elevation: 2, 
    borderWidth: 1, 
    borderColor: '#eee' 
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
    backgroundColor: '#e0e0e0'
  },
  nome: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    color: '#333'
  },
  infoText: { 
    textAlign: 'center', 
    marginTop: 50, 
    fontSize: 16, 
    color: '#7f8c8d' 
  },
  fab: { 
    position: 'absolute', 
    width: 60, 
    height: 60, 
    alignItems: 'center', 
    justifyContent: 'center', 
    right: 30, 
    bottom: 30, 
    backgroundColor: '#3498db', 
    borderRadius: 30, 
    elevation: 8 
  },
  loadMoreButton: {
    padding: 15,
    backgroundColor: '#3498db',
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default Inicio;