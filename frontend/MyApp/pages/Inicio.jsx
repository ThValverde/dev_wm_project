import React, { useState, useEffect, useCallback } from 'react'; // Adicionado useCallback
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // Adicionado useFocusEffect
import SearchBar from '../components/SearchBar';
import { Ionicons } from '@expo/vector-icons'; // Adicionado Ionicons
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

function ListaDeIdosos({ idosos, navigation }) {
  if (idosos.length === 0) {
    return <Text style={styles.infoText}>Nenhum idoso cadastrado neste grupo.</Text>;
  }
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.grid}>
        {idosos.map((idoso) => (
          <TouchableOpacity
            key={idoso.id}
            style={styles.card}
            onPress={() => navigation.navigate('Dados', { idoso: idoso })}
          >
            <Image
              source={{ uri: `https://avatar.iran.liara.run/public/boy?username=${idoso.nome_completo}` }}
              style={styles.image}
            />
            <Text style={styles.nome}>{idoso.nome_completo}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function Inicio({ navigation }) {
  const [idosos, setIdosos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // ATUALIZAÇÃO: Trocado useEffect por useFocusEffect
  useFocusEffect(
    useCallback(() => {
      const buscarIdosos = async () => {
        try {
          setCarregando(true);
          const token = await AsyncStorage.getItem('authToken');
          const groupId = await AsyncStorage.getItem('selectedGroupId');
          if (!token || !groupId) throw new Error('Sessão inválida.');

          const response = await axios.get(`${baseURL}/api/grupos/${groupId}/idosos/`, {
            headers: { 'Authorization': `Token ${token}` }
          });
          setIdosos(response.data);
        } catch (err) {
          console.error("Erro ao buscar idosos:", err.response ? err.response.data : err.message);
          setErro('Não foi possível carregar os dados dos idosos.');
        } finally {
          setCarregando(false);
        }
      };
      buscarIdosos();
    }, []) // O array vazio garante que não entre em loop
  );

  const renderContent = () => {
    if (carregando) return <ActivityIndicator size="large" color="#2c3e50" style={{ marginTop: 50 }} />;
    if (erro) return <Text style={styles.infoText}>{erro}</Text>;
    return <ListaDeIdosos idosos={idosos} navigation={navigation} />;
  };
  
  return (
    <View style={styles.appContainer}>
      <SearchBar />
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {renderContent()}
      </View>
      {/* NOVO: Botão Flutuante para adicionar idoso */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CadastroIdoso')}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1 },
  scrollContainer: { padding: 16, backgroundColor: '#fff', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  card: { backgroundColor: '#f4f4f4', borderRadius: 10, margin: 8, alignItems: 'center', width: 140, padding: 10, elevation: 2 },
  image: { width: 100, height: 100, borderRadius: 50, marginBottom: 8, backgroundColor: '#e0e0e0' },
  nome: { fontWeight: 'bold', fontSize: 16, color: '#2c3e50', textAlign: 'center' },
  infoText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#7f8c8d' },
  // NOVO: Estilo para o botão flutuante
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
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});

export default Inicio;