"use client"

import { useState, useEffect, useCallback } from "react"
import { useContract } from "./useContract"
import {
  getUserPlants,
  getPlant,
  plantSeed as plantSeedContract,
  waterPlant as waterPlantContract,
  harvestPlant as harvestPlantContract,
  updatePlantStage as updatePlantStageContract,
  isStageOutOfSync,
} from "@/lib/contract"
import { Plant } from "@/types/contract"
import { useToast } from "@/hooks/use-toast"

/**
 * Hook untuk manage user's plants
 * Fetch plants dari contract dan provides plant operations
 */
export function usePlants() {
  const { client, account, isConnected, address } = useContract()
  const { toast } = useToast()

  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Fetch user's plants (dengan optional silent mode untuk auto-refresh)
  const fetchPlants = useCallback(
    async (silent = false) => {
      if (!client || !address) {
        setPlants([])
        return
      }

      // Hanya show loading state kalau bukan silent (user-initiated actions)
      if (!silent) {
        setLoading(true)
      }
      setError(null)

      try {
        // Get user's plant IDs
        const plantIds = await getUserPlants(client, address)

        // Fetch data setiap plant
        const plantPromises = plantIds.map(async (id) => {
          try {
            const plant = await getPlant(client, id)
            return plant.exists ? plant : null
          } catch (err) {
            console.error(`Error fetching plant ${id}:`, err)
            return null
          }
        })

        const fetchedPlants = await Promise.all(plantPromises)
        const validPlants = fetchedPlants.filter((p): p is Plant => p !== null)

        setPlants(validPlants)
      } catch (err) {
        console.error("Error fetching plants:", err)
        setError(err as Error)

        // Hanya show error toast kalau bukan silent
        if (!silent) {
          toast.error("Error", {
            description: "Gagal mengambil data plants. Silakan coba lagi.",
          })
        }
      } finally {
        if (!silent) {
          setLoading(false)
        }
      }
    },
    [client, address, toast]
  )

  // Plant new seed
  const plantSeed = useCallback(async () => {
    if (!client || !account) {
      toast.error("Wallet belum terkoneksi", {
        description: "Silakan connect wallet terlebih dahulu",
      })
      return
    }

    setLoading(true)
    try {
      // Send transaction dan wait untuk receipt
      await plantSeedContract(client, account)

      toast.success("Seed berhasil ditanam!", {
        description: "Plant Anda berhasil dibuat. Cost: 0.001 ETH",
      })

      // Transaction confirmed, refresh plants
      await fetchPlants()
    } catch (err: any) {
      console.error("Error planting seed:", err)
      toast.error("Error", {
        description: err.message || "Gagal menanam seed. Silakan coba lagi.",
      })
    } finally {
      setLoading(false)
    }
  }, [client, account, toast, fetchPlants])

  // Water a plant
  const waterPlant = useCallback(
    async (plantId: bigint) => {
      if (!client || !account) {
        toast.error("Wallet belum terkoneksi", {
          description: "Silakan connect wallet terlebih dahulu",
        })
        return
      }

      setLoading(true)
      try {
        // Check apakah stage perlu update
        const plant = await getPlant(client, plantId)
        const needsStageUpdate = isStageOutOfSync(plant)

        if (needsStageUpdate) {
          toast("Syncing stage...", {
            description: "Update plant stage terlebih dahulu, lalu watering.",
          })
          await updatePlantStageContract(client, account, plantId)
        }

        // Send transaction
        await waterPlantContract(client, account, plantId)

        toast.success("Plant berhasil disiram!", {
          description: needsStageUpdate
            ? "Stage di-sync dan plant disiram!"
            : "Plant Anda berhasil disiram. GRATIS - hanya gas!",
        })

        // Refresh plants
        await fetchPlants()
      } catch (err: any) {
        console.error("Error watering plant:", err)
        toast.error("Error", {
          description:
            err.message || "Gagal menyiram plant. Silakan coba lagi.",
        })
      } finally {
        setLoading(false)
      }
    },
    [client, account, toast, fetchPlants]
  )

  // Harvest a plant
  const harvestPlant = useCallback(
    async (plantId: bigint) => {
      if (!client || !account) {
        toast.error("Wallet belum terkoneksi", {
          description: "Silakan connect wallet terlebih dahulu",
        })
        return
      }

      setLoading(true)
      try {
        // Check apakah stage perlu update sebelum harvest
        const plant = await getPlant(client, plantId)
        const needsStageUpdate = isStageOutOfSync(plant)

        if (needsStageUpdate) {
          toast("Syncing stage...", {
            description: "Update ke blooming stage sebelum harvest.",
          })
          await updatePlantStageContract(client, account, plantId)
        }

        // Send transaction
        await harvestPlantContract(client, account, plantId)

        toast("Plant berhasil dipanen!", {
          description: needsStageUpdate
            ? "Stage di-sync dan di-harvest! Anda menerima 0.003 ETH 🎉"
            : "Anda menerima 0.003 ETH reward! 🎉",
        })

        // Refresh plants
        await fetchPlants()
      } catch (err: any) {
        console.error("Error harvesting plant:", err)
        toast.error("Error", {
          description: err.message || "Gagal panen plant. Silakan coba lagi.",
        })
      } finally {
        setLoading(false)
      }
    },
    [client, account, toast, fetchPlants]
  )

  // Update plant stage manually
  const updatePlantStage = useCallback(
    async (plantId: bigint) => {
      if (!client || !account) {
        toast.error("Wallet belum terkoneksi", {
          description: "Silakan connect wallet terlebih dahulu",
        })
        return
      }

      setLoading(true)
      try {
        await updatePlantStageContract(client, account, plantId)

        toast.success("Stage berhasil di-update!", {
          description: "Plant stage sudah di-sync dengan blockchain.",
        })

        await fetchPlants()
      } catch (err: any) {
        console.error("Error updating plant stage:", err)
        toast.error("Error", {
          description:
            err.message || "Gagal update plant stage. Silakan coba lagi.",
        })
      } finally {
        setLoading(false)
      }
    },
    [client, account, toast, fetchPlants]
  )

  // Auto-fetch plants saat connected
  useEffect(() => {
    if (isConnected && address) {
      fetchPlants()
    }
  }, [isConnected, address, fetchPlants])

  // Auto-refresh data setiap 5 detik (silent mode untuk seamless updates)
  useEffect(() => {
    if (!isConnected || !address) {
      return
    }

    // Set interval untuk refetch setiap 5 detik dalam silent mode
    const intervalId = setInterval(() => {
      fetchPlants(true) // true = silent mode (no loading state)
    }, 5000)

    // Cleanup interval on unmount atau dependencies change
    return () => clearInterval(intervalId)
  }, [isConnected, address, fetchPlants])

  return {
    plants,
    loading,
    error,
    fetchPlants,
    plantSeed,
    waterPlant,
    harvestPlant,
    updatePlantStage,
  }
}
