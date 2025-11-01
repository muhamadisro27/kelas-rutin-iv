"use client"

import { useEffect, useCallback, useRef } from "react"
import { useContract } from "./useContract"
import { usePlants } from "./usePlants"
import {
  updatePlantStage as updatePlantStageContract,
  isStageOutOfSync,
} from "@/lib/contract"
import { GrowthStage } from "@/types/contract"

/**
 * Background scheduler yang otomatis update plant stages setiap menit
 * Runs untuk semua user's plants yang butuh stage updates
 */
export function usePlantStageScheduler() {
  const { client, account, isConnected } = useContract()
  const { plants } = usePlants()
  const isProcessingRef = useRef(false)

  const updatePlantsStages = useCallback(async () => {
    // Skip kalau sudah processing atau tidak connected
    if (isProcessingRef.current || !client || !account || !isConnected) {
      return
    }

    // Skip kalau belum ada plants
    if (plants.length === 0) {
      return
    }

    isProcessingRef.current = true

    try {
      // Filter plants yang butuh stage updates
      const plantsNeedingUpdate = plants.filter((plant) => {
        // Skip dead plants
        if (plant.isDead || !plant.exists) return false

        // Skip plants yang sudah blooming
        if (plant.stage === GrowthStage.BLOOMING) return false

        // Hanya update kalau stage out of sync
        return isStageOutOfSync(plant)
      })

      if (plantsNeedingUpdate.length === 0) {
        console.log("[PlantScheduler] All plants are up to date")
        return
      }

      console.log(
        `[PlantScheduler] Updating ${plantsNeedingUpdate.length} plant(s) stages...`
      )

      // Update setiap plant sequentially untuk avoid nonce conflicts
      for (const plant of plantsNeedingUpdate) {
        try {
          console.log(`[PlantScheduler] Updating plant #${plant.id}...`)
          await updatePlantStageContract(client, account, plant.id)
          console.log(
            `[PlantScheduler] Plant #${plant.id} updated successfully`
          )
        } catch (err) {
          console.error(
            `[PlantScheduler] Failed to update plant #${plant.id}:`,
            err
          )
          // Continue dengan plant berikutnya meskipun ada yang fail
        }
      }

      console.log("[PlantScheduler] Batch update complete")
    } catch (err) {
      console.error("[PlantScheduler] Error in scheduler:", err)
    } finally {
      isProcessingRef.current = false
    }
  }, [client, account, isConnected, plants])

  // Setup interval untuk run setiap menit
  useEffect(() => {
    if (!isConnected || plants.length === 0) {
      return
    }

    console.log("[PlantScheduler] Starting scheduler (runs every 60 seconds)")

    // Run immediately saat mount
    updatePlantsStages()

    // Kemudian run setiap menit
    const intervalId = setInterval(() => {
      updatePlantsStages()
    }, 60000) // 60 seconds

    return () => {
      console.log("[PlantScheduler] Stopping scheduler")
      clearInterval(intervalId)
    }
  }, [isConnected, plants.length, updatePlantsStages])

  return {
    isRunning: isConnected && plants.length > 0,
  }
}
