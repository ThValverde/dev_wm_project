import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// É importante usar o SafeAreaView desta biblioteca para melhor integração com a navegação
import { SafeAreaView } from 'react-native-safe-area-context';

// Em um app real, você buscaria esses dados do estado global (Context/Redux) ou da API
// Esta simulação ajuda a visualizar como o menu se comportaria com diferentes permissões
const useUserData = () => {
    const [isAdmin, setIsAdmin] = useState(true); // Mude para false para testar como membro
    const [hasGroup, setHasGroup] = useState(true); // Mude para false para testar sem grupo

    return { isAdmin, hasGroup };
};

function CustomDrawerContent(props) {
  const { isAdmin, hasGroup } = useUserData();

  const handleLogout = async () => {
    // Limpa os dados de autenticação e redireciona para a tela de Login
    await AsyncStorage.multiRemove(['authToken', 'selectedGroupId', 'userData', 'isCurrentUserAdmin']);
    props.navigation.navigate('Login'); 
  };

  return (
    // 1. SafeAreaView garante que o conteúdo não fique sob a barra de status do celular
    <SafeAreaView style={{flex: 1}} edges={['top', 'bottom']}>
      
      {/* 2. DrawerContentScrollView permite a rolagem dos itens do menu */}
      <DrawerContentScrollView 
        {...props}
        contentContainerStyle={{ paddingTop: 0 }} // Removemos o padding, pois o cabeçalho cuidará disso
      >
      <View style={{
        height: 50,
        backgroundColor: 'transparent'
      }} />
        {/* Cabeçalho personalizado */}
        <View style={styles.headerContainer}>
          <Ionicons name="medkit" size={40} color="#3498db" />
          <Text style={styles.appName}>MediCare</Text>
          <Text style={styles.version}>v1.0.2</Text>
        </View>

        {/* DrawerItemList renderiza os itens que você definiu no App.jsx */}
        <DrawerItemList {...props} />

        {/* Aqui você pode adicionar outros itens customizados que não estão no App.jsx */}
        {/* Exemplo de item condicional para administradores */}
        {isAdmin && (
           <DrawerItem
            label="Gerenciar Membros"
            labelStyle={styles.customItemLabel}
            icon={({color, size}) => <Ionicons name="people-outline" size={size} color={color} />}
            onPress={() => { /* Navegar para a tela de gerenciamento de membros */ }}
          />
        )}
      </DrawerContentScrollView>

      {/* 4. Rodapé fixo com o botão de Sair */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <View style={styles.logoutButtonContent}>
            <Ionicons name="exit-outline" size={22} color="#c0392b" />
            <Text style={styles.logoutButtonText}>Sair</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    // Novo estilos para o cabeçalho
    headerContainer: {
        padding: 20,
        paddingTop: 50, // Aumente para um valor muito maior
        marginTop: 30,   // Adicione uma margem extra no topo
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#f9f9f9',
        alignItems: 'center'
    },
    appName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#3498db',
        marginTop: 8,
        marginBottom: 5
    },
    version: {
        fontSize: 12,
        color: '#95a5a6'
    },
    // Estilos existentes
    footer: {
        borderTopColor: '#e0e0e0',
        borderTopWidth: 1,
        padding: 10,
    },
    logoutButton: {
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    logoutButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoutButtonText: {
        marginLeft: 15,
        fontWeight: 'bold',
        color: '#c0392b',
        fontSize: 15,
    },
    customItemLabel: {
        fontWeight: 'bold',
        color: '#333'
    }
});

export default CustomDrawerContent;