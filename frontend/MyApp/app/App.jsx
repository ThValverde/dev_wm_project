// App.jsx

import 'react-native-gesture-handler';
import React from 'react';
// ALTERAÇÃO: Importar CommonActions para a ação de reset
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerItemList } from '@react-navigation/drawer'; 
import { Alert, TouchableOpacity, View, Text, Platform } from 'react-native'; // Platform já estava aqui
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Importação das suas telas (pages) ---
import Login from '../pages/Login';
import Cadastro from '../pages/Cadastro';
import Inicio from '../pages/Inicio';
import Estoque from '../pages/Estoque';
import Horario from '../pages/Horario';
import Dados from '../pages/Dados';
import SelecionarLar from '../pages/SelecionarLar';
import CriarLar from '../pages/CriarLar';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Componente para renderizar o conteúdo customizado do menu lateral
function CustomDrawerContent(props) {
  return (
    <View style={{ flex: 1 }}>
      {/* Renderiza os links padrões (Início, Estoque, etc.) */}
      <DrawerItemList {...props} />
      
      {/* NOVO: Botão para retornar à tela de seleção de lar */}
      <TouchableOpacity
        style={{ paddingHorizontal: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#eee' }}
        onPress={() => {
          // Reseta a pilha de navegação para a tela SelecionarLar
          props.navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'SelecionarLar' }],
            })
          );
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="swap-horizontal-outline" size={22} color="#333" />
          <Text style={{ marginLeft: 30, fontWeight: 'bold', color: '#333' }}>
            Trocar de Lar
          </Text>
        </View>
      </TouchableOpacity>

      {/* Botão customizado de Sair (com a sua correção para web) */}
      <TouchableOpacity
        style={{ padding: 20 }}
        onPress={async () => {
          const logout = async () => {
            await AsyncStorage.multiRemove(['authToken', 'selectedGroupId']);
            // A ação de reset leva o usuário para a tela de Login
            props.navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              })
            );
          };

          if (Platform.OS === 'web') {
            if (window.confirm('Tem certeza que deseja sair do aplicativo?')) {
              await logout();
            }
          } else {
            Alert.alert(
              'Sair',
              'Tem certeza que deseja sair do aplicativo?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { 
                  text: 'Sair', 
                  style: 'destructive',
                  onPress: logout
                }
              ]
            );
          }
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="log-out-outline" size={22} color="#333" />
          <Text style={{ marginLeft: 30, fontWeight: 'bold', color: '#333' }}>
            Sair
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}


function MainDrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Início"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#2c3e50' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Drawer.Screen name="Início" component={Inicio} />
      <Drawer.Screen name="Estoque" component={Estoque} />
      <Drawer.Screen name="Horários" component={Horario} />
    </Drawer.Navigator>
  );
}

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }} 
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Cadastro" component={Cadastro} />
        <Stack.Screen name="SelecionarLar" component={SelecionarLar} />
        <Stack.Screen 
          name="CriarLar" 
          component={CriarLar}
        />
        <Stack.Screen
          name="Main"
          component={MainDrawerNavigator}
        />
        <Stack.Screen 
          name="Dados" 
          component={Dados}
          options={{ 
            headerShown: true,
            title: 'Detalhes do Idoso',
            headerStyle: { backgroundColor: '#2c3e50' },
            headerTintColor: '#fff',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;