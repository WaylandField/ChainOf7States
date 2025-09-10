// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../tokens/NationalCurrency.sol";
import "../governance/StateDAO.sol";

// 国家中央银行，实现本国货币与黄金/白银的兑换
contract CentralBank is Ownable{
    IERC20 public goldOnL1; // L1黄金代币在L2上的映射地址

    NationalCurrency public nationalCurrency;
    StateDAO public stateDao;

    // TODO: 实现一个AMM DEX的核心逻辑
    // mapping(address => uint256) private reserves;


    // 定义事件：记录关键操作
    event CurrencyIssued(address indexed to, uint256 amount);
    event SwappedCurrencyToGold(address indexed user, uint256 currencyAmount, uint256 goldReceived);
    event LiquidityAdded(address indexed provider, uint256 currencyAmount, uint256 goldAmount);


    constructor(StateDAO _stateDao, NationalCurrency _currencyAddress, address _goldAddress) Ownable(msg.sender){
        stateDao = _stateDao;
        nationalCurrency = _currencyAddress;
        goldOnL1 = IERC20(_goldAddress);
    }

    function issueCurrency(uint256 amount) public onlyStateDAOOrOwner {
        nationalCurrency.mint(address(stateDao), amount);
        emit CurrencyIssued(address(stateDao), amount);
    }


    // Added custom modifier
    modifier onlyStateDAOOrOwner() {
        require(
            msg.sender == address(stateDao) || msg.sender == owner(),
            "Only StateDAO or owner can call this function"
        );
        _;
    }

    function swapCurrencyToGold(uint256 amount) public {
        // TODO: 实现动态汇率兑换和税费扣除
        // 假设兑换逻辑已实现，用户获得一定数量的黄金
        uint256 goldReceived = amount / 10; // 示例：简单固定汇率
        require(goldOnL1.transfer(msg.sender, goldReceived), "Gold transfer failed");

        // 触发事件，记录兑换操作
        emit SwappedCurrencyToGold(msg.sender, amount, goldReceived);
    }

    function addLiquidity(uint256 currencyAmount, uint256 goldAmount) public {
        // 将用户的货币和黄金转移到中央银行
        require(nationalCurrency.transferFrom(msg.sender, address(this), currencyAmount), "Currency transfer failed");
        require(goldOnL1.transferFrom(msg.sender, address(this), goldAmount), "Gold transfer failed");

        // 触发事件，记录流动性添加操作
        emit LiquidityAdded(msg.sender, currencyAmount, goldAmount);
    }
}
