import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

function Dados({ route, navigation }) {
  // Recebendo os dados do idoso através dos parâmetros de navegação
  const { idoso } = route.params;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.profileHeader}>
          <Image 
            source={idoso.imagem} 
            style={styles.profileImage} 
          />
          <Text style={styles.profileName}>{idoso.nome}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Idade:</Text>
            <Text style={styles.infoValue}>{idoso.idade} anos</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data de Nascimento:</Text>
            <Text style={styles.infoValue}>{idoso.dataNascimento || "Não informada"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gênero:</Text>
            <Text style={styles.infoValue}>{idoso.genero || "Não informado"}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Condições Médicas</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Comorbidades:</Text>
            <Text style={styles.infoValue}>{idoso.comorbidade}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Alergias:</Text>
            <Text style={styles.infoValue}>{idoso.alergias || "Nenhuma conhecida"}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Medicamentos Atuais</Text>
          {idoso.medicamentos && idoso.medicamentos.length > 0 ? (
            idoso.medicamentos.map((med, index) => (
              <View key={index} style={styles.medicationItem}>
                <Text style={styles.medicationName}>{med.nome}</Text>
                <Text style={styles.medicationDetails}>
                  {med.dosagem} - {med.frequencia}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>Nenhum medicamento registrado</Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Histórico</Text>
          <Text style={styles.historyText}>
            {idoso.historia || "Histórico não disponível para este residente."}
          </Text>
        </View>
      </ScrollView>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495e',
    width: '40%',
  },
  infoValue: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  medicationItem: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  medicationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  medicationDetails: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  historyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2c3e50',
  },
  noDataText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
});

export default Dados;