import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

export default function DadosMedicamento({ route, navigation }) {
  const { medicamentoId } = route.params;
  const [medicamento, setMedicamento] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchMedicamento = async () => {
        try {
          setCarregando(true);
          const token = await AsyncStorage.getItem('authToken');
          const groupId = await AsyncStorage.getItem('selectedGroupId');
          const response = await axios.get(`${baseURL}/api/grupos/${groupId}/medicamentos/${medicamentoId}/`, {
            headers: { 'Authorization': `Token ${token}` }
          });
          setMedicamento(response.data);
        } catch (error) {
          Alert.alert("Erro", "Não foi possível carregar os dados do medicamento.");
          navigation.goBack();
        } finally {
          setCarregando(false);
        }
      };
      fetchMedicamento();
    }, [medicamentoId])
  );

  const handleDelete = async () => {
    const deleteAction = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const groupId = await AsyncStorage.getItem('selectedGroupId');
        await axios.delete(`${baseURL}/api/grupos/${groupId}/medicamentos/${medicamentoId}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        Alert.alert("Sucesso", "Medicamento excluído do estoque.");
        navigation.goBack();
      } catch (error) {
        Alert.alert("Erro", "Não foi possível excluir o medicamento.");
      }
    };

    // CORREÇÃO: Lógica de alerta diferente para web e mobile
    if (Platform.OS === 'web') {
      if (window.confirm("Tem certeza que deseja excluir este medicamento? Esta ação não pode ser desfeita.")) {
        await deleteAction();
      }
    } else {
      Alert.alert(
        "Excluir Medicamento",
        "Tem certeza que deseja excluir este medicamento do estoque? Esta ação não pode ser desfeita.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Excluir", style: "destructive", onPress: deleteAction }
        ]
      );
    }
  };

  if (carregando) return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  if (!medicamento) return <Text style={styles.errorText}>Medicamento não encontrado.</Text>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{medicamento.nome_marca}</Text>
        <Text style={styles.headerSubtitle}>{medicamento.principio_ativo || 'Princípio Ativo não informado'}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={24} color="#e74c3c" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('EditarMedicamento', { medicamento: medicamento })} style={[styles.actionButton, { marginLeft: 16 }]}>
            <Ionicons name="pencil-outline" size={24} color="#3498db" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Detalhes Gerais</Text>
        <View style={styles.infoRow}><Text style={styles.label}>Fabricante:</Text><Text style={styles.value}>{medicamento.fabricante || 'Não informado'}</Text></View>
        <View style={styles.infoRow}><Text style={styles.label}>Genérico:</Text><Text style={styles.value}>{medicamento.generico ? 'Sim' : 'Não'}</Text></View>
      </View>
      
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Dosagem e Forma</Text>
        <View style={styles.infoRow}><Text style={styles.label}>Forma Farmacêutica:</Text><Text style={styles.value}>{medicamento.forma_farmaceutica}</Text></View>
        <View style={styles.infoRow}><Text style={styles.label}>Concentração:</Text><Text style={styles.value}>{medicamento.concentracao_valor ? `${medicamento.concentracao_valor} ${medicamento.concentracao_unidade}` : 'Não informado'}</Text></View>
      </View>
      
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Estoque</Text>
        <View style={styles.infoRow}><Text style={styles.label}>Quantidade:</Text><Text style={styles.value}>{medicamento.quantidade_estoque} unidades</Text></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50' },
  headerSubtitle: { fontSize: 16, color: '#7f8c8d', marginTop: 4 },
  actions: { flexDirection: 'row', position: 'absolute', right: 20, top: 20 },
  actionButton: { padding: 8 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, margin: 16, marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#ecf0f1', paddingBottom: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { fontSize: 16, color: '#34495e', fontWeight: '600' },
  value: { fontSize: 16, color: '#2c3e50' },
  errorText: { textAlign: 'center', marginTop: 30, fontSize: 16 }
});