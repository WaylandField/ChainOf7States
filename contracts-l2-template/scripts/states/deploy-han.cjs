// Deploys contracts for the state of Han
const hre = require("hardhat");

async function main() {
  console.log("Deploying L2 contracts for the State of Han...");

  const currencyName = "Han Yuan Jin";
  const currencySymbol = "HYJ";

  const NationalCurrency = await hre.ethers.getContractFactory("NationalCurrency");
  const currency = await NationalCurrency.deploy(currencyName, currencySymbol);
  const currencyAddress = await currency.getAddress();
  console.log(`Han's NationalCurrency (${currencySymbol}) deployed to: ${currencyAddress}`);

  // TODO: Deploy other L2 contracts for Han
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
