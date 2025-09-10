// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// 城池NFT注册表，所有权只能由代表国家的“君主地址”持有
contract CityRegistry is ERC721, Ownable {
    // 使用更小的数据类型来优化存储
    struct CityInfo {
        uint8 stateId; // 国家ID (0:秦, 1:楚, ...)
        uint32 populationCapacity; // 人口容量
        string name; // 城池名称
        // ... 其他属性
    }

    // 映射城池ID到城池信息
    mapping(uint256 => CityInfo) private _cityInfos;

    // 自增计数器，用于生成新的城池ID
    uint256 private _nextCityId;

    constructor(address stateOwner)
        ERC721("Warring States City", "WSC")
        Ownable(stateOwner) {}

    // 铸造新城池NFT并分配给指定国家的君主
    function mintCity(address stateRuler, string memory name, uint8 stateId) public onlyOwner {
        uint256 cityId = _nextCityId++;
        _safeMint(stateRuler, cityId); // 铸造NFT并分配给君主
        _cityInfos[cityId] = CityInfo({
            name: name,
            stateId: stateId,
            populationCapacity: 1000 // 示例默认值
        });
    }

    // 更新城池信息
    function updateCityInfo(uint256 cityId, string memory name, uint8 stateId, uint32 populationCapacity) public onlyOwner {
        require(_cityInfos[cityId].stateId != 0, "City does not exist"); // 使用ERC721的_exists函数
        _cityInfos[cityId] = CityInfo({
            name: name,
            stateId: stateId,
            populationCapacity: populationCapacity
        });
    }

    // 查询城池信息
    function getCityInfo(uint256 cityId) public view returns (string memory name, uint8 stateId, uint32 populationCapacity) {
        require(_cityInfos[cityId].stateId != 0, "City does not exist"); 
        CityInfo storage city = _cityInfos[cityId];
        return (city.name, city.stateId, city.populationCapacity);
    }
}