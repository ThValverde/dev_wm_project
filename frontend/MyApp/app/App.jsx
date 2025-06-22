// App.jsx

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


const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Componente para renderizar o conteúdo customizado do menu lateral
function CustomDrawerContent(props) {
  // Estado para controlar a visibilidade do botão de admin
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
  console.log('Botão pressionado'); // Diagnóstico
  
  try {
    // Teste simples para verificar se a função está executando 
    if (Platform.OS === 'web') {
      console.log('Detectado como web');
    } else {
      console.log('Detectado como mobile');  
    }
    
    const token = await AsyncStorage.getItem('authToken');
    console.log('Token obtido:', token ? 'sim' : 'não');
    
    const groupId = await AsyncStorage.getItem('selectedGroupId');
    console.log('ID do grupo:', groupId);
    
    if (!token || !groupId) {
      if (Platform.OS === 'web') {
        alert('Erro: Token ou ID do grupo não encontrado');
      } else {
        Alert.alert('Erro', 'Token ou ID do grupo não encontrado');
      }
      return;
    }
    
    console.log('Fazendo requisição para:', `${baseURL}/api/grupos/${groupId}/codigo-de-acesso/`);
    
    const response = await axios.get(`${baseURL}/api/grupos/${groupId}/codigo-de-acesso/`, {
      headers: { 'Authorization': `Token ${token}` }
    });
    
    console.log('Resposta recebida:', response.data);
    
    const accessCode = response.data.codigo_acesso;
    
    if (Platform.OS === 'web') {
      // Para web, mostra um alert nativo simples
      alert(`Código de acesso: ${accessCode}`);
      
      try {
        await navigator.clipboard.writeText(accessCode);
        console.log('Texto copiado para a área de transferência');
      } catch (clipboardError) {
        console.error("Erro ao copiar:", clipboardError);
      }
    } else {
      // Para mobile
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
    console.error('Erro completo:', error);
    
    if (Platform.OS === 'web') {
      alert(`Erro: ${error.message || 'Não foi possível obter o código de acesso.'}`);
    } else {
      Alert.alert('Erro', 'Não foi possível obter o código de acesso.');
    }
  }
};

  return (
    <View style={{ flex: 1 }}>
      <DrawerItemList {...props} />
      
      {/* Botão para "Obter Código de Acesso" renderizado condicionalmente */}
      {isUserAdmin && (
        <TouchableOpacity
          style={{ paddingHorizontal: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#eee' }}
          onPress={handleGetAccessCode}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="qr-code-outline" size={22} color="#333" />
            <Text style={{ marginLeft: 30, fontWeight: 'bold', color: '#333' }}>
              Obter Código de Acesso
            </Text>
          </View>
        </TouchableOpacity>
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
        onPress={async () => {
          const logout = async () => {
            await AsyncStorage.multiRemove(['authToken', 'selectedGroupId', 'userData', 'isCurrentUserAdmin']);
            props.navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
          };
          if (Platform.OS === 'web') {
            if (window.confirm('Tem certeza que deseja sair?')) { await logout(); }
          } else {
            Alert.alert('Sair', 'Tem certeza que deseja sair?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Sair', style: 'destructive', onPress: logout }
            ]);
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
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        {/* ... Telas de Login, Cadastro, SelecionarLar, CriarLar, Main, Dados, CadastroIdoso, EditarIdoso ... */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Cadastro" component={Cadastro} />
        <Stack.Screen name="SelecionarLar" component={SelecionarLar} />
        <Stack.Screen name="CriarLar" component={CriarLar} />
        <Stack.Screen name="Main" component={MainDrawerNavigator} />
        <Stack.Screen name="Dados" component={Dados} options={{ headerShown: true, title: 'Perfil do Idoso' }}/>
        <Stack.Screen name="CadastroIdoso" component={CadastroIdoso} options={{ headerShown: false }} />
        <Stack.Screen name="EditarIdoso" component={EditarIdoso} options={{ headerShown: false }} />

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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;