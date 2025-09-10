// L1 deployment script
const hre = require("hardhat");

async function main() {
  console.log("Deploying L1 contracts...");
  // TODO: Add deployment logic for all L1 contracts
  const Gold = await hre.ethers.getContractFactory("Gold");
  const gold = await Gold.deploy();
  const goldAddress = await gold.getAddress();
  console.log(`Gold deployed to: ${goldAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
