// Deploys contracts for the state of Qin
const hre = require("hardhat");

async function main() {
  console.log("Deploying L2 contracts for the State of Qin...");

  const currencyName = "Qin Ban Liang";
  const currencySymbol = "QBL";

  const NationalCurrency = await hre.ethers.getContractFactory("NationalCurrency");
  const currency = await NationalCurrency.deploy(currencyName, currencySymbol);
  const currencyAddress = await currency.getAddress();
  console.log(`Qin's NationalCurrency (${currencySymbol}) deployed to: ${currencyAddress}`);

  // TODO: Deploy other L2 contracts for Qin (CentralBank, ProductionManager, etc.)
  // using the currencyAddress where needed.
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
