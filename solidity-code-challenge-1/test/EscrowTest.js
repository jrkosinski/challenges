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
            
            const entry = await contract.getEntry(payer.address, receiver.address, releaser.address);
            expect(entry.amount).to.equal(amount); 
            expect(entry.payer).to.equal(payer.address);
            expect(entry.receiver).to.equal(receiver.address);
            expect(entry.releaser).to.equal(releaser.address); 
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

            const entry1 = await contract.getEntry(payer1.address, receiver.address, releaser1.address);
            const entry2 = await contract.getEntry(payer2.address, receiver.address, releaser2.address);

            //correct amounts 
            expect(entry1.amount).to.equal(amount1);
            expect(entry2.amount).to.equal(amount2);

            //correct payers 
            expect(entry1.payer).to.equal(payer1.address);
            expect(entry2.payer).to.equal(payer2.address);

            //correct receivers 
            expect(entry1.receiver).to.equal(receiver.address);
            expect(entry2.receiver).to.equal(receiver.address);

            //correct releasers 
            expect(entry1.releaser).to.equal(releaser1.address);
            expect(entry2.releaser).to.equal(releaser2.address);
        });

        it("can add multiple entries with same releaser", async function () {
            const amount1 = 100;
            const amount2 = 300;

            const payer1 = payer;
            const payer2 = addr5;

            await contract.connect(payer1).depositFor(receiver.address, releaser.address, { value: amount1 });
            await contract.connect(payer2).depositFor(receiver.address, releaser.address, { value: amount2 });

            const entry1 = await contract.getEntry(payer1.address, receiver.address, releaser.address);
            const entry2 = await contract.getEntry(payer2.address, receiver.address, releaser.address);

            //correct amounts 
            expect(entry1.amount).to.equal(amount1);
            expect(entry2.amount).to.equal(amount2);

            //correct payers 
            expect(entry1.payer).to.equal(payer1.address);
            expect(entry2.payer).to.equal(payer2.address);

            //correct receivers 
            expect(entry1.receiver).to.equal(receiver.address);
            expect(entry2.receiver).to.equal(receiver.address);

            //correct releasers 
            expect(entry1.releaser).to.equal(releaser.address);
            expect(entry2.releaser).to.equal(releaser.address);
        });

        it("cannot add identical entries", async function () {
            const amount1 = 100;
            const amount2 = 300;
            
            await contract.depositFor(receiver.address, releaser.address, { value: amount1 });
            await contract.depositFor(receiver.address, releaser.address, { value: amount2 }); 
            
            //should be one entry, with the full amount 
            const entry = await contract.getEntry(payer.address, receiver.address, releaser.address);

            expect(entry.amount).to.equal(amount1 + amount2);
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

        it("release removes the entry", async function () {
            const amount = 100;
            await contract.depositFor(receiver.address, releaser.address, { value: amount });
            await contract.connect(releaser).release();
            
            const entry = await contract.getEntry(payer.address, receiver.address, releaser.address);
            expect(entry.amount).to.equal(0); 
        });
    });

    describe("Integration", function () {

    }); 
});