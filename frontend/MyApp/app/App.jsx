// App.jsx - Versão com o botão de menu manual

import 'react-native-gesture-handler';

import React from 'react';
// IMPORTAÇÕES ADICIONAIS PARA O BOTÃO
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

// --- Importação das suas telas (pages) ---
import Login from '../pages/Login';
import Cadastro from '../pages/Cadastro';
import Inicio from '../pages/Inicio';
import Estoque from '../pages/Estoque';
import Horario from '../pages/Horario';
import Dados from '../pages/Dados';

// --- Importação dos seus componentes ---
import CustomDrawerContent from '../components/CustomDrawerContent'; 

// --- Criação dos navegadores ---
const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2c3e50' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      {/* AQUI ESTÁ A MUDANÇA PRINCIPAL */}
      <Stack.Screen 
        name="InicioNav" 
        component={Inicio} 
        options={({ navigation }) => ({
          title: 'Início',
          // Adiciona um componente à esquerda do cabeçalho
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.toggleDrawer()}>
              <Ionicons name="menu" size={28} color="#fff" style={{ marginLeft: 15 }} />
            </TouchableOpacity>
          ),
        })}
      />
      {/* Fim da mudança */}

      <Stack.Screen name="Estoque" component={Estoque} />
      <Stack.Screen name="Horarios" component={Horario} options={{ title: 'Horários' }}/>
      <Stack.Screen name="Dados" component={Dados} />
    </Stack.Navigator>
  );
}

function MainAppDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="AppScreens" component={AppStack} />
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
        <Stack.Screen name="MainApp" component={MainAppDrawer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;