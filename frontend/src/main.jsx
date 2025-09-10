import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
// 1. 从 @tanstack/react-query 导入 QueryClient 和 QueryClientProvider
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { config } from './wagmi.js';
import App from './App.jsx';
import './index.css';

// 2. 创建一个 QueryClient 的实例
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      {/* 3. 将 QueryClientProvider 包裹在 App 组件外面 */}
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);