// Deploys contracts for the state of Wei
const hre = require("hardhat");

async function main() {
  console.log("Deploying L2 contracts for the State of Wei...");

  const currencyName = "Wei Bu Bi";
  const currencySymbol = "WBB";

  const NationalCurrency = await hre.ethers.getContractFactory("NationalCurrency");
  const currency = await NationalCurrency.deploy(currencyName, currencySymbol);
  const currencyAddress = await currency.getAddress();
  console.log(`Wei's NationalCurrency (${currencySymbol}) deployed to: ${currencyAddress}`);

  // TODO: Deploy other L2 contracts for Wei
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
