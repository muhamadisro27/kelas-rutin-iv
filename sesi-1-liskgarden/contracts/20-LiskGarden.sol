// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract LiskGarden {


    enum GrowthStage {SEED, SPROUT, GROWING, BLOOMING}

    struct Plant {
        uint256 id;
        address owner;
        GrowthStage stage;
        uint256 plantedDate;
        uint256 lastWatered;
        uint8 waterLevel;
        bool exists;
        bool isDead;
    }

    mapping(uint256 => Plant) public plants;

    mapping(address => uint256[]) public userPlants;

    uint256 public plantCounter;

    address public owner;

    uint256 public constant PLANT_PRICE = 0.001 ether;
    uint256 public constant REWARD_HARVEST = 0.003 ether;
    uint256 public constant STAGE_DURATION = 1 minutes;
    uint256 public constant WATER_DEPLETION_TIME = 30 seconds;
    uint8 public constant WATER_DEPLETION_RATE = 2;


    event PlantSeeded(address indexed owner, uint256 indexed plantId);
    event PlantWatered(uint256 indexed plantId, uint8 newWaterLevel);
    event PlantHarvested(uint256 indexed plantId, address indexed owner, uint256 reward);
    event StageAdvanced(uint256 indexed plantId, GrowthStage stage);
    event PlantDied(uint256 indexed plantId);

    constructor() {
        owner = msg.sender;
    }

    function plantSeed() external payable returns (uint256) {
        require(msg.value >= PLANT_PRICE, "Insufficient balance!");

        plantCounter++;

        Plant memory newPlant = Plant({
            id: plantCounter,
            owner: msg.sender,
            stage: GrowthStage.SEED,
            plantedDate: block.timestamp,
            lastWatered: block.timestamp,
            waterLevel : 100,
            exists: true,
            isDead: false
        });

        plants[plantCounter] = newPlant;
        
        userPlants[msg.sender].push(plantCounter);
        
        emit PlantSeeded(msg.sender, plantCounter);

        return plantCounter;
    }

    function calculateWaterLevel(uint256 _plantId) public view returns (uint8) {
        Plant storage plant = plants[_plantId];

        if(!plant.exists || plant.isDead) return 0;

        uint256 timeSinceWatered = block.timestamp - plant.lastWatered;

        uint256 depletionIntervals = timeSinceWatered / WATER_DEPLETION_TIME;

        uint256 waterLost = depletionIntervals * WATER_DEPLETION_RATE;

        if(waterLost >= plant.waterLevel) return 0;

        return uint8(plant.waterLevel - waterLost);
    }

    function updateWaterLevel (uint256 _plantId) internal {
        Plant storage plant = plants[_plantId];

        uint8 currentWater = calculateWaterLevel(_plantId);

        plant.waterLevel = currentWater;

        if(currentWater == 0 && !plant.isDead) {
            plant.isDead = true;
            emit PlantDied(_plantId);
        }
    }

    function waterPlant(uint256 _plantId) external {
        Plant storage plant = plants[_plantId];
        require(plant.exists, "Plant doesn't exist!");
        require(plant.owner == msg.sender, "You are not the owner!");
        require(!plant.isDead, "Plant already dead!");

        plant.waterLevel = 100;
        plant.lastWatered = block.timestamp;

        emit PlantWatered(_plantId, 100);
        updatePlantStage(_plantId);
    }

    function updatePlantStage(uint256 _plantId) public  {
        Plant storage plant = plants[_plantId];
        require(plant.exists, "Plant doesn't exist!");

        updateWaterLevel(_plantId);
        if(plant.isDead) return;

        uint256 timeSincePlanted = block.timestamp - plant.plantedDate;
        GrowthStage oldStage = plant.stage;

        if(timeSincePlanted >= STAGE_DURATION * 3) {
            plant.stage = GrowthStage.BLOOMING;
        } else if(timeSincePlanted >= STAGE_DURATION * 2) {
            plant.stage = GrowthStage.GROWING;
        } else if(timeSincePlanted >= STAGE_DURATION) {
            plant.stage = GrowthStage.SPROUT;
        } else {
            plant.stage = GrowthStage.SEED;
        }

        if(plant.stage != oldStage) {
            emit StageAdvanced(_plantId, plant.stage);
        }
    }
 
    function harvestPlant(uint256 plantId) external {
        Plant storage plant = plants[plantId];
        require(plant.exists, "Plant doesn't exist!");
        require(plant.owner == msg.sender, "You are not the owner!");
        require(!plant.isDead, "Plant already dead!");

        updatePlantStage(plantId);
        require(plant.stage == GrowthStage.BLOOMING, "Belum mekar");

        plant.exists = false;

        emit PlantHarvested(plantId, msg.sender, REWARD_HARVEST);

        (bool success, ) = payable(msg.sender).call{value: REWARD_HARVEST}("");
        require(success, "Failed sending reward!");
    }

    function getPlant(uint256 _plantId) external view returns (Plant memory) {
        Plant memory plant = plants[_plantId];
        plant.waterLevel = calculateWaterLevel(_plantId);
        
        return plant;
    }

    function getUserPlants(address user) external view returns (uint256[] memory) {
        return userPlants[user];
    }

    function withdraw() external {
        require(msg.sender == owner, "You are not the owner!");
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Failed Transfer!");
    }

    receive() external payable {}
}