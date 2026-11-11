import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiRoutes = [
  '/usuario',
  '/funcionario',
  '/categorias',
  '/clientes',
  '/fornecedores',
  '/produtos',
  '/entradas',
  '/saidas',
  '/estoque',
  '/pedidos',
  '/pedido-itens',
  '/movimentacoes',
  '/historico-precos',
  '/logs',
  '/teste'
];

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: Object.fromEntries(apiRoutes.map(route => [
      route,
      {
        target: 'https://backend-1-puom.onrender.com',
        changeOrigin: true,
        secure: true
      }
    ]))
  }
});
