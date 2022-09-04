const { expect } = require("chai");
const { ethers } = require("hardhat");
const constants = require("./util/constants");
const deploy = require("./util/deploy");
const testEvent = require("./util/testEvent");

const provider = ethers.provider;

describe(constants.CONTRACT_NAME + ": Test", function () {		  
	let contract;				                            //contracts
    let owner, team1, team2, 
        member1_1, member1_2, member1_3, 
        member2_1, member2_2, member2_3; 	//accounts
	
	beforeEach(async function () {
        [
            owner, team1, team2, member1_1, member1_2, member1_3, 
            member2_1, member2_2, member2_3, nonMember, ...addrs
        ] = await ethers.getSigners();
        
        //contract
        contract = await deploy.deployContract();
	});
    
    describe("team creation", async function () {
        it("non-owner cannot create team", async function () {
            await expect(
                contract.connect(member1_1).createTeam(team1.address, [member1_1.address, member1_2.address])
            ).to.be.revertedWith(constants.errorMessages.UNAUTHORIZED);
        });
        
        it("owner can create team", async function () {
            await expect(
                contract.createTeam(team1.address, [member1_1.address, member1_2.address])
            ).to.not.be.reverted;

            //test initial values (stakes, rewards, etc. are 0)
            expect(await contract.getPoolRewards(team1.address)).to.equal(0);
            expect(await contract.getPoolStake(team1.address)).to.equal(0);
            expect(await contract.getMemberStake(member1_1.address)).to.equal(0);
            expect(await contract.getMemberStake(member1_2.address)).to.equal(0);
            expect(await contract.getMemberStake(member1_3.address)).to.equal(0);
            expect(await contract.getWithdrawLimit(member1_1.address)).to.equal(0);
            expect(await contract.getWithdrawLimit(member1_2.address)).to.equal(0);
            expect(await contract.getWithdrawLimit(member1_3.address)).to.equal(0); 
        });

        it("team must have at least 2 members", async function () {
            await expect(
                contract.createTeam(team1.address, [member1_1.address])
            ).to.be.revertedWith(constants.errorMessages.MIN_TEAM_MEMBERS);
        });

        it("team members must be unique", async function () {
            //TODO: ensure unique
        });
    });
    
    //TODO: TEST ALSO CONTRACT & MEMBER BALANCES   
    //TODO: test withdraw limits 

    describe("member staking", async function () {
        beforeEach(async function () {
            await contract.createTeam(team1.address, [member1_1.address, member1_2.address, member1_3.address]);
            await contract.createTeam(team2.address, [member2_1.address, member2_2.address, member2_3.address]); 
        });
        
        it("non-member of team cannot stake", async function () {
            await expect(
                contract.connect(nonMember).stake({value:1})
            ).to.be.revertedWith(constants.errorMessages.UNAUTHORIZED); 
            
            expect(await contract.getMemberStake(nonMember.address)).to.equal(0);
        });

        it("team member can stake to team pool", async function () {
            const amount = 100;
            await expect(
                contract.connect(member2_1).stake({ value: amount })
            ).to.not.be.reverted; 

            expect(await contract.getMemberStake(member2_1.address)).to.equal(amount);
            expect(await contract.getPoolStake(team2.address)).to.equal(amount);
            expect(await contract.getWithdrawLimit(member2_1.address)).to.equal(amount);
        });

        it("stake value is cumulative", async function () {
            const amount1 = 100;
            const amount2 = 200;
            const amount3 = 230;
            
            await contract.connect(member2_1).stake({ value: amount1 });
            expect(await contract.getMemberStake(member2_1.address)).to.equal(amount1);
            expect(await contract.getWithdrawLimit(member2_1.address)).to.equal(amount1);
            expect(await contract.getPoolStake(team2.address)).to.equal(amount1);

            await contract.connect(member2_1).stake({ value: amount2 });
            expect(await contract.getMemberStake(member2_1.address)).to.equal(amount1 + amount2);
            expect(await contract.getWithdrawLimit(member2_1.address)).to.equal(amount1 + amount2);
            expect(await contract.getPoolStake(team2.address)).to.equal(amount1 + amount2);

            await contract.connect(member2_2).stake({ value: amount3 });
            expect(await contract.getMemberStake(member2_2.address)).to.equal(amount3);
            expect(await contract.getWithdrawLimit(member2_2.address)).to.equal(amount3);
            expect(await contract.getPoolStake(team2.address)).to.equal(amount1 + amount2 + amount3);
        });
    });

    describe("posting rewards", async function () {
        beforeEach(async function () {
            await contract.createTeam(team1.address, [member1_1.address, member1_2.address, member1_3.address]);
            await contract.createTeam(team2.address, [member2_1.address, member2_2.address, member2_3.address]);
        });

        it("team can post rewards", async function () {
            const amount = 1000; 
            await contract.connect(team1).postRewards({value:amount}); 
            expect(await contract.getPoolRewards(team1.address)).to.equal(amount); 
        });

        it("non-team cannot post rewards", async function () {
            await expect(
                contract.connect(member1_2).postRewards({ value: 1 })
            ).to.be.revertedWith(constants.errorMessages.UNAUTHORIZED);
        });

        it("team reward posts are cumulative", async function () {
            const amount1 = 1000;
            const amount2 = 1150;
            
            await contract.connect(team1).postRewards({ value: amount1 });
            expect(await contract.getPoolRewards(team1.address)).to.equal(amount1);

            await contract.connect(team1).postRewards({ value: amount2 });
            expect(await contract.getPoolRewards(team1.address)).to.equal(amount1 + amount2);
        });
        
        it("member withdraw limit after rewards posted", async function () {
            const reward = 1000;
            const stake1 = 100;
            const stake2 = 100;

            await contract.connect(member1_1).stake({ value: stake1 });
            await contract.connect(team1).postRewards({ value: reward });
            await contract.connect(member1_2).stake({ value: stake2 });
            
            expect(await contract.getMemberStake(member1_1.address)).to.equal(stake1 + reward);
            expect(await contract.getWithdrawLimit(member1_1.address)).to.equal(stake1 + reward);
            expect(await contract.getMemberStake(member1_2.address)).to.equal(stake2);
            expect(await contract.getWithdrawLimit(member1_2.address)).to.equal(stake2);
        });
    });

    //TODO: test what happens when receiver refuses payment
    describe("withdrawing stake", async function () {
        beforeEach(async function () {
            await contract.createTeam(team1.address, [member1_1.address, member1_2.address, member1_3.address]);
            await contract.createTeam(team2.address, [member2_1.address, member2_2.address, member2_3.address]);
        });

        it("non-member cannot withdraw", async function () {
            await expect(
                contract.connect(nonMember).withdraw(2)
            ).to.be.revertedWith(constants.errorMessages.UNAUTHORIZED);
        });

        it("team member can stake and withdraw full stake", async function () {
            const amount = 100; 
            
            await contract.connect(member1_2).stake({ value: amount });
            expect(await contract.getMemberStake(member1_2.address)).to.equal(amount);
            expect(await contract.getWithdrawLimit(member1_2.address)).to.equal(amount);
            expect(await contract.getPoolStake(team1.address)).to.equal(amount);
            
            await contract.connect(member1_2).withdraw(amount);
            expect(await contract.getMemberStake(member1_2.address)).to.equal(0);
            expect(await contract.getWithdrawLimit(member1_2.address)).to.equal(0);
            expect(await contract.getPoolStake(team1.address)).to.equal(0);
        });

        it("team member cannot withdraw more than they stake", async function () {
            const amount = 100;

            await contract.connect(member1_1).stake({ value: amount });
            expect(await contract.getMemberStake(member1_1.address)).to.equal(amount);
            expect(await contract.getWithdrawLimit(member1_1.address)).to.equal(amount);
            expect(await contract.getPoolStake(team1.address)).to.equal(amount);

            await expect(
                contract.connect(member1_1).withdraw(amount+1)
            ).to.be.revertedWith(constants.errorMessages.WITHDRAW_LIMIT_EXCEEDED); 
        });

        it("team member can withdraw less than they staked", async function () {
            const amount = 100;

            await contract.connect(member1_1).stake({ value: amount });
            expect(await contract.getMemberStake(member1_1.address)).to.equal(amount);
            expect(await contract.getWithdrawLimit(member1_1.address)).to.equal(amount);
            expect(await contract.getPoolStake(team1.address)).to.equal(amount);

            await contract.connect(member1_1).withdraw(amount / 2);
            expect(await contract.getMemberStake(member1_1.address)).to.equal(amount / 2);
            expect(await contract.getWithdrawLimit(member1_1.address)).to.equal(amount / 2);
            expect(await contract.getPoolStake(team1.address)).to.equal(amount/2);
        });

        it("team member can only withdraw their own stake", async function () {
            const amount1 = 100;
            const amount2 = 150;

            await contract.connect(member1_1).stake({ value: amount1 });
            await contract.connect(member1_2).stake({ value: amount2 });

            expect(await contract.getMemberStake(member1_1.address)).to.equal(amount1);
            expect(await contract.getWithdrawLimit(member1_1.address)).to.equal(amount1);
            expect(await contract.getMemberStake(member1_2.address)).to.equal(amount2);
            expect(await contract.getWithdrawLimit(member1_2.address)).to.equal(amount2);
            expect(await contract.getPoolStake(team1.address)).to.equal(amount1 + amount2);

            await expect(
                contract.connect(member1_1).withdraw(amount1 + 1)
            ).to.be.revertedWith(constants.errorMessages.WITHDRAW_LIMIT_EXCEEDED); 
        });
    });

    describe("calculating rewards", async function () {
        beforeEach(async function () {
            await contract.createTeam(team1.address, [member1_1.address, member1_2.address, member1_3.address]);
            await contract.createTeam(team2.address, [member2_1.address, member2_2.address, member2_3.address]);
        });

        it("single team member can get a reward of 100%", async function () {
            const stake = 100;
            const reward = 1150;

            await contract.connect(member1_1).stake({ value: stake });
            await contract.connect(team1).postRewards({value: reward}); 
            
            expect(await contract.getMemberStake(member1_1.address)).to.equal(reward + stake);
            expect(await contract.getWithdrawLimit(member1_1.address)).to.equal(reward + stake);
        });

        it("two team members can share reward", async function () {
            const stake1 = 100;
            const stake2 = 101;
            const reward = 1150;
            const rewardShare1 = 572;
            const rewardShare2 = 577;

            await contract.connect(member1_1).stake({ value: stake1 });
            await contract.connect(member1_2).stake({ value: stake2 });
            await contract.connect(team1).postRewards({ value: reward });

            expect(await contract.getMemberStake(member1_1.address)).to.equal(rewardShare1 + stake1);
            expect(await contract.getWithdrawLimit(member1_1.address)).to.equal(rewardShare1 + stake1);

            expect(await contract.getMemberStake(member1_2.address)).to.equal(rewardShare2 + stake2);
            expect(await contract.getWithdrawLimit(member1_2.address)).to.equal(rewardShare2 + stake2);
        });

        it("late staker misses out on reward", async function () {
            const stake1 = 100;
            const stake2 = 101;
            const reward = 1150;
            const rewardShare1 = reward;
            const rewardShare2 = 0;

            await contract.connect(member1_1).stake({ value: stake1 });
            await contract.connect(team1).postRewards({ value: reward });
            await contract.connect(member1_2).stake({ value: stake2 });

            expect(await contract.getMemberStake(member1_1.address)).to.equal(rewardShare1 + stake1);
            expect(await contract.getWithdrawLimit(member1_1.address)).to.equal(rewardShare1 + stake1);

            expect(await contract.getMemberStake(member1_2.address)).to.equal(rewardShare2 + stake2);
            expect(await contract.getWithdrawLimit(member1_2.address)).to.equal(rewardShare2 + stake2);
        });

        it("late staker misses out on reward but gets the next one", async function () {

        });

        it("rewards are shared correctly between multiple stakers", async function () {

        });
    });

    describe("percentage basis", async function () {
        let percentageBasisLib;
        
        beforeEach(async function () {  
            percentageBasisLib = await deploy.deployLibrary();
        });
        
        it("x is what percent of y", async function () {
            let response;
            response = await percentageBasisLib.XisWhatPercentageOfY(20, 40, 4);
            expect(response.result).to.equal(50000); 
            expect(response.whole).to.equal(50);
            expect(response.decimal).to.equal(0); 

            response = await percentageBasisLib.XisWhatPercentageOfY(30, 40, 4);
            expect(response.result).to.equal(75000); 
            expect(response.whole).to.equal(75);
            expect(response.decimal).to.equal(0); 

            response = await percentageBasisLib.XisWhatPercentageOfY(20, 50, 4);
            expect(response.result).to.equal(40000); 
            expect(response.whole).to.equal(40);
            expect(response.decimal).to.equal(0); 

            response = await percentageBasisLib.XisWhatPercentageOfY(25, 40, 4);
            expect(response.result).to.equal(62500); 
            expect(response.whole).to.equal(62); 
            expect(response.decimal).to.equal(500); 
        });
        
        it("what is x percent of y", async function () {
            let response;
            response = await percentageBasisLib.XisWhatPercentageOfY(5, 100, 4);
            expect(response.result).to.equal(5000);
            expect(response.whole).to.equal(5);
            expect(response.decimal).to.equal(0); 

            response = await percentageBasisLib.XisWhatPercentageOfY(5, 200, 4);
            expect(response.result).to.equal(2500);
            expect(response.whole).to.equal(2);
            expect(response.decimal).to.equal(500); 

            response = await percentageBasisLib.XisWhatPercentageOfY(5, 40, 4);
            expect(response.result).to.equal(12500);
            expect(response.whole).to.equal(12);
            expect(response.decimal).to.equal(500); 

            response = await percentageBasisLib.XisWhatPercentageOfY(29, 30, 4);
            expect(response.result).to.equal(96600);
            expect(response.whole).to.equal(96);
            expect(response.decimal).to.equal(600); 
        });
    });

    describe("events", async function () {
        beforeEach(async function () { //TODO: make this a separate function 
            await contract.createTeam(team1.address, [member1_1.address, member1_2.address, member1_3.address]);
            await contract.createTeam(team2.address, [member2_1.address, member2_2.address, member2_3.address]);
        });

        it("MemberStaked event fires upon stake", async function () {
            const amount = 11;
            testEvent(
                await contract.connect(member1_1).stake({ value: amount}), 
                "MemberStaked", 
                [team1.address, member1_1.address, amount]
            ); 
        });

        it("RewardPosted event fires upon posting reward", async function () {
            const amount = 1111;
            testEvent(
                await contract.connect(team1).postRewards({ value: amount }),
                "RewardPosted",
                [team1.address, amount]
            ); 
        });

        it("MemberWithdrawal event fires upon member withdrawal", async function () {
            const stake = 100; 
            const withdrawal = 75;
            await contract.connect(member1_1).stake({ value: stake });

            testEvent(
                await contract.connect(member1_1).withdraw(withdrawal),
                "MemberWithdrawal",
                [team1.address, member1_1.adddress, withdrawal]
            ); 
        });
    });
});