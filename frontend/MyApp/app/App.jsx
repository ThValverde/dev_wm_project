import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NavBar from '../components/NavBar';
import Estoque from '../pages/Estoque';
import Inicio from '../pages/Inicio';
import Horarios from '../pages/Horarios';
import Dados from '../pages/Dados';
import Prescricoes from '../pages/Prescricoes';
import Login from '../pages/Login';
import Cadastro from '../pages/Cadastro';

const Stack = createNativeStackNavigator();

function ScreenWrapper({ children, route, navigation }) {
  const isLoginScreen = route.name === 'Login' || route.name === 'Cadastro';
  
  if (isLoginScreen) {
    // Na tela de Login, não mostra navbar
    return children;
  }
  
  // Nas outras telas, mostra navbar  
  return (
    <View style={styles.container}>
      <NavBar navigation={navigation} />
      <Text style={styles.hugeText1}>Abrigo de Idosos</Text>
      <Text style={styles.hugeText2}>E-doso</Text>
      <View style={styles.appContainer}>
        {children}
      </View>
    </View>
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
        <Stack.Screen name="Horarios">
          {(props) => (
            <ScreenWrapper {...props}>
              <Horarios {...props} />
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
        <Stack.Screen name="Prescricoes">
          {(props) => (
            <ScreenWrapper {...props}>
              <Prescricoes {...props} />
            </ScreenWrapper>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  hugeText1: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 24,
  },
  hugeText2: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  appContainer: {
    flex: 1,
  },
});

export default App;