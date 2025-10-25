// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract LearnSendETH {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function deposit() public payable {}

    function sendReward(address _to) public {
        require(msg.sender == owner, "Hanya owner");

        (bool success, ) = _to.call{value: 0.001 ether}("");
        require(success, "Transfer gagal");
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}