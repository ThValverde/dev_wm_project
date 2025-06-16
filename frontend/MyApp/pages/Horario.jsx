import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import NavBar from '../components/NavBar';

// Dados de exemplo (serão substituídos por dados do backend futuramente)
const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const PACIENTES = [
  { id: 1, nome: 'João Silva', idade: 72, comorbidades: 'Hipertensão, Diabetes' },
  { id: 2, nome: 'Maria Santos', idade: 68, comorbidades: 'Artrite' },
  { id: 3, nome: 'Carlos Oliveira', idade: 80, comorbidades: 'Alzheimer inicial' }
];

const MEDICAMENTOS_HORARIOS = [
  { 
    id: 1, 
    medicamento: 'Paracetamol', 
    horario: '08:00', 
    pacienteId: 1, 
    quantidade: '1 comprimido',
    dias: [1, 2, 3, 4, 5, 6, 0] // todos os dias
  },
  { 
    id: 2, 
    medicamento: 'Enalapril', 
    horario: '08:30', 
    pacienteId: 1, 
    quantidade: '1 comprimido de 10mg',
    dias: [1, 3, 5] // segunda, quarta, sexta
  },
  { 
    id: 3, 
    medicamento: 'Insulina', 
    horario: '12:00', 
    pacienteId: 1, 
    quantidade: '10 unidades',
    dias: [1, 2, 3, 4, 5, 6, 0] // todos os dias
  },
  { 
    id: 4, 
    medicamento: 'Ibuprofeno', 
    horario: '14:00', 
    pacienteId: 2, 
    quantidade: '1 comprimido de 600mg',
    dias: [2, 4, 6] // terça, quinta, sábado
  },
  { 
    id: 5, 
    medicamento: 'Donepezila', 
    horario: '20:00', 
    pacienteId: 3, 
    quantidade: '1 comprimido de 5mg',
    dias: [1, 2, 3, 4, 5, 6, 0] // todos os dias
  },
];

function Horario({ navigation }) {
  const hoje = new Date();
  const [diaAtual, setDiaAtual] = useState(hoje.getDay());
  const [mostrarPerfil, setMostrarPerfil] = useState(null);

  // Filtrar medicamentos para o dia selecionado
  const medicamentosDoDia = MEDICAMENTOS_HORARIOS.filter(med => 
    med.dias.includes(diaAtual)
  ).sort((a, b) => a.horario.localeCompare(b.horario));

  // Avançar ou retroceder dia
  const mudarDia = (incremento) => {
    let novoDia = (diaAtual + incremento) % 7;
    if (novoDia < 0) novoDia = 6; // Se for menor que zero, volta para sábado
    setDiaAtual(novoDia);
  };

  // Encontrar paciente pelo ID
  const encontrarPaciente = (id) => {
    return PACIENTES.find(p => p.id === id) || { nome: 'Paciente não encontrado' };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Horário de Medicamentos</Text>
        
        {/* Navegação de datas */}
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={() => mudarDia(-1)} style={styles.dateButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.dateText}>{DIAS_SEMANA[diaAtual]}</Text>
          <TouchableOpacity onPress={() => mudarDia(1)} style={styles.dateButton}>
            <Ionicons name="chevron-forward" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Lista de medicamentos */}
        <ScrollView style={styles.scrollView}>
          {medicamentosDoDia.length > 0 ? (
            medicamentosDoDia.map((med) => {
              const paciente = encontrarPaciente(med.pacienteId);
              
              return (
                <View key={med.id} style={styles.medicationCard}>
                  <View style={styles.timeContainer}>
                    <Text style={styles.time}>{med.horario}</Text>
                  </View>
                  <View style={styles.medicationInfo}>
                    <Text style={styles.medicationName}>{med.medicamento}</Text>
                    <Text style={styles.quantity}>{med.quantidade}</Text>
                    <TouchableOpacity 
                      style={styles.patientButton}
                      onPress={() => setMostrarPerfil(paciente.id === mostrarPerfil ? null : paciente.id)}
                    >
                      <Text style={styles.patientName}>Paciente: {paciente.nome}</Text>
                      <Ionicons 
                        name={mostrarPerfil === paciente.id ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        color="#2c3e50" 
                      />
                    </TouchableOpacity>
                    
                    {mostrarPerfil === paciente.id && (
                      <View style={styles.patientDetails}>
                        <Text style={styles.patientDetail}>Idade: {paciente.idade} anos</Text>
                        <Text style={styles.patientDetail}>Comorbidades: {paciente.comorbidades}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Não há medicamentos agendados para este dia</Text>
            </View>
          )}
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