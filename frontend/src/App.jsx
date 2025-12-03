import React, { useState, useEffect } from "react";
import { ethers } from "ethers"; // 使用ethers来编码calldata
import { formatUnits, parseUnits } from "viem";
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
  useChainId,
} from "wagmi";

// --- 关键配置：部署后请务必替换这些地址 ---
// Seven Kingdoms Configuration
const SEVEN_KINGDOMS = {
  Qin: {
    id: "Qin",
    name: "Qin",
    currency: { name: "Qin Ban Liang", symbol: "QBL" },
    contracts: {
      stateDao: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
      centralBank: "0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE",
      currency: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    },
    color: "#8B5CF6", // Purple
  },
  Chu: {
    id: "Chu",
    name: "Chu",
    currency: { name: "Ying Yuan", symbol: "CYY" },
    contracts: {
      stateDao: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // TODO: Update after deployment
      centralBank: "0x9A676e781A523b5d0C0e43731313A708CB607508",
      currency: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    },
    color: "#EF4444", // Red
  },
  Qi: {
    id: "Qi",
    name: "Qi",
    currency: { name: "Qi Fahua", symbol: "QFH" },
    contracts: {
      stateDao: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
      centralBank: "0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE",
      currency: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    },
    color: "#10B981", // Green
  },
  Yan: {
    id: "Yan",
    name: "Yan",
    currency: { name: "Yan Ming Dao", symbol: "YMD" },
    contracts: {
      stateDao: "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0",
      centralBank: "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d",
      currency: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
    },
    color: "#F59E0B", // Yellow
  },
  Zhao: {
    id: "Zhao",
    name: "Zhao",
    currency: { name: "Zhao Bu Bi", symbol: "ZBB" },
    contracts: {
      stateDao: "0x9A676e781A523b5d0C0e43731313A708CB607508",
      centralBank: "0x59b670e9fA9D0A427751Af201D676719a970857b",
      currency: "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
    },
    color: "#3B82F6", // Blue
  },
  Wei: {
    id: "Wei",
    name: "Wei",
    currency: { name: "Wei Bu Bi", symbol: "WBB" },
    contracts: {
      stateDao: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
      centralBank: "0x3Aa5ebB10DC797CAC828524e59A333d0A371443c",
      currency: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
    },
    color: "#F97316", // Orange
  },
  Han: {
    id: "Han",
    name: "Han",
    currency: { name: "Han Yuan Jin", symbol: "HYJ" },
    contracts: {
      stateDao: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
      centralBank: "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1",
      currency: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    },
    color: "#EC4899", // Pink
  },
};

// Default selected kingdom
const DEFAULT_KINGDOM = "Qin";

// Legacy constants (for backward compatibility)
const STATE_DAO_ADDRESS = SEVEN_KINGDOMS[DEFAULT_KINGDOM].contracts.stateDao;
const CENTRAL_BANK_ADDRESS =
  SEVEN_KINGDOMS[DEFAULT_KINGDOM].contracts.centralBank;
const CURRENCY_ADDRESS = SEVEN_KINGDOMS[DEFAULT_KINGDOM].contracts.currency;

// Network configuration
const SUPPORTED_NETWORKS = {
  1: "Ethereum Mainnet",
  11155111: "Sepolia Testnet",
  31337: "Hardhat Local Network",
};

// --- ABI文件导入 ---
import stateDaoAbi from "./abi/StateEconomy_Qin_StateDAO.json";
import centralBankAbi from "./abi/StateEconomy_Qin_CentralBank.json";
import currencyAbi from "./abi/StateEconomy_Qin_NationalCurrency.json";

// ABI files for different kingdoms
import stateDaoAbi_Chu from "./abi/StateEconomy_Chu_StateDAO.json";
import centralBankAbi_Chu from "./abi/StateEconomy_Chu_CentralBank.json";
import currencyAbi_Chu from "./abi/StateEconomy_Chu_NationalCurrency.json";

import stateDaoAbi_Qi from "./abi/StateEconomy_Qi_StateDAO.json";
import centralBankAbi_Qi from "./abi/StateEconomy_Qi_CentralBank.json";
import currencyAbi_Qi from "./abi/StateEconomy_Qi_NationalCurrency.json";

import stateDaoAbi_Yan from "./abi/StateEconomy_Yan_StateDAO.json";
import centralBankAbi_Yan from "./abi/StateEconomy_Yan_CentralBank.json";
import currencyAbi_Yan from "./abi/StateEconomy_Yan_NationalCurrency.json";

import stateDaoAbi_Zhao from "./abi/StateEconomy_Zhao_StateDAO.json";
import centralBankAbi_Zhao from "./abi/StateEconomy_Zhao_CentralBank.json";
import currencyAbi_Zhao from "./abi/StateEconomy_Zhao_NationalCurrency.json";

import stateDaoAbi_Wei from "./abi/StateEconomy_Wei_StateDAO.json";
import centralBankAbi_Wei from "./abi/StateEconomy_Wei_CentralBank.json";
import currencyAbi_Wei from "./abi/StateEconomy_Wei_NationalCurrency.json";

import stateDaoAbi_Han from "./abi/StateEconomy_Han_StateDAO.json";
import centralBankAbi_Han from "./abi/StateEconomy_Han_CentralBank.json";
import currencyAbi_Han from "./abi/StateEconomy_Han_NationalCurrency.json";

// Function to get ABI based on kingdom
function getKingdomABI(kingdomId, contractType) {
  const abiMap = {
    Qin: {
      stateDao: stateDaoAbi,
      centralBank: centralBankAbi,
      currency: currencyAbi,
    },
    Chu: {
      stateDao: stateDaoAbi_Chu,
      centralBank: centralBankAbi_Chu,
      currency: currencyAbi_Chu,
    },
    Qi: {
      stateDao: stateDaoAbi_Qi,
      centralBank: centralBankAbi_Qi,
      currency: currencyAbi_Qi,
    },
    Yan: {
      stateDao: stateDaoAbi_Yan,
      centralBank: centralBankAbi_Yan,
      currency: currencyAbi_Yan,
    },
    Zhao: {
      stateDao: stateDaoAbi_Zhao,
      centralBank: centralBankAbi_Zhao,
      currency: currencyAbi_Zhao,
    },
    Wei: {
      stateDao: stateDaoAbi_Wei,
      centralBank: centralBankAbi_Wei,
      currency: currencyAbi_Wei,
    },
    Han: {
      stateDao: stateDaoAbi_Han,
      centralBank: centralBankAbi_Han,
      currency: currencyAbi_Han,
    },
  };

  return abiMap[kingdomId]?.[contractType] || abiMap.Qin[contractType]; // fallback to Qin
}

// Kingdom Context for managing selected kingdom
const KingdomContext = React.createContext({
  selectedKingdom: DEFAULT_KINGDOM,
  setSelectedKingdom: () => {},
  currentConfig: SEVEN_KINGDOMS[DEFAULT_KINGDOM],
});

// Custom hook to use Kingdom context
function useKingdom() {
  const context = React.useContext(KingdomContext);
  if (!context) {
    throw new Error("useKingdom must be used within a KingdomProvider");
  }
  return context;
}

// Kingdom Provider component
function KingdomProvider({ children }) {
  const [selectedKingdom, setSelectedKingdom] = useState(() => {
    // 从localStorage获取保存的国家选择，如果没有则使用默认值
    const savedKingdom = localStorage.getItem("selectedKingdom");
    return savedKingdom && SEVEN_KINGDOMS[savedKingdom]
      ? savedKingdom
      : DEFAULT_KINGDOM;
  });

  const currentConfig = SEVEN_KINGDOMS[selectedKingdom];

  // 当selectedKingdom变化时，保存到localStorage
  useEffect(() => {
    localStorage.setItem("selectedKingdom", selectedKingdom);
  }, [selectedKingdom]);

  const value = {
    selectedKingdom,
    setSelectedKingdom,
    currentConfig,
  };

  return (
    <KingdomContext.Provider value={value}>{children}</KingdomContext.Provider>
  );
}

// Hook for contract deployment status
function useContractStatus() {
  const { currentConfig } = useKingdom();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [status, setStatus] = useState({
    allDeployed: false,
    individual: { stateDao: false, centralBank: false, currency: false },
    checking: true,
    error: null,
  });

  useEffect(() => {
    const checkStatus = async () => {
      if (!publicClient) return;

      setStatus((prev) => ({ ...prev, checking: true, error: null }));

      try {
        const [stateDaoCode, centralBankCode, currencyCode] = await Promise.all(
          [
            publicClient.getCode({ address: currentConfig.contracts.stateDao }),
            publicClient.getCode({
              address: currentConfig.contracts.centralBank,
            }),
            publicClient.getCode({ address: currentConfig.contracts.currency }),
          ],
        );

        const individual = {
          stateDao: stateDaoCode !== "0x",
          centralBank: centralBankCode !== "0x",
          currency: currencyCode !== "0x",
        };

        setStatus({
          allDeployed:
            individual.stateDao &&
            individual.centralBank &&
            individual.currency,
          individual,
          checking: false,
          error: null,
        });
      } catch (error) {
        setStatus({
          allDeployed: false,
          individual: { stateDao: false, centralBank: false, currency: false },
          checking: false,
          error: error.message,
        });
      }
    };

    checkStatus();
  }, [publicClient, chainId, currentConfig]);

  return status;
}

// System Status Icon Component
function SystemStatusIcon() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { currentConfig, selectedKingdom } = useKingdom();
  const stateDaoAbi = getKingdomABI(selectedKingdom, "stateDao");
  const centralBankAbi = getKingdomABI(selectedKingdom, "centralBank");
  const currencyAbi = getKingdomABI(selectedKingdom, "currency");

  const [contractStatus, setContractStatus] = useState({
    stateDao: null,
    centralBank: null,
    currency: null,
    checking: true,
    error: null,
  });
  const [lastCheckTime, setLastCheckTime] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const checkContracts = async () => {
    if (!publicClient) return;

    setContractStatus((prev) => ({ ...prev, checking: true, error: null }));

    try {
      // Check if addresses are valid
      if (
        !currentConfig.contracts.stateDao ||
        !currentConfig.contracts.centralBank ||
        !currentConfig.contracts.currency
      ) {
        throw new Error("Contract addresses not configured");
      }

      // Get bytecode for each contract
      const [stateDaoCode, centralBankCode, currencyCode] = await Promise.all([
        publicClient.getCode({ address: currentConfig.contracts.stateDao }),
        publicClient.getCode({ address: currentConfig.contracts.centralBank }),
        publicClient.getCode({ address: currentConfig.contracts.currency }),
      ]);

      // Additional check: Try to call a read function to verify contract is functional
      let functionalCheck = {
        stateDao: false,
        centralBank: false,
        currency: false,
      };

      if (stateDaoCode !== "0x") {
        try {
          await publicClient.readContract({
            address: currentConfig.contracts.stateDao,
            abi: stateDaoAbi.abi,
            functionName: "nextProposalId",
          });
          functionalCheck.stateDao = true;
        } catch (e) {
          console.warn("StateDAO deployed but not functional:", e.message);
        }
      }

      if (currencyCode !== "0x") {
        try {
          await publicClient.readContract({
            address: currentConfig.contracts.currency,
            abi: currencyAbi.abi,
            functionName: "name",
          });
          functionalCheck.currency = true;
        } catch (e) {
          console.warn("Currency deployed but not functional:", e.message);
        }
      }

      if (centralBankCode !== "0x") {
        try {
          await publicClient.readContract({
            address: currentConfig.contracts.centralBank,
            abi: centralBankAbi.abi,
            functionName: "stateDao",
          });
          functionalCheck.centralBank = true;
        } catch (e) {
          console.warn("CentralBank deployed but not functional:", e.message);
        }
      }

      setContractStatus({
        stateDao: stateDaoCode !== "0x" && functionalCheck.stateDao,
        centralBank: centralBankCode !== "0x" && functionalCheck.centralBank,
        currency: currencyCode !== "0x" && functionalCheck.currency,
        checking: false,
        error: null,
      });
      setLastCheckTime(new Date());
    } catch (error) {
      console.error("❌ Error checking contracts:", error);
      setContractStatus({
        stateDao: false,
        centralBank: false,
        currency: false,
        checking: false,
        error: error.message,
      });
      setLastCheckTime(new Date());
    }
  };

  useEffect(() => {
    checkContracts();
  }, [publicClient, chainId, selectedKingdom]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(checkContracts, 30000);
    return () => clearInterval(interval);
  }, [publicClient, selectedKingdom]);

  const networkName =
    SUPPORTED_NETWORKS[chainId] || `Unknown Network (${chainId})`;
  const allContractsDeployed =
    contractStatus.stateDao &&
    contractStatus.centralBank &&
    contractStatus.currency;

  const getStatusIcon = () => {
    if (contractStatus.checking) {
      return {
        icon: "⏳",
        color: "#f59e0b",
        title: "Checking contracts...",
      };
    }
    if (contractStatus.error) {
      return {
        icon: "❌",
        color: "#ef4444",
        title: "Contract check failed",
      };
    }
    if (allContractsDeployed) {
      return {
        icon: "✅",
        color: "#10b981",
        title: "All systems ready",
      };
    }
    return {
      icon: "⚠️",
      color: "#f59e0b",
      title: "Contracts not deployed",
    };
  };

  const status = getStatusIcon();

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
      onClick={() => setShowDetails(!showDetails)}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          backgroundColor: status.color + "20",
          border: `2px solid ${status.color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.2em",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        title={status.title}
      >
        {status.icon}
      </div>

      {showDetails && (
        <div
          style={{
            position: "absolute",
            top: "50px",
            right: "0",
            width: "320px",
            padding: "1rem",
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
          }}
        >
          <div style={{ marginBottom: "1rem" }}>
            <h4
              style={{
                margin: "0 0 0.5rem 0",
                color: status.color,
                fontSize: "1rem",
              }}
            >
              {status.icon} {status.title}
            </h4>
            <div style={{ fontSize: "0.85em", color: "#6b7280" }}>
              <div>
                <strong>Network:</strong> {networkName}
              </div>
              <div>
                <strong>Kingdom:</strong> {currentConfig.name}
              </div>
              <div>
                <strong>Last Check:</strong>{" "}
                {lastCheckTime?.toLocaleTimeString()}
              </div>
            </div>
          </div>

          {contractStatus.error ? (
            <div style={{ color: "#dc2626", fontSize: "0.9em" }}>
              <strong>Error:</strong> {contractStatus.error}
            </div>
          ) : (
            <div style={{ fontSize: "0.85em" }}>
              <div
                style={{
                  marginBottom: "0.5rem",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                Contract Status:
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "0.25rem 0.5rem",
                  alignItems: "center",
                }}
              >
                <span>{contractStatus.stateDao ? "✅" : "❌"}</span>
                <span style={{ color: "#6b7280" }}>StateDAO {currentConfig.contracts.stateDao}</span>

                <span>{contractStatus.centralBank ? "✅" : "❌"}</span>
                <span style={{ color: "#6b7280" }}>CentralBank {currentConfig.contracts.centralBank}</span>

                <span>{contractStatus.currency ? "✅" : "❌"}</span>
                <span style={{ color: "#6b7280" }}>Currency {currentConfig.contracts.currency}</span>
              </div>
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              checkContracts();
            }}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: status.color,
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.85em",
              width: "100%",
            }}
          >
            🔄 Refresh Status
          </button>
        </div>
      )}
    </div>
  );
}

// Contract verification and network status component
// 主应用组件
function App() {
  return (
    <KingdomProvider>
      <AppContent />
    </KingdomProvider>
  );
}

function AppContent() {
  const { isConnected } = useAccount();
  const contractStatus = useContractStatus();
  const { currentConfig, setSelectedKingdom } = useKingdom();

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "auto" }}>
      {/* First row - Wallet connection */}
      {isConnected && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "1rem",
            padding: "1rem",
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          <WalletConnect />
        </div>
      )}

      {/* Second row - Kingdom selector and system status */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          padding: "1rem",
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <select
            value={currentConfig.id}
            onChange={(e) => setSelectedKingdom(e.target.value)}
            style={{
              padding: "0.75rem 1rem",
              border: `2px solid ${currentConfig.color}`,
              borderRadius: "8px",
              backgroundColor: "white",
              color: currentConfig.color,
              fontSize: "1.1rem",
              fontWeight: "600",
              cursor: "pointer",
              minWidth: "200px",
            }}
          >
            {Object.values(SEVEN_KINGDOMS).map((kingdom) => (
              <option key={kingdom.id} value={kingdom.id}>
                {kingdom.name} ({kingdom.currency.symbol})
              </option>
            ))}
          </select>
        </div>

        <SystemStatusIcon />
      </div>

      {!isConnected && (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            backgroundColor: "#f0f9ff",
            borderRadius: "8px",
            border: "1px solid #bfdbfe",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ color: "#1e40af", margin: "0 0 1rem 0" }}>
            🔗 Connect Your Wallet
          </h2>
          <p style={{ color: "#3730a3", margin: "0 0 1rem 0" }}>
            Please connect your wallet to interact with the {currentConfig.name}{" "}
            DAO.
          </p>
          <WalletConnect />
        </div>
      )}

      {isConnected && (
        <main>
          {contractStatus.allDeployed ? (
            <>
              {/* <StateInfo />
              <hr style={{ margin: "2rem 0" }} /> */}
              <CreateMintProposal />
              <hr style={{ margin: "2rem 0" }} />
              <ProposalList />
              <hr style={{ margin: "2rem 0" }} />
              <EventLogs />
              <hr style={{ margin: "2rem 0" }} />
              <RealTimeEvents />
            </>
          ) : (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            >
              <h2 style={{ color: "#6b7280", margin: "0 0 1rem 0" }}>
                🛠️ Contracts Not Ready
              </h2>
              <p style={{ color: "#6b7280", margin: 0 }}>
                Please deploy the contracts for {currentConfig.name} first to
                use the application.
              </p>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

// 余额显示组件 - 可重用的余额监控组件
function BalanceDisplay({ address, label, color = "#374151", size = "1em" }) {
  const { currentConfig, selectedKingdom } = useKingdom();
  const currencyAbi = getKingdomABI(selectedKingdom, "currency");

  const {
    data: balance,
    refetch,
    error,
    isError,
  } = useReadContract({
    address: currentConfig.contracts.currency,
    abi: currencyAbi.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    watch: true, // 自动监听更新
    enabled: !!address,
  });

  // 监听Transfer事件来触发余额刷新
  useWatchContractEvent({
    address: currentConfig.contracts.currency,
    abi: currencyAbi.abi,
    eventName: "Transfer",
    onLogs: (logs) => {
      // 只在涉及当前地址的转账时才刷新
      const isRelevant = logs.some(
        (log) => log.args?.from === address || log.args?.to === address,
      );
      if (isRelevant) {
        refetch();
      }
    },
    enabled: !!address && !isError,
  });

  if (!address) return <span style={{ color: "#9ca3af" }}>Not Available</span>;

  if (isError) {
    return (
      <span style={{ color: "#ef4444", fontSize: size }}>
        Contract Error
        {label && (
          <small
            style={{
              marginLeft: "0.5rem",
              color: "#6b7280",
              fontWeight: "normal",
            }}
          >
            ({label})
          </small>
        )}
      </span>
    );
  }

  return (
    <span
      style={{
        color,
        fontSize: size,
        fontFamily: "monospace",
        fontWeight: "600",
      }}
    >
      {balance !== undefined
        ? `${formatUnits(balance, 18)} ${currentConfig.currency.symbol}`
        : "Loading..."}
      {label && (
        <small
          style={{
            marginLeft: "0.5rem",
            color: "#6b7280",
            fontWeight: "normal",
          }}
        >
          ({label})
        </small>
      )}
    </span>
  );
}

// 钱包连接组件
function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { currentConfig, selectedKingdom } = useKingdom();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();

  const metaMaskConnector = connectors.find((c) => c.id === "metaMaskSDK");

  if (isConnected) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>
              Connected: {`${address.slice(0, 6)}...${address.slice(-4)}`}
            </span>
            <button
              onClick={() => disconnect()}
              style={{ padding: "0.25rem 0.5rem", fontSize: "0.8em" }}
            >
              Disconnect
            </button>
          </div>
          <div
            style={{
              fontSize: "0.9em",
              color: "#374151",
              marginTop: "0.25rem",
            }}
          >
            Balance: <BalanceDisplay address={address} color="#059669" />/
            <BalanceDisplay address={currentConfig.contracts.stateDao} color="#059669" />/
            <BalanceDisplay address={currentConfig.contracts.centralBank} color="#059669" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <button onClick={() => connect({ connector: metaMaskConnector })}>
      Connect Wallet
    </button>
  );
}

// 显示state信息的组件
function StateInfo() {
  const { address } = useAccount();
  const { currentConfig, selectedKingdom } = useKingdom();
  const currencyAbi = getKingdomABI(selectedKingdom, "currency");

  // 查询DAO合约（State Bank）的余额 - 自动更新
  const { data: treasuryBalance, refetch: refetchTreasuryBalance } =
    useReadContract({
      address: currentConfig.contracts.currency,
      abi: currencyAbi.abi,
      functionName: "balanceOf",
      args: [currentConfig.contracts.stateDao],
      watch: true, // 启用自动监听
    });

  // 查询用户钱包余额 - 自动更新
  const { data: userBalance, refetch: refetchUserBalance } = useReadContract({
    address: currentConfig.contracts.currency,
    abi: currencyAbi.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    watch: true, // 启用自动监听
    enabled: !!address,
  });

  // 查询央行余额 - 自动更新
  const { data: centralBankBalance, refetch: refetchCentralBankBalance } =
    useReadContract({
      address: currentConfig.contracts.currency,
      abi: currencyAbi.abi,
      functionName: "balanceOf",
      args: [currentConfig.contracts.centralBank],
      watch: true, // 启用自动监听
    });

  // 监听新区块来刷新所有余额 (备用刷新机制)
  useBlock({
    onBlock: () => {
      refetchTreasuryBalance();
      refetchUserBalance();
      refetchCentralBankBalance();
    },
  });

  // 监听Transfer事件来触发余额刷新
  useWatchContractEvent({
    address: currentConfig.contracts.currency,
    abi: currencyAbi.abi,
    eventName: "Transfer",
    onLogs: () => {
      // 当有转账事件时，刷新所有相关余额
      refetchTreasuryBalance();
      refetchUserBalance();
      refetchCentralBankBalance();
    },
  });

  return (
    <section>
      <h2 style={{ color: currentConfig.color }}>{currentConfig.name} Status</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        {/* <div
          style={{
            padding: "1rem",
            border: `2px solid ${currentConfig.color}40`,
            borderRadius: "8px",
            backgroundColor: "#f9fafb",
          }}
        >
          <h3 style={{ margin: "0 0 0.5rem 0", color: currentConfig.color }}>
            合约地址
          </h3>
          <p>
            <strong>StateDAO (State Bank):</strong>
            <br />
            <code style={{ fontSize: "0.8em", wordBreak: "break-all" }}>
              {currentConfig.contracts.stateDao}
            </code>
          </p>
          <p>
            <strong>Central Bank:</strong>
            <br />
            <code style={{ fontSize: "0.8em", wordBreak: "break-all" }}>
              {currentConfig.contracts.centralBank}
            </code>
          </p>
          <p>
            <strong>{currentConfig.currency.name}:</strong>
            <br />
            <code style={{ fontSize: "0.8em", wordBreak: "break-all" }}>
              {currentConfig.contracts.currency}
            </code>
          </p>
        </div> */}

        <div
          style={{
            padding: "1rem",
            border: `2px solid ${currentConfig.color}40`,
            borderRadius: "8px",
            backgroundColor: currentConfig.color + "10",
          }}
        >
          <h3 style={{ margin: "0 0 0.5rem 0", color: currentConfig.color }}>
            Balance
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                backgroundColor: "#10b981",
                borderRadius: "50%",
                marginRight: "0.5rem",
              }}
            ></span>
            <strong>Balance:</strong>
          </div>
          <p
            style={{
              fontSize: "1.2em",
              color: "#059669",
              margin: "0 0 1rem 1rem",
              fontFamily: "monospace",
            }}
          >
            {address
              ? userBalance !== undefined
                ? `${formatUnits(userBalance, 18)} ${currentConfig.currency.symbol}`
                : "Loading..."
              : "Not Connected"}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                backgroundColor: currentConfig.color,
                borderRadius: "50%",
                marginRight: "0.5rem",
              }}
            ></span>
            <strong>State Bank Balance:</strong>
          </div>
          <p
            style={{
              fontSize: "1.2em",
              color: currentConfig.color,
              margin: "0 0 1rem 1rem",
              fontFamily: "monospace",
            }}
          >
            {treasuryBalance !== undefined
              ? `${formatUnits(treasuryBalance, 18)} ${currentConfig.currency.symbol}`
              : "Loading..."}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                backgroundColor: "#f59e0b",
                borderRadius: "50%",
                marginRight: "0.5rem",
              }}
            ></span>
            <strong>Central Bank Balance:</strong>
          </div>
          <p
            style={{
              fontSize: "1.2em",
              color: "#d97706",
              margin: "0 0 0 1rem",
              fontFamily: "monospace",
            }}
          >
            {centralBankBalance !== undefined
              ? `${formatUnits(centralBankBalance, 18)} ${currentConfig.currency.symbol}`
              : "Loading..."}
          </p>
        </div>
      </div>
    </section>
  );
}

// 创建铸币提案的组件
function CreateMintProposal() {
  const [amount, setAmount] = useState("");
  const { data: hash, writeContract, error: writeError } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });
  const contractStatus = useContractStatus();
  const { currentConfig, selectedKingdom } = useKingdom();
  const stateDaoAbi = getKingdomABI(selectedKingdom, "stateDao");
  const centralBankAbi = getKingdomABI(selectedKingdom, "centralBank");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) return;

    // Check if contracts are deployed before proceeding
    if (!contractStatus.allDeployed) {
      alert("⚠️ Contracts not deployed! Please deploy contracts first.");
      return;
    }

    try {
      const centralBankInterface = new ethers.Interface(centralBankAbi.abi);
      const amountInWei = parseUnits(amount, 18);
      const calldata = centralBankInterface.encodeFunctionData(
        "issueCurrency",
        [amountInWei],
      );

      writeContract({
        address: currentConfig.contracts.stateDao,
        abi: stateDaoAbi.abi,
        functionName: "createProposal",
        args: [
          currentConfig.contracts.centralBank, // target
          calldata, // calldata
          `Issue ${amount} new ${currentConfig.currency.symbol} currency units to the treasury`, // description
        ],
      });
    } catch (error) {
      console.error("Error creating proposal:", error);
      alert("❌ Error creating proposal: " + error.message);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      setAmount("");
    }
  }, [isSuccess]);

  // Show loading state while checking contracts
  if (contractStatus.checking) {
    return (
      <section>
        <h2>Create Minting Proposal</h2>
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#f9fafb",
            borderRadius: "6px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#6b7280", margin: 0 }}>
            Checking contract status...
          </p>
        </div>
      </section>
    );
  }

  // Show error if contracts not deployed
  if (!contractStatus.allDeployed) {
    return (
      <section>
        <h2>Create Minting Proposal</h2>
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#fef2f2",
            border: "1px solid #ef4444",
            borderRadius: "6px",
          }}
        >
          <p
            style={{
              color: "#dc2626",
              margin: "0 0 0.5rem 0",
              fontWeight: "bold",
            }}
          >
            ⚠️ Contracts Required
          </p>
          <p style={{ color: "#991b1b", margin: 0, fontSize: "0.9em" }}>
            Cannot create proposals until all contracts are deployed and
            functional.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 style={{ color: currentConfig.color }}>
        Create {currentConfig.name} Minting Proposal
      </h2>

      {/* Kingdom indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "1rem",
          padding: "0.5rem 1rem",
          backgroundColor: currentConfig.color + "20",
          borderRadius: "6px",
          border: `1px solid ${currentConfig.color}40`,
        }}
      >
        <span style={{ color: currentConfig.color, fontSize: "1.2em" }}>
          🏰
        </span>
        <span
          style={{
            color: currentConfig.color,
            fontSize: "0.9em",
            fontWeight: "600",
          }}
        >
          Current kingdom: {currentConfig.name} | Currency: {currentConfig.currency.symbol}
        </span>
      </div>

      {/* Contract status indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "1rem",
          padding: "0.5rem 1rem",
          backgroundColor: "#ecfdf5",
          borderRadius: "6px",
          border: "1px solid #10b981",
        }}
      >
        <span style={{ color: "#10b981", fontSize: "1.2em" }}>✅</span>
        <span style={{ color: "#065f46", fontSize: "0.9em" }}>
          All contracts ready for proposal creation
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Minting amount"
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "1rem",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !contractStatus.allDeployed}
          style={{
            backgroundColor:
              isLoading || !contractStatus.allDeployed ? "#9ca3af" : "#3b82f6",
            color: "white",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "6px",
            cursor:
              isLoading || !contractStatus.allDeployed
                ? "not-allowed"
                : "pointer",
            fontSize: "1rem",
            fontWeight: "600",
          }}
        >
          {isLoading ? "Submitting..." : "Submit"}
        </button>
      </form>

      {isLoading && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#fef3c7",
            borderRadius: "6px",
          }}
        >
          <p style={{ color: "#92400e", margin: 0 }}>⏳ Wait for confirmation...</p>
        </div>
      )}

      {isSuccess && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#ecfdf5",
            borderRadius: "6px",
          }}
        >
          <p style={{ color: "#065f46", margin: 0 }}>
            ✅ Creation Success! <br />
            <small>
              Tx: <code style={{ fontSize: "0.8em" }}>{hash}</code>
            </small>
          </p>
        </div>
      )}

      {writeError && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#fef2f2",
            borderRadius: "6px",
          }}
        >
          <p style={{ color: "#dc2626", margin: 0 }}>
            ❌ Creation Fail: {writeError.message}
          </p>
        </div>
      )}
    </section>
  );
}

// 提案列表组件
function ProposalList() {
  const contractStatus = useContractStatus();
  const { currentConfig, selectedKingdom } = useKingdom();
  const stateDaoAbi = getKingdomABI(selectedKingdom, "stateDao");
  const [newProposalDetected, setNewProposalDetected] = useState(false);

  const {
    data: nextProposalId,
    error: proposalError,
    refetch: refetchNextProposalId,
  } = useReadContract({
    address: currentConfig.contracts.stateDao,
    abi: stateDaoAbi.abi,
    functionName: "nextProposalId",
    watch: true,
    enabled: contractStatus.allDeployed,
  });

  // 监听新提案创建事件
  useWatchContractEvent({
    address: currentConfig.contracts.stateDao,
    abi: stateDaoAbi.abi,
    eventName: "ProposalCreated",
    onLogs: (logs) => {
      if (logs.length > 0) {
        console.log("New proposal created:", logs);
        setNewProposalDetected(true);
        // 强制刷新提案列表
        refetchNextProposalId();
        // 3秒后清除新提案提示
        setTimeout(() => setNewProposalDetected(false), 3000);
      }
    },
  });

  // Show loading state while checking contracts
  if (contractStatus.checking) {
    return (
      <section>
        <h2>Proposal List</h2>
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#f9fafb",
            borderRadius: "6px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#6b7280", margin: 0 }}>
            Checking contract status...
          </p>
        </div>
      </section>
    );
  }

  // Show error if contracts not deployed
  if (!contractStatus.allDeployed) {
    return (
      <section>
        <h2>Proposal List</h2>
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#fef2f2",
            border: "1px solid #ef4444",
            borderRadius: "6px",
          }}
        >
          <p
            style={{
              color: "#dc2626",
              margin: "0 0 0.5rem 0",
              fontWeight: "bold",
            }}
          >
            ⚠️ Cannot Load Proposals
          </p>
          <p style={{ color: "#991b1b", margin: 0, fontSize: "0.9em" }}>
            StateDAO contract is not deployed or accessible.
          </p>
        </div>
      </section>
    );
  }

  if (proposalError) {
    return (
      <section>
        <h2>Proposal List</h2>
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#fef2f2",
            border: "1px solid #ef4444",
            borderRadius: "6px",
          }}
        >
          <p
            style={{
              color: "#dc2626",
              margin: "0 0 0.5rem 0",
              fontWeight: "bold",
            }}
          >
            ❌ Error Loading Proposals
          </p>
          <p style={{ color: "#991b1b", margin: 0, fontSize: "0.9em" }}>
            {proposalError.message}
          </p>
        </div>
      </section>
    );
  }

  const proposalIds = nextProposalId
    ? Array.from({ length: Number(nextProposalId) }, (_, i) => i)
    : [];

  return (
    <section>
      <h2>Proposal List</h2>

      {/* Status indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "1rem",
          padding: "0.5rem 1rem",
          backgroundColor: newProposalDetected ? "#fffbeb" : "#ecfdf5",
          borderRadius: "6px",
          border: newProposalDetected
            ? "1px solid #f59e0b"
            : "1px solid #10b981",
        }}
      >
        <span
          style={{
            color: newProposalDetected ? "#f59e0b" : "#10b981",
            fontSize: "1.2em",
          }}
        >
          {newProposalDetected ? "🔄" : "✅"}
        </span>
        <span
          style={{
            color: newProposalDetected ? "#92400e" : "#065f46",
            fontSize: "0.9em",
          }}
        >
          {newProposalDetected
            ? "New proposal detected! Refreshing..."
            : `Connected to StateDAO | Total Proposals: ${proposalIds.length}`}
        </span>
      </div>

      {proposalIds.length === 0 ? (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            backgroundColor: "#f9fafb",
            borderRadius: "6px",
            border: "1px solid #e5e7eb",
          }}
        >
          <p style={{ color: "#6b7280", margin: 0 }}>📜 暂无提案</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column-reverse" }}>
          {proposalIds.map((id) => (
            <ProposalCard key={id} proposalId={id} />
          ))}
        </div>
      )}
    </section>
  );
}

// 单个提案卡片组件
function ProposalCard({ proposalId }) {
  const { currentConfig, selectedKingdom } = useKingdom();
  const stateDaoAbi = getKingdomABI(selectedKingdom, "stateDao");

  const { data: proposal, refetch } = useReadContract({
    address: currentConfig.contracts.stateDao,
    abi: stateDaoAbi.abi,
    functionName: "proposals",
    args: [BigInt(proposalId)],
    watch: true, // 自动监听提案状态变化
  });

  const { data: block } = useBlock({ watch: true });
  const { data: hash, writeContract } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  const [executionStatus, setExecutionStatus] = useState(null);

  // 监听提案执行事件
  useWatchContractEvent({
    address: currentConfig.contracts.stateDao,
    abi: stateDaoAbi.abi,
    eventName: "ProposalExecuted",
    onLogs: (logs) => {
      const relevantLog = logs.find(
        (log) => log.args?.proposalId?.toString() === proposalId.toString(),
      );
      if (relevantLog) {
        setExecutionStatus("executed");
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
  const now = new Date();
  const isExecuted = proposal[8];
  const canVote = now < deadline && !isExecuted;
  const canExecute = !canVote && !isExecuted && proposal[6] > proposal[7]; // yesVotes > noVotes

  // 尝试解析提案类型
  const proposalType =
    proposal[2].includes("Issue") || proposal[2].includes("铸")
      ? "mint"
      : "other";

  return (
    <div
      style={{
        border: isExecuted ? "2px solid #10b981" : "1px solid #d1d5db",
        padding: "1rem",
        marginBottom: "1rem",
        borderRadius: "8px",
        backgroundColor: isExecuted ? "#f0f9ff" : "white",
        boxShadow: isExecuted
          ? "0 4px 6px rgba(16, 185, 129, 0.1)"
          : "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1rem",
        }}
      >
        <h3 style={{ margin: 0, color: isExecuted ? "#059669" : "#374151" }}>
          提案 #{proposal[0].toString()}: {proposal[2]}
          {isExecuted && (
            <span
              style={{
                marginLeft: "0.5rem",
                fontSize: "0.8em",
                color: "#10b981",
              }}
            >
              ✓ Executed
            </span>
          )}
          {executionStatus === "executed" && (
            <span
              style={{
                marginLeft: "0.5rem",
                fontSize: "0.8em",
                color: "#f59e0b",
              }}
            >
              🔄 Updating...
            </span>
          )}
        </h3>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div>
          <p>
            <strong>Creator:</strong>{" "}
            <code style={{ fontSize: "0.8em" }}>
              {proposal[1].slice(0, 10)}...
            </code>
          </p>
          <p>
            <strong>Status:</strong>
            <span
              style={{
                padding: "0.25rem 0.5rem",
                borderRadius: "12px",
                fontSize: "0.8em",
                marginLeft: "0.5rem",
                backgroundColor: isExecuted
                  ? "#dcfce7"
                  : canVote
                    ? "#fef3c7"
                    : "#f3f4f6",
                color: isExecuted ? "#065f46" : canVote ? "#92400e" : "#374151",
              }}
            >
              {isExecuted ? "已执行" : canVote ? "投票中" : "已结束"}
            </span>
          </p>
        </div>
        <div>
          <p>
            <strong>Voting Deadline:</strong> {deadline.toLocaleString()}
          </p>
          <p>
            <strong>Tickets:</strong>
            <span
              style={{
                color: "#059669",
                fontWeight: "600",
                marginLeft: "0.5rem",
              }}
            >
              {proposal[6].toString()} Agree
            </span>{" "}
            /
            <span
              style={{
                color: "#dc2626",
                fontWeight: "600",
                marginLeft: "0.25rem",
              }}
            >
              {proposal[7].toString()} Deny
            </span>
          </p>
        </div>
      </div>

      {/* 如果是铸币提案且已执行，显示余额影响 */}
      {isExecuted && proposalType === "mint" && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#ecfdf5",
            borderRadius: "6px",
            border: "1px solid #10b981",
            marginBottom: "1rem",
          }}
        >
          <h4 style={{ margin: "0 0 0.5rem 0", color: "#065f46" }}>
            Minting success ✓
          </h4>
          <p style={{ margin: "0", fontSize: "0.9em", color: "#047857" }}>
            New minted corn is transfered to State Bank
          </p>
        </div>
      )}

      {canVote && (
        <div style={{ marginBottom: "1rem" }}>
          <button
            onClick={() =>
              writeContract({
                address: currentConfig.contracts.stateDao,
                abi: stateDaoAbi.abi,
                functionName: "vote",
                args: [BigInt(proposalId), true],
              })
            }
            style={{
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              cursor: "pointer",
              marginRight: "0.5rem",
            }}
          >
            Agree
          </button>
          <button
            onClick={() =>
              writeContract({
                address: currentConfig.contracts.stateDao,
                abi: stateDaoAbi.abi,
                functionName: "vote",
                args: [BigInt(proposalId), false],
              })
            }
            style={{
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Deny
          </button>
        </div>
      )}

      {canExecute && (
        <button
          onClick={() =>
            writeContract({
              address: currentConfig.contracts.stateDao,
              abi: stateDaoAbi.abi,
              functionName: "execute",
              args: [BigInt(proposalId)],
            })
          }
          style={{
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "1em",
            fontWeight: "600",
          }}
        >
          Execute Proposal
        </button>
      )}
    </div>
  );
}

// 事件日志读取组件
function EventLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState("stateDao");
  const [blockRange, setBlockRange] = useState({
    from: "latest-100",
    to: "latest",
  });
  const publicClient = usePublicClient();
  const { currentConfig, selectedKingdom } = useKingdom();

  // 获取日志的函数
  const fetchLogs = async () => {
    if (!publicClient) return;

    setLoading(true);
    try {
      const contractConfig = getContractConfig(selectedContract);

      // 计算区块范围
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock =
        blockRange.from === "latest-100"
          ? currentBlock - 100n
          : BigInt(blockRange.from);
      const toBlock =
        blockRange.to === "latest" ? currentBlock : BigInt(blockRange.to);

      const contractLogs = await publicClient.getLogs({
        address: contractConfig.address,
        events: contractConfig.events,
        fromBlock: fromBlock,
        toBlock: toBlock,
      });

      // 获取区块信息来显示时间戳
      const logsWithDetails = await Promise.all(
        contractLogs.map(async (log) => {
          const block = await publicClient.getBlock({
            blockHash: log.blockHash,
          });
          return {
            ...log,
            timestamp: new Date(Number(block.timestamp) * 1000),
            eventName: log.eventName,
            args: log.args,
          };
        }),
      );

      setLogs(logsWithDetails.sort((a, b) => b.blockNumber - a.blockNumber));
    } catch (error) {
      console.error("获取日志失败:", error);
      alert("获取日志失败: " + error.message);
    }
    setLoading(false);
  };

  // 获取合约配置
  const getContractConfig = (contractType) => {
    switch (contractType) {
      case "stateDao":
        return {
          address: currentConfig.contracts.stateDao,
          events: [
            {
              name: "ProposalCreated",
              type: "event",
              inputs: [
                { name: "id", type: "uint256", indexed: false },
                { name: "proposer", type: "address", indexed: true },
                { name: "description", type: "string", indexed: false },
                { name: "target", type: "address", indexed: false },
                { name: "deadline", type: "uint256", indexed: false },
              ],
            },
            {
              name: "Voted",
              type: "event",
              inputs: [
                { name: "proposalId", type: "uint256", indexed: true },
                { name: "voter", type: "address", indexed: true },
                { name: "support", type: "bool", indexed: false },
              ],
            },
            {
              name: "ProposalExecuted",
              type: "event",
              inputs: [{ name: "proposalId", type: "uint256", indexed: true }],
            },
          ],
        };
      case "centralBank":
        return {
          address: currentConfig.contracts.centralBank,
          events: [
            {
              name: "CurrencyIssued",
              type: "event",
              inputs: [
                { name: "amount", type: "uint256", indexed: false },
                { name: "recipient", type: "address", indexed: true },
              ],
            },
          ],
        };
      case "currency":
        return {
          address: currentConfig.contracts.currency,
          events: [
            {
              name: "Transfer",
              type: "event",
              inputs: [
                { name: "from", type: "address", indexed: true },
                { name: "to", type: "address", indexed: true },
                { name: "value", type: "uint256", indexed: false },
              ],
            },
            {
              name: "Approval",
              type: "event",
              inputs: [
                { name: "owner", type: "address", indexed: true },
                { name: "spender", type: "address", indexed: true },
                { name: "value", type: "uint256", indexed: false },
              ],
            },
          ],
        };
      default:
        return { address: currentConfig.contracts.stateDao, events: [] };
    }
  };

  // 格式化事件参数显示
  const formatEventArgs = (eventName, args) => {
    if (!args) return "";

    switch (eventName) {
      case "ProposalCreated":
        return `提案ID: ${args.id?.toString()}, 发起人: ${args.proposer}, 描述: ${args.description}, 目标: ${args.target}`;
      case "Voted":
        return `提案ID: ${args.proposalId?.toString()}, 投票人: ${args.voter}, 支持: ${args.support ? "是" : "否"}`;
      case "ProposalExecuted":
        return `提案ID: ${args.proposalId?.toString()}`;
      case "Transfer":
        return `从: ${args.from}, 到: ${args.to}, 数量: ${args.value ? formatUnits(args.value, 18) : "0"} ${currentConfig.currency.symbol}`;
      case "CurrencyIssued":
        return `数量: ${args.amount ? formatUnits(args.amount, 18) : "0"} ${currentConfig.currency.symbol}, 接收人: ${args.recipient}`;
      case "Approval":
        return `所有者: ${args.owner}, 授权给: ${args.spender}, 数量: ${args.value ? formatUnits(args.value, 18) : "0"} ${currentConfig.currency.symbol}`;
      default:
        return JSON.stringify(args);
    }
  };

  return (
    <section>
      <h2>Execution Log</h2>

      <div style={{ marginBottom: "1rem" }}>
        <label>
          Select contract:
          <select
            value={selectedContract}
            onChange={(e) => setSelectedContract(e.target.value)}
            style={{ marginLeft: "0.5rem" }}
          >
            <option value="stateDao">StateDAO (治理合约)</option>
            <option value="centralBank">CentralBank (央行)</option>
            <option value="currency">Currency (货币合约)</option>
          </select>
        </label>

        <label style={{ marginLeft: "1rem" }}>
          Start Block:
          <input
            type="text"
            value={blockRange.from}
            onChange={(e) =>
              setBlockRange((prev) => ({ ...prev, from: e.target.value }))
            }
            placeholder="latest-100 或区块号"
            style={{ marginLeft: "0.5rem", width: "120px" }}
          />
        </label>

        <label style={{ marginLeft: "1rem" }}>
          End Block:
          <input
            type="text"
            value={blockRange.to}
            onChange={(e) =>
              setBlockRange((prev) => ({ ...prev, to: e.target.value }))
            }
            placeholder="latest 或区块号"
            style={{ marginLeft: "0.5rem", width: "120px" }}
          />
        </label>

        <button
          onClick={fetchLogs}
          disabled={loading}
          style={{ marginLeft: "1rem" }}
        >
          {loading ? "获取中..." : "获取日志"}
        </button>
      </div>

      <div
        style={{
          maxHeight: "400px",
          overflowY: "auto",
          border: "1px solid #ddd",
          borderRadius: "4px",
        }}
      >
        {logs.length === 0 ? (
          <p style={{ padding: "1rem", textAlign: "center", color: "#666" }}>
            No Data
          </p>
        ) : (
          logs.map((log, index) => (
            <div
              key={`${log.transactionHash}-${log.logIndex}`}
              style={{
                padding: "1rem",
                borderBottom:
                  index < logs.length - 1 ? "1px solid #eee" : "none",
                backgroundColor: index % 2 === 0 ? "#f9f9f9" : "white",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <strong style={{ color: "#2563eb" }}>{log.eventName}</strong>
                  <div
                    style={{
                      fontSize: "0.9em",
                      color: "#666",
                      margin: "0.25rem 0",
                    }}
                  >
                    时间: {log.timestamp?.toLocaleString()}
                  </div>
                  <div
                    style={{
                      fontSize: "0.9em",
                      color: "#666",
                      margin: "0.25rem 0",
                    }}
                  >
                    区块: {log.blockNumber?.toString()} | 交易:{" "}
                    {log.transactionHash?.slice(0, 10)}...
                  </div>
                  <div style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
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
  const { currentConfig, selectedKingdom } = useKingdom();
  const stateDaoAbi = getKingdomABI(selectedKingdom, "stateDao");
  const currencyAbi = getKingdomABI(selectedKingdom, "currency");

  // 监听 StateDAO 事件
  useWatchContractEvent({
    address: currentConfig.contracts.stateDao,
    abi: stateDaoAbi.abi,
    eventName: "ProposalCreated",
    enabled: isMonitoring,
    onLogs: (logs) => {
      logs.forEach((log) => addRealtimeLog("ProposalCreated", log));
    },
  });

  useWatchContractEvent({
    address: currentConfig.contracts.stateDao,
    abi: stateDaoAbi.abi,
    eventName: "Voted",
    enabled: isMonitoring,
    onLogs: (logs) => {
      logs.forEach((log) => addRealtimeLog("Voted", log));
    },
  });

  useWatchContractEvent({
    address: currentConfig.contracts.stateDao,
    abi: stateDaoAbi.abi,
    eventName: "ProposalExecuted",
    enabled: isMonitoring,
    onLogs: (logs) => {
      logs.forEach((log) => addRealtimeLog("ProposalExecuted", log));
    },
  });

  // 监听 Currency 事件 (Transfer)
  useWatchContractEvent({
    address: currentConfig.contracts.currency,
    abi: currencyAbi.abi,
    eventName: "Transfer",
    enabled: isMonitoring,
    onLogs: (logs) => {
      logs.forEach((log) => addRealtimeLog("Transfer", log));
    },
  });

  const addRealtimeLog = (eventName, log) => {
    if (!isMonitoring) return;

    const newLog = {
      ...log,
      eventName,
      timestamp: new Date(),
      id: `${log.transactionHash}-${log.logIndex}-${Date.now()}`,
    };

    setRealtimeLogs((prev) => [newLog, ...prev.slice(0, 19)]); // 保持最新20条
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    if (!isMonitoring) {
      setRealtimeLogs([]); // 开始监听时清空日志
    }
  };

  const formatRealtimeEventArgs = (eventName, args) => {
    if (!args) return "";

    switch (eventName) {
      case "ProposalCreated":
        return `New Proposal #${args.id?.toString()}: ${args.description}`;
      case "Voted":
        return `Proposal #${args.proposalId?.toString()} received ${args.support ? "Support" : "Objection"} Ticket`;
      case "ProposalExecuted":
        return `Proposal #${args.proposalId?.toString()} is executed`;
      case "Transfer":
        const amount = args.value ? formatUnits(args.value, 18) : "0";
        return `Transfer: ${amount} ${currentConfig.currency.symbol} from ${args.from?.slice(0, 8)}... to ${args.to?.slice(0, 8)}...`;
      default:
        return JSON.stringify(args);
    }
  };

  return (
    <section>
      <h2>Event Monitoring</h2>

      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={toggleMonitoring}
          style={{
            backgroundColor: isMonitoring ? "#dc2626" : "#16a34a",
            color: "white",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {isMonitoring ? "Stop" : "Start"}
        </button>
        <span style={{ marginLeft: "1rem", color: "#666" }}>
          状态: {isMonitoring ? "监听中" : "已停止"}
        </span>
        {realtimeLogs.length > 0 && (
          <button
            onClick={() => setRealtimeLogs([])}
            style={{ marginLeft: "1rem", padding: "0.25rem 0.5rem" }}
          >
            clear
          </button>
        )}
      </div>

      <div
        style={{
          height: "300px",
          overflowY: "auto",
          border: "1px solid #ddd",
          borderRadius: "4px",
          backgroundColor: "#f8f9fa",
        }}
      >
        {realtimeLogs.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#666",
              fontStyle: "italic",
            }}
          >
            {isMonitoring ? "waiting for events..." : "click to \"start\" to start monitoring."}
          </div>
        ) : (
          realtimeLogs.map((log) => (
            <div
              key={log.id}
              style={{
                padding: "0.75rem",
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "white",
                margin: "0.25rem",
                borderRadius: "4px",
                borderLeft: "3px solid #3b82f6",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <strong style={{ color: "#1e40af" }}>{log.eventName}</strong>
                  <div
                    style={{
                      fontSize: "0.85em",
                      color: "#6b7280",
                      marginTop: "0.25rem",
                    }}
                  >
                    {log.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                <div style={{ fontSize: "0.75em", color: "#9ca3af" }}>
                  区块: {log.blockNumber?.toString()}
                </div>
              </div>
              <div
                style={{
                  fontSize: "0.9em",
                  marginTop: "0.5rem",
                  color: "#374151",
                }}
              >
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
