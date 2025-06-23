import { Platform } from 'react-native';

// // IP da sua máquina na rede local.
// // Este IP deve ser usado para o acesso via celular/emulador.
//  const DEV_MOBILE_URL = 'http://192.168.0.14:8000';         // LOCAL

// // No navegador, podemos usar 'localhost' ou o IP. 'localhost' é mais comum e estável.
//  const DEV_WEB_URL = 'http://localhost:8000';       // LOCAL

// // Quando for para produção, você terá a URL do seu servidor real.
// // const PROD_URL = 'https://api.seudominio.com';

// // A lógica abaixo escolhe a URL correta automaticamente.
// // Por enquanto, estamos focando apenas no ambiente de desenvolvimento.

//  const baseURL = Platform.OS === 'web' ? DEV_WEB_URL : DEV_MOBILE_URL;  // LOCAL

const baseURL = 'https://e-doso-backend.onrender.com';   // DEPLOY

export default baseURL;