// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// L1上的白银代币
contract Silver is ERC20 {
    constructor() ERC20("Silver", "SLV") {}
}
