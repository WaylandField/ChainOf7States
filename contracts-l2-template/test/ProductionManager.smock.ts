import { describe, it } from "node:test";
import { expect } from "chai";
import { network } from "hardhat";

describe("ProductionManager", function () {
  it("deploys and can call placeholder function", async function () {
    const { viem } = await network.connect();
    const pm = await viem.deployContract("ProductionManager");

    await pm.write.calculateAndDistributeProduction();
  });
});


