import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("GoldModule", (m) => {
  const gold = m.contract("Gold");

  return { gold };
});
