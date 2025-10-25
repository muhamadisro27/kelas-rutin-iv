// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract LearnArray {
    uint256[] public allPlantIds;

    function addPlant(uint256 _plantId) public {
        allPlantIds.push(_plantId);
    }

    function getTotalPlants() public view returns (uint256) {
        return allPlantIds.length;
    }

    function getAllPlants() public view returns (uint256[] memory) {
        return allPlantIds;
    }
}