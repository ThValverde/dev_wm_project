import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../components/SearchBar';

export default function SelecionarLar({ navigation }) {
  const [lares, setLares] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Dados mockados dos lares (substitua pela sua API futuramente)
  const laresMock = [
    {
      id: 1,
      nome: 'Lar São Francisco',
      endereco: 'Rua das Flores, 123',
      numeroResidentes: 15,
      capacidade: 20,
      cor: '#3498db'
    },
    {
      id: 2,
      nome: 'Casa da Esperança',
      endereco: 'Av. Principal, 456',
      numeroResidentes: 8,
      capacidade: 12,
      cor: '#2ecc71'
    },
    {
      id: 3,
      nome: 'Residencial Vida Nova',
      endereco: 'Rua do Carmo, 789',
      numeroResidentes: 22,
      capacidade: 25,
      cor: '#e74c3c'
    },
  ];

  useEffect(() => {
    const carregarLares = async () => {
      try {
        setCarregando(true);
        // Simular carregamento da API
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLares(laresMock);
      } catch (err) {
        setErro('Erro ao carregar lares');
      } finally {
        setCarregando(false);
      }
    };

    carregarLares();
  }, []);

  const handleCriarLar = () => {
    Alert.alert(
      'Criar Novo Lar',
      'Funcionalidade em desenvolvimento',
      [{ text: 'OK' }]
    );
  };

  const handleSelecionarLar = (lar) => {
    Alert.alert(
      'Lar Selecionado',
      `Você selecionou: ${lar.nome}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Entrar', 
          onPress: () => navigation.navigate('Inicio')
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair do aplicativo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: () => navigation.navigate('Login')
        }
      ]
    );
  };

  const renderContent = () => {
    if (carregando) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c3e50" />
          <Text style={styles.loadingText}>Carregando lares...</Text>
        </View>
      );
    }

    if (erro) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
          <Text style={styles.errorText}>{erro}</Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Botão Criar Lar */}
        <TouchableOpacity 
          style={styles.criarLarCard}
          onPress={handleCriarLar}
        >
          <View style={styles.criarLarIcon}>
            <Ionicons name="add" size={32} color="#fff" />
          </View>
          <Text style={styles.criarLarText}>Criar Lar</Text>
          <Text style={styles.criarLarSubtext}>Adicionar novo lar de idosos</Text>
        </TouchableOpacity>

        {/* Lista de Lares */}
        <View style={styles.laresGrid}>
          {lares.map((lar) => (
            <TouchableOpacity
              key={lar.id}
              style={[styles.larCard, { borderLeftColor: lar.cor }]}
              onPress={() => handleSelecionarLar(lar)}
            >
              <View style={styles.larHeader}>
                <Text style={styles.larNome}>{lar.nome}</Text>
                <Ionicons name="chevron-forward" size={20} color="#7f8c8d" />
              </View>
              
              <Text style={styles.larEndereco}>{lar.endereco}</Text>
              
              <View style={styles.larStats}>
                <View style={styles.statItem}>
                  <Ionicons name="people-outline" size={16} color="#7f8c8d" />
                  <Text style={styles.statText}>
                    {lar.numeroResidentes}/{lar.capacidade}
                  </Text>
                </View>
                
                <View style={[styles.statusIndicator, { 
                  backgroundColor: lar.numeroResidentes < lar.capacidade ? '#2ecc71' : '#f39c12' 
                }]}>
                  <Text style={styles.statusText}>
                    {lar.numeroResidentes < lar.capacidade ? 'Disponível' : 'Lotado'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTexts}>
            <Text style={styles.title}>Selecionar Lar</Text>
            <Text style={styles.subtitle}>Escolha um lar para gerenciar</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <SearchBar />
      
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    padding: 20,
    backgroundColor: '#2c3e50',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTexts: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ecf0f1',
    textAlign: 'center',
    marginTop: 8,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginLeft: 16,
  },
  scrollContainer: {
    padding: 16,
  },
  criarLarCard: {
    backgroundColor: '#3498db',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  criarLarIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  criarLarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  criarLarSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  laresGrid: {
    gap: 12,
  },
  larCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  larHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  larNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  larEndereco: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  larStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#7f8c8d',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
});