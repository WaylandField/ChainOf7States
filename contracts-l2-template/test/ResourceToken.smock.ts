import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("ResourceToken", () => {
  it("mints to recipient", async () => {
    const { viem } = await network.connect();
    const [deployer, user] = await viem.getWalletClients();

    const token = await viem.deployContract("ResourceToken", ["Food", "FOOD"]);
    await token.write.mint([user.account.address, 1000n]);
    const bal = await token.read.balanceOf([user.account.address]);
    assert.equal(bal, 1000n);
  });
});


