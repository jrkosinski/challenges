// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PercentageBasis.sol";
import "hardhat/console.sol";

//TODO: allow team to skim the pot 

/** 
 * @title EthPool
 */
contract EthPool is Ownable {
    //maps team pool address to TeamPool struct 
    mapping(address => TeamPool) internal teamPools; 
    
    //maps member address to team address (each member belongs to 1 & only 1 team)
    mapping(address => address) internal membersToTeams;
    
    //error messages 
    string constant errorUnauthorized = "Unauthorized";
    string constant errorMinTeamSize = "Min team size is 2";
    string constant errorExceedWithdraw = "Exceeded withdraw limit"; 
    string constant errorDuplicate = "Duplicate item";
    
    //precision for divvying up currency rewards 
    uint8 constant calcPrecision = 6;
    
    //team member 
    struct MemberData {
        uint256 stake;  //how much user has staked cumulatively 
    }
    
    //one full team 
    struct TeamPool {
        uint256 totalStake;     //how much unclaimed total staked by all members 
        uint256 totalReward;    //how much total unclaimed reward has been posted 
        address[] members;      //array of member addresses 
        mapping(address => MemberData) memberData; //map of member data 
    }
    
    //events 
    event MemberStaked(
        address team, 
        address member, 
        uint256 amount
    ); 
    event RewardPosted(
        address team, 
        uint256 amount
    ); 
    event MemberWithdraw(
        address team, 
        address member, 
        uint256 amount
    ); 
    
    /**
     * @dev Creates a new unique team with preassigned members. 
     * 
     * @param _team address of team administrator.
     * @param members list of all member addresses, assigned once and not changed.
     */
    function createTeam(address _team, address[] memory members) external {
        require(msg.sender == owner(), errorUnauthorized); 
        require(members.length >= 2, errorMinTeamSize);
        require(teamPools[_team].members.length == 0, errorDuplicate);
        
        teamPools[_team].totalStake = 0; 
        teamPools[_team].totalReward = 0; 
        teamPools[_team].members = members;
        
        for(uint n=0; n<members.length; n++) {
            require (membersToTeams[members[n]] == address(0), errorDuplicate); 
            membersToTeams[members[n]] = _team;
        }
    }
    
    /**
     * @dev A member calls this to stake their ETH in order to participate in a share 
     * of future rewards. 
     */
    function stake() external payable {
        address _team = membersToTeams[msg.sender]; 
        address _member = msg.sender;
        uint amount = msg.value;
        
        require(_team != address(0), errorUnauthorized); 
        
        teamPools[_team].memberData[_member].stake += amount;
        teamPools[_team].totalStake += amount;
        
        assert(teamPools[_team].memberData[_member].stake <= teamPools[_team].totalStake );
        
        emit MemberStaked(_team, _member, amount);
    }
    
    /**
     * @dev Gets the amount of unclaimed stake currently held from the given member.
     * 
     * @param _member address of a team member. 
     * @return uint256 amount of eth currently staked (unclaimed) by given member. 
     */
    function getMemberStake(address _member) public view returns (uint256) {
        return teamPools[membersToTeams[_member]].memberData[_member].stake;
    }
    
    /**
     * @dev Gets the entire stake currently unclaimed for a given team pool. 
     * 
     * @param _team address of a valid team. 
     * @return uint256 the total amount staked (unclaimed) by all members of the pool.
     */
    function getPoolStake(address _team) external view returns (uint256) {
        return teamPools[_team].totalStake;
    }
    
    /**
     * @dev Gets the amount of reward currently available for claiming in a pool. 
     * 
     * @param _team address of a valid team.
     * @return uint256 the amount of reward in the pool. 
     */
    function getPoolRewards(address _team) public view returns (uint256) {
        return teamPools[_team].totalReward;
    }
    
    /**
     * @dev Allows a team administrator to insert reward funds into the pool, which can 
     * be claimed by members according to their stake. 
     */
    function postRewards() external payable {
        address _team = msg.sender;
        uint amount = msg.value; 
        
        TeamPool storage pool = teamPools[_team]; 
        require(pool.members.length > 0, errorUnauthorized); //ensure pool exists
        
        pool.totalReward += amount;
        
        //determine share per member 
        for(uint n=0; n<pool.members.length; n++) {
            MemberData storage member = pool.memberData[pool.members[n]]; 
            (uint sharePct,,) = PercentageBasis.XisWhatPercentageOfY(member.stake, pool.totalStake, calcPrecision); 
            (uint rewardShare,,) = PercentageBasis.whatIsXPercentOfY(sharePct, amount, 1); 
            
            member.stake += rewardShare / 10**(calcPrecision-1); 
        }
        
        emit RewardPosted(_team, amount);
    }
    
    /**
     * @dev Allows a member to withdraw funds, including both original stake and 
     * rewards (if any). 
     * 
     * @param amount the amount to withdraw. 
     */
    function withdraw(uint256 amount) external {
        address _member = msg.sender;
        address _team = membersToTeams[_member]; 
        
        require(_team != address(0), errorUnauthorized); 
        require(teamPools[_team].memberData[_member].stake >= amount, errorExceedWithdraw); 
        
        teamPools[_team].memberData[_member].stake -= amount;
        teamPools[_team].totalStake -= amount;
        
        assert(teamPools[_team].memberData[_member].stake <= teamPools[_team].totalStake);
        
        (bool sent,) = payable(_member).call{value:amount}("");
        require(sent);
        
        emit MemberWithdraw(_team, _member, amount);
    }
    
    //- - - - - - - NON-PUBLIC METHODS - - - - - - -
    
}