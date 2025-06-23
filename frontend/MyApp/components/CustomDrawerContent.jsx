import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const useUserData = () => {
    const [isAdmin, setIsAdmin] = useState(true); 
    const [hasGroup, setHasGroup] = useState(true); 

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
        contentContainerStyle={{ paddingTop: 0 }} 
      >
      <View style={{
        height: 50,
        backgroundColor: 'transparent'
      }} />
        {/* Cabeçalho*/}
        <View style={styles.headerContainer}>
          <Ionicons name="medkit" size={40} color="#3498db" />
          <Text style={styles.appName}>MediCare</Text>
          <Text style={styles.version}>v1.0.2</Text>
        </View>

        {/* DrawerItemList renderiza os itens definidos no App.jsx */}
        <DrawerItemList {...props} />

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

    headerContainer: {
        padding: 20,
        paddingTop: 50, 
        marginTop: 30,   
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
