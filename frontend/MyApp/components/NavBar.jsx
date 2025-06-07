import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function NavBar() {
  const navigation = useNavigation();

  return (
    <View style={styles.navbar}>
      <View style={styles.navbarBrand}>
        <TouchableOpacity onPress={() => navigation.navigate('Inicio')}>
          <Text style={styles.navLink}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Estoque')}>
          <Text style={styles.navLink}>Estoque</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Horarios')}>
          <Text style={styles.navLink}>Horários</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: '#2c3e50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 4,
  },
  navbarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navLink: {
    color: '#fff',
    fontSize: 18,
    marginHorizontal: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default NavBar;