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
  usePublicClient
} from 'wagmi';

// --- 关键配置：部署后请务必替换这些地址 ---
const STATE_DAO_ADDRESS = '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6';
const CENTRAL_BANK_ADDRESS = '0x68B1D87F95878fE05B998F19b66F4baba5De1aed';
const CURRENCY_ADDRESS = '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853';

// --- ABI文件导入 ---
import stateDaoAbi from './abi/StateEconomy_Qin_StateDAO.json';
import centralBankAbi from './abi/StateEconomy_Qin_CentralBank.json';
import currencyAbi from './abi/StateEconomy_Qin_NationalCurrency.json';

// 主应用组件
function App() {
  const { isConnected } = useAccount();

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: 'auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>DAO Of Seven Kindoms</h1>
        <WalletConnect />
      </header>

      {isConnected && (
        <main>
          <StateInfo />
          <hr style={{margin: '2rem 0'}}/>
          <CreateMintProposal />
          <hr style={{margin: '2rem 0'}}/>
          <ProposalList />
          <hr style={{margin: '2rem 0'}}/>
          <EventLogs />
          <hr style={{margin: '2rem 0'}}/>
          <RealTimeEvents />
        </main>
      )}
    </div>
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
      <div>
        <span>已连接: {`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
        <button onClick={() => disconnect()} style={{ marginLeft: '10px' }}>Disconnect</button>
      </div>
    );
  }
  return <button onClick={() => connect({ connector: metaMaskConnector })}>Connect Wallet</button>;
}

// 显示state信息的组件
function StateInfo() {
  const { address } = useAccount();
  const { data: treasuryBalance, refetch: refetchTreasuryBalance } = useReadContract({
    address: CURRENCY_ADDRESS,
    abi: currencyAbi.abi,
    functionName: 'balanceOf',
    args: [STATE_DAO_ADDRESS], // 查询DAO合约（State Bank）的余额
  });

  // 监听新区块来刷新余额
  useBlock({
    onBlock: () => {
      refetchTreasuryBalance();
    }
  });

  return (
    <section>
      <h2>State状态</h2>
      <p><strong>StateDAO (State Bank) 地址:</strong> {STATE_DAO_ADDRESS}</p>
      <p><strong>Central Bank地址:</strong> {CENTRAL_BANK_ADDRESS}</p>
      <p><strong>State Currency Address:</strong> {CURRENCY_ADDRESS}</p>
      <p><strong>State Bank余额:</strong> {treasuryBalance !== undefined ? `${formatUnits(treasuryBalance, 18)} QBL` : 'Loading...'}</p>
    </section>
  );
}

// 创建铸币提案的组件
function CreateMintProposal() {
  const [amount, setAmount] = useState('');
  const { data: hash, writeContract } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) return;

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
  };
  
  useEffect(() => {
    if(isSuccess) {
      setAmount('');
    }
  }, [isSuccess]);

  return (
    <section>
      <h2>创建铸币提案</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="number" 
          value={amount} 
          onChange={e => setAmount(e.target.value)} 
          placeholder="要铸造的货币数量"
          required
        />
        <button type="submit" disabled={isLoading}>{isLoading ? '提交中...' : '提交提案'}</button>
      </form>
      {isLoading && <p>等待钱包确认...</p>}
      {isSuccess && <p>提案创建成功! Tx: {hash}</p>}
    </section>
  );
}

// 提案列表组件
function ProposalList() {
  const { data: nextProposalId } = useReadContract({
    address: STATE_DAO_ADDRESS,
    abi: stateDaoAbi.abi,
    functionName: 'nextProposalId',
    watch: true,
  });

  const proposalIds = nextProposalId ? Array.from({ length: Number(nextProposalId) }, (_, i) => i) : [];

  return (
    <section>
      <h2>提案列表</h2>
      {proposalIds.length === 0 ? <p>暂无提案</p> : 
        <div style={{ display: 'flex', flexDirection: 'column-reverse' }}>
          {proposalIds.map(id => <ProposalCard key={id} proposalId={id} />)}
        </div>
      }
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
  });

  const { data: block } = useBlock({ watch: true });
  const { data: hash, writeContract } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

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

  return (
    <div style={{ border: '1px solid black', padding: '1rem', marginBottom: '1rem' }}>
      <h3>提案 #{proposal[0].toString()}: {proposal[2]}</h3>
      <p>发起人: {proposal[1]}</p>
      <p>状态: {isExecuted ? '已执行' : (canVote ? '投票中' : '已结束')}</p>
      <p>投票截止: {deadline.toLocaleString()}</p>
      <p>票数: {proposal[6].toString()} 同意 / {proposal[7].toString()} 反对</p>
      
      {canVote && (
        <div>
          <button onClick={() => writeContract({ address: STATE_DAO_ADDRESS, abi: stateDaoAbi.abi, functionName: 'vote', args: [BigInt(proposalId), true] })}>同意</button>
          <button onClick={() => writeContract({ address: STATE_DAO_ADDRESS, abi: stateDaoAbi.abi, functionName: 'vote', args: [BigInt(proposalId), false] })} style={{marginLeft: '1rem'}}>反对</button>
        </div>
      )}

      {canExecute && (
        <button onClick={() => writeContract({ address: STATE_DAO_ADDRESS, abi: stateDaoAbi.abi, functionName: 'execute', args: [BigInt(proposalId)] })} style={{marginTop: '1rem'}}>执行提案</button>
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