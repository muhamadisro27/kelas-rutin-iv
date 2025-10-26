# 🌱 LiskGarden Smart Contract

**LiskGarden** adalah smart contract berbasis Solidity yang mensimulasikan proses pertumbuhan tanaman secara interaktif di blockchain.  
Pengguna dapat **menanam benih, menyirami tanaman, memantau pertumbuhannya**, hingga **memanen bunga dan menerima reward dalam bentuk Ether (ETH)**.  

---

## 📘 Ringkasan Fitur

| Fitur | Deskripsi |
|-------|------------|
| 🌾 **Tanam Benih** | Pengguna dapat menanam benih baru dengan biaya tetap (`PLANT_PRICE`). |
| 💧 **Siram Tanaman** | Tanaman membutuhkan penyiraman agar tidak mati. Air akan berkurang setiap periode waktu. |
| 🌿 **Pertumbuhan Bertahap** | Tanaman akan tumbuh melewati empat tahap: `SEED → SPROUT → GROWING → BLOOMING`. |
| 🌸 **Panen Bunga** | Setelah mencapai tahap `BLOOMING`, pengguna dapat memanen bunga dan menerima reward (`REWARD_HARVEST`). |
| 💀 **Kematian Tanaman** | Jika level air mencapai 0, tanaman akan mati dan tidak bisa dipulihkan. |
| 💰 **Withdraw & Deposit** | Pemilik kontrak (owner) dapat menarik atau menambahkan saldo kontrak. |

---

## ⚙️ Konstanta Utama

| Konstanta | Nilai | Deskripsi |
|------------|--------|-----------|
| `PLANT_PRICE` | `0.001 ether` | Harga untuk menanam satu benih. |
| `REWARD_HARVEST` | `0.003 ether` | Reward untuk pengguna yang berhasil memanen bunga. |
| `STAGE_DURATION` | `1 minutes` | Durasi setiap tahap pertumbuhan tanaman. |
| `WATER_DEPLETION_TIME` | `30 seconds` | Waktu yang dibutuhkan agar air berkurang. |
| `WATER_DEPLETION_RATE` | `2` | Jumlah pengurangan air setiap interval. |

---

## 🌱 Struktur Data

### Enum: `GrowthStage`
Menandakan tahap pertumbuhan tanaman:
```solidity
enum GrowthStage { SEED, SPROUT, GROWING, BLOOMING }


🧩 Fungsi Utama

1. plantSeed()

Menanam benih baru.
Pengguna harus mengirim PLANT_PRICE dalam transaksi.

✅ Mengembalikan ID tanaman baru.
📤 Event: PlantSeeded

2. waterPlant(uint256 _plantId)

Menyirami tanaman agar tetap hidup.

✅ Mengatur ulang waterLevel ke 100.
📤 Event: PlantWatered

3. updatePlantStage(uint256 _plantId)

Menghitung tahap pertumbuhan berdasarkan waktu sejak penanaman.

📤 Event: StageAdvanced

4. harvestPlant(uint256 _plantId)

Memanen bunga saat tanaman mencapai tahap BLOOMING.

💰 Mengirim reward: REWARD_HARVEST
📤 Event: PlantHarvested

5. calculateWaterLevel(uint256 _plantId)

Menghitung level air terkini berdasarkan waktu sejak terakhir disiram.

6. getPlant(uint256 _plantId)

Mengambil data lengkap tanaman (dengan level air terkini).

7. withdraw() & deposit()

Hanya dapat dipanggil oleh pemilik kontrak.
Digunakan untuk mengatur saldo ETH di dalam kontrak.

🧠 Cara Kerja Siklus Hidup Tanaman

1. 🌱 Tanam benih → Mengirim 0.001 ETH.
2. 💧 Siram tanaman secara berkala agar tidak mati.
3. ⏳ Tunggu waktu → setiap menit, tanaman naik ke tahap berikutnya.
4. 🌸 Saat BLOOMING, lakukan harvestPlant() untuk mendapat reward 0.003 ETH.
5. 💀 Jika tidak disiram, air akan turun → 0 → tanaman mati.
