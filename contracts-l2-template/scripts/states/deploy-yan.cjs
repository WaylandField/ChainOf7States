// Deploys contracts for the state of Yan
const hre = require("hardhat");

async function main() {
  console.log("Deploying L2 contracts for the State of Yan...");

  const currencyName = "Yan Ming Dao";
  const currencySymbol = "YMD";

  const NationalCurrency = await hre.ethers.getContractFactory("NationalCurrency");
  const currency = await NationalCurrency.deploy(currencyName, currencySymbol);
  const currencyAddress = await currency.getAddress();
  console.log(`Yan's NationalCurrency (${currencySymbol}) deployed to: ${currencyAddress}`);

  // TODO: Deploy other L2 contracts for Yan
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
