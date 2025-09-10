import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("CentralBank", () => {
  it("deploys with stubbed token addresses", async () => {
    const { viem } = await network.connect();
    const [deployer] = await viem.getWalletClients();

    // Deploy minimal ERC20s as stand-ins
    const currency = await viem.deployContract("ResourceToken", ["Currency", "CUR"]);
    const gold = await viem.deployContract("ResourceToken", ["Gold", "GLD"]);

    // If CentralBank signature changed to (stateDao, currency, gold), deploy a trivial StateDAO
    let cb;
    try {
      cb = await viem.deployContract("CentralBank", [currency.address, gold.address]);
    } catch {
      const dao = await viem.deployContract("StateDAO", [[deployer.account.address], 1n, 50n]);
      cb = await viem.deployContract("CentralBank", [dao.address, currency.address, gold.address]);
    }
    assert.ok(typeof cb.address === "string" && cb.address.length > 0);
  });
});


