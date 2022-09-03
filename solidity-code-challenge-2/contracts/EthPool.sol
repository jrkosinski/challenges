// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";


//TODO: add events 
//TODO: allow conversion from reward to stake 
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
    
    //precision for divvying up currency rewards 
    uint8 constant calcPrecision = 6;
    
    //team member 
    struct MemberData {
        uint256 stake;  //how much user has staked cumulatively 
        uint256 rewardShare; //how much of the reward the user is due 
    }
    
    //one full team 
    struct TeamPool {
        uint256 totalStake;     //how much unclaimed total staked by all members 
        uint256 totalReward;    //how much total unclaimed reward has been posted 
        address[] members;      //array of member addresses 
        mapping(address => MemberData) memberData; //map of member data 
    }
    
    //events 
    event MemberStaked(address team, address member, uint256 amount); 
    event RewardPosted(address team, uint256 amount); 
    event MemberWithdraw(address team, address member, uint256 amount); 
    
    /**
     * @dev Creates a new unique team with preassigned members. 
     * 
     * @param _team address of team administrator.
     * @param members list of all member addresses, assigned once and not changed.
     */
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
    
    /**
     * @dev A member calls this to stake their ETH in order to participate in a share 
     * of future rewards. 
     */
    function stake() external payable {
        address _team = membersToTeams[msg.sender]; 
        require(_team != address(0), errorUnauthorized); 
        
        teamPools[_team].memberData[msg.sender].stake += msg.value;
        teamPools[_team].totalStake += msg.value;
        
        assert(teamPools[_team].memberData[msg.sender].stake <= teamPools[_team].totalStake );
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
     * @dev Gets the total amount that the given member has a right to withdraw as of 
     * the time this method is called; it includes both the member's unclaimed stake 
     * (if any) plus any share of rewards. 
     * 
     * @param _member address of a team member. 
     * @return uint256 amount of eth that this member can withdraw at this moment.
     */
    function getWithdrawLimit(address _member) external view returns (uint256) {
        return getMemberStake(_member) + getRewardShare(_member); 
    }
    
    /**
     * @dev Gets the share, represented as a percentage, of the current rewards to which 
     * the given member is entitled. 
     * 
     * @param _member address of a team member. 
     * @return uint256 the amount of reward currently posted. 
     */
    function getRewardShare(address _member) public view returns (uint256) {
        return teamPools[membersToTeams[_member]].memberData[_member].rewardShare;
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
    
    /**
     * @dev Allows a member to withdraw funds, including both original stake and 
     * rewards (if any). 
     * 
     * @param amount the amount to withdraw. 
     */
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