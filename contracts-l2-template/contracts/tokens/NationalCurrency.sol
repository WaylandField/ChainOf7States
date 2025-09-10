// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// 国家货币模板，每个国家部署时传入自己的名称和符号
contract NationalCurrency is ERC20, AccessControl {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    event Minted(address indexed to, uint256 amount);

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // 国库合约才能铸造新币
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        // 触发事件，记录铸币操作
        emit Minted(to, amount);
        _mint(to, amount);
    }
}
