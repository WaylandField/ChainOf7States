// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SeasonOracle
 * @dev Oracle contract that automatically broadcasts seasonal changes
 * Seasons cycle through Spring, Summer, Autumn, Winter every configurable interval (default 10 minutes)
 */
contract SeasonOracle is Ownable {
    // --- 枚举和结构体 ---
    
    enum Season {
        Spring,   // 春 - 0
        Summer,   // 夏 - 1
        Autumn,   // 秋 - 2
        Winter    // 冬 - 3
    }
    
    struct SeasonInfo {
        Season currentSeason;
        uint256 seasonStartTime;
        uint256 seasonDuration;
        uint256 seasonNumber; // 总季节计数
    }
    
    // --- 状态变量 ---
    
    SeasonInfo public seasonInfo;
    uint256 public defaultSeasonDuration = 10 minutes; // 默认每10分钟一个季节
    bool public isActive = true; // Oracle是否激活
    
    // 季节名称映射（用于事件和查询）
    mapping(Season => string) public seasonNames;
    
    // --- 事件 ---
    
    event SeasonChanged(
        Season indexed newSeason,
        Season indexed previousSeason,
        uint256 indexed seasonNumber,
        uint256 changeTime,
        string seasonName
    );
    
    event SeasonDurationUpdated(
        uint256 oldDuration,
        uint256 newDuration,
        address indexed updatedBy
    );
    
    event OracleStatusChanged(
        bool isActive,
        address indexed changedBy
    );
    
    // --- 构造函数 ---
    
    constructor() Ownable(msg.sender) {
        // 初始化季节名称
        seasonNames[Season.Spring] = "Spring";
        seasonNames[Season.Summer] = "Summer";
        seasonNames[Season.Autumn] = "Autumn";
        seasonNames[Season.Winter] = "Winter";
        
        // 初始化第一个季节为春季
        seasonInfo = SeasonInfo({
            currentSeason: Season.Spring,
            seasonStartTime: block.timestamp,
            seasonDuration: defaultSeasonDuration,
            seasonNumber: 1
        });
        
        emit SeasonChanged(
            Season.Spring,
            Season.Winter, // 从冬季开始新的循环
            1,
            block.timestamp,
            seasonNames[Season.Spring]
        );
    }
    
    // --- 核心功能函数 ---
    
    /**
     * @dev 获取当前季节信息，如果需要则自动更新季节
     * @return current 当前季节
     * @return timeInSeason 当前季节已经过去的时间
     * @return timeToNext 距离下一个季节的时间
     */
    function getCurrentSeason() public returns (Season current, uint256 timeInSeason, uint256 timeToNext) {
        _updateSeasonIfNeeded();
        
        current = seasonInfo.currentSeason;
        timeInSeason = block.timestamp - seasonInfo.seasonStartTime;
        
        if (timeInSeason >= seasonInfo.seasonDuration) {
            timeToNext = 0;
        } else {
            timeToNext = seasonInfo.seasonDuration - timeInSeason;
        }
    }
    
    /**
     * @dev 查看当前季节信息（不触发更新）
     */
    function viewCurrentSeason() public view returns (Season current, uint256 timeInSeason, uint256 timeToNext) {
        current = seasonInfo.currentSeason;
        timeInSeason = block.timestamp - seasonInfo.seasonStartTime;
        
        if (timeInSeason >= seasonInfo.seasonDuration) {
            timeToNext = 0;
        } else {
            timeToNext = seasonInfo.seasonDuration - timeInSeason;
        }
    }
    
    /**
     * @dev 手动触发季节更新检查
     */
    function updateSeason() public {
        require(isActive, "Oracle is not active");
        _updateSeasonIfNeeded();
    }
    
    /**
     * @dev 强制进入下一个季节（仅owner可调用）
     */
    function forceNextSeason() public onlyOwner {
        require(isActive, "Oracle is not active");
        _advanceToNextSeason();
    }
    
    // --- 配置管理函数 ---
    
    /**
     * @dev 设置季节持续时间
     * @param newDuration 新的季节持续时间（秒）
     */
    function setSeasonDuration(uint256 newDuration) public onlyOwner {
        require(newDuration >= 1 minutes, "Duration too short");
        require(newDuration <= 30 days, "Duration too long");
        
        uint256 oldDuration = defaultSeasonDuration;
        defaultSeasonDuration = newDuration;
        
        // 更新当前季节的持续时间
        seasonInfo.seasonDuration = newDuration;
        
        emit SeasonDurationUpdated(oldDuration, newDuration, msg.sender);
    }
    
    /**
     * @dev 设置Oracle激活状态
     */
    function setOracleActive(bool _isActive) public onlyOwner {
        isActive = _isActive;
        emit OracleStatusChanged(_isActive, msg.sender);
    }
    
    // --- 查询函数 ---
    
    /**
     * @dev 获取季节名称
     */
    function getSeasonName(Season season) public view returns (string memory) {
        return seasonNames[season];
    }
    
    /**
     * @dev 获取当前季节的详细信息
     */
    function getSeasonDetails() public view returns (
        Season currentSeason,
        string memory seasonName,
        uint256 seasonNumber,
        uint256 startTime,
        uint256 duration,
        uint256 timeElapsed,
        uint256 timeRemaining
    ) {
        currentSeason = seasonInfo.currentSeason;
        seasonName = seasonNames[currentSeason];
        seasonNumber = seasonInfo.seasonNumber;
        startTime = seasonInfo.seasonStartTime;
        duration = seasonInfo.seasonDuration;
        timeElapsed = block.timestamp - startTime;
        
        if (timeElapsed >= duration) {
            timeRemaining = 0;
        } else {
            timeRemaining = duration - timeElapsed;
        }
    }
    
    /**
     * @dev 检查是否需要季节更新
     */
    function needsSeasonUpdate() public view returns (bool) {
        if (!isActive) return false;
        return (block.timestamp - seasonInfo.seasonStartTime) >= seasonInfo.seasonDuration;
    }
    
    // --- 内部函数 ---
    
    /**
     * @dev 内部函数：检查并更新季节
     */
    function _updateSeasonIfNeeded() internal {
        if (!isActive) return;
        
        if (needsSeasonUpdate()) {
            _advanceToNextSeason();
        }
    }
    
    /**
     * @dev 内部函数：推进到下一个季节
     */
    function _advanceToNextSeason() internal {
        Season previousSeason = seasonInfo.currentSeason;
        Season nextSeason = _getNextSeason(previousSeason);
        
        seasonInfo.currentSeason = nextSeason;
        seasonInfo.seasonStartTime = block.timestamp;
        seasonInfo.seasonDuration = defaultSeasonDuration;
        seasonInfo.seasonNumber++;
        
        emit SeasonChanged(
            nextSeason,
            previousSeason,
            seasonInfo.seasonNumber,
            block.timestamp,
            seasonNames[nextSeason]
        );
    }
    
    /**
     * @dev 内部函数：获取下一个季节
     */
    function _getNextSeason(Season current) internal pure returns (Season) {
        if (current == Season.Spring) return Season.Summer;
        if (current == Season.Summer) return Season.Autumn;
        if (current == Season.Autumn) return Season.Winter;
        return Season.Spring; // Winter -> Spring
    }
    
    // --- 应急函数 ---
    
    /**
     * @dev 重置Oracle到指定季节（紧急情况使用）
     */
    function emergencyReset(Season newSeason) public onlyOwner {
        Season previousSeason = seasonInfo.currentSeason;
        
        seasonInfo.currentSeason = newSeason;
        seasonInfo.seasonStartTime = block.timestamp;
        seasonInfo.seasonDuration = defaultSeasonDuration;
        seasonInfo.seasonNumber++;
        
        emit SeasonChanged(
            newSeason,
            previousSeason,
            seasonInfo.seasonNumber,
            block.timestamp,
            seasonNames[newSeason]
        );
    }
}