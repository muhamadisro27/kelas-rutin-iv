// Contract interaction utilities untuk LiskGarden DApp
// Menggunakan Panna SDK & Thirdweb untuk berinteraksi dengan smart contract

import { liskSepolia } from "panna-sdk"
import {
  prepareContractCall,
  sendTransaction,
  readContract,
  waitForReceipt,
} from "thirdweb/transaction"
import { getContract } from "thirdweb/contract"
import { toWei } from "thirdweb/utils"
import {
  LISK_GARDEN_CONTRACT_ADDRESS,
  LISK_GARDEN_ABI,
  Plant,
  GrowthStage,
  STAGE_NAMES,
  PLANT_PRICE,
  HARVEST_REWARD,
  STAGE_DURATION,
  WATER_DEPLETION_TIME,
  WATER_DEPLETION_RATE,
} from "@/types/contract"

// ============================================
// HELPER FUNCTIONS
// ============================================

// Convert raw contract data menjadi typed Plant object
export function parsePlantData(rawPlant: any): Plant {
  // Handle both array-like tuples and object-like structures
  const isArray = Array.isArray(rawPlant)

  return {
    id: BigInt(isArray ? rawPlant[0] ?? 0 : rawPlant.id ?? 0),
    owner: isArray ? rawPlant[1] ?? "" : rawPlant.owner ?? "",
    stage: Number(
      isArray ? rawPlant[2] ?? 0 : rawPlant.stage ?? 0
    ) as GrowthStage,
    plantedDate: BigInt(isArray ? rawPlant[3] ?? 0 : rawPlant.plantedDate ?? 0),
    lastWatered: BigInt(isArray ? rawPlant[4] ?? 0 : rawPlant.lastWatered ?? 0),
    waterLevel: Number(isArray ? rawPlant[5] ?? 0 : rawPlant.waterLevel ?? 0),
    exists: Boolean(isArray ? rawPlant[6] ?? false : rawPlant.exists ?? false),
    isDead: Boolean(isArray ? rawPlant[7] ?? false : rawPlant.isDead ?? false),
  }
}

// ============================================
// CONTRACT WRITE FUNCTIONS (Mengubah state)
// ============================================

// Plant a new seed (payable - butuh ETH)
export async function plantSeed(client: any, account: any) {
  const tx = prepareContractCall({
    contract: getContract({
      client,
      chain: liskSepolia,
      address: LISK_GARDEN_CONTRACT_ADDRESS,
    }),
    method: "function plantSeed() payable returns (uint256)",
    params: [],
    value: toWei(PLANT_PRICE), // Convert 0.001 ETH ke wei
  })

  const result = await sendTransaction({
    account,
    transaction: tx,
  })

  // Wait sampai transaction di-mine
  await waitForReceipt(result)

  return result
}

// Water a plant
export async function waterPlant(client: any, account: any, plantId: bigint) {
  const tx = prepareContractCall({
    contract: getContract({
      client,
      chain: liskSepolia,
      address: LISK_GARDEN_CONTRACT_ADDRESS,
    }),
    method: "function waterPlant(uint256 plantId)",
    params: [plantId],
  })

  const result = await sendTransaction({
    account,
    transaction: tx,
  })

  await waitForReceipt(result)

  return result
}

// Harvest a blooming plant
export async function harvestPlant(client: any, account: any, plantId: bigint) {
  const tx = prepareContractCall({
    contract: getContract({
      client,
      chain: liskSepolia,
      address: LISK_GARDEN_CONTRACT_ADDRESS,
    }),
    method: "function harvestPlant(uint256 plantId)",
    params: [plantId],
  })

  const result = await sendTransaction({
    account,
    transaction: tx,
  })

  await waitForReceipt(result)

  return result
}

// Update plant stage manually (sync dengan blockchain)
export async function updatePlantStage(
  client: any,
  account: any,
  plantId: bigint
) {
  const tx = prepareContractCall({
    contract: getContract({
      client,
      chain: liskSepolia,
      address: LISK_GARDEN_CONTRACT_ADDRESS,
    }),
    method: "function updatePlantStage(uint256 plantId)",
    params: [plantId],
  })

  const result = await sendTransaction({
    account,
    transaction: tx,
  })

  await waitForReceipt(result)

  return result
}

// ============================================
// CONTRACT READ FUNCTIONS (Read-only, tidak butuh gas)
// ============================================

// Get single plant data
export async function getPlant(client: any, plantId: bigint): Promise<Plant> {
  const contract = getContract({
    client,
    chain: liskSepolia,
    address: LISK_GARDEN_CONTRACT_ADDRESS,
  })

  const rawPlant = await readContract({
    contract,
    method:
      "function getPlant(uint256 plantId) view returns (uint256 id, address owner, uint8 stage, uint256 plantedDate, uint256 lastWatered, uint8 waterLevel, bool exists, bool isDead)",
    params: [plantId],
  })

  return parsePlantData(rawPlant)
}

// Calculate current water level dari blockchain
export async function calculateWaterLevel(
  client: any,
  plantId: bigint,
  plant?: Plant
): Promise<number> {
  // Optimization: Skip blockchain call untuk blooming plants
  // Blooming plants tidak kehilangan air
  if (plant && plant.stage === GrowthStage.BLOOMING) {
    return plant.waterLevel
  }

  const contract = getContract({
    client,
    chain: liskSepolia,
    address: LISK_GARDEN_CONTRACT_ADDRESS,
  })

  const waterLevel = await readContract({
    contract,
    method:
      "function calculateWaterLevel(uint256 plantId) view returns (uint8)",
    params: [plantId],
  })

  return Number(waterLevel)
}

// Get all plants milik user
export async function getUserPlants(
  client: any,
  userAddress: string
): Promise<bigint[]> {
  const contract = getContract({
    client,
    chain: liskSepolia,
    address: LISK_GARDEN_CONTRACT_ADDRESS,
  })

  const plantIds = await readContract({
    contract,
    method: "function getUserPlants(address user) view returns (uint256[])",
    params: [userAddress],
  })

  return plantIds.map((id: any) => BigInt(id))
}

// ============================================
// CLIENT-SIDE HELPER FUNCTIONS (Tidak hit blockchain)
// ============================================

// Format plant age menjadi human-readable string
export function formatPlantAge(plantedDate: bigint): string {
  const now = Date.now()
  const planted = Number(plantedDate) * 1000
  const diff = now - planted

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (days > 0) return `${days} hari lalu`
  if (hours > 0) return `${hours}j ${minutes}m lalu`
  if (minutes > 0) return `${minutes}m ${seconds}d lalu`
  return `${seconds}d lalu`
}

// Format last watered time
export function formatLastWatered(lastWatered: bigint): string {
  return formatPlantAge(lastWatered)
}

// Get stage display name
export function getStageDisplayName(stage: GrowthStage): string {
  return STAGE_NAMES[stage]
}

// Check apakah plant bisa di-harvest
export function canHarvest(plant: Plant): boolean {
  return plant.stage === GrowthStage.BLOOMING && plant.exists && !plant.isDead
}

// Calculate plant progress percentage
export function getPlantProgress(plant: Plant): number {
  const now = Date.now() / 1000
  const planted = Number(plant.plantedDate)
  const timePassed = now - planted

  if (plant.stage === GrowthStage.BLOOMING) return 100

  // Use STAGE_DURATION constant (60 seconds per stage)
  const currentStageStart = Number(plant.stage) * STAGE_DURATION
  const currentStageProgress =
    ((timePassed - currentStageStart) / STAGE_DURATION) * 25

  return Math.min(Number(plant.stage) * 25 + currentStageProgress, 100)
}

// Calculate current water level (client-side, no blockchain call)
export function getClientWaterLevel(plant: Plant): number {
  if (!plant.exists || plant.isDead) return 0

  // Blooming plants tidak kehilangan air - mereka siap panen!
  if (plant.stage === GrowthStage.BLOOMING) {
    return plant.waterLevel
  }

  const now = Date.now() / 1000
  const timeSinceWatered = now - Number(plant.lastWatered)
  const depletionIntervals = Math.floor(timeSinceWatered / WATER_DEPLETION_TIME)
  const waterLost = depletionIntervals * WATER_DEPLETION_RATE

  if (waterLost >= plant.waterLevel) return 0

  return plant.waterLevel - waterLost
}

// Check apakah plant butuh disiram (di bawah 50%)
export function needsWater(plant: Plant): boolean {
  if (plant.isDead || !plant.exists) return false
  if (plant.stage === GrowthStage.BLOOMING) return false
  return getClientWaterLevel(plant) < 50
}

// Check apakah plant dalam kondisi kritis (di bawah 20%)
export function isCritical(plant: Plant): boolean {
  if (plant.isDead || !plant.exists) return false
  if (plant.stage === GrowthStage.BLOOMING) return false
  return getClientWaterLevel(plant) < 20
}

// Calculate expected stage berdasarkan waktu
export function getExpectedStage(plant: Plant): GrowthStage {
  if (plant.isDead || !plant.exists) return plant.stage

  const now = Date.now() / 1000
  const planted = Number(plant.plantedDate)
  const timePassed = now - planted

  // Calculate stage berdasarkan waktu
  const calculatedStage = Math.min(Math.floor(timePassed / STAGE_DURATION), 3)
  return calculatedStage as GrowthStage
}

// Check apakah plant stage perlu di-sync
export function isStageOutOfSync(plant: Plant): boolean {
  if (plant.isDead || !plant.exists) return false
  const expectedStage = getExpectedStage(plant)
  return plant.stage < expectedStage
}

// Export constants
export {
  LISK_GARDEN_CONTRACT_ADDRESS,
  PLANT_PRICE,
  HARVEST_REWARD,
  STAGE_DURATION,
}
