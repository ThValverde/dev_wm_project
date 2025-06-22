import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
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

  const renderContent = () => {
    if (carregando) return <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />;
    if (erro) return <Text style={styles.feedbackText}>{erro}</Text>;
    if (medicamentos.length === 0) {
      return <Text style={styles.feedbackText}>Nenhum medicamento cadastrado no estoque.</Text>;
    }
    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {medicamentos.map((med) => (
          <TouchableOpacity 
            key={med.id} 
            style={styles.card}
            onPress={() => navigation.navigate('DadosMedicamento', { medicamentoId: med.id })}
          >
            <Text style={styles.medName}>{med.nome_marca}</Text>
            <View style={styles.infoRow}><Text style={styles.label}>Princípio Ativo:</Text><Text style={styles.value}>{med.principio_ativo || 'N/A'}</Text></View>
            <View style={styles.infoRow}><Text style={styles.label}>Estoque (unidades):</Text><Text style={styles.value}>{med.quantidade_estoque}</Text></View>
            <View style={styles.infoRow}><Text style={styles.label}>Concentração:</Text><Text style={styles.value}>{med.concentracao_valor ? `${med.concentracao_valor} ${med.concentracao_unidade}` : 'N/A'}</Text></View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estoque de Medicamentos</Text>
      <SearchBar />
      {renderContent()}
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
  scrollContent: { paddingBottom: 80 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 16, elevation: 4 },
  medName: { fontSize: 20, fontWeight: 'bold', color: '#232946', marginBottom: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#232946', fontWeight: '600', fontSize: 16 },
  value: { color: '#393e46', fontSize: 16 },
  feedbackText: { color: '#fff', textAlign: 'center', marginTop: 50, fontSize: 16 },
  fab: { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center', right: 30, bottom: 30, backgroundColor: '#3498db', borderRadius: 30, elevation: 8 },
});