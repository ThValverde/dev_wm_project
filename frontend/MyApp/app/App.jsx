import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NavBar from '../components/NavBar';
import Estoque from '../pages/Estoque';
import Inicio from '../pages/Inicio';
import Horario from '../pages/Horario';
import Dados from '../pages/Dados';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <View style={styles.container}>
        <NavBar />
        <Text style={styles.hugeText1}>Abrigo de Idosos</Text>
        <Text style={styles.hugeText2}>E-doso</Text>
        <View style={styles.appContainer}>
          <Stack.Navigator initialRouteName="Inicio" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Inicio" component={Inicio} />
            <Stack.Screen name="Estoque" component={Estoque} />
            <Stack.Screen name="Horários" component={Horario} />
            <Stack.Screen name="Dados" component={Dados} />
          </Stack.Navigator>
        </View>
      </View>
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
    paddingHorizontal: 16,
  },
});

export default App;