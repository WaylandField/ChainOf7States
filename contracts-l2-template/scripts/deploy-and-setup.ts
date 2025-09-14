import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { formatEther } from "viem";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Type definitions
interface DeploymentInfo {
  network: string;
  chainId: number | undefined;
  timestamp: string;
  deployer: string;
  contracts: {
    StateDAO: string;
    CentralBank: string;
    NationalCurrency: string;
  };
  goldAddress: string;
}

async function main(): Promise<void> {
  console.log("🚀 Starting deployment of State Economy contracts...");
  console.log("Network:", (hre.network as any).name);
  
  // Use Viem instead of ethers
  const publicClient = await (hre as any).viem.getPublicClient();
  const [deployer] = await (hre as any).viem.getWalletClients();
  
  console.log("Deploying from account:", deployer.account.address);
  const balance = await publicClient.getBalance({ address: deployer.account.address });
  console.log("Account balance:", formatEther(balance), "ETH");

  // Deploy contracts for Qin state
  console.log("\n📜 Deploying Qin State Economy...");
  
  // 1. Deploy National Currency
  console.log("Deploying NationalCurrency...");
  const currency = await (hre as any).viem.deployContract("NationalCurrency", ["Qin Ban Liang", "QBL"]);
  console.log(`✅ NationalCurrency deployed to: ${currency.address}`);

  // 2. Deploy StateDAO
  console.log("Deploying StateDAO...");
  const stateDAO = await (hre as any).viem.deployContract("StateDAO", [
    [deployer.account.address], // members array
    10n, // voting period in seconds (BigInt)
    50n  // quorum percentage (BigInt)
  ]);
  console.log(`✅ StateDAO deployed to: ${stateDAO.address}`);

  // 3. Deploy CentralBank 
  console.log("Deploying CentralBank...");
  const goldAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 
  const centralBank = await (hre as any).viem.deployContract("CentralBank", [
    stateDAO.address,
    currency.address,
    goldAddress
  ]);
  console.log(`✅ CentralBank deployed to: ${centralBank.address}`);

  // 4. Setup permissions
  console.log("\n🔐 Setting up permissions...");
  
  // Get contract instance
  const currencyContract = await (hre as any).viem.getContractAt("NationalCurrency", currency.address);
  
  // Get MINTER_ROLE
  const MINTER_ROLE = await currencyContract.read.MINTER_ROLE();
  console.log("Granting MINTER_ROLE to CentralBank...");
  
  // Grant role
  const grantTxHash = await currencyContract.write.grantRole([MINTER_ROLE, centralBank.address]);
  console.log(`Grant role transaction hash: ${grantTxHash}`);
  
  // Wait for transaction confirmation
  await publicClient.waitForTransactionReceipt({ hash: grantTxHash });
  console.log("✅ MINTER_ROLE granted successfully");

  // 5. Verify setup
  console.log("\n🔍 Verifying deployment...");
  const hasMinterRole = await currencyContract.read.hasRole([MINTER_ROLE, centralBank.address]);
  console.log("CentralBank has minter role:", hasMinterRole);

  if (!hasMinterRole) {
    throw new Error("Failed to grant MINTER_ROLE to CentralBank");
  }

  // Create deployment info
  const deploymentInfo: DeploymentInfo = {
    network: (hre.network as any).name,
    chainId: await publicClient.getChainId(),
    timestamp: new Date().toISOString(),
    deployer: deployer.account.address,
    contracts: {
      StateDAO: stateDAO.address,
      CentralBank: centralBank.address,
      NationalCurrency: currency.address
    },
    goldAddress: goldAddress
  };

  // Save deployment info
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, `${(hre.network as any).name}-deployment.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(50));
  console.log(`Network: ${(hre.network as any).name}`);
  console.log(`StateDAO Address: ${stateDAO.address}`);
  console.log(`CentralBank Address: ${centralBank.address}`);
  console.log(`NationalCurrency Address: ${currency.address}`);
  console.log(`Deployment file saved: ${deploymentFile}`);
  
  console.log("\n🛠️  FRONTEND UPDATE REQUIRED");
  console.log("=".repeat(50));
  console.log("Update the following addresses in frontend/src/App.jsx:");
  console.log(`const STATE_DAO_ADDRESS = '${stateDAO.address}';`);
  console.log(`const CENTRAL_BANK_ADDRESS = '${centralBank.address}';`);
  console.log(`const CURRENCY_ADDRESS = '${currency.address}';`);
  
  console.log("\n🔄 AUTO-UPDATE COMMAND:");
  console.log("=".repeat(50));
  console.log(`node scripts/update-frontend-addresses.js ${deploymentFile}`);
  
  console.log("\n✅ Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });