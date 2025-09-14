# Contract Deployment Guide

This guide will help you deploy the smart contracts and fix the "Calling an account which is not a contract" error.

## Problem
The frontend is configured with hardcoded contract addresses that don't exist on your current network. You need to deploy the contracts first and then update the frontend with the correct addresses.

## Solution

### Step 1: Deploy Contracts

```bash
cd contracts-l2-template

# For local Hardhat network
npx hardhat node
# In another terminal:
npx hardhat run scripts/deploy-and-setup.js --network localhost

# For Sepolia testnet (requires .env setup)
npx hardhat run scripts/deploy-and-setup.js --network sepolia
```

### Step 2: Update Frontend Addresses (Automatic)

```bash
# After deployment, update frontend automatically
node scripts/update-frontend-addresses.js deployments/hardhat-deployment.json
```

### Step 3: Update Frontend Addresses (Manual)
If automatic update doesn't work, manually update these lines in `frontend/src/App.jsx`:

```javascript
const STATE_DAO_ADDRESS = 'YOUR_DEPLOYED_STATE_DAO_ADDRESS';
const CENTRAL_BANK_ADDRESS = 'YOUR_DEPLOYED_CENTRAL_BANK_ADDRESS'; 
const CURRENCY_ADDRESS = 'YOUR_DEPLOYED_CURRENCY_ADDRESS';
```

### Step 4: Start Frontend

```bash
cd ../frontend
npm run dev
```

## Network Configuration

### Local Development (Hardhat)
- Make sure Hardhat node is running: `npx hardhat node`
- Connect MetaMask to localhost:8545 (Chain ID: 31337)
- Import one of the test accounts from Hardhat output

### Sepolia Testnet
- Get Sepolia ETH from faucet
- Configure `.env` with your private key and RPC URL
- Connect MetaMask to Sepolia network

## Troubleshooting

### "Calling an account which is not a contract"
- Contracts not deployed to current network
- Wrong contract addresses in frontend
- Connected to wrong network

### "Insufficient funds"
- Need ETH on the network you're deploying to
- For local: Use Hardhat test accounts
- For Sepolia: Get test ETH from faucet

### Contract verification failed
- Check network status in frontend
- Verify addresses match deployment output
- Ensure you're on the correct network

## File Structure After Deployment

```
contracts-l2-template/
├── deployments/
│   ├── hardhat-deployment.json
│   └── sepolia-deployment.json
├── scripts/
│   ├── deploy-and-setup.js
│   └── update-frontend-addresses.js
```

## Next Steps

1. Deploy contracts using the script
2. Update frontend addresses  
3. Connect MetaMask to correct network
4. Test the application

The frontend will now show a green status indicator when all contracts are properly deployed and accessible.