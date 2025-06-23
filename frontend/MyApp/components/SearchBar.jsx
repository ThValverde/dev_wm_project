import React, { useState } from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Componente de Barra de Busca reutilizável.
 * @param {object} props
 * @param {function(string): void} props.onSearch - Função chamada sempre que o texto de busca muda.
 * @param {string} props.placeholder - Texto a ser exibido no campo de busca.
 */
function SearchBar({ onSearch, placeholder = "Buscar..." }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Esta função agora atualiza o estado local e chama a função onSearch do componente pai.
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (onSearch) {
      onSearch(text);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholderTextColor="#888"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearchChange('')}>
            <Ionicons name="close-circle" size={20} color="#7f8c8d" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    width: '100%',
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#f0f2f5',
    borderRadius: 12,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
});

export default SearchBar;
