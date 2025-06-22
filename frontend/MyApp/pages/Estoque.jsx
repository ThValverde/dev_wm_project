import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../components/SearchBar';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

export default function Estoque({ navigation }) {
  const [medicamentos, setMedicamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // useFocusEffect garante que a lista seja recarregada ao entrar na tela
  useFocusEffect(
    useCallback(() => {
      const fetchMedicamentos = async () => {
        try {
          setCarregando(true);
          const token = await AsyncStorage.getItem('authToken');
          const groupId = await AsyncStorage.getItem('selectedGroupId');
          if (!token || !groupId) throw new Error("Sessão inválida");

          const response = await axios.get(`${baseURL}/api/grupos/${groupId}/medicamentos/`, {
            headers: { 'Authorization': `Token ${token}` }
          });
          
          // Como este endpoint não é paginado, a resposta já é a lista completa
          setMedicamentos(response.data);
          setErro(null);

        } catch (err) {
          setErro("Não foi possível carregar o estoque.");
        } finally {
          setCarregando(false);
        }
      };
      fetchMedicamentos();
    }, [])
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('DadosMedicamento', { medicamentoId: item.id })}
    >
      <Text style={styles.medName}>{item.nome_marca}</Text>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Estoque:</Text>
        <Text style={styles.value}>{item.quantidade_estoque} un.</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Forma:</Text>
        <Text style={styles.value}>{item.forma_farmaceutica || 'N/A'}</Text>
      </View>
    </TouchableOpacity>
  );

  if (carregando) {
    return (
      <View style={[styles.container, {justifyContent: 'center'}]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estoque de Medicamentos</Text>
      <SearchBar />
      <FlatList
        data={medicamentos}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.feedbackText}>Nenhum medicamento cadastrado.</Text>}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CadastroMedicamento')}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2c3e50', padding: 16 },
  title: { color: '#f4f4f4', fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  listContent: { paddingBottom: 80 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 16, elevation: 4 },
  medName: { fontSize: 20, fontWeight: 'bold', color: '#232946', marginBottom: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#232946', fontWeight: '600', fontSize: 16 },
  value: { color: '#393e46', fontSize: 16 },
  feedbackText: { color: '#fff', textAlign: 'center', marginTop: 50, fontSize: 16 },
  fab: { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center', right: 30, bottom: 30, backgroundColor: '#3498db', borderRadius: 30, elevation: 8 },
});