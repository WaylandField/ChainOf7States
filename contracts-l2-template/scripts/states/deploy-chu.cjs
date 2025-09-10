// Deploys contracts for the state of Chu
const hre = require("hardhat");

async function main() {
  console.log("Deploying L2 contracts for the State of Chu...");

  const currencyName = "Ying Yuan";
  const currencySymbol = "CYY";

  const NationalCurrency = await hre.ethers.getContractFactory("NationalCurrency");
  const currency = await NationalCurrency.deploy(currencyName, currencySymbol);
  const currencyAddress = await currency.getAddress();
  console.log(`Chu's NationalCurrency (${currencySymbol}) deployed to: ${currencyAddress}`);


  // 部署中央银行
  const NationalCurrency = await hre.ethers.getContractFactory("NationalCurrency");


  // 赋权中央银行铸币
  const MINTER_ROLE = await nationalCurrency.MINTER_ROLE();
  await nationalCurrency.grantRole(MINTER_ROLE, centralBankAddress);

  // TODO: Deploy other L2 contracts for Chu
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
