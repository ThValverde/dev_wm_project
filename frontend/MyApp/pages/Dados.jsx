import React, { useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

// --- Funções Auxiliares para Formatação ---
function calcularIdade(dataNasc) {
  if (!dataNasc) return 'Não informada';
  const hoje = new Date();
  const nascimento = new Date(dataNasc);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
}

function getGeneroDisplay(genero) {
  if (genero === 'M') return 'Masculino';
  if (genero === 'F') return 'Feminino';
  if (genero === 'O') return 'Outro / Não informar';
  return 'Não informado';
}

function getPlanoSaudeDisplay(idoso) {
    if (!idoso || !idoso.plano_saude) return 'Não informado';
    if (idoso.plano_saude === 'OUT') return idoso.plano_saude_outro || 'Outro';
    const planos = { 'BRA': 'Bradesco Saúde', 'UNI': 'Unimed' };
    return planos[idoso.plano_saude];
}

// --- Componente Principal ---
function Dados({ route, navigation }) {
  const { idosoId } = route.params;

  const [idoso, setIdoso] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Função para buscar os dados do idoso na API
useFocusEffect(
  useCallback(() => {
    // 1. A função que o hook recebe NÃO é async.
    
    // 2. Definimos nossa função async AQUI DENTRO.
    const fetchData = async () => {
      if (!idosoId) {
        setErro("ID do idoso não fornecido.");
        setCarregando(false);
        return;
      }
      try {
        setCarregando(true);
        const token = await AsyncStorage.getItem('authToken');
        const groupId = await AsyncStorage.getItem('selectedGroupId');
        if (!token || !groupId) throw new Error("Sessão inválida.");

        const response = await axios.get(`${baseURL}/api/grupos/${groupId}/idosos/${idosoId}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });

        setIdoso(response.data);
        setErro(null);
      } catch (err) {
        console.error("Erro ao buscar dados do idoso:", err.response?.data || err.message);
        setErro("Não foi possível carregar os dados do idoso.");
      } finally {
        setCarregando(false);
      }
    };

    // 3. Chamamos a função async que acabamos de criar.
    fetchData();

  }, [idosoId]) // A dependência do useCallback continua sendo o idosoId
);

  const handleDeletePrescricao = (prescricaoId) => {
    const deleteAction = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const groupId = await AsyncStorage.getItem('selectedGroupId');
            await axios.delete(`${baseURL}/api/grupos/${groupId}/prescricoes/${prescricaoId}/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            Alert.alert("Sucesso", "Prescrição removida.");
            fetchIdosoData(); // Força a re-busca dos dados para atualizar a lista
        } catch (error) {
            Alert.alert("Erro", "Não foi possível remover a prescrição.");
        }
    };
    // Lógica de Alerta compatível com Web e Mobile
    if (Platform.OS === 'web') {
        if(window.confirm("Tem certeza que deseja remover esta prescrição?")) {
            deleteAction();
        }
    } else {
        Alert.alert("Remover Prescrição", "Tem certeza que deseja remover esta prescrição?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Remover", style: "destructive", onPress: deleteAction }
        ]);
    }
  };

  // Renderização de estados de carregamento e erro
  if (carregando) {
    return <SafeAreaView style={styles.safeArea}><ActivityIndicator size="large" color="#fff" /></SafeAreaView>;
  }
  if (erro) {
    return <SafeAreaView style={styles.safeArea}><Text style={styles.noDataText}>{erro}</Text></SafeAreaView>;
  }
  if (!idoso) {
    return <SafeAreaView style={styles.safeArea}><Text style={styles.noDataText}>Dados não encontrados.</Text></SafeAreaView>;
  }

  // Renderização principal do perfil
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.profileHeader}>
          <View style={styles.profileNameContainer}>
            <Text style={styles.profileName}>{idoso.nome_completo}</Text>
            <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditarIdoso', { idoso: idoso })}>
              <Ionicons name="pencil" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Idade:</Text><Text style={styles.infoValue}>{calcularIdade(idoso.data_nascimento)} anos</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Nascimento:</Text><Text style={styles.infoValue}>{idoso.data_nascimento ? new Date(idoso.data_nascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : "Não informada"}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Gênero:</Text><Text style={styles.infoValue}>{getGeneroDisplay(idoso.genero)}</Text></View>
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Documentos</Text>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>CPF:</Text><Text style={styles.infoValue}>{idoso.cpf || "Não informado"}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>RG:</Text><Text style={styles.infoValue}>{idoso.rg || "Não informado"}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Cartão SUS:</Text><Text style={styles.infoValue}>{idoso.cartao_sus || "Não informado"}</Text></View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Plano de Saúde</Text>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Possui plano?</Text><Text style={styles.infoValue}>{idoso.possui_plano_saude ? 'Sim' : 'Não'}</Text></View>
          {idoso.possui_plano_saude && (
            <>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Plano:</Text><Text style={styles.infoValue}>{getPlanoSaudeDisplay(idoso)}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Nº Carteirinha:</Text><Text style={styles.infoValue}>{idoso.numero_carteirinha_plano || "Não informado"}</Text></View>
            </>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Condições Médicas</Text>
          <View><Text style={styles.infoLabel}>Doenças:</Text><Text style={styles.infoValue}>{idoso.doencas || "Nenhuma informada"}</Text></View>
          <View style={{marginTop: 10}}><Text style={styles.infoLabel}>Alergias:</Text><Text style={styles.infoValue}>{idoso.condicoes || "Nenhuma conhecida"}</Text></View>
        </View>

        <View style={styles.infoCard}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Prescrições</Text>
                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => navigation.navigate('CadastroPrescricao', { idosoId: idoso.id })}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
            {idoso.prescricoes && idoso.prescricoes.length > 0 ? idoso.prescricoes.map(p => (
                <View key={p.id} style={styles.prescricaoCard}>
                    <View style={{flex: 1}}>
                        <Text style={styles.prescricaoMedicamento}>{p.medicamento.nome_marca}</Text>
                        <Text style={styles.prescricaoDetalhe}>{p.dosagem} - às {p.horario_previsto.substring(0, 5)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('EditarPrescricao', { prescricao: p, idosoId: idoso.id })} style={styles.actionIcon}>
                        <Ionicons name="pencil-outline" size={22} color="#3498db" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeletePrescricao(p.id)} style={styles.actionIcon}>
                        <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                    </TouchableOpacity>
                </View>
            )) : (
                <Text style={styles.noDataTextSmall}>Nenhuma prescrição cadastrada.</Text>
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
    container: { flex: 1 },
    profileHeader: { alignItems: 'center', padding: 20, backgroundColor: '#2c3e50'},
    profileNameContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    profileName: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    editButton: { marginLeft: 15, padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
    infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1, }, shadowOpacity: 0.22, shadowRadius: 2.22, elevation: 3, },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ecf0f1', paddingBottom: 8, marginBottom: 8 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    infoRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
    infoLabel: { fontSize: 16, fontWeight: '600', color: '#34495e', width: '40%' },
    infoValue: { fontSize: 16, color: '#2c3e50', flex: 1 },
    addButton: { backgroundColor: '#27ae60', padding: 6, borderRadius: 20 },
    prescricaoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8, marginTop: 10 },
    prescricaoMedicamento: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
    prescricaoDetalhe: { fontSize: 14, color: '#7f8c8d' },
    actionIcon: { padding: 8, marginLeft: 8 },
    noDataText: { fontSize: 18, color: '#2c3e50', textAlign: 'center', marginTop: 50, paddingHorizontal: 20 },
    noDataTextSmall: { fontSize: 14, color: '#7f8c8d', fontStyle: 'italic', textAlign: 'center', paddingVertical: 10 },
});

export default Dados;