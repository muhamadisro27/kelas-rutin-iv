// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract LiskGarden {
    enum GrowthStage {
        SEED,
        SPROUT,
        GROWING,
        BLOOMING
    }

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
    event PlantHarvested(
        uint256 indexed plantId,
        address indexed owner,
        uint256 reward
    );
    event StageAdvanced(uint256 indexed plantId, GrowthStage stage);
    event PlantDied(uint256 indexed plantId);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner!");
        _;
    }

    modifier onlyOwnerPlant(uint256 _plantId) {
        require(plants[_plantId].owner == msg.sender, "You are not the owner!");
        _;
    }

    modifier isBalanceEnough() {
        require(msg.value >= PLANT_PRICE, "Insufficient balance!");
        _;
    }

    modifier isPlantAlive(uint256 _plantId) {
        require(!plants[_plantId].isDead, "Plant already dead!");
        _;
    }

    modifier isPlantExist(uint256 _plantId) {
        require(plants[_plantId].exists, "Plant doesn't exist!");
        _;
    }

    modifier isBlooming(uint256 _plantId) {
        require(
            plants[_plantId].stage == GrowthStage.BLOOMING,
            "Not blooming yet!"
        );
        _;
    }

    function plantSeed() external payable isBalanceEnough returns (uint256) {
        plants[++plantCounter] = Plant({
            id: plantCounter,
            owner: msg.sender,
            stage: GrowthStage.SEED,
            plantedDate: block.timestamp,
            lastWatered: block.timestamp,
            waterLevel: 100,
            exists: true,
            isDead: false
        });

        userPlants[msg.sender].push(plantCounter);

        emit PlantSeeded(msg.sender, plantCounter);

        return plantCounter;
    }

    function calculateWaterLevel(uint256 _plantId) public view returns (uint8) {
        Plant memory plant = plants[_plantId];

        if (!plant.exists || plant.isDead) return 0;

        uint256 timeSinceWatered = block.timestamp - plant.lastWatered;

        uint256 depletionIntervals = timeSinceWatered / WATER_DEPLETION_TIME;

        uint256 waterLost = depletionIntervals * WATER_DEPLETION_RATE;

        if (waterLost >= plant.waterLevel) return 0;

        return uint8(plant.waterLevel - waterLost);
    }

    function updateWaterLevel(uint256 _plantId) internal {
        Plant storage plant = plants[_plantId];

        uint8 currentWater = calculateWaterLevel(_plantId);

        plant.waterLevel = currentWater;

        if (currentWater == 0 && !plant.isDead) {
            plant.isDead = true;
            emit PlantDied(_plantId);
        }
    }

    function waterPlant(
        uint256 _plantId
    )
        external
        isPlantExist(_plantId)
        isPlantAlive(_plantId)
        onlyOwnerPlant(_plantId)
    {
        Plant storage plant = plants[_plantId];
        plant.waterLevel = 100;
        plant.lastWatered = block.timestamp;

        emit PlantWatered(_plantId, 100);
        updatePlantStage(_plantId);
    }

    function updatePlantStage(uint256 _plantId) public isPlantExist(_plantId) {
        Plant storage plant = plants[_plantId];

        updateWaterLevel(_plantId);
        if (plant.isDead) return;

        uint256 timeSincePlanted = block.timestamp - plant.plantedDate;
        GrowthStage oldStage = plant.stage;

        if (timeSincePlanted >= STAGE_DURATION * 3) {
            plant.stage = GrowthStage.BLOOMING;
        } else if (timeSincePlanted >= STAGE_DURATION * 2) {
            plant.stage = GrowthStage.GROWING;
        } else if (timeSincePlanted >= STAGE_DURATION) {
            plant.stage = GrowthStage.SPROUT;
        } else {
            plant.stage = GrowthStage.SEED;
        }

        if (plant.stage != oldStage) {
            emit StageAdvanced(_plantId, plant.stage);
        }
    }

    function harvestPlant(
        uint256 _plantId
    )
        external
        isPlantExist(_plantId)
        isPlantAlive(_plantId)
        onlyOwnerPlant(_plantId)
    {
        Plant storage plant = plants[_plantId];

        updatePlantStage(_plantId);
        require(plant.stage == GrowthStage.BLOOMING, "Plant not blooming yet!");

        plant.exists = false;

        emit PlantHarvested(_plantId, msg.sender, REWARD_HARVEST);

        require(
            address(this).balance >= REWARD_HARVEST,
            "Insufficient contract balance!"
        );
        (bool success, ) = payable(msg.sender).call{value: REWARD_HARVEST}("");
        require(success, "Failed sending reward!");
    }

    function getPlant(uint256 _plantId) external view returns (Plant memory) {
        Plant memory plant = plants[_plantId];
        plant.waterLevel = calculateWaterLevel(_plantId);

        return plant;
    }

    function getUserPlants(
        address user
    ) external view returns (uint256[] memory) {
        return userPlants[user];
    }

    function getStatusUserPlant(
        uint256 _plantId
    ) external view onlyOwnerPlant(_plantId) returns (GrowthStage) {
        return plants[_plantId].stage;
    }

    function withdraw() external onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "Nothing to withdraw");

        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Failed transfer");
    }

    function deposit() external payable onlyOwner {}

    receive() external payable {}
}
