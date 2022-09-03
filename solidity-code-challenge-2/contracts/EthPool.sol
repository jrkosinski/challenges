// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";


//TODO: add events 

/** 
 * @title EthPool
 */
contract EthPool is Ownable {
    mapping(address => TeamPool) internal teamPools; 
    mapping(address => address) internal membersToTeams;
    
    string constant errorUnauthorized = "Unauthorized";
    string constant errorMinTeamSize = "Min team size is 2";
    string constant errorExceedWithdraw = "Exceeded withdraw limit"; 
    
    uint8 constant calcPrecision = 6;
    
    struct MemberData {
        uint256 stake;
        uint256 rewardShare;
    }
    
    struct TeamPool {
        uint256 totalStake; 
        uint256 totalReward;
        address[] members;
        mapping(address => MemberData) memberData;
    }
    
    function createTeam(address _team, address[] memory members) external {
        require(msg.sender == owner(), errorUnauthorized); 
        require(members.length >= 2, errorMinTeamSize);
        
        //TODO: require that team pool doesn't already exist 
        //TODO: require menbers to be unique 
        
        teamPools[_team].totalStake = 0; 
        teamPools[_team].totalReward = 0; 
        teamPools[_team].members = members;
        
        for(uint n=0; n<members.length; n++) {
            membersToTeams[members[n]] = _team;
        }
    }
    
    function stake() external payable {
        address _team = membersToTeams[msg.sender]; 
        require(_team != address(0), errorUnauthorized); 
        
        teamPools[_team].memberData[msg.sender].stake += msg.value;
        teamPools[_team].totalStake += msg.value;
        
        assert(teamPools[_team].memberData[msg.sender].stake <= teamPools[_team].totalStake );
    }
    
    function getMemberStake(address _member) public view returns (uint256) {
        return teamPools[membersToTeams[_member]].memberData[_member].stake;
    }
    
    function getWithdrawLimit(address _member) external view returns (uint256) {
        return getMemberStake(_member) + getRewardShare(_member); 
    }
    
    function getRewardShare(address _member) public view returns (uint256) {
        return teamPools[membersToTeams[_member]].memberData[_member].rewardShare;
    }
    
    function getPoolStake(address _team) external view returns (uint256) {
        return teamPools[_team].totalStake;
    }
    
    function getPoolRewards(address _team) public view returns (uint256) {
        return teamPools[_team].totalReward;
    }
    
    function postRewards() external payable {
        address _team = msg.sender;
        TeamPool storage pool = teamPools[_team]; 
        require(pool.members.length > 0, errorUnauthorized); //ensure pool exists
        
        pool.totalReward += msg.value;
        
        //determine share per member 
        for(uint n=0; n<pool.members.length; n++) {
            MemberData storage member = pool.memberData[pool.members[n]]; 
            (uint sharePct,,) = XisWhatPercentageOfY(member.stake, pool.totalStake, calcPrecision); 
            (uint rewardShare,,) = whatIsXPercentOfY(sharePct, (pool.totalReward), 1); 
            
            member.rewardShare = rewardShare / 10**(calcPrecision-1); 
        }
    }
    
    function withdraw(uint256 amount) external {
        address _team = membersToTeams[msg.sender]; 
        require(_team != address(0), errorUnauthorized); 
        require(teamPools[_team].memberData[msg.sender].stake >= amount, errorExceedWithdraw); 
        
        teamPools[_team].memberData[msg.sender].stake -= amount;
        teamPools[_team].totalStake -= amount;
        
        assert(teamPools[_team].memberData[msg.sender].stake <= teamPools[_team].totalStake);
        
        (bool sent,) = payable(msg.sender).call{value:amount}("");
        require(sent);
    }
    
    function XisWhatPercentageOfY(uint x, uint y, uint8 precision) public pure returns (uint256 result, uint256 whole, uint256 decimal) {
        require(precision >= 1);
        uint multiplier = 10**(precision-1); 
        result = ((x * multiplier) / y * 100); 
        whole = result / multiplier; 
        decimal = result - (whole * multiplier); 
    }
    
    function whatIsXPercentOfY(uint x, uint y, uint8 precision) public pure returns (uint256 result, uint256 whole, uint256 decimal) {
        require(precision >= 1);
        uint multiplier = 10**(precision-1); 
        result = (x * multiplier)/100 * y; 
        whole = result/multiplier; 
        decimal = result - (whole * multiplier);
    }
    
    //- - - - - - - NON-PUBLIC METHODS - - - - - - -
    
}