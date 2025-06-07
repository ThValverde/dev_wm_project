import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import SearchBar from '../components/SearchBar';

function IdososUnsplash() {
  const [imagens, setImagens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.unsplash.com/search/photos?query=elderly&per_page=15&client_id=DBYn6-SZGTYN3T2xUJuRwa-_jvQ3FF3WCwAc5HBJL5Y')
      .then(res => res.json())
      .then(data => {
        setImagens(data.results);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c3e50" />
        <Text style={styles.loadingText}>Carregando imagens...</Text>
      </View>
    );
  }

  const nomes = [
    { nome: "Seu Antônio", comorbidade: "Hipertensão" },
    { nome: "Seu João", comorbidade: "Diabetes" },
    { nome: "Dona Ana", comorbidade: "Artrose" },
    { nome: "Seu José", comorbidade: "Alzheimer" },
    { nome: "Dona Rosa", comorbidade: "Osteoporose" },
    { nome: "Seu Pedro", comorbidade: "Parkinson" },
    { nome: "Dona Lúcia", comorbidade: "Cardiopatia" },
    { nome: "Dona Maria", comorbidade: "Hipertensão" },
    { nome: "Seu Carlos", comorbidade: "Diabetes" },
    { nome: "Dona Helena", comorbidade: "Artrose" },
    { nome: "Dona Francisca", comorbidade: "Alzheimer" },
    { nome: "Seu Manoel", comorbidade: "Osteoporose" },
    { nome: "Dona Rita", comorbidade: "Parkinson" },
    { nome: "Seu Paulo", comorbidade: "Cardiopatia" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.grid}>
        {imagens.map((img, idx) => (
          <View key={img.id} style={styles.card}>
            <Image
              source={{ uri: img.urls.small }}
              style={styles.image}
              resizeMode="cover"
            />
            <Text style={styles.nome}>{nomes[idx]?.nome || 'Idoso'}</Text>
            <Text style={styles.comorbidade}>{nomes[idx]?.comorbidade || ''}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Inicio() {
  return (
    <View style={styles.appContainer}>
      <SearchBar />
      <IdososUnsplash />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
  },
  card: {
    width: 150,
    margin: 8,
    backgroundColor: '#f1f1f1',
    borderRadius: 12,
    alignItems: 'center',
    padding: 12,
    elevation: 2,
  },
  image: {
    width: 120,
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
  },
  nome: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 2,
  },
  comorbidade: {
    fontSize: 14,
    color: '#555',
  },
});


export default Inicio;