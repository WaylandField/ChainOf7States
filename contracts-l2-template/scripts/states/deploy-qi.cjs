// Deploys contracts for the state of Qi
const hre = require("hardhat");

async function main() {
  console.log("Deploying L2 contracts for the State of Qi...");

  const currencyName = "Qi Fahua";
  const currencySymbol = "QFH";

  const NationalCurrency = await hre.ethers.getContractFactory("NationalCurrency");
  const currency = await NationalCurrency.deploy(currencyName, currencySymbol);
  const currencyAddress = await currency.getAddress();
  console.log(`Qi's NationalCurrency (${currencySymbol}) deployed to: ${currencyAddress}`);

  // TODO: Deploy other L2 contracts for Qi
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
