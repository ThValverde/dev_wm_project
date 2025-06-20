// src/components/CustomDrawerContent.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Em um app real, você buscaria esses dados da API ou de um estado global
const useUserData = () => {
    // Simulação de dados do usuário
    const [isAdmin, setIsAdmin] = useState(true); // Mude para false para testar
    const [hasGroup, setHasGroup] = useState(false); // Mude para true para testar

    // Você pode adicionar um useEffect para buscar dados reais da API aqui
    
    return { isAdmin, hasGroup };
}

function CustomDrawerContent(props) {
  const { isAdmin, hasGroup } = useUserData();

  const handleLogout = async () => {
    await AsyncStorage.removeItem('authToken'); // Limpa o token
    props.navigation.navigate('Login'); // Redireciona para o Login
  };

  return (
    <View style={{flex: 1}}>
      <DrawerContentScrollView {...props}>
        {/* Itens padrão do menu, se houver */}
        <DrawerItemList {...props} />

        {/* Itens customizados */}
        <DrawerItem
          label="Meu Perfil"
          icon={({color, size}) => <Ionicons name="person-circle-outline" size={size} color={color} />}
          onPress={() => { /* Navegar para a tela de perfil */ }}
        />
        <DrawerItem
          label="Configurações"
          icon={({color, size}) => <Ionicons name="settings-outline" size={size} color={color} />}
          onPress={() => { /* Navegar para a tela de configurações */ }}
        />

        {/* Itens Condicionais */}
        {isAdmin && (
           <DrawerItem
            label="Gerenciar Grupo"
            icon={({color, size}) => <Ionicons name="people-outline" size={size} color={color} />}
            onPress={() => { /* Navegar para a tela de gerenciamento */ }}
          />
        )}

        {!hasGroup && (
           <DrawerItem
            label="Entrar em um Grupo"
            icon={({color, size}) => <Ionicons name="log-in-outline" size={size} color={color} />}
            onPress={() => { /* Navegar para a tela de entrar em grupo */ }}
          />
        )}

      </DrawerContentScrollView>

      {/* Botão de Sair no final */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleLogout} style={{paddingVertical: 15}}>
          <View style={{flexDirection: 'row', alignItems: 'center', marginLeft: 20}}>
            <Ionicons name="exit-outline" size={22} />
            <Text style={{marginLeft: 15, fontWeight: 'bold'}}>Sair</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    footer: {
        borderTopColor: '#ccc',
        borderTopWidth: 1,
    }
});

export default CustomDrawerContent;