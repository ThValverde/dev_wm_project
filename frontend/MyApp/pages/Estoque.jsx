import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../components/SearchBar';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

export default function Estoque({ navigation }) {
  // --- ESTADOS PARA O FILTRO E DADOS ---
  const [todosMedicamentos, setTodosMedicamentos] = useState([]);
  const [medicamentosFiltrados, setMedicamentosFiltrados] = useState([]);
  const [termoBusca, setTermoBusca] = useState(''); // Termo de busca instantâneo do input
  const [termoDebounced, setTermoDebounced] = useState(''); // Termo usado para o filtro, após o delay

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
          
          setTodosMedicamentos(response.data);
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

  // --- LÓGICA DE DEBOUNCE ---
  // Este efeito observa o termo de busca instantâneo
  useEffect(() => {
    // Configura um timer para atualizar o termo de busca final após 300ms
    const handler = setTimeout(() => {
      setTermoDebounced(termoBusca);
    }, 300);

    // Limpa o timer se o usuário digitar novamente antes dos 300ms
    return () => {
      clearTimeout(handler);
    };
  }, [termoBusca]); // Roda sempre que o termo do input muda

  // --- LÓGICA DE FILTRAGEM ---
  // Este efeito roda apenas quando o termo "debounced" muda
  useEffect(() => {
    if (termoDebounced.trim() === '') {
      setMedicamentosFiltrados(todosMedicamentos);
    } else {
      const filtrados = todosMedicamentos.filter(medicamento =>
        medicamento.nome_marca.toLowerCase().includes(termoDebounced.toLowerCase())
      );
      setMedicamentosFiltrados(filtrados);
    }
  }, [termoDebounced, todosMedicamentos]); // Depende do termo final e da lista completa

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
      <View style={[styles.container, {justifyContent: 'center', backgroundColor: '#f0f2f5'}]}>
        <ActivityIndicator size="large" color="#2c3e50" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estoque de Medicamentos</Text>
      {/* SearchBar atualiza o termo de busca instantâneo */}
      <SearchBar onSearch={setTermoBusca} placeholder="Buscar por nome do medicamento..." />
      <FlatList
        data={medicamentosFiltrados}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled" // Melhora a interação com a lista ao usar o teclado
        ListEmptyComponent={
            <Text style={styles.feedbackText}>
              {todosMedicamentos.length > 0 ? 'Nenhum resultado encontrado.' : 'Nenhum medicamento cadastrado.'}
            </Text>
        }
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
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  title: { color: '#2c3e50', fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', marginTop: 10 },
  listContent: { paddingHorizontal: 16, paddingBottom: 80 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  medName: { fontSize: 20, fontWeight: 'bold', color: '#34495e', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 6 },
  label: { color: '#34495e', fontWeight: '600', fontSize: 16 },
  value: { color: '#7f8c8d', fontSize: 16, fontWeight: '500' },
  feedbackText: { color: '#7f8c8d', textAlign: 'center', marginTop: 50, fontSize: 16 },
  fab: { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center', right: 30, bottom: 30, backgroundColor: '#3498db', borderRadius: 30, elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4 },
});
