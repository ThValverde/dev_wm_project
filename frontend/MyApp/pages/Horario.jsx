import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DIAS_API = ['dia_domingo', 'dia_segunda', 'dia_terca', 'dia_quarta', 'dia_quinta', 'dia_sexta', 'dia_sabado'];

function Horario({ navigation }) {
  const hoje = new Date();
  const [diaAtual, setDiaAtual] = useState(hoje.getDay());
  const [prescricoes, setPrescricoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Busca todas as prescrições do grupo sempre que a tela for focada
  useFocusEffect(
    useCallback(() => {
      const fetchPrescricoes = async () => {
        try {
          setCarregando(true);
          const token = await AsyncStorage.getItem('authToken');
          const groupId = await AsyncStorage.getItem('selectedGroupId');
          if (!token || !groupId) throw new Error("Sessão inválida");

          const response = await axios.get(`${baseURL}/api/grupos/${groupId}/prescricoes/`, {
            headers: { 'Authorization': `Token ${token}` }
          });
          setPrescricoes(response.data);
        } catch (error) {
          Alert.alert("Erro", "Não foi possível carregar a agenda de horários.");
        } finally {
          setCarregando(false);
        }
      };
      fetchPrescricoes();
    }, [])
  );

  // Filtra as prescrições para o dia da semana selecionado
  const prescricoesDoDia = prescricoes.filter(p => p[DIAS_API[diaAtual]])
                                     .sort((a, b) => a.horario_previsto.localeCompare(b.horario_previsto));

  const mudarDia = (incremento) => {
    let novoDia = (diaAtual + 7 + incremento) % 7;
    setDiaAtual(novoDia);
  };
  
  // Função para administrar o medicamento com a hora atual
  const handleAdministrarAgora = (prescricao) => {
    const administrar = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const groupId = await AsyncStorage.getItem('selectedGroupId');
        // Requisição POST sem corpo para usar a hora atual no backend
        await axios.post(`${baseURL}/api/grupos/${groupId}/prescricoes/${prescricao.id}/administrar/`, {}, {
          headers: { 'Authorization': `Token ${token}` }
        });
        Alert.alert("Sucesso", `${prescricao.medicamento.nome_marca} administrado com sucesso!`);
      } catch (error) {
        Alert.alert("Erro", "Falha ao registrar a administração. Verifique o estoque.");
      }
    };

    Alert.alert(
      "Confirmar Administração",
      `Deseja administrar ${prescricao.dosagem} de ${prescricao.medicamento.nome_marca} para ${prescricao.idoso}?`,
      [{ text: "Cancelar", style: "cancel" }, { text: "Confirmar", onPress: administrar }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Horário de Medicamentos</Text>
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={() => mudarDia(-1)} style={styles.dateButton}><Ionicons name="chevron-back" size={24} color="white" /></TouchableOpacity>
          <Text style={styles.dateText}>{DIAS_SEMANA[diaAtual]}</Text>
          <TouchableOpacity onPress={() => mudarDia(1)} style={styles.dateButton}><Ionicons name="chevron-forward" size={24} color="white" /></TouchableOpacity>
        </View>

        {carregando ? <ActivityIndicator color="#fff" size="large" /> : (
          <ScrollView style={styles.scrollView}>
            {prescricoesDoDia.length > 0 ? (
              prescricoesDoDia.map((p) => (
                <View key={p.id} style={styles.medicationCard}>
                  <View style={styles.timeContainer}><Text style={styles.time}>{p.horario_previsto.substring(0, 5)}</Text></View>
                  <View style={styles.medicationInfo}>
                    <Text style={styles.medicationName}>{p.medicamento.nome_marca}</Text>
                    <Text style={styles.patientName}>Para: {p.idoso}</Text>
                    <Text style={styles.quantity}>{p.dosagem}</Text>
                  </View>
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity onPress={() => navigation.navigate('Administracao', { prescricao: p })} style={styles.actionButton}>
                      <Ionicons name="document-text-outline" size={24} color="#7f8c8d" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleAdministrarAgora(p)} style={[styles.actionButton, styles.playButton]}>
                      <Ionicons name="play" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}><Text style={styles.emptyText}>Não há medicamentos agendados para este dia.</Text></View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2c3e50',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#2c3e50',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  dateNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#34495e',
    borderRadius: 10,
    padding: 8,
    marginBottom: 16,
  },
  dateButton: {
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#2c3e50',
  },
  dateText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  medicationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  timeContainer: {
    backgroundColor: '#3498db',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  time: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  medicationInfo: {
    flex: 1,
    padding: 12,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  quantity: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  patientButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  patientName: {
    fontSize: 14,
    color: '#2c3e50',
  },
  patientDetails: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  patientDetail: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
  },
  emptyText: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  }
});

export default Horario;