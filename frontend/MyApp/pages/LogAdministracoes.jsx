import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, ActivityIndicator, Alert, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

// Função para agrupar os logs por data
const groupLogsByDate = (logs) => {
  return logs.reduce((acc, log) => {
    const date = new Date(log.data_hora_administracao).toLocaleDateString('pt-BR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {});
};

// Componente para os controles de paginação
const PaginationControls = ({ onNext, onPrevious, hasNext, hasPrevious }) => (
    <View style={styles.paginationContainer}>
        <TouchableOpacity onPress={onPrevious} disabled={!hasPrevious} style={[styles.paginationButton, !hasPrevious && styles.disabledButton]}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.paginationText}>Anteriores</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext} disabled={!hasNext} style={[styles.paginationButton, !hasNext && styles.disabledButton]}>
            <Text style={styles.paginationText}>Próximos</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
    </View>
);

export default function LogAdministracoes() {
  const [logsAgrupados, setLogsAgrupados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [previousPageUrl, setPreviousPageUrl] = useState(null);
  
  const fetchLogs = async (url) => {
    try {
      setCarregando(true);
      const token = await AsyncStorage.getItem('authToken');
      const groupId = await AsyncStorage.getItem('selectedGroupId');
      if (!token || !groupId) throw new Error("Sessão inválida");

      const response = await axios.get(url, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      const grouped = groupLogsByDate(response.data.results);
      const sections = Object.keys(grouped).map(date => ({
        title: date,
        data: grouped[date]
      }));
      
      setLogsAgrupados(sections);
      setNextPageUrl(response.data.next);
      setPreviousPageUrl(response.data.previous);

    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar o histórico de administrações.");
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const getInitialLogs = async () => {
          const groupId = await AsyncStorage.getItem('selectedGroupId');
          if (groupId) {
              const initialUrl = `${baseURL}/api/grupos/${groupId}/logs/`;
              fetchLogs(initialUrl);
          } else {
              setCarregando(false);
          }
      }
      getInitialLogs();
    }, [])
  );

  const getStatusInfo = (status) => {
    switch(status) {
        case 'OK': return { text: 'Administrado', color: '#27ae60', icon: 'checkmark-circle' };
        case 'REC': return { text: 'Recusado', color: '#e74c3c', icon: 'close-circle' };
        case 'PUL': return { text: 'Pulado', color: '#f39c12', icon: 'alert-circle' };
        default: return { text: 'Desconhecido', color: '#7f8c8d', icon: 'help-circle' };
    }
  };

const handleDeleteLog = (logIdToDelete) => {
    const deleteAction = async () => {
      try {
        setCarregando(true); // Inicia o carregamento para feedback visual
        const token = await AsyncStorage.getItem('authToken');
        const groupId = await AsyncStorage.getItem('selectedGroupId');

        // 1. Deleta o registro no servidor
        await axios.delete(`${baseURL}/api/grupos/${groupId}/logs/${logIdToDelete}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        
        // 2. Exibe a mensagem de sucesso
        Alert.alert("Sucesso", "O registro foi excluído.");

        // 3. Recarrega os dados para atualizar a interface
        // Isso garante que a lista estará sempre sincronizada com o servidor.
        // A paginação retornará para a primeira página.
        const initialUrl = `${baseURL}/api/grupos/${groupId}/logs/`;
        await fetchLogs(initialUrl);

      } catch (error) {
        // Em caso de erro, exibe uma mensagem clara
        const errorMessage = error.response?.data?.detail || "Não foi possível excluir o registro.";
        Alert.alert("Erro", errorMessage);
        setCarregando(false); // Garante que o loading seja desativado em caso de erro
      }
      // A própria função fetchLogs já desativa o 'carregando' em caso de sucesso
    };

    // Lógica de confirmação (sem alterações)
    if (Platform.OS === 'web') {
        if(window.confirm("Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.")) {
            deleteAction();
        }
    } else {
        Alert.alert("Excluir Registro", "Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.", [
            { text: "Cancelar", style: "cancel" },
            { text: "Excluir", style: "destructive", onPress: deleteAction }
        ]);
    }
  };
  
  const renderItem = ({ item }) => {
    const statusInfo = getStatusInfo(item.status);
    const nomeMedicamento = item.prescricao?.medicamento?.nome_marca || 'Medicamento não encontrado';
    const nomeIdoso = item.prescricao?.idoso || 'Paciente não encontrado';

    return (
        <View style={styles.logCard}>
            <View style={styles.logHeader}>
                <Text style={styles.logTime}>{new Date(item.data_hora_administracao).toLocaleTimeString('pt-BR').substring(0, 5)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                    <Ionicons name={statusInfo.icon} size={14} color="#fff" />
                    <Text style={styles.statusText}>{statusInfo.text}</Text>
                </View>
            </View>
            <Text style={styles.logDetail}><Text style={styles.bold}>Medicamento:</Text> {nomeMedicamento}</Text>
            <Text style={styles.logDetail}><Text style={styles.bold}>Paciente:</Text> {nomeIdoso}</Text>
            <Text style={styles.logDetail}><Text style={styles.bold}>Responsável:</Text> {item.usuario_responsavel || 'N/A'}</Text>
            {item.observacoes ? <Text style={styles.logDetail}><Text style={styles.bold}>Obs:</Text> {item.observacoes}</Text> : null}
            
            <TouchableOpacity onPress={() => handleDeleteLog(item.id)} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={20} color="#e74c3c" />
            </TouchableOpacity>
        </View>
    );
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Log de Administrações</Text>
        </View>
        {carregando ? (
            <ActivityIndicator size="large" color="#2c3e50" style={{flex: 1}}/>
        ) : (
            <View style={{flex: 1}}>
                <PaginationControls
                    onNext={() => fetchLogs(nextPageUrl)}
                    onPrevious={() => fetchLogs(previousPageUrl)}
                    hasNext={!!nextPageUrl}
                    hasPrevious={!!previousPageUrl}
                />
                <SectionList
                    sections={logsAgrupados}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    renderSectionHeader={renderSectionHeader}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={<Text style={styles.emptyText}>Nenhum registro de administração encontrado.</Text>}
                    ListFooterComponent={
                      logsAgrupados.length > 0 ? (
                        <PaginationControls
                            onNext={() => fetchLogs(nextPageUrl)}
                            onPrevious={() => fetchLogs(previousPageUrl)}
                            hasNext={!!nextPageUrl}
                            hasPrevious={!!previousPageUrl}
                        />
                      ) : null
                    }
                />
            </View>
        )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
    headerTitleContainer: {
        padding: 16,
        backgroundColor: '#2c3e50'
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center'
    },
    listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', backgroundColor: '#e9ecef', padding: 10, borderRadius: 8, marginTop: 16, marginBottom: 8 },
    logCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee', elevation: 1 },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    logTime: { fontSize: 16, fontWeight: 'bold', color: '#34495e' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
    logDetail: { fontSize: 14, color: '#333', marginTop: 4 },
    bold: { fontWeight: '600' },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#7f8c8d' },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    paginationButton: {
        flexDirection: 'row',
        backgroundColor: '#3498db',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#bdc3c7',
    },
    paginationText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginHorizontal: 8,
    },
    deleteButton: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        padding: 5,
    },
});