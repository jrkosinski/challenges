const { expect } = require("chai");
const { ethers } = require("hardhat");
const constants = require("./util/constants");
const deploy = require("./util/deploy");
const testEvent = require("./util/testEvent");


describe(constants.CONTRACT_NAME + ": Test", function () {		  
	let contract;				    //contracts
	let owner, addr1, addr2; 	    //accounts
	
	beforeEach(async function () {
		[owner, addr1, addr2,...addrs] = await ethers.getSigners();
        
        //contract
        contract = await deploy.deployContract();
	});
	
	describe("Initial State", function () {
    });  
});