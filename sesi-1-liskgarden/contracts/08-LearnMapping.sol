// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract LearnMapping {
    mapping(uint256 => uint8) public plantWater;
    mapping(uint256 => address) public plantOwner;

    function addPlant(uint256 _plantId) public {
        plantWater[_plantId] = 100;
        plantOwner[_plantId] = msg.sender;
    }

    function waterPlant(uint256 _plantId) public {
        plantWater[_plantId] = 100;
    }
}