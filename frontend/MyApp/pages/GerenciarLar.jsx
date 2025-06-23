import React, { useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    Alert, 
    ActivityIndicator,
    ScrollView 
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

const GerenciarLar = () => {
  const [membros, setMembros] = useState([]);
  const [adminId, setAdminId] = useState(null);
  const [grupoInfo, setGrupoInfo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const navigation = useNavigation();

  const buscarDados = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const groupId = await AsyncStorage.getItem('selectedGroupId');
      
      if (!token || !groupId) {
        throw new Error("Sessão inválida.");
      }
      
      const grupoResponse = await axios.get(`${baseURL}/api/grupos/${groupId}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setGrupoInfo(grupoResponse.data);
      setAdminId(grupoResponse.data.admin.id);
      
      const membrosResponse = await axios.get(`${baseURL}/api/grupos/${groupId}/usuarios/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      const membrosList = Array.isArray(membrosResponse.data) ? membrosResponse.data : membrosResponse.data.results;
      setMembros(membrosList || []);

    } catch (err) {
      console.error("Erro ao buscar dados do lar:", err.response?.data || err.message);
      setErro('Não foi possível carregar os dados. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      buscarDados();
    }, [])
  );

  const handleRemoverMembro = (membro) => {
    Alert.alert(
      "Confirmar Remoção",
      `Tem certeza que deseja remover ${membro.user.nome_completo} do lar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              const groupId = await AsyncStorage.getItem('selectedGroupId');
              await axios.post(`${baseURL}/api/grupos/${groupId}/remover-membro/`, 
                { user_id: membro.user.id },
                { headers: { 'Authorization': `Token ${token}` } }
              );
              Alert.alert('Sucesso', 'Membro removido.');
              buscarDados();
            } catch (error) {
              console.error("Erro ao remover membro:", error.response?.data || error.message);
              Alert.alert('Erro', error.response?.data?.detail || 'Não foi possível remover o membro.');
            }
          }
        }
      ]
    );
  };

  const handleDeletarLar = () => {
    Alert.alert(
      "Deletar Lar Permanentemente",
      "Esta ação é irreversível e irá apagar todos os dados associados a este lar (idosos, medicamentos, logs, etc.).\n\nTem certeza absoluta que deseja continuar?",
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sim, Deletar Tudo', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              const groupId = await AsyncStorage.getItem('selectedGroupId');
              await axios.delete(`${baseURL}/api/grupos/${groupId}/`, {
                headers: { 'Authorization': `Token ${token}` }
              });
              
              await AsyncStorage.multiRemove(['selectedGroupId', 'isCurrentUserAdmin']);

              Alert.alert('Lar Deletado', 'O lar foi removido com sucesso.');
              navigation.navigate('SelecionarLar');
            } catch (error) {
              // Log do erro completo para depuração
              console.error("Erro completo ao deletar o lar:", error.response || error);

              // Prepara uma mensagem de erro amigável para o usuário
              let errorMessage = 'Não foi possível deletar o lar.';

              if (error.response) {
                // Verifica se a resposta do erro é um HTML (indicando um erro de servidor)
                if (typeof error.response.data === 'string' && error.response.data.trim().startsWith('<!DOCTYPE')) {
                  errorMessage = 'Ocorreu um erro inesperado no servidor. A ação não pôde ser concluída.';
                } 
                // Verifica se a API retornou uma mensagem de erro JSON específica
                else if (error.response.data && error.response.data.detail) {
                  errorMessage = error.response.data.detail;
                }
              } else {
                // Lida com erros de conexão onde não há resposta do servidor
                errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
              }

              Alert.alert('Erro ao Deletar', errorMessage);
            }
          }
        }
      ]
    );
  };
  
  if (carregando) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2c3e50" /></View>;
  }

  if (erro) {
    return <View style={styles.centered}><Text style={styles.errorText}>{erro}</Text></View>;
  }

  const renderMembro = ({ item }) => (
    <View style={styles.membroItem}>
      <View style={styles.membroInfo}>
        <Text style={styles.membroNome}>{item.user.nome_completo}</Text>
        <Text style={styles.membroEmail}>{item.user.email}</Text>
        {item.user.id === adminId && <Text style={styles.adminTag}>Admin</Text>}
      </View>
      {item.user.id !== adminId && (
        <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoverMembro(item)}>
          <Ionicons name="trash-bin-outline" size={24} color="#e74c3c" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Membros do Lar</Text>
      <Text style={styles.headerSubtitle}>{grupoInfo?.nome}</Text>
      
      <FlatList
        data={membros}
        renderItem={renderMembro}
        keyExtractor={item => item.user.id.toString()}
        ListEmptyComponent={<Text style={styles.infoText}>Nenhum membro encontrado.</Text>}
        scrollEnabled={false}
      />

      <View style={styles.separator} />

      <View style={styles.dangerZone}>
        <Text style={styles.dangerZoneTitle}>Zona de Perigo</Text>
        <TouchableOpacity style={styles.deleteLarButton} onPress={handleDeletarLar}>
          <Text style={styles.deleteLarButtonText}>Deletar este Lar</Text>
        </TouchableOpacity>
        <Text style={styles.dangerZoneWarning}>
          Esta ação não pode ser desfeita. Todos os dados serão perdidos.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9', padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center' },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#2c3e50', marginBottom: 5 },
  headerSubtitle: { fontSize: 18, color: '#7f8c8d', marginBottom: 20 },
  membroItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  membroInfo: { flex: 1 },
  membroNome: { fontSize: 16, fontWeight: '600', color: '#34495e' },
  membroEmail: { fontSize: 14, color: '#95a5a6' },
  adminTag: { color: '#27ae60', fontWeight: 'bold', fontSize: 12, marginTop: 4 },
  removeButton: { padding: 5 },
  infoText: { textAlign: 'center', marginTop: 20, color: '#7f8c8d' },
  separator: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 30 },
  dangerZone: { borderWidth: 2, borderColor: '#e74c3c', borderRadius: 10, padding: 15, backgroundColor: '#fff5f5' },
  dangerZoneTitle: { fontSize: 20, fontWeight: 'bold', color: '#c0392b', marginBottom: 15 },
  deleteLarButton: { backgroundColor: '#e74c3c', padding: 15, borderRadius: 8, alignItems: 'center' },
  deleteLarButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  dangerZoneWarning: { textAlign: 'center', color: '#c0392b', marginTop: 15, fontSize: 12 }
});

export default GerenciarLar;
