import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// 子模块工厂：为单个国家部署所需合约，并以扁平键名返回
const buildStateEconomySubmodule = (
    stateId: string,
    name: string,
    symbol: string,
    goldAddress: string
) =>
    buildModule(`StateEconomy_${stateId}`, (m) => {
        const deployer = m.getAccount(0);
        const stateDao = m.contract("StateDAO", [[deployer], 10, 50]);
        const nationalCurrency = m.contract("NationalCurrency", [name, symbol]);
        const centralBank = m.contract("CentralBank", [stateDao, nationalCurrency, goldAddress]);

        const minterRole = m.staticCall(nationalCurrency, "MINTER_ROLE");
        m.call(nationalCurrency, "grantRole", [minterRole, centralBank]);

        // 扁平返回，满足 Ignition 对返回类型的要求（string -> ContractFuture）
        return {
            [`${stateId}_nationalCurrency`]: nationalCurrency,
            [`${stateId}_centralBank`]: centralBank,
            [`${stateId}_stateDAO`]: stateDao,
        };
    });

// 统一部署多种货币
export default buildModule("StateEconomyModule", (m) => {
    const STATES_DATA = [
        { id: "Qin", name: "Qin Ban Liang", symbol: "QBL" },
        { id: "Chu", name: "Ying Yuan", symbol: "CYY" },
        { id: "Qi", name: "Qi Fahua", symbol: "QFH" },
        { id: "Yan", name: "Yan Ming Dao", symbol: "YMD" },
        { id: "Zhao", name: "Zhao Bu Bi", symbol: "ZBB" },
        { id: "Wei", name: "Wei Bu Bi", symbol: "WBB" },
        { id: "Han", name: "Han Yuan Jin", symbol: "HYJ" },
    ];

    // 黄金地址作为参数传入，或使用默认值
    const goldAddress = m.getParameter(
        "goldAddress",
        "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    );

    // 聚合所有子模块返回
    let result: { [key: string]: any } = {};
    for (const s of STATES_DATA) {
        const sub = buildStateEconomySubmodule(s.id, s.name, s.symbol, goldAddress);
        result = { ...result, ...m.useModule(sub) };
    }
    return result;
});