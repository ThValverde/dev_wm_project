import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import SearchBar from '../components/SearchBar';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../config/api';

function ListaDeIdosos({ idosos, navigation }) {
  // Se a lista de idosos estiver vazia, mostra a mensagem
  if (idosos.length === 0) {
    return <Text style={styles.infoText}>Nenhum idoso cadastrado neste grupo.</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.grid}>
        {idosos.map((idoso) => (
          <TouchableOpacity
            key={idoso.id}
            style={styles.card}
            onPress={() =>
              navigation.navigate('Dados',
                {idoso: idoso })
            }
          >
            {/* Imagem padrão, adicionar foto a idoso */}
            <Image
              source={{ uri: `https://avatar.iran.liara.run/public/boy?username=${idoso.nome_completo}` }}
              style={styles.image}
            />
            <Text style={styles.nome}>{idoso.nome_completo}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// Componente principal da tela
function Inicio({ navigation }) {
  // Estados para armazenar os dados, o status de carregamento e os erros
  const [idosos, setIdosos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const buscarIdosos = async () => {
      try {
        // 1. Pega o token salvo no dispositivo durante o login
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          throw new Error('Token de autenticação não encontrado. Faça o login novamente.');
        }

        // 2. Faz a requisição GET para a API, enviando o token no cabeçalho (Header)
        const response = await axios.get(`${baseURL}/api/idosos/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });

        // 3. Salva a lista de idosos recebida no estado do componente
        setIdosos(response.data);

      } catch (err) {
        console.error("Erro ao buscar idosos:", err.response ? err.response.data : err.message);
        setErro('Não foi possível carregar os dados dos idosos.');
      } finally {
        setCarregando(false);
      }
    };

    buscarIdosos();
  }, []); // O array vazio [] garante que esta função rode apenas uma vez quando a tela montar

  // Função para renderizar o conteúdo principal
  const renderContent = () => {
    if (carregando) {
      return <ActivityIndicator size="large" color="#2c3e50" style={{ marginTop: 50 }} />;
    }
    if (erro) {
      return <Text style={styles.infoText}>{erro}</Text>;
    }
    return <ListaDeIdosos idosos={idosos} navigation={navigation} />;
  };
  
  return (
    <View style={styles.appContainer}>
      <SearchBar />
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {renderContent()}
      </View>
    </View>
  );
}

// Estilos (mantidos e com pequenas adições)
const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    margin: 8,
    alignItems: 'center',
    width: 140,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
    backgroundColor: '#e0e0e0',
  },
  nome: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
  },
  infoText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#7f8c8d',
  },
});

export default Inicio;