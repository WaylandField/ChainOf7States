// Deploys contracts for the state of Zhao
const hre = require("hardhat");

async function main() {
  console.log("Deploying L2 contracts for the State of Zhao...");

  const currencyName = "Zhao Bu Bi";
  const currencySymbol = "ZBB";

  const NationalCurrency = await hre.ethers.getContractFactory("NationalCurrency");
  const currency = await NationalCurrency.deploy(currencyName, currencySymbol);
  const currencyAddress = await currency.getAddress();
  console.log(`Zhao's NationalCurrency (${currencySymbol}) deployed to: ${currencyAddress}`);

  // TODO: Deploy other L2 contracts for Zhao
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
