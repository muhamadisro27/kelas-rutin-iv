// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract LearnVisibility {
    uint256 public publicVar = 100;
    uint256 private privateVar = 200;
    uint256 internal internalVar = 300;

    function publicFunction() public pure returns (string memory) {
        return "Semua bisa panggil ini";
    }

    function externalFunction() external pure returns (string memory) {
        return "Hanya bisa dipanggil dari luar";
    }

    function internalFunction() internal pure returns (string memory) {
        return "Hanya untuk internal";
    }

    function privateFunction() private pure returns (string memory) {
        return "Hanya contract ini";
    }

    function testInternalCall() public pure returns (string memory) {
        return internalFunction();
    }

    function getPrivateVar() public view returns (uint256) {
        return privateVar;
    }
}