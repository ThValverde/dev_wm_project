import 'react-native-gesture-handler';
// Adicionado useState, useCallback, useFocusEffect
import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerItemList } from '@react-navigation/drawer'; 
import { Alert, TouchableOpacity, View, Text, Platform, Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Adicionado axios e baseURL para a chamada da API
import axios from 'axios';
import baseURL from '../config/api';

// --- Importação das suas telas (pages) ---
import Login from '../pages/Login';
import Cadastro from '../pages/Cadastro';
import Inicio from '../pages/Inicio';
import Estoque from '../pages/Estoque';
import Horario from '../pages/Horario';
import Dados from '../pages/Dados';
import SelecionarLar from '../pages/SelecionarLar';
import CriarLar from '../pages/CriarLar';
import CadastroIdoso from '../pages/CadastroIdoso';
import EditarIdoso from '../pages/EditarIdoso';
import DadosMedicamento from '../pages/DadosMedicamento';
import CadastroMedicamento from '../pages/CadastroMedicamento';
import EditarMedicamento from '../pages/EditarMedicamento';
import CadastroPrescricao from '../pages/CadastroPrescricao';
import EditarPrescricao from '../pages/EditarPrescricao';
import Administracao from '../pages/Administracao';
import LogAdministracoes from '../pages/LogAdministracoes';
import PerfilUsuario from '../pages/PerfilUsuario';
import GerenciarLar from '../pages/GerenciarLar';


const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Componente para renderizar o conteúdo customizado do menu lateral
function CustomDrawerContent(props) {
  // Estado para controlar a visibilidade dos botões de admin
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // useFocusEffect garante que a verificação de admin seja feita toda vez que o menu for aberto
  useFocusEffect(
    useCallback(() => {
      const checkAdminStatus = async () => {
        const status = await AsyncStorage.getItem('isCurrentUserAdmin');
        setIsUserAdmin(status === 'true');
      };
      checkAdminStatus();
    }, [])
  );
  
  // Função para buscar e exibir o código de acesso
  const handleGetAccessCode = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const groupId = await AsyncStorage.getItem('selectedGroupId');
      
      if (!token || !groupId) {
        Alert.alert('Erro', 'Token ou ID do grupo não encontrado');
        return;
      }
      
      const response = await axios.get(`${baseURL}/api/grupos/${groupId}/codigo-de-acesso/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      const accessCode = response.data.codigo_acesso;
      
      if (Platform.OS === 'web') {
        alert(`Código de acesso: ${accessCode}`);
        try {
          await navigator.clipboard.writeText(accessCode);
        } catch (clipboardError) {
          console.error("Erro ao copiar:", clipboardError);
        }
      } else {
        Alert.alert(
          "Código de Acesso do Lar",
          `Use este código para convidar outros membros:\n\n${accessCode}`,
          [
            { text: 'Copiar', onPress: () => Clipboard.setString(accessCode) },
            { text: 'Fechar', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('Erro ao obter código de acesso:', error);
      Alert.alert('Erro', 'Não foi possível obter o código de acesso.');
    }
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      await AsyncStorage.multiRemove(['authToken', 'selectedGroupId', 'userData', 'isCurrentUserAdmin']);
      props.navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Tem certeza que deseja sair?')) { await performLogout(); }
    } else {
      Alert.alert('Sair', 'Tem certeza que deseja sair?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: performLogout }
      ]);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerItemList {...props} />

      {/* ### CORREÇÃO APLICADA AQUI ### */}
      {/* Botões de gerenciamento visíveis apenas para administradores */}
      {isUserAdmin && (
        <>
          <TouchableOpacity
            style={{ paddingHorizontal: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#eee' }}
            onPress={() => props.navigation.navigate('GerenciarLar')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="settings-outline" size={22} color="#333" />
              <Text style={{ marginLeft: 30, fontWeight: 'bold', color: '#333' }}>
                Gerenciar Lar
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ paddingHorizontal: 20, paddingTop: 20 }}
            onPress={handleGetAccessCode}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="qr-code-outline" size={22} color="#333" />
              <Text style={{ marginLeft: 30, fontWeight: 'bold', color: '#333' }}>
                Obter Código de Acesso
              </Text>
            </View>
          </TouchableOpacity>
        </>
      )}

      {/* Botão para retornar à tela de seleção de lar */}
      <TouchableOpacity
        style={{ paddingHorizontal: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#eee' }}
        onPress={() => {
          props.navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'SelecionarLar' }] }));
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="swap-horizontal-outline" size={22} color="#333" />
          <Text style={{ marginLeft: 30, fontWeight: 'bold', color: '#333' }}>
            Trocar de Lar
          </Text>
        </View>
      </TouchableOpacity>

      {/* Botão de Sair */}
      <TouchableOpacity
        style={{ padding: 20 }}
        onPress={handleLogout}
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
        headerShown: true,
        drawerStyle: {
          paddingTop: 40
        }
      }}
    >
      <Drawer.Screen name="Início" component={Inicio} />
      <Drawer.Screen name="Meu Perfil" component={PerfilUsuario} />
      <Drawer.Screen name="Estoque" component={Estoque} />
      <Drawer.Screen name="Horários" component={Horario} />
      <Drawer.Screen name="Log de Administrações" component={LogAdministracoes} />
    </Drawer.Navigator>
  );
}

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ 
        headerShown: false,
        headerBackTitle: 'Voltar', 
        headerTintColor: '#000',
        }}>
        {/* ... Telas de Login, Cadastro, SelecionarLar, CriarLar, Main, Dados, CadastroIdoso, EditarIdoso ... */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Cadastro" component={Cadastro} />
        <Stack.Screen name="SelecionarLar" component={SelecionarLar} />
        <Stack.Screen name="CriarLar" component={CriarLar} />
        <Stack.Screen name="Main" component={MainDrawerNavigator} />
        <Stack.Screen name="Dados" component={Dados} options={{ headerShown: true, title: 'Perfil do Idoso' }}/>
        <Stack.Screen name="CadastroIdoso" component={CadastroIdoso} options={{ headerShown: false }} />
        <Stack.Screen name="EditarIdoso" component={EditarIdoso} options={{ headerShown: false }} />
        <Stack.Screen
          name="GerenciarLar"
          component={GerenciarLar}
          options={{
            headerShown: true,
            title: 'Gerenciar Lar e Membros',
            headerStyle: { backgroundColor: '#2c3e50' },
            headerTintColor: '#fff'
          }}
        />
        {/* Adicionando as novas telas de medicamento à pilha de navegação */}
        <Stack.Screen
          name="DadosMedicamento"
          component={DadosMedicamento}
          options={{ headerShown: true, title: 'Detalhes do Medicamento', headerStyle: { backgroundColor: '#2c3e50' }, headerTintColor: '#fff' }}
        />
        <Stack.Screen
          name="CadastroMedicamento"
          component={CadastroMedicamento}
          options={{ headerShown: true, title: 'Adicionar Medicamento', headerStyle: { backgroundColor: '#2c3e50' }, headerTintColor: '#fff' }}
        />
        <Stack.Screen
          name="EditarMedicamento"
          component={EditarMedicamento}
          options={{ headerShown: true, title: 'Editar Medicamento', headerStyle: { backgroundColor: '#2c3e50' }, headerTintColor: '#fff' }}
        />
        <Stack.Screen
          name="CadastroPrescricao"
          component={CadastroPrescricao}
          options={{ headerShown: true, title: 'Adicionar Prescrição' }}
        />
        <Stack.Screen
          name="EditarPrescricao"
          component={EditarPrescricao}
          options={{ headerShown: true, title: 'Editar Prescrição' }}
        />
        <Stack.Screen
          name="Administracao"
          component={Administracao}
          options={{
            headerShown: true,
            title: 'Registrar Administração',
            headerStyle: { backgroundColor: '#2c3e50' },
            headerTintColor: '#fff'
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
