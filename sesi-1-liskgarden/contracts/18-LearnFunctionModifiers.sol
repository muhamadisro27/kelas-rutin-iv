// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract LearnFunctionModifiers {
    uint256 public counter = 0;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function getCounter() public view returns (uint256) {
        return counter;
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function calculateDouble(uint256 x) public pure returns (uint256) {
        return x * 2;
    }

    function add(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b;
    }

    function multiply(uint256 a, uint256 b) public pure returns (uint256) {
        return a * b;
    }

    function deposit() public payable {}

    function buyItem() public payable returns (bool) {
        require(msg.value >= 0.001 ether, "Minimal 0.001 ETH");
        return true;
    }

    function incrementCounter() public {
        counter++;
    }

    function setCounter(uint256 _newValue) public {
        counter = _newValue;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}