import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SeasonOracleModule", (m) => {
    // 部署季节Oracle
    const seasonOracle = m.contract("SeasonOracle", []);
    
    return {
        seasonOracle,
    };
});