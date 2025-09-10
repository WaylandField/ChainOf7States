import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("NationalCurrency", () => {
  it("grants DEFAULT_ADMIN_ROLE to deployer and controls MINTER_ROLE", async () => {
    const { viem } = await network.connect();
    const [deployer, user, minter] = await viem.getWalletClients();

    const nc = await viem.deployContract("NationalCurrency", ["Test Coin", "TST"]);

    const DEFAULT_ADMIN_ROLE = await nc.read.DEFAULT_ADMIN_ROLE();
    const MINTER_ROLE = await nc.read.MINTER_ROLE();

    const hasAdmin = await nc.read.hasRole([DEFAULT_ADMIN_ROLE, deployer.account.address]);
    assert.equal(hasAdmin, true);

    let reverted = false;
    try {
      await nc.write.mint([user.account.address, 100n], { account: user.account });
    } catch {
      reverted = true;
    }
    assert.equal(reverted, true);

    await nc.write.grantRole([MINTER_ROLE, minter.account.address]);
    await nc.write.mint([user.account.address, 123n], { account: minter.account });
    const bal = await nc.read.balanceOf([user.account.address]);
    assert.equal(bal, 123n);
  });
});


