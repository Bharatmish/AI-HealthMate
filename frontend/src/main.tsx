import * as React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme'; // 👈 import the custom theme

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}> {/* 👈 pass the theme here */}
      <App />
    </ChakraProvider>
  </React.StrictMode>,
);
