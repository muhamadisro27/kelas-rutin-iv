import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

const LiskGardenModule = buildModule("LiskGardenModule", (m) => {
  const liskGarden = m.contract("LiskGarden")

  return { liskGarden }
})

export default LiskGardenModule
