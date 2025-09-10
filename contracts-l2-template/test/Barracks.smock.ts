import { describe, it } from "node:test";
import { network } from "hardhat";

describe("Barracks", () => {
  it("deploys and exposes callable stubs", async () => {
    const { viem } = await network.connect();
    const b = await viem.deployContract("Barracks");

    await b.write.conscript([100n]);
    await b.write.upgradeEquipment();
  });
});


