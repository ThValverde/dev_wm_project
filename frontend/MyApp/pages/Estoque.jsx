import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import SearchBar from '../components/SearchBar';

const medicamentos = [
  { nome: 'Bromoprida', quantidade: 12, VolMassa: '12 mL', Preco: 'R$499,99' },
  { nome: 'Amoxicilina', quantidade: 32, VolMassa: '280 mL', Preco: 'R$10,99' },
  { nome: 'Dipirona', quantidade: 20, VolMassa: '600 mg', Preco: 'R$8,99' },
  { nome: 'Buscopan', quantidade: 13, VolMassa: '30 mL', Preco: 'R$20,00' },
  { nome: 'Benegrip', quantidade: 1, VolMassa: '50 mL', Preco: 'R$40,99' },
  { nome: 'Insulina', quantidade: 5, VolMassa: '50 mL', Preco: 'R$40,99' },
  { nome: 'Paracetamol', quantidade: 6, VolMassa: '200 mg', Preco: 'R$9,99' },
  { nome: 'Ibuprofeno', quantidade: 8, VolMassa: '400 mg', Preco: 'R$15,99' },
  { nome: 'Carbamazepina', quantidade: 7, VolMassa: '200 mg', Preco: 'R$1250,00' },  
  // ...adicione mais se necessário
];

function Estoque() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estoque de Medicamentos</Text>
      <SearchBar />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {medicamentos.map((med, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.medName}>{med.nome}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Quantidade:</Text>
              <Text style={styles.value}>{med.quantidade}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Vol/Massa:</Text>
              <Text style={styles.value}>{med.VolMassa}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Preço:</Text>
              <Text style={styles.value}>{med.Preco}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
    padding: 16,
  },
  title: {
    color: '#f4f4f4',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  medName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#232946',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: '#232946',
    fontWeight: '600',
    fontSize: 16,
  },
  value: {
    color: '#393e46',
    fontSize: 16,
  },
});

export default Estoque;