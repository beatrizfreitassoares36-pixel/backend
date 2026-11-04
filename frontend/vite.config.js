import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/usuario': 'http://localhost:5000',
      '/funcionario': 'http://localhost:5000',
      '/categorias': 'http://localhost:5000',
      '/clientes': 'http://localhost:5000',
      '/fornecedores': 'http://localhost:5000',
      '/produtos': 'http://localhost:5000',
      '/entradas': 'http://localhost:5000',
      '/saidas': 'http://localhost:5000',
      '/estoque': 'http://localhost:5000',
      '/pedidos': 'http://localhost:5000',
      '/pedido-itens': 'http://localhost:5000',
      '/movimentacoes': 'http://localhost:5000',
      '/historico-precos': 'http://localhost:5000',
      '/logs': 'http://localhost:5000',
      '/teste': 'http://localhost:5000'
    }
  }
});
