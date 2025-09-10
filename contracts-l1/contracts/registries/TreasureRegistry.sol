// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// 宝物/名将NFT注册表
contract TreasureRegistry is ERC721 {
    constructor() ERC721("Warring States Treasure", "WST") {}

    function mintTreasure(address owner, string memory tokenURI) public {
        // TODO: 增加权限控制，实现铸造宝物/名将NFT
    }
}
