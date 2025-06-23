import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import SearchBar from '../components/SearchBar';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

function Inicio({ navigation }) {
  const [idosos, setIdosos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const buscarIdosos = async () => {
    setCarregando(true);
    setErro(null);

    try {
      const token = await AsyncStorage.getItem('authToken');
      const groupId = await AsyncStorage.getItem('selectedGroupId');
      if (!token || !groupId) {
        throw new Error('Sessão inválida. Faça o login novamente.');
      }

      const url = `${baseURL}/api/grupos/${groupId}/idosos/`;

      const response = await axios.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      setIdosos(response.data);

    } catch (err) {
      setErro('Não foi possível carregar os dados dos idosos.');
    } finally {
      setCarregando(false);
    }
  };
  
  useFocusEffect(
    useCallback(() => {
      buscarIdosos();
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
  
  if (carregando) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2c3e50" />
      </SafeAreaView>
    );
  }
  
  if (erro) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.infoText}>{erro}</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <SearchBar />
      <FlatList
        data={idosos}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={<Text style={styles.infoText}>Nenhum idoso cadastrado neste grupo.</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CadastroIdoso')}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  grid: { 
    padding: 8, 
    alignItems: 'center' 
  },
  card: { 
    backgroundColor: '#f8f9fa', 
    borderRadius: 10, 
    margin: 8, 
    alignItems: 'center', 
    justifyContent: 'center',
    width: 150, 
    height: 120,
    padding: 10, 
    elevation: 2, 
    borderWidth: 1, 
    borderColor: '#eee' 
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
});

export default Inicio;