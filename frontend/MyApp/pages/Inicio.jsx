import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import SearchBar from '../components/SearchBar';

const imagens = [
  { id: 1, urls: { small: 'https://picsum.photos/200/300?random=1' } },
  { id: 2, urls: { small: 'https://picsum.photos/200/300?random=2' } },
  { id: 3, urls: { small: 'https://picsum.photos/200/300?random=3' } },
  { id: 4, urls: { small: 'https://picsum.photos/200/300?random=4' } },
  { id: 5, urls: { small: 'https://picsum.photos/200/300?random=5' } },
  { id: 6, urls: { small: 'https://picsum.photos/200/300?random=6' } },
  { id: 7, urls: { small: 'https://picsum.photos/200/300?random=7' } },
  { id: 8, urls: { small: 'https://picsum.photos/200/300?random=8' } },
  { id: 9, urls: { small: 'https://picsum.photos/200/300?random=9' } },
  { id: 10, urls: { small: 'https://picsum.photos/200/300?random=10' } },
  { id: 11, urls: { small: 'https://picsum.photos/200/300?random=11' } },
  { id: 12, urls: { small: 'https://picsum.photos/200/300?random=12' } },
  { id: 13, urls: { small: 'https://picsum.photos/200/300?random=13' } },
  { id: 14, urls: { small: 'https://picsum.photos/200/300?random=14' } },
  { id: 15, urls: { small: 'https://picsum.photos/200/300?random=15' } },
  // ...mais imagens
];

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

function IdososUnsplash({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.grid}>
        {Array.isArray(imagens) && imagens.map((img, idx) => {
          if (!img?.urls?.small) return null;
          return (
            <TouchableOpacity
              key={img.id}
              style={styles.card}
              onPress={() =>
                navigation.navigate('Dados', {
                  idoso: {
                    nome: nomes[idx]?.nome || 'Idoso',
                    comorbidade: nomes[idx]?.comorbidade || '',
                    imagem: { uri: img.urls.small },
                  },
                })
              }
            >
              <Image
                source={{ uri: img.urls.small }}
                style={styles.image}
                resizeMode="cover"
                onError={() => console.log('Erro ao carregar imagem', img.urls.small)}
              />
              <Text style={styles.nome}>{nomes[idx]?.nome || 'Idoso'}</Text>
              <Text style={styles.comorbidade}>{nomes[idx]?.comorbidade || ''}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

function Inicio({ navigation }) {
  return (
    <View style={styles.appContainer}>
      <SearchBar />
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <IdososUnsplash navigation={navigation} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
  },
  nome: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
  },
  comorbidade: {
    fontSize: 13,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});

export default Inicio;
