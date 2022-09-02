const { expect } = require("chai");

/**
 * Verifies that an event was fired and that the values associated with the event are as 
 * expected. 
 * @param {lambda} funcCall A remote call that should trigger the event.  
 * @param {string} eventName The name of the event expected. 
 * @param {array} expectedValues (optional) Array of values expected to be associated 
 * with the event.
 */
async function testEvent(funcCall, eventName, expectedValues) {
    //call the remote function 
    const tx = await funcCall();
    const rc = await tx.wait();
    
    //expect that the event was fired
    const event = rc.events.find(event => event.event === eventName);
    expect(event.args); 

    //expect the expected values 
    if (expectedValues && expectedValues.length) {
        for (let n = 0; n < expectedValues.length; n++) {
            expect(event.args[n]).to.equal(expectedValues[n]);
        }
    }
}

module.exports = testEvent;