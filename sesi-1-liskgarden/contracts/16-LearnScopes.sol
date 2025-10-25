// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract LearnScopes {
    uint256 public plantCounter;  
    address public owner;         

    function getGlobalVariables() public view returns (
        address sender,
        uint256 timestamp,
        uint256 blockNumber,
        address contractAddress
    ) {
        sender = msg.sender;              
        timestamp = block.timestamp;      
        blockNumber = block.number;      
        contractAddress = address(this); 

        return (sender, timestamp, blockNumber, contractAddress);
    }

   
    function calculateAge(uint256 _plantedTime) public view returns (uint256) {
        uint256 currentTime = block.timestamp;
        uint256 age = currentTime - _plantedTime;

        return age;
    }

    constructor() {
        owner = msg.sender;
        plantCounter = 0;
    }

    function addPlant() public {
        uint256 newId = plantCounter + 1;

        plantCounter = newId;
    }
}