import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
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
  const [erro, setErro] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const fetchPrescricoes = async () => {
        setCarregando(true);
        setErro(null);
        try {
          const token = await AsyncStorage.getItem('authToken');
          const groupId = await AsyncStorage.getItem('selectedGroupId');
          if (!token || !groupId) throw new Error("Sessão inválida");

          const response = await axios.get(`${baseURL}/api/grupos/${groupId}/prescricoes/`, {
            headers: { 'Authorization': `Token ${token}` }
          });
          setPrescricoes(response.data);
        } catch (error) {
          console.error("Erro ao carregar horários:", error.response ? error.response.data : error.message);
          setErro("Não foi possível carregar a agenda de horários.");
        } finally {
          setCarregando(false);
        }
      };
      fetchPrescricoes();
    }, [])
  );

  const prescricoesDoDia = prescricoes.filter(p => p[DIAS_API[diaAtual]])
                                     .sort((a, b) => a.horario_previsto.localeCompare(b.horario_previsto));

  const mudarDia = (incremento) => {
    let novoDia = (diaAtual + 7 + incremento) % 7;
    setDiaAtual(novoDia);
  };
  
  const handleAdministrarAgora = (prescricao) => {
    const administrar = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const groupId = await AsyncStorage.getItem('selectedGroupId');
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

  const renderContent = () => {
    if (carregando) {
      return <ActivityIndicator color="#fff" size="large" style={{ marginTop: 50 }} />;
    }

    if (erro) {
        return (
          <View style={styles.emptyContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color="#ccc" />
            <Text style={styles.errorText}>{erro}</Text>
          </View>
        );
    }
    
    if (prescricoesDoDia.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-done-circle-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Não há medicamentos agendados para este dia.</Text>
            </View>
        );
    }

    return (
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

        <ScrollView style={styles.scrollView}>
            {renderContent()}
        </ScrollView>
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
    fontSize: 18,
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
  },
  patientName: {
    fontSize: 14,
    color: '#34495e',
    marginTop: 4,
  },
  quantity: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  actionButton: {
    padding: 8,
  },
  playButton: {
    backgroundColor: '#27ae60',
    borderRadius: 20,
    padding: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
  },
  emptyText: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#ffdddd',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  }
});

export default Horario;