// L2 deployment script template
const hre = require("hardhat");

async function main() {
  console.log("Deploying L2 contracts for a state...");
  // TODO: Add deployment logic for all L2 contracts
  const NationalCurrency = await hre.ethers.getContractFactory("NationalCurrency");
  // Example for deploying Qin's currency
  const qinCurrency = await NationalCurrency.deploy("Qin Ban Liang", "QBL");
  const qinAddress = await qinCurrency.getAddress();
  console.log(`Qin Currency deployed to: ${qinAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
