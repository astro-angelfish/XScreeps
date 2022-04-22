/**
 * 任务相关声明
 */
interface Creep {
  manageMission(): void

  // 任务
  processFeedMission(): void
  processCarryMission(): void
  processRepairMission(): void
  processPlanCMission(): void
  handle_dismantle(): void
  processQuickRushMission(): void
  processExpandMission(): void
  handle_support(): void
  handle_control(): void
  processHelpBuildMission(): void
  processSignMission(): void
  handle_aio(): void
  processMineralMission(): void
  handle_outmine(): void
  handle_power(): void
  handle_deposit(): void
  handle_defend_attack(): void
  handle_defend_range(): void
  handle_defend_double(): void
  handle_task_squard(): void
  handle_double(): void
}

interface CreepMemory {
  missionData?: any
  double?: string // 双人小队
  captain?: boolean
  swith?: boolean
  disPos?: string
  num?: number
  bindpoint?: string
  tick?: number
  controlledBySquardFrame?: boolean
  squad?: Squad
  arrived?: boolean
  targetFlag?: string
}
