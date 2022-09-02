const { expect } = require("chai");
const { ethers } = require("hardhat");
const constants = require("./util/constants");
const deploy = require("./util/deploy");
const testEvent = require("./util/testEvent");


describe(constants.CONTRACT_NAME + ": Test", function () {		  
	let contract;				                    //contracts
	let payer, receiver, releaser, addr4, addr5; 	//accounts
	
	beforeEach(async function () {
        [payer, receiver, releaser, addr4, addr5, ...addrs] = await ethers.getSigners();
        
        //contract
        contract = await deploy.deployContract();
	});
	
	describe("Initial State", function () {
        
    });

    describe("Deposit", function () {
        it("releaser must be different from both sender & payee", async function() {
            await expect(contract.depositFor({ value: 1 }, payer.addresss, payer.address)).to.be.reverted;
            await expect(contract.depositFor({ value: 1 }, payer.addresss, releaser.address)).to.be.reverted;
            await expect(contract.depositFor({ value: 1 }, receiver.addresss, payer.address)).to.be.reverted;
        });
        
        it("amount must be > 0", async function () {
            await expect(contract.depositFor(receiver.addresss, releaser.address)).to.be.reverted;
        });

        it("can deposit nonzero amount", async function () {
            const amount = 100; 
            await expect(contract.depositFor(receiver.address, releaser.address, {value:amount})).to.not.be.reverted;
            
            const entry = await contract.entries(releaser.address);
            expect(entry.paidOut).to.equal(false);
            expect(entry.amount).to.equal(amount); 
            expect(entry.payer).to.equal(payer.address);
            expect(entry.receiver).to.equal(receiver.address);
            expect(entry.releaser).to.equal(releaser.address); 
        });
    });

    describe("Release", function () {
        it("cannot release if no deposit", async function () {
            await expect(contract.release()).to.be.reverted;
        });

        it("payer cannot release", async function () {
            await contract.depositFor(receiver.address, releaser.address, { value: 1 }); 
            await expect(contract.release()).to.be.reverted;
        });

        it("receiver cannot release", async function () {
            await contract.depositFor(receiver.address, releaser.address, { value: 1 });
            await expect(contract.connect(receiver).release()).to.be.reverted;
        });

        it("releaser can release", async function () {
            await contract.depositFor(receiver.address, releaser.address, { value: 1 });
            await expect(contract.connect(releaser).release()).to.not.be.reverted;
        });

        it("release sets paidOut to true", async function () {
            const amount = 100;
            await contract.depositFor(receiver.address, releaser.address, { value: amount });
            await contract.connect(releaser).release();
            
            const entry = await contract.entries(releaser.address); 
            expect(entry.paidOut).to.equal(true);
            expect(entry.amount).to.equal(amount); 
        });
    });
});