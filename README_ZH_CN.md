### 主要设计思路
这个系统是使用blockchain来模拟中国战国时代的七雄争霸的历史时代。在整个项目环境中，包含了
1. 预言机，用来模拟一些重大事件。比如天气，战争，特殊历史事件等等
2. 各国中央货币链，用来在自己国家内部进行商业活动
3. 各国自己的货币兑换体系，用来支持外部货币兑换到本国货币体系，货币兑换时，支持动态汇率和税费
4. 各国货币对金银的统一结算体系
5. 每个国家都有自己独立的农业，工业，商业的产出，产出会受预言机的事件影响
6. 每个国家都有自己的人口基数，人口基数也受预言机影响，并影响实际产出的数量
7. 支持RWA，用NFT来表示一些重要的资产，比如城池，宝物(和氏璧)，矿山，牧场，森林等等，拥有NFT同样会影响产出，
8. 个人归属于一个国家，又一个钱包，可以拥有不同国家货币和NFT。
9. 城池只能归属于皇帝，其他可以归属个人



### 代码架构
frontend 前端服务

contracts-l1 L1合约服务，金银货币

contracts-l2-template L2合约服务,七国货币功能类似，使用相同的模版部署方式，

oracle-service oracle服务, 包含天气变化，战争等等历史事件


### 开发相关
启动前端服务
``` shell
cd frontend
yarn run dev
```

#### 启动hardhat 服务
``` shell
cd contracts-l1
yarn hardhat node
```
#### ignition部署L2七国经济系统
``` shell
cd contracts-l2-template
yarn hardhat ignition deploy --network localhost ignition/modules/DeployStateEconomy.ts
```
#### Ignition部署L1主链货币
``` shell
cd contracts-l1
yarn hardhat ignition deploy --network localhost ignition/modules/Gold.ts
```