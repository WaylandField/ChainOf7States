// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// L1上的黄金代币，作为统一结算资产
contract Gold is ERC20 {
    constructor() ERC20("Gold", "GLD") {}
}
