// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract LearnEvents {
    event PlantAdded(address indexed owner, uint256 indexed plantId);
    event PlantWatered(uint256 indexed plantId, uint8 waterLevel);

    mapping (uint256 => address) public plantOwner;
    uint256 public plantCounter;

    function addPlant() public {
        plantCounter++;
        plantOwner[plantCounter] = msg.sender;

        emit PlantAdded(msg.sender, plantCounter);
    }

    function waterPlant(uint256 _plantId) public {
        emit PlantWatered(_plantId, 100);
    }
}