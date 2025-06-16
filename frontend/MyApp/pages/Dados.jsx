import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';



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
    // Se o plano for 'Outro', mostra o que foi digitado no campo 'plano_saude_outro'.
    if (idoso.plano_saude === 'OUT') {
        return idoso.plano_saude_outro || 'Outro (não especificado)';
    }
    // Para os outros, pode-se criar um mapa para exibir o nome completo.
    const planos = {
        'BRA': 'Bradesco Saúde',
        'UNI': 'Unimed',
    };
    return planos[idoso.plano_saude] || 'Não informado';
}


function Dados({ route, navigation }) {
  const { idoso } = route.params;

  if (!idoso) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <Text style={styles.noDataText}>Erro ao carregar dados do idoso.</Text>
        </SafeAreaView>
    );
  }

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
            source={{ uri: `https://avatar.iran.liara.run/public/boy?username=${idoso.nome_completo}` }} 
            style={styles.profileImage} 
          />
          <Text style={styles.profileName}>{idoso.nome_completo}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Idade:</Text>
            <Text style={styles.infoValue}>{calcularIdade(idoso.data_nascimento)} anos</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data de Nascimento:</Text>
            <Text style={styles.infoValue}>{idoso.data_nascimento ? new Date(idoso.data_nascimento).toLocaleDateString('pt-BR') : "Não informada"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gênero:</Text>
            <Text style={styles.infoValue}>{getGeneroDisplay(idoso.genero)}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Documentos</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CPF:</Text>
            <Text style={styles.infoValue}>{idoso.cpf || "Não informado"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>RG:</Text>
            <Text style={styles.infoValue}>{idoso.rg || "Não informado"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cartão SUS:</Text>
            <Text style={styles.infoValue}>{idoso.cartao_sus || "Não informado"}</Text>
          </View>
        </View>


        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Plano de Saúde</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Possui plano?</Text>
            <Text style={styles.infoValue}>{idoso.possui_plano_saude ? 'Sim' : 'Não'}</Text>
          </View>
          
        /* A lógica abaixo mostra os detalhes do plano APENAS SE possui_plano_saude for true */
          {idoso.possui_plano_saude && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Plano:</Text>
                <Text style={styles.infoValue}>{getPlanoSaudeDisplay(idoso)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nº Carteirinha:</Text>
                <Text style={styles.infoValue}>{idoso.numero_carteirinha_plano || "Não informado"}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Condições Médicas</Text>
          <View>
            <Text style={styles.infoLabel}>Doenças Pré-existentes:</Text>
            <Text style={styles.infoValue}>{idoso.doencas || "Nenhuma informada"}</Text>
          </View>
          <View style={{marginTop: 10}}>
            <Text style={styles.infoLabel}>Alergias e Condições:</Text>
            <Text style={styles.infoValue}>{idoso.condicoes || "Nenhuma conhecida"}</Text>
          </View>
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
      backgroundColor: '#e0e0e0',
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
      alignItems: 'flex-start',
    },
    infoLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#34495e',
      width: '45%',
    },
    infoValue: {
      fontSize: 16,
      color: '#2c3e50',
      flex: 1,
    },
    noDataText: {
      fontSize: 16,
      color: '#7f8c8d',
      fontStyle: 'italic',
      textAlign: 'center'
    },
});

export default Dados;