# SeasonOracle Implementation

## 概述

SeasonOracle 是一个自动执行的智能合约，用于广播春夏秋冬的季节变更。它与 StateDAO 系统集成，使得治理系统能够响应季节变化并触发相应的行为。

## 功能特性

### 🌍 核心功能
- **自动季节更迭**: 默认每10分钟切换一次季节（可配置）
- **季节循环**: Spring → Summer → Autumn → Winter → Spring...
- **可配置间隔**: 支持1分钟到30天的季节持续时间
- **手动控制**: 管理员可以手动推进季节或暂停Oracle

### 🎯 StateDAO 集成
- **自动触发**: StateDAO 在关键操作时检查季节变化
- **季节性行为**: 不同季节触发不同的治理行为
- **奖励系统**: 季节性奖励比例配置（Spring: 12%, Summer: 8%, Autumn: 15%, Winter: 5%）

## 合约架构

### SeasonOracle.sol
```solidity
// 主要函数
function getCurrentSeason() public returns (Season, uint256, uint256)
function updateSeason() public
function forceNextSeason() public onlyOwner
function setSeasonDuration(uint256 newDuration) public onlyOwner
```

### StateDAO.sol (增强版)
```solidity
// Oracle 集成
function setSeasonOracle(address _oracleAddress) public onlyOwner
function checkSeasonChange() public
function setSeasonalBonusRate(Season season, uint256 bonusRate) public onlyOwner
```

## 部署指南

### 1. 编译合约
```bash
cd contracts-l2-template
npx hardhat compile
```

### 2. 部署Oracle
```bash
npx hardhat ignition deploy ignition/modules/SeasonOracle.ts --network localhost
```

### 3. 部署集成系统
```bash
npx hardhat ignition deploy ignition/modules/DeployStateEconomy.ts --network localhost
```

### 4. 更新前端配置
```javascript
// 在 frontend/src/App.jsx 中更新地址
const SEASON_ORACLE_ADDRESS = '0x...'; // 替换为实际部署地址
```

## 使用示例

### 获取当前季节信息
```javascript
const oracle = await ethers.getContractAt("SeasonOracle", oracleAddress);
const [season, timeInSeason, timeToNext] = await oracle.getCurrentSeason();
console.log(`当前季节: ${season}, 剩余时间: ${timeToNext}秒`);
```

### 手动推进季节
```javascript
// 仅管理员可调用
await oracle.forceNextSeason();
```

### 配置季节持续时间
```javascript
// 设置为5分钟
await oracle.setSeasonDuration(300);
```

## 前端集成

### SeasonOracle 组件
- **实时显示**: 当前季节、剩余时间、季节编号
- **可视化界面**: 季节图标、进度条、状态指示
- **交互功能**: 手动刷新、强制更新（管理员）

### 事件监听
```javascript
// 监听季节变化事件
useWatchContractEvent({
  address: SEASON_ORACLE_ADDRESS,
  abi: oracleAbi,
  eventName: 'SeasonChanged',
  onLogs: (logs) => {
    console.log('季节已变更:', logs);
  },
});
```

## 季节行为配置

### 默认季节特性
- **Spring (春)**: 12% 奖励加成，适合增长和扩张
- **Summer (夏)**: 8% 奖励加成，稳定发展期
- **Autumn (秋)**: 15% 奖励加成，收获和储备期
- **Winter (冬)**: 5% 奖励加成，保守和防御期

### StateDAO 响应行为
1. **创建提案时**: 检查季节变化，应用季节性修饰
2. **投票时**: 根据当前季节调整投票权重
3. **执行提案时**: 触发季节特定的后续行为

## 测试

### 运行Oracle测试
```bash
npx hardhat test test/SeasonOracle.smock.ts
```

### 测试场景
- ✅ 初始化测试：正确的初始季节和持续时间
- ✅ 手动推进：管理员强制切换季节
- ✅ 自动更迭：时间到期后自动切换
- ✅ 季节循环：完整的四季循环测试
- ✅ 配置管理：持续时间和激活状态配置

## 安全考虑

### 访问控制
- **onlyOwner**: 关键配置函数仅管理员可调用
- **时间验证**: 防止过于频繁的季节变更
- **参数边界**: 持续时间限制在合理范围内

### 故障恢复
- **紧急重置**: `emergencyReset()` 函数用于故障恢复
- **激活开关**: 可以临时禁用Oracle功能
- **状态查询**: 提供多种状态检查函数

## 扩展性

### 未来增强
1. **多维度季节**: 支持地理位置相关的季节
2. **动态调整**: 基于链上活动自动调整季节持续时间
3. **复杂行为**: 更丰富的季节性治理行为
4. **跨链同步**: 多链季节同步机制

### 集成建议
- **DeFi协议**: 季节性收益率调整
- **游戏系统**: 季节任务和奖励
- **投票治理**: 季节性提案优先级

## 故障排除

### 常见问题
1. **季节不更新**: 检查Oracle是否激活，调用 `updateSeason()`
2. **权限错误**: 确认调用者是合约所有者
3. **时间异常**: 验证区块时间和季节持续时间设置

### 调试工具
```javascript
// 检查Oracle状态
const isActive = await oracle.isActive();
const needsUpdate = await oracle.needsSeasonUpdate();
const details = await oracle.getSeasonDetails();
```

## 贡献指南

欢迎提交 Issues 和 Pull Requests 来改进Oracle系统！

### 开发流程
1. Fork 项目
2. 创建功能分支
3. 编写测试
4. 提交PR

---

**注意**: 这是一个实验性实现，在生产环境中使用前请进行充分测试。