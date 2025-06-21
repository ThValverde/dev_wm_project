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
import Login from '../pages/Login';
import Cadastro from '../pages/Cadastro';
import SelecionarLar from '../pages/SelecionarLar';
import CriarLar from '../pages/CriarLar';

// --- Criação dos navegadores ---
const Stack = createNativeStackNavigator();

function ScreenWrapper({ children, route, navigation }) {
  const isLoginScreen = route.name === 'Login' || route.name === 'Cadastro';
  
  if (isLoginScreen) {
    // Na tela de Login, não mostra navbar
    return children;
  }
  
  // Para SelecionarLar, renderize sem NavBar mas garantindo que receba navigation
  if (route.name === 'SelecionarLar' || route.name === 'CriarLar') {
    return (
      <View style={{ flex: 1 }}>
        {React.cloneElement(children, { navigation })}
      </View>
    );
  }

  // Nas outras telas, mostra navbar
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
        <Stack.Screen name="Login">
          {(props) => (
            <ScreenWrapper {...props}>
              <Login {...props} />
            </ScreenWrapper>
          )}
      
        </Stack.Screen>

        <Stack.Screen name="SelecionarLar">
          {(props) => (
            <ScreenWrapper {...props}>
              <SelecionarLar {...props} />
            </ScreenWrapper>
          )}
        </Stack.Screen>

        <Stack.Screen name="CriarLar">
          {(props) => (
            <ScreenWrapper {...props}>
              <CriarLar {...props} />
            </ScreenWrapper>
          )}
        </Stack.Screen>

        <Stack.Screen name="Cadastro">
          {(props) => (
            <ScreenWrapper {...props}>
              <Cadastro {...props} />
            </ScreenWrapper>
          )}
        </Stack.Screen>


        <Stack.Screen name="Inicio">
          {(props) => (
            <ScreenWrapper {...props}>
              <Inicio {...props} />
            </ScreenWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="Estoque">
          {(props) => (
            <ScreenWrapper {...props}>
              <Estoque {...props} />
            </ScreenWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="Horários">
          {(props) => (
            <ScreenWrapper {...props}>
              <Horario {...props} />
            </ScreenWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="Dados">
          {(props) => (
            <ScreenWrapper {...props}>
              <Dados {...props} />
            </ScreenWrapper>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;