import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function updateFrontendAddresses(deploymentFile) {
  const deploymentPath = path.resolve(deploymentFile);
  const frontendAppPath = path.resolve(__dirname, '../../frontend/src/App.jsx');
  
  if (!fs.existsSync(deploymentPath)) {
    console.error(`❌ Deployment file not found: ${deploymentPath}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(frontendAppPath)) {
    console.error(`❌ Frontend App.jsx not found: ${frontendAppPath}`);
    process.exit(1);
  }
  
  // Read deployment info
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const { StateDAO, CentralBank, NationalCurrency } = deployment.contracts;
  
  // Read frontend file
  let appContent = fs.readFileSync(frontendAppPath, 'utf8');
  
  // Update addresses using regex
  appContent = appContent.replace(
    /const STATE_DAO_ADDRESS = '[^']*';/,
    `const STATE_DAO_ADDRESS = '${StateDAO}';`
  );
  
  appContent = appContent.replace(
    /const CENTRAL_BANK_ADDRESS = '[^']*';/,
    `const CENTRAL_BANK_ADDRESS = '${CentralBank}';`
  );
  
  appContent = appContent.replace(
    /const CURRENCY_ADDRESS = '[^']*';/,
    `const CURRENCY_ADDRESS = '${NationalCurrency}';`
  );
  
  // Write updated content
  fs.writeFileSync(frontendAppPath, appContent);
  
  console.log('✅ Frontend addresses updated successfully!');
  console.log(`StateDAO: ${StateDAO}`);
  console.log(`CentralBank: ${CentralBank}`);
  console.log(`Currency: ${NationalCurrency}`);
}

// Get deployment file from command line argument
const deploymentFile = process.argv[2];
if (!deploymentFile) {
  console.error('Usage: node update-frontend-addresses.js <deployment-file>');
  console.error('Example: node update-frontend-addresses.js ../deployments/hardhat-deployment.json');
  process.exit(1);
}

updateFrontendAddresses(deploymentFile);