import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers'; // 使用ethers来编码calldata
import { formatUnits, parseUnits } from 'viem';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBlock,
  useWatchContractEvent,
  usePublicClient,
  useChainId
} from 'wagmi';

// --- 关键配置：部署后请务必替换这些地址 ---
// TODO: Update these addresses after deploying contracts
const STATE_DAO_ADDRESS = '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853';
const CENTRAL_BANK_ADDRESS = '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE';
const CURRENCY_ADDRESS = '0x0165878A594ca255338adfa4d48449f69242Eb8F';

// Network configuration
const SUPPORTED_NETWORKS = {
  1: 'Ethereum Mainnet',
  11155111: 'Sepolia Testnet', 
  31337: 'Hardhat Local Network'
};

// --- ABI文件导入 ---
import stateDaoAbi from './abi/StateEconomy_Qin_StateDAO.json';
import centralBankAbi from './abi/StateEconomy_Qin_CentralBank.json';
import currencyAbi from './abi/StateEconomy_Qin_NationalCurrency.json';

// Hook for contract deployment status
function useContractStatus() {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [status, setStatus] = useState({
    allDeployed: false,
    individual: { stateDao: false, centralBank: false, currency: false },
    checking: true,
    error: null
  });

  useEffect(() => {
    const checkStatus = async () => {
      if (!publicClient) return;
      
      setStatus(prev => ({ ...prev, checking: true, error: null }));
      
      try {
        const [stateDaoCode, centralBankCode, currencyCode] = await Promise.all([
          publicClient.getCode({ address: STATE_DAO_ADDRESS }),
          publicClient.getCode({ address: CENTRAL_BANK_ADDRESS }),
          publicClient.getCode({ address: CURRENCY_ADDRESS })
        ]);
        
        const individual = {
          stateDao: stateDaoCode !== '0x',
          centralBank: centralBankCode !== '0x',
          currency: currencyCode !== '0x'
        };
        
        setStatus({
          allDeployed: individual.stateDao && individual.centralBank && individual.currency,
          individual,
          checking: false,
          error: null
        });
      } catch (error) {
        setStatus({
          allDeployed: false,
          individual: { stateDao: false, centralBank: false, currency: false },
          checking: false,
          error: error.message
        });
      }
    };
    
    checkStatus();
  }, [publicClient, chainId]);
  
  return status;
}

// Contract verification and network status component
function NetworkStatus() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [contractStatus, setContractStatus] = useState({
    stateDao: null,
    centralBank: null, 
    currency: null,
    checking: true,
    error: null
  });
  const [lastCheckTime, setLastCheckTime] = useState(null);

  const checkContracts = async () => {
    if (!publicClient) return;
    
    setContractStatus(prev => ({ ...prev, checking: true, error: null }));
    
    try {
      console.log('🔍 Checking contract deployment status...');
      
      // Check if addresses are valid
      if (!STATE_DAO_ADDRESS || !CENTRAL_BANK_ADDRESS || !CURRENCY_ADDRESS) {
        throw new Error('Contract addresses not configured');
      }

      // Get bytecode for each contract
      const [stateDaoCode, centralBankCode, currencyCode] = await Promise.all([
        publicClient.getCode({ address: STATE_DAO_ADDRESS }),
        publicClient.getCode({ address: CENTRAL_BANK_ADDRESS }),
        publicClient.getCode({ address: CURRENCY_ADDRESS })
      ]);
      
      console.log('📋 Contract check results:');
      console.log(`StateDAO (${STATE_DAO_ADDRESS}): ${stateDaoCode !== '0x' ? '✅ Deployed' : '❌ Not found'}`);
      console.log(`CentralBank (${CENTRAL_BANK_ADDRESS}): ${centralBankCode !== '0x' ? '✅ Deployed' : '❌ Not found'}`);
      console.log(`Currency (${CURRENCY_ADDRESS}): ${currencyCode !== '0x' ? '✅ Deployed' : '❌ Not found'}`);
      
      // Additional check: Try to call a read function to verify contract is functional
      let functionalCheck = { stateDao: false, centralBank: false, currency: false };
      
      if (stateDaoCode !== '0x') {
        try {
          await publicClient.readContract({
            address: STATE_DAO_ADDRESS,
            abi: stateDaoAbi.abi,
            functionName: 'nextProposalId'
          });
          functionalCheck.stateDao = true;
        } catch (e) {
          console.warn('StateDAO deployed but not functional:', e.message);
        }
      }
      
      if (currencyCode !== '0x') {
        try {
          await publicClient.readContract({
            address: CURRENCY_ADDRESS,
            abi: currencyAbi.abi,
            functionName: 'name'
          });
          functionalCheck.currency = true;
        } catch (e) {
          console.warn('Currency deployed but not functional:', e.message);
        }
      }
      
      if (centralBankCode !== '0x') {
        try {
          await publicClient.readContract({
            address: CENTRAL_BANK_ADDRESS,
            abi: centralBankAbi.abi,
            functionName: 'stateDao'
          });
          functionalCheck.centralBank = true;
        } catch (e) {
          console.warn('CentralBank deployed but not functional:', e.message);
        }
      }
        
      setContractStatus({
        stateDao: stateDaoCode !== '0x' && functionalCheck.stateDao,
        centralBank: centralBankCode !== '0x' && functionalCheck.centralBank,
        currency: currencyCode !== '0x' && functionalCheck.currency,
        checking: false,
        error: null
      });
      setLastCheckTime(new Date());
      
    } catch (error) {
      console.error('❌ Error checking contracts:', error);
      setContractStatus({
        stateDao: false,
        centralBank: false,
        currency: false,
        checking: false,
        error: error.message
      });
      setLastCheckTime(new Date());
    }
  };

  useEffect(() => {
    checkContracts();
  }, [publicClient, chainId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(checkContracts, 30000);
    return () => clearInterval(interval);
  }, [publicClient]);

  const networkName = SUPPORTED_NETWORKS[chainId] || `Unknown Network (${chainId})`;
  const allContractsDeployed = contractStatus.stateDao && contractStatus.centralBank && contractStatus.currency;
  const someContractsDeployed = contractStatus.stateDao || contractStatus.centralBank || contractStatus.currency;

  if (contractStatus.checking) {
    return (
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#fef3c7', 
        border: '1px solid #f59e0b', 
        borderRadius: '8px', 
        marginBottom: '1rem' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            border: '2px solid #f59e0b', 
            borderTop: '2px solid transparent', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite' 
          }}></div>
          <h3 style={{ margin: 0, color: '#92400e' }}>Checking Network & Contracts...</h3>
        </div>
        <p style={{ margin: 0, color: '#78350f', fontSize: '0.9em' }}>
          Verifying contract deployment on {networkName}...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (contractStatus.error) {
    return (
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#fef2f2', 
        border: '1px solid #ef4444', 
        borderRadius: '8px', 
        marginBottom: '1rem' 
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#dc2626' }}>🚨 Contract Check Failed</h3>
        <p style={{ margin: '0 0 1rem 0', color: '#991b1b' }}>
          <strong>Network:</strong> {networkName}<br/>
          <strong>Error:</strong> {contractStatus.error}
        </p>
        <button 
          onClick={checkContracts}
          style={{
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Retry Check
        </button>
      </div>
    );
  }

  if (!allContractsDeployed) {
    return (
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#fef2f2', 
        border: '1px solid #ef4444', 
        borderRadius: '8px', 
        marginBottom: '1rem' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: '#dc2626' }}>⚠️ Contract Deployment Issue</h3>
          <button 
            onClick={checkContracts}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8em'
            }}
          >
            🔄 Refresh
          </button>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ margin: '0 0 0.5rem 0', color: '#991b1b' }}>
            <strong>Network:</strong> {networkName} (Chain ID: {chainId})
          </p>
          <p style={{ margin: '0 0 0.5rem 0', color: '#991b1b' }}>
            <strong>Last Check:</strong> {lastCheckTime?.toLocaleTimeString()}
          </p>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#991b1b' }}>Contract Status:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
            <span>{contractStatus.stateDao ? '✅' : '❌'}</span>
            <span style={{ color: '#991b1b' }}>StateDAO</span>
            <code style={{ fontSize: '0.7em', color: '#6b7280' }}>{STATE_DAO_ADDRESS?.slice(0, 10)}...</code>
            
            <span>{contractStatus.centralBank ? '✅' : '❌'}</span>
            <span style={{ color: '#991b1b' }}>CentralBank</span>
            <code style={{ fontSize: '0.7em', color: '#6b7280' }}>{CENTRAL_BANK_ADDRESS?.slice(0, 10)}...</code>
            
            <span>{contractStatus.currency ? '✅' : '❌'}</span>
            <span style={{ color: '#991b1b' }}>Currency</span>
            <code style={{ fontSize: '0.7em', color: '#6b7280' }}>{CURRENCY_ADDRESS?.slice(0, 10)}...</code>
          </div>
        </div>
        
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fff7ed', 
          border: '1px solid #f97316', 
          borderRadius: '6px' 
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#ea580c' }}>🛠️ How to Fix:</h4>
          <ol style={{ margin: 0, paddingLeft: '1.5rem', color: '#9a3412', fontSize: '0.9em' }}>
            <li>Deploy contracts: <code style={{ backgroundColor: '#f3f4f6', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>cd contracts-l2-template && npx hardhat run scripts/deploy-and-setup.js --network localhost</code></li>
            <li>Update contract addresses in App.jsx</li>
            <li>Make sure you're connected to the correct network</li>
            <li>Check the console for detailed error messages</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '1rem', 
      backgroundColor: '#ecfdf5', 
      border: '1px solid #10b981', 
      borderRadius: '8px', 
      marginBottom: '1rem' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#065f46' }}>✅ All Systems Ready</h3>
          <p style={{ margin: 0, color: '#047857', fontSize: '0.9em' }}>
            <strong>Network:</strong> {networkName} (Chain ID: {chainId})<br/>
            <strong>Contracts:</strong> All deployed and functional<br/>
            <strong>Last Check:</strong> {lastCheckTime?.toLocaleTimeString()}
          </p>
        </div>
        <button 
          onClick={checkContracts}
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8em'
          }}
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}

// 主应用组件
function App() {
  const { isConnected } = useAccount();
  const contractStatus = useContractStatus();

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: 'auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>DAO Of Seven Kindoms</h1>
        <WalletConnect />
      </header>

      {isConnected && (
        <main>
          <NetworkStatus />
          {contractStatus.allDeployed ? (
            <>
              <StateInfo />
              <hr style={{margin: '2rem 0'}}/>
              <BalanceMonitor />
              <hr style={{margin: '2rem 0'}}/>
              <CreateMintProposal />
              <hr style={{margin: '2rem 0'}}/>
              <ProposalList />
              <hr style={{margin: '2rem 0'}}/>
              <EventLogs />
              <hr style={{margin: '2rem 0'}}/>
              <RealTimeEvents />
            </>
          ) : (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h2 style={{ color: '#6b7280', margin: '0 0 1rem 0' }}>🛠️ Contracts Not Ready</h2>
              <p style={{ color: '#6b7280', margin: 0 }}>
                Please deploy the contracts first to use the application.
              </p>
            </div>
          )}
        </main>
      )}

      {!isConnected && (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #bfdbfe',
          marginTop: '2rem'
        }}>
          <h2 style={{ color: '#1e40af', margin: '0 0 1rem 0' }}>🔗 Connect Your Wallet</h2>
          <p style={{ color: '#3730a3', margin: 0 }}>
            Please connect your wallet to interact with the DAO.
          </p>
        </div>
      )}
    </div>
  );
}

// 余额显示组件 - 可重用的余额监控组件
function BalanceDisplay({ address, label, color = '#374151', size = '1em' }) {
  const { data: balance, refetch, error, isError } = useReadContract({
    address: CURRENCY_ADDRESS,
    abi: currencyAbi.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    watch: true, // 自动监听更新
    enabled: !!address,
  });

  // 监听Transfer事件来触发余额刷新
  useWatchContractEvent({
    address: CURRENCY_ADDRESS,
    abi: currencyAbi.abi,
    eventName: 'Transfer',
    onLogs: (logs) => {
      // 只在涉及当前地址的转账时才刷新
      const isRelevant = logs.some(log => 
        log.args?.from === address || log.args?.to === address
      );
      if (isRelevant) {
        refetch();
      }
    },
    enabled: !!address && !isError,
  });

  if (!address) return <span style={{ color: '#9ca3af' }}>Not Available</span>;
  
  if (isError) {
    return (
      <span style={{ color: '#ef4444', fontSize: size }}>
        Contract Error
        {label && <small style={{ marginLeft: '0.5rem', color: '#6b7280', fontWeight: 'normal' }}>({label})</small>}
      </span>
    );
  }
  
  return (
    <span style={{ color, fontSize: size, fontFamily: 'monospace', fontWeight: '600' }}>
      {balance !== undefined ? `${formatUnits(balance, 18)} QBL` : 'Loading...'}
      {label && <small style={{ marginLeft: '0.5rem', color: '#6b7280', fontWeight: 'normal' }}>({label})</small>}
    </span>
  );
}

// 钱包连接组件
function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  
  const metaMaskConnector = connectors.find(c => c.id === 'metaMaskSDK');

  if (isConnected) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>已连接: {`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
            <button onClick={() => disconnect()} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8em' }}>Disconnect</button>
          </div>
          <div style={{ fontSize: '0.9em', color: '#374151', marginTop: '0.25rem' }}>
            余额: <BalanceDisplay address={address} color="#059669" />
          </div>
        </div>
      </div>
    );
  }
  return <button onClick={() => connect({ connector: metaMaskConnector })}>Connect Wallet</button>;
}

// 显示state信息的组件
function StateInfo() {
  const { address } = useAccount();
  
  // 查询DAO合约（State Bank）的余额 - 自动更新
  const { data: treasuryBalance, refetch: refetchTreasuryBalance } = useReadContract({
    address: CURRENCY_ADDRESS,
    abi: currencyAbi.abi,
    functionName: 'balanceOf',
    args: [STATE_DAO_ADDRESS],
    watch: true, // 启用自动监听
  });

  // 查询用户钱包余额 - 自动更新
  const { data: userBalance, refetch: refetchUserBalance } = useReadContract({
    address: CURRENCY_ADDRESS,
    abi: currencyAbi.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    watch: true, // 启用自动监听
    enabled: !!address,
  });

  // 查询央行余额 - 自动更新
  const { data: centralBankBalance, refetch: refetchCentralBankBalance } = useReadContract({
    address: CURRENCY_ADDRESS,
    abi: currencyAbi.abi,
    functionName: 'balanceOf',
    args: [CENTRAL_BANK_ADDRESS],
    watch: true, // 启用自动监听
  });

  // 监听新区块来刷新所有余额 (备用刷新机制)
  useBlock({
    onBlock: () => {
      refetchTreasuryBalance();
      refetchUserBalance();
      refetchCentralBankBalance();
    }
  });

  // 监听Transfer事件来触发余额刷新
  useWatchContractEvent({
    address: CURRENCY_ADDRESS,
    abi: currencyAbi.abi,
    eventName: 'Transfer',
    onLogs: () => {
      // 当有转账事件时，刷新所有相关余额
      refetchTreasuryBalance();
      refetchUserBalance();
      refetchCentralBankBalance();
    },
  });

  return (
    <section>
      <h2>State状态</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>合约地址</h3>
          <p><strong>StateDAO (State Bank):</strong><br/><code style={{ fontSize: '0.8em', wordBreak: 'break-all' }}>{STATE_DAO_ADDRESS}</code></p>
          <p><strong>Central Bank:</strong><br/><code style={{ fontSize: '0.8em', wordBreak: 'break-all' }}>{CENTRAL_BANK_ADDRESS}</code></p>
          <p><strong>State Currency:</strong><br/><code style={{ fontSize: '0.8em', wordBreak: 'break-all' }}>{CURRENCY_ADDRESS}</code></p>
        </div>
        
        <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f0f9ff' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>余额信息 (实时更新)</h3>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', marginRight: '0.5rem' }}></span>
            <strong>您的钱包余额:</strong>
          </div>
          <p style={{ fontSize: '1.2em', color: '#059669', margin: '0 0 1rem 1rem', fontFamily: 'monospace' }}>
            {address ? (userBalance !== undefined ? `${formatUnits(userBalance, 18)} QBL` : 'Loading...') : 'Not Connected'}
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '50%', marginRight: '0.5rem' }}></span>
            <strong>State Bank余额:</strong>
          </div>
          <p style={{ fontSize: '1.2em', color: '#2563eb', margin: '0 0 1rem 1rem', fontFamily: 'monospace' }}>
            {treasuryBalance !== undefined ? `${formatUnits(treasuryBalance, 18)} QBL` : 'Loading...'}
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#f59e0b', borderRadius: '50%', marginRight: '0.5rem' }}></span>
            <strong>Central Bank余额:</strong>
          </div>
          <p style={{ fontSize: '1.2em', color: '#d97706', margin: '0 0 0 1rem', fontFamily: 'monospace' }}>
            {centralBankBalance !== undefined ? `${formatUnits(centralBankBalance, 18)} QBL` : 'Loading...'}
          </p>
        </div>
      </div>
    </section>
  );
}

// 余额监控组件 - 显示所有重要地址的余额
function BalanceMonitor() {
  const { address } = useAccount();
  const contractStatus = useContractStatus();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

  // 监听转账事件来更新时间戳
  useWatchContractEvent({
    address: CURRENCY_ADDRESS,
    abi: currencyAbi.abi,
    eventName: 'Transfer',
    onLogs: () => {
      setLastUpdateTime(new Date());
      setRefreshTrigger(prev => prev + 1);
    },
    enabled: contractStatus.individual.currency,
  });

  // 监听铸币事件
  useWatchContractEvent({
    address: CENTRAL_BANK_ADDRESS,
    abi: centralBankAbi.abi,
    eventName: 'CurrencyIssued',
    onLogs: () => {
      setLastUpdateTime(new Date());
      setRefreshTrigger(prev => prev + 1);
    },
    enabled: contractStatus.individual.centralBank,
  });

  // Show loading state while checking contracts
  if (contractStatus.checking) {
    return (
      <section>
        <h2>余额监控 (实时更新)</h2>
        <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '6px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', margin: 0 }}>Checking contract status...</p>
        </div>
      </section>
    );
  }

  // Show error if contracts not deployed
  if (!contractStatus.allDeployed) {
    return (
      <section>
        <h2>余额监控 (实时更新)</h2>
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #ef4444', 
          borderRadius: '6px' 
        }}>
          <p style={{ color: '#dc2626', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
            ⚠️ Cannot Monitor Balances
          </p>
          <p style={{ color: '#991b1b', margin: 0, fontSize: '0.9em' }}>
            Currency contract is not deployed or accessible.
          </p>
        </div>
      </section>
    );
  }

  const importantAddresses = [
    { 
      address: STATE_DAO_ADDRESS, 
      label: 'State Bank (DAO Treasury)', 
      color: '#2563eb',
      available: contractStatus.individual.stateDao
    },
    { 
      address: CENTRAL_BANK_ADDRESS, 
      label: 'Central Bank', 
      color: '#d97706',
      available: contractStatus.individual.centralBank
    },
    { 
      address, 
      label: '您的钱包', 
      color: '#059669',
      available: !!address
    },
  ].filter(item => item.address && item.available); // 过滤掉空地址或不可用的合约

  return (
    <section>
      <h2>余额监控 (实时更新)</h2>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1rem',
        padding: '0.5rem 1rem',
        backgroundColor: contractStatus.allDeployed ? '#ecfdf5' : '#fef3c7',
        borderRadius: '6px',
        border: contractStatus.allDeployed ? '1px solid #10b981' : '1px solid #f59e0b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ 
            display: 'inline-block', 
            width: '8px', 
            height: '8px', 
            backgroundColor: contractStatus.allDeployed ? '#10b981' : '#f59e0b', 
            borderRadius: '50%',
            animation: contractStatus.allDeployed ? 'pulse 2s infinite' : 'none'
          }}></span>
          <span style={{ 
            fontSize: '0.9em', 
            color: contractStatus.allDeployed ? '#065f46' : '#92400e' 
          }}>
            {contractStatus.allDeployed ? '实时同步中' : '部分合约不可用'}
          </span>
        </div>
        <div style={{ fontSize: '0.8em', color: '#6b7280' }}>
          最后更新: {lastUpdateTime.toLocaleTimeString()}
        </div>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem' 
      }}>
        {importantAddresses.map((item, index) => (
          <div 
            key={index}
            style={{ 
              padding: '1.5rem', 
              border: '2px solid #e5e7eb', 
              borderRadius: '12px', 
              backgroundColor: 'white',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease',
              borderColor: item.color + '40'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '1rem',
              gap: '0.5rem'
            }}>
              <span style={{ 
                display: 'inline-block', 
                width: '12px', 
                height: '12px', 
                backgroundColor: item.color, 
                borderRadius: '50%' 
              }}></span>
              <h3 style={{ margin: 0, color: '#374151', fontSize: '1rem' }}>{item.label}</h3>
              {item.available && (
                <span style={{ fontSize: '0.8em', color: '#10b981' }}>✅</span>
              )}
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75em', color: '#6b7280', marginBottom: '0.25rem' }}>地址:</div>
              <code style={{ 
                fontSize: '0.7em', 
                color: '#4b5563', 
                wordBreak: 'break-all',
                backgroundColor: '#f9fafb',
                padding: '0.25rem',
                borderRadius: '4px',
                display: 'block'
              }}>
                {item.address}
              </code>
            </div>
            
            <div>
              <div style={{ fontSize: '0.75em', color: '#6b7280', marginBottom: '0.25rem' }}>余额:</div>
              <div style={{ fontSize: '1.4em', fontWeight: '600' }}>
                <BalanceDisplay 
                  address={item.address} 
                  color={item.color}
                  key={`${item.address}-${refreshTrigger}`} // 强制刷新
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </section>
  );
}

// 创建铸币提案的组件
function CreateMintProposal() {
  const [amount, setAmount] = useState('');
  const { data: hash, writeContract, error: writeError } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });
  const contractStatus = useContractStatus();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) return;

    // Check if contracts are deployed before proceeding
    if (!contractStatus.allDeployed) {
      alert('⚠️ Contracts not deployed! Please deploy contracts first.');
      return;
    }

    try {
      const centralBankInterface = new ethers.Interface(centralBankAbi.abi);
      const amountInWei = parseUnits(amount, 18);
      const calldata = centralBankInterface.encodeFunctionData("issueCurrency", [amountInWei]);

      writeContract({
        address: STATE_DAO_ADDRESS,
        abi: stateDaoAbi.abi,
        functionName: 'createProposal',
        args: [
          CENTRAL_BANK_ADDRESS, // target
          calldata, // calldata
          `Issue ${amount} new currency units to the treasury` // description
        ],
      });
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('❌ Error creating proposal: ' + error.message);
    }
  };
  
  useEffect(() => {
    if(isSuccess) {
      setAmount('');
    }
  }, [isSuccess]);

  // Show loading state while checking contracts
  if (contractStatus.checking) {
    return (
      <section>
        <h2>创建铸币提案</h2>
        <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '6px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', margin: 0 }}>Checking contract status...</p>
        </div>
      </section>
    );
  }

  // Show error if contracts not deployed
  if (!contractStatus.allDeployed) {
    return (
      <section>
        <h2>创建铸币提案</h2>
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #ef4444', 
          borderRadius: '6px' 
        }}>
          <p style={{ color: '#dc2626', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
            ⚠️ Contracts Required
          </p>
          <p style={{ color: '#991b1b', margin: 0, fontSize: '0.9em' }}>
            Cannot create proposals until all contracts are deployed and functional.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2>创建铸币提案</h2>
      
      {/* Contract status indicator */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem', 
        marginBottom: '1rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#ecfdf5',
        borderRadius: '6px',
        border: '1px solid #10b981'
      }}>
        <span style={{ color: '#10b981', fontSize: '1.2em' }}>✅</span>
        <span style={{ color: '#065f46', fontSize: '0.9em' }}>All contracts ready for proposal creation</span>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <input 
            type="number" 
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
            placeholder="要铸造的货币数量"
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '1rem'
            }}
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading || !contractStatus.allDeployed}
          style={{
            backgroundColor: isLoading || !contractStatus.allDeployed ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            cursor: isLoading || !contractStatus.allDeployed ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: '600'
          }}
        >
          {isLoading ? '提交中...' : '提交提案'}
        </button>
      </form>
      
      {isLoading && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '6px' }}>
          <p style={{ color: '#92400e', margin: 0 }}>⏳ 等待钱包确认...</p>
        </div>
      )}
      
      {isSuccess && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: '6px' }}>
          <p style={{ color: '#065f46', margin: 0 }}>
            ✅ 提案创建成功! <br/>
            <small>Tx: <code style={{ fontSize: '0.8em' }}>{hash}</code></small>
          </p>
        </div>
      )}
      
      {writeError && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '6px' }}>
          <p style={{ color: '#dc2626', margin: 0 }}>
            ❌ 提案创建失败: {writeError.message}
          </p>
        </div>
      )}
    </section>
  );
}

// 提案列表组件
function ProposalList() {
  const contractStatus = useContractStatus();
  const { data: nextProposalId, error: proposalError } = useReadContract({
    address: STATE_DAO_ADDRESS,
    abi: stateDaoAbi.abi,
    functionName: 'nextProposalId',
    watch: true,
    enabled: contractStatus.allDeployed,
  });

  // Show loading state while checking contracts
  if (contractStatus.checking) {
    return (
      <section>
        <h2>提案列表</h2>
        <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '6px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', margin: 0 }}>Checking contract status...</p>
        </div>
      </section>
    );
  }

  // Show error if contracts not deployed
  if (!contractStatus.allDeployed) {
    return (
      <section>
        <h2>提案列表</h2>
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #ef4444', 
          borderRadius: '6px' 
        }}>
          <p style={{ color: '#dc2626', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
            ⚠️ Cannot Load Proposals
          </p>
          <p style={{ color: '#991b1b', margin: 0, fontSize: '0.9em' }}>
            StateDAO contract is not deployed or accessible.
          </p>
        </div>
      </section>
    );
  }

  if (proposalError) {
    return (
      <section>
        <h2>提案列表</h2>
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #ef4444', 
          borderRadius: '6px' 
        }}>
          <p style={{ color: '#dc2626', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
            ❌ Error Loading Proposals
          </p>
          <p style={{ color: '#991b1b', margin: 0, fontSize: '0.9em' }}>
            {proposalError.message}
          </p>
        </div>
      </section>
    );
  }

  const proposalIds = nextProposalId ? Array.from({ length: Number(nextProposalId) }, (_, i) => i) : [];

  return (
    <section>
      <h2>提案列表</h2>
      
      {/* Status indicator */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem', 
        marginBottom: '1rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#ecfdf5',
        borderRadius: '6px',
        border: '1px solid #10b981'
      }}>
        <span style={{ color: '#10b981', fontSize: '1.2em' }}>✅</span>
        <span style={{ color: '#065f46', fontSize: '0.9em' }}>
          Connected to StateDAO | Total Proposals: {proposalIds.length}
        </span>
      </div>
      
      {proposalIds.length === 0 ? (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          backgroundColor: '#f9fafb', 
          borderRadius: '6px',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ color: '#6b7280', margin: 0 }}>📜 暂无提案</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column-reverse' }}>
          {proposalIds.map(id => <ProposalCard key={id} proposalId={id} />)}
        </div>
      )}
    </section>
  );
}

// 单个提案卡片组件
function ProposalCard({ proposalId }) {
  const { data: proposal, refetch } = useReadContract({
    address: STATE_DAO_ADDRESS,
    abi: stateDaoAbi.abi,
    functionName: 'proposals',
    args: [BigInt(proposalId)],
    watch: true, // 自动监听提案状态变化
  });

  const { data: block } = useBlock({ watch: true });
  const { data: hash, writeContract } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  const [executionStatus, setExecutionStatus] = useState(null);

  // 监听提案执行事件
  useWatchContractEvent({
    address: STATE_DAO_ADDRESS,
    abi: stateDaoAbi.abi,
    eventName: 'ProposalExecuted',
    onLogs: (logs) => {
      const relevantLog = logs.find(log => 
        log.args?.proposalId?.toString() === proposalId.toString()
      );
      if (relevantLog) {
        setExecutionStatus('executed');
        refetch(); // 刷新提案数据
      }
    },
  });

  useEffect(() => {
    if (isSuccess) {
      refetch(); // 投票或执行成功后，重新获取提案数据
    }
  }, [isSuccess, refetch]);

  if (!proposal) return <div>Loading proposal...</div>;

  const deadline = new Date(Number(proposal[5]) * 1000);
  const now = block ? new Date(Number(block.timestamp) * 1000) : new Date();
  const isExecuted = proposal[8];
  const canVote = now < deadline && !isExecuted;
  const canExecute = !isExecuted && proposal[6] > proposal[7]; // yesVotes > noVotes
  
  // 尝试解析提案类型
  const proposalType = proposal[2].includes('Issue') || proposal[2].includes('铸') ? 'mint' : 'other';

  return (
    <div style={{ 
      border: isExecuted ? '2px solid #10b981' : '1px solid #d1d5db', 
      padding: '1rem', 
      marginBottom: '1rem',
      borderRadius: '8px',
      backgroundColor: isExecuted ? '#f0f9ff' : 'white',
      boxShadow: isExecuted ? '0 4px 6px rgba(16, 185, 129, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, color: isExecuted ? '#059669' : '#374151' }}>
          提案 #{proposal[0].toString()}: {proposal[2]}
          {isExecuted && <span style={{ marginLeft: '0.5rem', fontSize: '0.8em', color: '#10b981' }}>✓ 已执行</span>}
          {executionStatus === 'executed' && <span style={{ marginLeft: '0.5rem', fontSize: '0.8em', color: '#f59e0b' }}>🔄 正在更新...</span>}
        </h3>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <p><strong>发起人:</strong> <code style={{ fontSize: '0.8em' }}>{proposal[1].slice(0, 10)}...</code></p>
          <p><strong>状态:</strong> 
            <span style={{ 
              padding: '0.25rem 0.5rem', 
              borderRadius: '12px', 
              fontSize: '0.8em', 
              marginLeft: '0.5rem',
              backgroundColor: isExecuted ? '#dcfce7' : (canVote ? '#fef3c7' : '#f3f4f6'),
              color: isExecuted ? '#065f46' : (canVote ? '#92400e' : '#374151')
            }}>
              {isExecuted ? '已执行' : (canVote ? '投票中' : '已结束')}
            </span>
          </p>
        </div>
        <div>
          <p><strong>投票截止:</strong> {deadline.toLocaleString()}</p>
          <p><strong>票数:</strong> 
            <span style={{ color: '#059669', fontWeight: '600', marginLeft: '0.5rem' }}>{proposal[6].toString()} 同意</span> / 
            <span style={{ color: '#dc2626', fontWeight: '600', marginLeft: '0.25rem' }}>{proposal[7].toString()} 反对</span>
          </p>
        </div>
      </div>
      
      {/* 如果是铸币提案且已执行，显示余额影响 */}
      {isExecuted && proposalType === 'mint' && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#ecfdf5', 
          borderRadius: '6px', 
          border: '1px solid #10b981',
          marginBottom: '1rem'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#065f46' }}>铸币执行成功 ✓</h4>
          <p style={{ margin: '0', fontSize: '0.9em', color: '#047857' }}>
            新铸造的货币已转入 State Bank，余额已自动更新
          </p>
        </div>
      )}
      
      {canVote && (
        <div style={{ marginBottom: '1rem' }}>
          <button 
            onClick={() => writeContract({ 
              address: STATE_DAO_ADDRESS, 
              abi: stateDaoAbi.abi, 
              functionName: 'vote', 
              args: [BigInt(proposalId), true] 
            })}
            style={{ 
              backgroundColor: '#10b981', 
              color: 'white', 
              border: 'none', 
              padding: '0.5rem 1rem', 
              borderRadius: '6px', 
              cursor: 'pointer',
              marginRight: '0.5rem'
            }}
          >
            同意
          </button>
          <button 
            onClick={() => writeContract({ 
              address: STATE_DAO_ADDRESS, 
              abi: stateDaoAbi.abi, 
              functionName: 'vote', 
              args: [BigInt(proposalId), false] 
            })}
            style={{ 
              backgroundColor: '#ef4444', 
              color: 'white', 
              border: 'none', 
              padding: '0.5rem 1rem', 
              borderRadius: '6px', 
              cursor: 'pointer'
            }}
          >
            反对
          </button>
        </div>
      )}

      {canExecute && (
        <button 
          onClick={() => writeContract({ 
            address: STATE_DAO_ADDRESS, 
            abi: stateDaoAbi.abi, 
            functionName: 'execute', 
            args: [BigInt(proposalId)] 
          })}
          style={{ 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontSize: '1em',
            fontWeight: '600'
          }}
        >
          执行提案
        </button>
      )}
    </div>
  );
}

// 事件日志读取组件
function EventLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState('stateDao');
  const [blockRange, setBlockRange] = useState({ from: 'latest-100', to: 'latest' });
  const publicClient = usePublicClient();

  // 获取日志的函数
  const fetchLogs = async () => {
    if (!publicClient) return;
    
    setLoading(true);
    try {
      const contractConfig = getContractConfig(selectedContract);
      
      // 计算区块范围
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = blockRange.from === 'latest-100' ? currentBlock - 100n : BigInt(blockRange.from);
      const toBlock = blockRange.to === 'latest' ? currentBlock : BigInt(blockRange.to);
      
      const contractLogs = await publicClient.getLogs({
        address: contractConfig.address,
        events: contractConfig.events,
        fromBlock: fromBlock,
        toBlock: toBlock,
      });
      
      // 获取区块信息来显示时间戳
      const logsWithDetails = await Promise.all(
        contractLogs.map(async (log) => {
          const block = await publicClient.getBlock({ blockHash: log.blockHash });
          return {
            ...log,
            timestamp: new Date(Number(block.timestamp) * 1000),
            eventName: log.eventName,
            args: log.args
          };
        })
      );
      
      setLogs(logsWithDetails.sort((a, b) => b.blockNumber - a.blockNumber));
    } catch (error) {
      console.error('获取日志失败:', error);
      alert('获取日志失败: ' + error.message);
    }
    setLoading(false);
  };

  // 获取合约配置
  const getContractConfig = (contractType) => {
    switch (contractType) {
      case 'stateDao':
        return {
          address: STATE_DAO_ADDRESS,
          events: [
            {
              name: 'ProposalCreated',
              type: 'event',
              inputs: [
                { name: 'id', type: 'uint256', indexed: false },
                { name: 'proposer', type: 'address', indexed: true },
                { name: 'description', type: 'string', indexed: false },
                { name: 'target', type: 'address', indexed: false },
                { name: 'deadline', type: 'uint256', indexed: false }
              ]
            },
            {
              name: 'Voted',
              type: 'event', 
              inputs: [
                { name: 'proposalId', type: 'uint256', indexed: true },
                { name: 'voter', type: 'address', indexed: true },
                { name: 'support', type: 'bool', indexed: false }
              ]
            },
            {
              name: 'ProposalExecuted',
              type: 'event',
              inputs: [
                { name: 'proposalId', type: 'uint256', indexed: true }
              ]
            }
          ]
        };
      case 'centralBank':
        return {
          address: CENTRAL_BANK_ADDRESS,
          events: [
            {
              name: 'CurrencyIssued',
              type: 'event',
              inputs: [
                { name: 'amount', type: 'uint256', indexed: false },
                { name: 'recipient', type: 'address', indexed: true }
              ]
            }
          ]
        };
      case 'currency':
        return {
          address: CURRENCY_ADDRESS,
          events: [
            {
              name: 'Transfer',
              type: 'event',
              inputs: [
                { name: 'from', type: 'address', indexed: true },
                { name: 'to', type: 'address', indexed: true },
                { name: 'value', type: 'uint256', indexed: false }
              ]
            },
            {
              name: 'Approval',
              type: 'event',
              inputs: [
                { name: 'owner', type: 'address', indexed: true },
                { name: 'spender', type: 'address', indexed: true },
                { name: 'value', type: 'uint256', indexed: false }
              ]
            }
          ]
        };
      default:
        return { address: STATE_DAO_ADDRESS, events: [] };
    }
  };

  // 格式化事件参数显示
  const formatEventArgs = (eventName, args) => {
    if (!args) return '';
    
    switch (eventName) {
      case 'ProposalCreated':
        return `提案ID: ${args.id?.toString()}, 发起人: ${args.proposer}, 描述: ${args.description}, 目标: ${args.target}`;
      case 'Voted':
        return `提案ID: ${args.proposalId?.toString()}, 投票人: ${args.voter}, 支持: ${args.support ? '是' : '否'}`;
      case 'ProposalExecuted':
        return `提案ID: ${args.proposalId?.toString()}`;
      case 'Transfer':
        return `从: ${args.from}, 到: ${args.to}, 数量: ${args.value ? formatUnits(args.value, 18) : '0'} QBL`;
      case 'CurrencyIssued':
        return `数量: ${args.amount ? formatUnits(args.amount, 18) : '0'} QBL, 接收人: ${args.recipient}`;
      case 'Approval':
        return `所有者: ${args.owner}, 授权给: ${args.spender}, 数量: ${args.value ? formatUnits(args.value, 18) : '0'} QBL`;
      default:
        return JSON.stringify(args);
    }
  };

  return (
    <section>
      <h2>智能合约执行日志</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <label>
          选择合约:
          <select 
            value={selectedContract} 
            onChange={e => setSelectedContract(e.target.value)}
            style={{ marginLeft: '0.5rem' }}
          >
            <option value="stateDao">StateDAO (治理合约)</option>
            <option value="centralBank">CentralBank (央行)</option>
            <option value="currency">Currency (货币合约)</option>
          </select>
        </label>
        
        <label style={{ marginLeft: '1rem' }}>
          起始区块:
          <input 
            type="text" 
            value={blockRange.from}
            onChange={e => setBlockRange(prev => ({ ...prev, from: e.target.value }))}
            placeholder="latest-100 或区块号"
            style={{ marginLeft: '0.5rem', width: '120px' }}
          />
        </label>
        
        <label style={{ marginLeft: '1rem' }}>
          结束区块:
          <input 
            type="text" 
            value={blockRange.to}
            onChange={e => setBlockRange(prev => ({ ...prev, to: e.target.value }))}
            placeholder="latest 或区块号"
            style={{ marginLeft: '0.5rem', width: '120px' }}
          />
        </label>
        
        <button 
          onClick={fetchLogs} 
          disabled={loading}
          style={{ marginLeft: '1rem' }}
        >
          {loading ? '获取中...' : '获取日志'}
        </button>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
        {logs.length === 0 ? (
          <p style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>暂无日志数据</p>
        ) : (
          logs.map((log, index) => (
            <div 
              key={`${log.transactionHash}-${log.logIndex}`} 
              style={{ 
                padding: '1rem', 
                borderBottom: index < logs.length - 1 ? '1px solid #eee' : 'none',
                backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ color: '#2563eb' }}>{log.eventName}</strong>
                  <div style={{ fontSize: '0.9em', color: '#666', margin: '0.25rem 0' }}>
                    时间: {log.timestamp?.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#666', margin: '0.25rem 0' }}>
                    区块: {log.blockNumber?.toString()} | 交易: {log.transactionHash?.slice(0, 10)}...
                  </div>
                  <div style={{ fontSize: '0.9em', marginTop: '0.5rem' }}>
                    {formatEventArgs(log.eventName, log.args)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

// 实时事件监听组件
function RealTimeEvents() {
  const [realtimeLogs, setRealtimeLogs] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const publicClient = usePublicClient();

  // 监听 StateDAO 事件
  useWatchContractEvent({
    address: STATE_DAO_ADDRESS,
    abi: stateDaoAbi.abi,
    eventName: 'ProposalCreated',
    enabled: isMonitoring,
    onLogs: (logs) => {
      logs.forEach(log => addRealtimeLog('ProposalCreated', log));
    },
  });

  useWatchContractEvent({
    address: STATE_DAO_ADDRESS,
    abi: stateDaoAbi.abi,
    eventName: 'Voted',
    enabled: isMonitoring,
    onLogs: (logs) => {
      logs.forEach(log => addRealtimeLog('Voted', log));
    },
  });

  useWatchContractEvent({
    address: STATE_DAO_ADDRESS,
    abi: stateDaoAbi.abi,
    eventName: 'ProposalExecuted',
    enabled: isMonitoring,
    onLogs: (logs) => {
      logs.forEach(log => addRealtimeLog('ProposalExecuted', log));
    },
  });

  // 监听 Currency 事件 (Transfer)
  useWatchContractEvent({
    address: CURRENCY_ADDRESS,
    abi: currencyAbi.abi,
    eventName: 'Transfer',
    enabled: isMonitoring,
    onLogs: (logs) => {
      logs.forEach(log => addRealtimeLog('Transfer', log));
    },
  });

  const addRealtimeLog = (eventName, log) => {
    if (!isMonitoring) return;
    
    const newLog = {
      ...log,
      eventName,
      timestamp: new Date(),
      id: `${log.transactionHash}-${log.logIndex}-${Date.now()}`
    };
    
    setRealtimeLogs(prev => [newLog, ...prev.slice(0, 19)]); // 保持最新20条
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    if (!isMonitoring) {
      setRealtimeLogs([]); // 开始监听时清空日志
    }
  };

  const formatRealtimeEventArgs = (eventName, args) => {
    if (!args) return '';
    
    switch (eventName) {
      case 'ProposalCreated':
        return `新提案 #${args.id?.toString()}: ${args.description}`;
      case 'Voted':
        return `提案 #${args.proposalId?.toString()} 收到${args.support ? '支持' : '反对'}票`;
      case 'ProposalExecuted':
        return `提案 #${args.proposalId?.toString()} 已执行`;
      case 'Transfer':
        const amount = args.value ? formatUnits(args.value, 18) : '0';
        return `转账: ${amount} QBL 从 ${args.from?.slice(0, 8)}... 到 ${args.to?.slice(0, 8)}...`;
      default:
        return JSON.stringify(args);
    }
  };

  return (
    <section>
      <h2>实时事件监听</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <button 
          onClick={toggleMonitoring}
          style={{ 
            backgroundColor: isMonitoring ? '#dc2626' : '#16a34a',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isMonitoring ? '停止监听' : '开始监听'}
        </button>
        <span style={{ marginLeft: '1rem', color: '#666' }}>
          状态: {isMonitoring ? '监听中' : '已停止'}
        </span>
        {realtimeLogs.length > 0 && (
          <button 
            onClick={() => setRealtimeLogs([])}
            style={{ marginLeft: '1rem', padding: '0.25rem 0.5rem' }}
          >
            清空日志
          </button>
        )}
      </div>

      <div style={{ 
        height: '300px', 
        overflowY: 'auto', 
        border: '1px solid #ddd', 
        borderRadius: '4px',
        backgroundColor: '#f8f9fa'
      }}>
        {realtimeLogs.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#666',
            fontStyle: 'italic'
          }}>
            {isMonitoring ? '等待事件...' : '点击“开始监听”来监听实时事件'}
          </div>
        ) : (
          realtimeLogs.map((log) => (
            <div 
              key={log.id}
              style={{ 
                padding: '0.75rem', 
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: 'white',
                margin: '0.25rem',
                borderRadius: '4px',
                borderLeft: '3px solid #3b82f6'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ color: '#1e40af' }}>{log.eventName}</strong>
                  <div style={{ fontSize: '0.85em', color: '#6b7280', marginTop: '0.25rem' }}>
                    {log.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                <div style={{ fontSize: '0.75em', color: '#9ca3af' }}>
                  区块: {log.blockNumber?.toString()}
                </div>
              </div>
              <div style={{ fontSize: '0.9em', marginTop: '0.5rem', color: '#374151' }}>
                {formatRealtimeEventArgs(log.eventName, log.args)}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default App;