// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract StateDAO is Ownable {
    // --- 状态变量 ---

    // 成员管理：只有成员才能发起提案和投票
    mapping(address => bool) public isMember;
    uint256 public memberCount;

    // 提案存储
    uint256 public nextProposalId;
    mapping(uint256 => Proposal) public proposals;

    // 投票记录，防止重复投票
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // 治理参数
    uint256 public votingPeriod; // 投票持续时间（例如：7天，以秒为单位）
    uint256 public quorumPercentage; // 提案通过所需的“同意”票比例（例如：51代表51%）

    // --- 结构体 ---

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        address target; // 提案要调用的目标合约地址
        bytes payload; // 调用目标合约时要使用的数据
        uint256 deadline; // 投票截止时间
        uint256 yesVotes;
        uint256 noVotes;
        bool executed; // 提案是否已被执行
    }

    // --- 事件 ---

    event MemberAdded(address indexed member);
    event MemberRemoved(address indexed member);
    event ProposalCreated(
        uint256 id,
        address indexed proposer,
        string description,
        address target,
        uint256 deadline
    );
    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        bool support
    );
    event ProposalExecuted(uint256 indexed proposalId);

    // --- 构造函数 ---

    constructor(
        address[] memory initialMembers,
        uint256 _votingPeriodInSeconds,
        uint256 _quorumPercentage
    ) Ownable(msg.sender) {
        // 部署者成为Owner，负责初始成员管理
        for (uint i = 0; i < initialMembers.length; i++) {
            isMember[initialMembers[i]] = true;
            emit MemberAdded(initialMembers[i]);
        }
        memberCount = initialMembers.length;
        votingPeriod = _votingPeriodInSeconds;
        quorumPercentage = _quorumPercentage;
    }

    // --- 核心功能函数 ---

    /**
     * @dev 创建一个新提案
     * @param target 提案要执行的目标合约地址
     * @param _payload 提案要执行的函数调用数据
     * @param description 提案的文字描述
     */
    function createProposal(
        address target,
        bytes memory _payload,
        string memory description
    ) public onlyMember {
        uint256 proposalId = nextProposalId;
        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            description: description,
            target: target,
            payload: _payload,
            deadline: block.timestamp + votingPeriod,
            yesVotes: 0,
            noVotes: 0,
            executed: false
        });
        nextProposalId++;
        emit ProposalCreated(
            proposalId,
            msg.sender,
            description,
            target,
            proposals[proposalId].deadline
        );
    }

    /**
     * @dev 对一个提案进行投票
     * @param proposalId 提案的ID
     * @param support 是否同意 (true为同意, false为反对)
     */
    function vote(uint256 proposalId, bool support) public onlyMember {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp < p.deadline, "Voting period has ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        hasVoted[proposalId][msg.sender] = true;
        if (support) {
            p.yesVotes++;
        } else {
            p.noVotes++;
        }
        emit Voted(proposalId, msg.sender, support);
    }

    /**
     * @dev 执行一个已通过的提案
     * @param proposalId 提案的ID
     */
    function execute(uint256 proposalId) public {
        Proposal storage p = proposals[proposalId];
        require(
            block.timestamp >= p.deadline,
            "Voting period has not ended yet"
        );
        require(!p.executed, "Proposal already executed");

        uint256 totalVotes = p.yesVotes + p.noVotes;
        // 检查是否达到法定票数比例
        require(
            (p.yesVotes * 100) / totalVotes >= quorumPercentage,
            "Quorum not reached"
        );
        // 简单规则：同意票必须多于反对票
        require(p.yesVotes > p.noVotes, "Proposal failed");

        p.executed = true;
        // 执行核心调用
        (bool success, ) = p.target.call(p.payload);
        require(success, "Proposal execution failed");

        emit ProposalExecuted(proposalId);
    }

    // --- 成员管理 (由Owner控制) ---

    function addMember(address member) public onlyOwner {
        require(!isMember[member], "Already a member");
        isMember[member] = true;
        memberCount++;
        emit MemberAdded(member); // 触发事件，记录成员添加操作
    }

    function removeMember(address member) public onlyOwner {
        require(isMember[member], "Not a member");
        isMember[member] = false;
        memberCount--;
        emit MemberRemoved(member); // 触发事件，记录成员移除操作
    }

    // --- 国库功能：接收ETH ---
    receive() external payable {}

    // --- 自定义修饰符 ---
    modifier onlyMember() {
        require(isMember[msg.sender], "Not a member");
        _;
    }
}