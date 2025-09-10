import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";

describe("SeasonOracle", () => {
  it("initializes with Spring season and correct duration", async () => {
    const { viem } = await network.connect();
    const [deployer] = await viem.getWalletClients();

    const oracle = await viem.deployContract("SeasonOracle", []);

    // Check initial season
    const seasonInfo = await oracle.read.seasonInfo() as readonly [bigint, bigint, bigint, bigint];
    assert.equal(seasonInfo[0], 0n); // Spring = 0
    assert.equal(seasonInfo[2], 600n); // 10 minutes = 600 seconds
    assert.equal(seasonInfo[3], 1n); // First season

    // Check season names
    const springName = await oracle.read.getSeasonName([0n]);
    assert.equal(springName, "Spring");
  });

  it("allows manual season advancement by owner", async () => {
    const { viem } = await network.connect();
    const [deployer] = await viem.getWalletClients();

    const oracle = await viem.deployContract("SeasonOracle", []);
    
    // Force next season
    await oracle.write.forceNextSeason([], { account: deployer.account });
    
    const seasonInfo = await oracle.read.seasonInfo() as readonly [bigint, bigint, bigint, bigint];
    assert.equal(seasonInfo[0], 1n); // Summer = 1
    assert.equal(seasonInfo[3], 2n); // Second season
  });

  it("automatically advances seasons after time passes", async () => {
    const { viem } = await network.connect();
    const [deployer] = await viem.getWalletClients();

    const oracle = await viem.deployContract("SeasonOracle", []);
    
    // Set shorter duration for testing
    await oracle.write.setSeasonDuration([60n], { account: deployer.account }); // 1 minute
    
    // Check initial season
    let seasonInfo = await oracle.read.seasonInfo() as readonly [bigint, bigint, bigint, bigint];
    assert.equal(seasonInfo[0], 0n); // Spring
    
    // Advance time by 61 seconds
    const testClient = await viem.getTestClient();
    await testClient.increaseTime({ seconds: 61 });
    await testClient.mine({ blocks: 1 });
    
    // Call updateSeason to trigger check
    await oracle.write.updateSeason([], { account: deployer.account });
    
    // Should now be Summer
    seasonInfo = await oracle.read.seasonInfo() as readonly [bigint, bigint, bigint, bigint];
    assert.equal(seasonInfo[0], 1n); // Summer = 1
  });

  it("cycles through all four seasons correctly", async () => {
    const { viem } = await network.connect();
    const [deployer] = await viem.getWalletClients();

    const oracle = await viem.deployContract("SeasonOracle", []);
    
    const seasons = ["Spring", "Summer", "Autumn", "Winter"];
    
    // Test each season transition
    for (let i = 0; i < 4; i++) {
      const seasonInfo = await oracle.read.seasonInfo() as readonly [bigint, bigint, bigint, bigint];
      assert.equal(seasonInfo[0], BigInt(i)); // Check season enum value
      
      const seasonName = await oracle.read.getSeasonName([BigInt(i)]);
      assert.equal(seasonName, seasons[i]);
      
      // Advance to next season (except after Winter)
      if (i < 3) {
        await oracle.write.forceNextSeason([], { account: deployer.account });
      }
    }
    
    // After Winter, should cycle back to Spring
    await oracle.write.forceNextSeason([], { account: deployer.account });
    const finalSeasonInfo = await oracle.read.seasonInfo() as readonly [bigint, bigint, bigint, bigint];
    assert.equal(finalSeasonInfo[0], 0n); // Back to Spring
  });

  it("allows owner to configure season duration", async () => {
    const { viem } = await network.connect();
    const [deployer] = await viem.getWalletClients();

    const oracle = await viem.deployContract("SeasonOracle", []);
    
    // Set new duration
    const newDuration = 300n; // 5 minutes
    await oracle.write.setSeasonDuration([newDuration], { account: deployer.account });
    
    const seasonInfo = await oracle.read.seasonInfo() as readonly [bigint, bigint, bigint, bigint];
    assert.equal(seasonInfo[2], newDuration);
    
    const defaultDuration = await oracle.read.defaultSeasonDuration();
    assert.equal(defaultDuration, newDuration);
  });

  it("can be activated and deactivated", async () => {
    const { viem } = await network.connect();
    const [deployer] = await viem.getWalletClients();

    const oracle = await viem.deployContract("SeasonOracle", []);
    
    // Initially active
    let isActive = await oracle.read.isActive();
    assert.equal(isActive, true);
    
    // Deactivate
    await oracle.write.setOracleActive([false], { account: deployer.account });
    isActive = await oracle.read.isActive();
    assert.equal(isActive, false);
    
    // Reactivate
    await oracle.write.setOracleActive([true], { account: deployer.account });
    isActive = await oracle.read.isActive();
    assert.equal(isActive, true);
  });

  it("provides detailed season information", async () => {
    const { viem } = await network.connect();
    const [deployer] = await viem.getWalletClients();

    const oracle = await viem.deployContract("SeasonOracle", []);
    
    const details = await oracle.read.getSeasonDetails() as readonly [bigint, string, bigint, bigint, bigint, bigint, bigint];
    
    // Should return: currentSeason, seasonName, seasonNumber, startTime, duration, timeElapsed, timeRemaining
    assert.equal(details[0], 0n); // Spring
    assert.equal(details[1], "Spring");
    assert.equal(details[2], 1n); // First season
    assert.equal(details[4], 600n); // 10 minutes duration
    
    // timeElapsed should be small since just deployed
    assert(details[5] < 10n); // Less than 10 seconds elapsed
    
    // timeRemaining should be close to full duration
    assert(details[6] > 590n); // More than 590 seconds remaining
  });
});