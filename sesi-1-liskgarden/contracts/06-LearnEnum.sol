// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract LearnEnum {
    enum GrowStage {
        SEED,
        SPROUT,
        GROWING,
        BLOOMING
    }

    GrowStage public currentStage;

    constructor() {
        currentStage = GrowStage.SEED;
    }

    function grow() public {
        if(currentStage == GrowStage.SEED) {
            currentStage = GrowStage.SPROUT;
        }

        else if(currentStage == GrowStage.SPROUT) {
            currentStage = GrowStage.SEED;
        }
        else if(currentStage == GrowStage.SEED) {
            currentStage = GrowStage.BLOOMING;
        }
    }
}