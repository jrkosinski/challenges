const { expect } = require("chai");
const { ethers } = require("hardhat");
const constants = require("./util/constants");
const deploy = require("./util/deploy");
const testEvent = require("./util/testEvent");

const provider = ethers.provider;

describe(constants.CONTRACT_NAME + ": Test", function () {		  
	let contract;				                    //contracts
	let payer, receiver, releaser, addr4, addr5; 	//accounts
	
	beforeEach(async function () {
        [payer, receiver, releaser, addr4, addr5, ...addrs] = await ethers.getSigners();
        
        //contract
        contract = await deploy.deployContract();
	});

    describe("Deposit", function () {
        it("releaser must be different from both sender & payee", async function() {
            await expect(contract.depositFor(payer.address, payer.address, { value:1 })).to.be.revertedWith(constants.errorMessages.RELEASER_SAME);
            await expect(contract.depositFor(receiver.address, payer.address, { value: 1 })).to.be.revertedWith(constants.errorMessages.RELEASER_SAME);
            await expect(contract.depositFor(receiver.address, receiver.address, { value: 1 })).to.be.revertedWith(constants.errorMessages.RELEASER_SAME);
        });
        
        it("amount must be > 0", async function () {
            await expect(contract.depositFor(receiver.address, releaser.address, { value: 0 })).to.be.revertedWith(constants.errorMessages.EMPTY_DEPOSIT);
        });

        it("can deposit nonzero amount", async function () {
            const amount = 100; 
            await expect(contract.depositFor(receiver.address, releaser.address, {value:amount})).to.not.be.reverted;
            
            const deposit = await contract.getDeposit(payer.address, receiver.address, releaser.address);
            expect(deposit.amount).to.equal(amount); 
            expect(deposit.payer).to.equal(payer.address);
            expect(deposit.receiver).to.equal(receiver.address);
            expect(deposit.releaser).to.equal(releaser.address); 
            
            expect(await provider.getBalance(contract.address)).to.equal(amount);
        });

        it("can add multiple entries with different releasers", async function () {
            const amount1 = 100;
            const amount2 = 300;

            const releaser1 = releaser;
            const releaser2 = addr4;
            const payer1 = payer;
            const payer2 = addr5;

            await contract.connect(payer1).depositFor(receiver.address, releaser1.address, { value: amount1 });
            await contract.connect(payer2).depositFor(receiver.address, releaser2.address, { value: amount2 });

            const deposit1 = await contract.getDeposit(payer1.address, receiver.address, releaser1.address);
            const deposit2 = await contract.getDeposit(payer2.address, receiver.address, releaser2.address);

            //correct amounts 
            expect(deposit1.amount).to.equal(amount1);
            expect(deposit2.amount).to.equal(amount2);

            //correct payers 
            expect(deposit1.payer).to.equal(payer1.address);
            expect(deposit2.payer).to.equal(payer2.address);

            //correct receivers 
            expect(deposit1.receiver).to.equal(receiver.address);
            expect(deposit2.receiver).to.equal(receiver.address);

            //correct releasers 
            expect(deposit1.releaser).to.equal(releaser1.address);
            expect(deposit2.releaser).to.equal(releaser2.address);

            expect(await provider.getBalance(contract.address)).to.equal(amount1 + amount2);
        });

        it("can add multiple entries with same releaser", async function () {
            const amount1 = 100;
            const amount2 = 300;

            const payer1 = payer;
            const payer2 = addr5;

            await contract.connect(payer1).depositFor(receiver.address, releaser.address, { value: amount1 });
            await contract.connect(payer2).depositFor(receiver.address, releaser.address, { value: amount2 });

            const deposit1 = await contract.getDeposit(payer1.address, receiver.address, releaser.address);
            const deposit2 = await contract.getDeposit(payer2.address, receiver.address, releaser.address);

            //correct amounts 
            expect(deposit1.amount).to.equal(amount1);
            expect(deposit2.amount).to.equal(amount2);

            //correct payers 
            expect(deposit1.payer).to.equal(payer1.address);
            expect(deposit2.payer).to.equal(payer2.address);

            //correct receivers 
            expect(deposit1.receiver).to.equal(receiver.address);
            expect(deposit2.receiver).to.equal(receiver.address);

            //correct releasers 
            expect(deposit1.releaser).to.equal(releaser.address);
            expect(deposit2.releaser).to.equal(releaser.address);

            expect(await provider.getBalance(contract.address)).to.equal(amount1 + amount2);
        });

        it("cannot add identical entries", async function () {
            const amount1 = 100;
            const amount2 = 300;
            
            await contract.depositFor(receiver.address, releaser.address, { value: amount1 });
            await contract.depositFor(receiver.address, releaser.address, { value: amount2 }); 
            
            //should be one deposit, with the full amount
            const deposit = await contract.getDeposit(payer.address, receiver.address, releaser.address);

            expect(deposit.amount).to.equal(amount1 + amount2);
            expect(deposit.payer).to.equal(payer.address);
            expect(deposit.receiver).to.equal(receiver.address);
            expect(deposit.releaser).to.equal(releaser.address);
        });
    });

    describe("Release", function () {
        it("cannot release if no deposit", async function () {
            await expect(contract.release()).to.be.revertedWith(constants.errorMessages.DEPOSIT_NOT_FOUND);
        });

        it("payer cannot release", async function () {
            await contract.depositFor(receiver.address, releaser.address, { value: 1 }); 
            await expect(contract.release()).to.be.revertedWith(constants.errorMessages.DEPOSIT_NOT_FOUND);
        });

        it("receiver cannot release", async function () {
            await contract.depositFor(receiver.address, releaser.address, { value: 1 });
            await expect(contract.connect(receiver).release()).to.be.revertedWith(constants.errorMessages.DEPOSIT_NOT_FOUND);
        });

        it("releaser can release", async function () {
            await contract.depositFor(receiver.address, releaser.address, { value: 1 });
            await expect(contract.connect(releaser).release()).to.not.be.reverted;

            expect(await provider.getBalance(contract.address)).to.equal(0);
        });

        it("release removes the deposit", async function () {
            const amount = 100;
            await contract.depositFor(receiver.address, releaser.address, { value: amount });
            await contract.connect(releaser).release();
            
            const deposit = await contract.getDeposit(payer.address, receiver.address, releaser.address);
            expect(deposit.amount).to.equal(0); 
            
            expect(await provider.getBalance(contract.address)).to.equal(0);
        });

        it("release reverts if unable to be received", async function () {
            const unpayable = await deploy.deployUnpayable();
            
            await contract.depositFor(unpayable.address, releaser.address, { value: 1 });
            
            await expect(contract.connect(releaser).release()).to.be.reverted;
        });

        it("correct amount is released", async function () {
            const amount1 = 100;
            const amount2 = 300;

            const releaser1 = releaser;
            const releaser2 = addr4;
            const payer1 = payer;
            const payer2 = addr5;

            await contract.connect(payer1).depositFor(receiver.address, releaser1.address, { value: amount1 });
            await contract.connect(payer2).depositFor(receiver.address, releaser2.address, { value: amount2 });

            await contract.connect(releaser2).release(); 
            
            expect(await provider.getBalance(contract.address)).to.equal(amount1); 
        });
    });
});