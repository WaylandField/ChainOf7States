import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("StateDAO", () => {
  it("initializes members and allows proposal lifecycle", async () => {
    const { viem } = await network.connect();
    const [owner, m1, m2] = await viem.getWalletClients();

    const dao = await viem.deployContract("StateDAO", [[m1.account.address, m2.account.address], 60n, 50n]);
    const currency = await viem.deployContract("NationalCurrency", ["Qin Ban Liang", "QBL"]);
    const centralBank = await viem.deployContract("CentralBank", [dao.address, currency.address, "0x5FbDB2315678afecb367f032d93F642f64180aa3"]);



    const count = await dao.read.memberCount();
    assert.equal(count, 2n);

    // create a proposal by member m1: target the DAO itself with empty calldata (hits receive)
    const payload = "0x" as `0x${string}`;
    await dao.write.createProposal([dao.address, payload, "noop"], { account: m1.account });

    // vote by both members
    await dao.write.vote([0n, true], { account: m1.account });
    await dao.write.vote([0n, true], { account: m2.account });

    // advance time beyond votingPeriod
    const testClient = await viem.getTestClient();
    await testClient.increaseTime({ seconds: 61 });
    await testClient.mine({ blocks: 1 });

    await dao.write.execute([0n]);
  });
});


