import { deserveDefend, unzipPosition, zipPosition } from '@/utils'

/* 房间原型拓展   --任务  --防御战争 */
export default class RoomMissionDefendWarExtension extends Room {
  // 核弹防御
  public checkNukeDefend(): void {
    if (this.memory.nukeData?.damage && Object.keys(this.memory.nukeData.damage).length > 0) {
      for (const i in this.memory.nukeData.damage) {
        const thisPos = unzipPosition(i)
        if (!thisPos)
          continue

        new RoomVisual(this.name)
          .text(`${this.memory.nukeData.damage[i] / 1000000}M`,
            thisPos.x, thisPos.y,
            { color: this.memory.nukeData.damage[i] === 0 ? 'green' : 'red', font: 0.5 })
      }
    }

    if (Game.time % 41)
      return

    const nuke = this.find(FIND_NUKES)
    if (!this.controller || this.controller.level < 6)
      return
    // var nuke_ = this.find(FIND_FLAGS,{filter:(flag_)=>{return flag_.color == COLOR_ORANGE}})

    if (!this.memory.nukeID)
      this.memory.nukeID = []
    if (!this.memory.nukeData)
      this.memory.nukeData = { damage: {}, rampart: {} }

    // 发现核弹，激活核防御任务
    if (nuke.length > 0) {
      const data = this.memory.nukeData.damage
      const ramparts = this.memory.nukeData.rampart

      for (const n of nuke) {
        if (this.memory.nukeID.includes(n.id))
          continue

        const strPos = zipPosition(n.pos)
        if (n.pos.getStructureWithTypes(['spawn', 'rampart', 'terminal', 'powerSpawn', 'factory', 'nuker', 'lab', 'tower', 'storage']).length > 0) {
          if (!data[strPos])
            data[strPos] = 10000000
          else data[strPos] += 10000000

          if (!ramparts[strPos]) {
            const rampart = n.pos.getStructureWithType('rampart')
            if (rampart)
              ramparts[strPos] = rampart.hits
            else ramparts[strPos] = 0
          }
        }

        for (let nX = n.pos.x - 2; nX < n.pos.x + 3; nX++) {
          for (let nY = n.pos.y - 2; nY < n.pos.y + 3; nY++) {
            const thisPos = new RoomPosition(nX, nY, this.name)
            if (nX === n.pos.x && nY === n.pos.y)
              continue

            if (thisPos.getStructureWithTypes(['spawn', 'rampart', 'terminal', 'powerSpawn', 'factory', 'nuker', 'lab', 'tower']).length <= 0)
              continue

            if (nX > 0 && nY > 0 && nX < 49 && nY < 49) {
              const strThisPos = zipPosition(thisPos)

              if (!data[strThisPos])
                data[strThisPos] = 5000000
              else data[strThisPos] += 5000000

              if (!ramparts[strThisPos]) {
                const rampart = n.pos.getStructureWithType('rampart')
                if (rampart)
                  ramparts[strThisPos] = rampart.hits
                else ramparts[strThisPos] = 0
              }
            }
          }
        }

        this.memory.nukeID.push(n.id)
      }

      let allDamageNum = 0
      for (const i in data) {
        const thisPos = unzipPosition(i)

        if (data[i] === 0) {
          const rampart = thisPos?.getStructureWithType(STRUCTURE_RAMPART)
          if (rampart)
            ramparts[i] = rampart.hits
        }

        allDamageNum += data[i]
      }

      // 计算总核弹需要维修的伤害确定
      let boostType: ResourceConstant | undefined
      if (allDamageNum >= 50000000)
        boostType = 'XLH2O'

      let num = 1
      if (allDamageNum >= 10000000 && allDamageNum < 20000000)
        num = 2
      else if (allDamageNum >= 20000000 && allDamageNum < 40000000)
        num = 3
      else if (allDamageNum >= 40000000)
        num = 3

      let task: MissionModel | undefined
      for (const t of this.memory.mission.Creep) {
        if (t.name === '墙体维护' && t.data.RepairType === 'nuker')
          task = t
      }
      if (task) {
        task.data.num = num

        if (!task.creepBind)
          task.creepBind = {}
        if (task.creepBind.repair.num !== num)
          task.creepBind.repair.num = num

        if (!task.data.boostType && boostType === 'XLH2O') {
          // 删除现有任务，重新挂载有 boost 的任务
          this.removeMission(task.id)
        }
      }
      // 激活维修防核任务
      else {
        const thisTask = this.generateRepairMission('nuker', num, boostType, 'T0')
        if (thisTask && allDamageNum > 0)
          this.addMission(thisTask)
      }

      // 去除废除的维护坐标 例如核弹已经砸过了，但是还没有修完
      if (Game.time % 9 === 0) {
        for (const po in this.memory.nukeData.damage) {
          const thisPos = unzipPosition(po)
          if (!thisPos) {
            if (po in this.memory.nukeData.rampart)
              delete this.memory.nukeData.rampart[po]
            delete this.memory.nukeData.damage[po]
            continue
          }

          if (nuke.some(n => n.pos.inRangeTo(thisPos, 2)))
            continue

          if (po in this.memory.nukeData.rampart)
            delete this.memory.nukeData.rampart[po]

          delete this.memory.nukeData.damage[po]
        }
      }
    }

    else {
      for (const m of this.memory.mission.Creep) {
        if (m.name === '墙体维护' && m.data.RepairType === 'nuker')
          this.removeMission(m.id)
      }

      if (this.memory.nukeID.length > 0)
        this.memory.nukeID = []

      this.memory.nukeData = { damage: {}, rampart: {} }
    }
  }

  /* 主动防御任务发布 */
  public checkAutoDefend(): void {
    if (Game.time % 5)
      return
    if (!this.controller || this.controller.level < 6)
      return
    if (!this.memory.state)
      return
    if (this.memory.state !== 'war') {
      this.memory.toggles.AutoDefend = false
      this.memory.enemy = {}
      return
    }

    // 激活主动防御
    const enemys = this.find(FIND_HOSTILE_CREEPS)
      .filter(c => !Memory.whitelist?.includes(c.owner.username) && c.owner.username !== 'Invader' && deserveDefend(c))
    if (enemys.length <= 0)
      return

    // 如果有合成任务，删除合成任务
    const compoundTask = this.getMissionModelByName('Room', '资源合成')
    if (compoundTask) {
      this.removeMission(compoundTask.id)
      return
    }

    if (!this.memory.toggles.AutoDefend) {
      // 表示房间存在主动防御任务
      this.memory.toggles.AutoDefend = true

      // 寻找攻击方
      const users = new Set()
      for (const c of enemys)
        users.add(c.owner.username)
      const str = Array.from(users).join(', ')

      Game.notify(`房间 ${this.name} 激活主动防御! 目前检测到的攻击方为: ${str}，爬虫数为: ${enemys.length}，我们将抗战到底!`)
      console.log(`房间 ${this.name} 激活主动防御! 目前检测到的攻击方为: ${str}，爬虫数为: ${enemys.length}，我们将抗战到底!`)
    }

    // 分析敌对爬虫的数量，应用不同的主防任务应对
    let defend_plan: Record<string, number> = {}
    // 1 2
    if (enemys.length <= 2)
      defend_plan = { attack: 1 }
    // 3-4
    else if (enemys.length > 2 && enemys.length < 5)
      defend_plan = { attack: 1, double: 1, range: 0 }
    // 5-7
    else if (enemys.length >= 5 && enemys.length < 8)
      defend_plan = { attack: 1, double: 1, range: 1 }
    // >8     一般这种情况下各个类型的防御任务爬虫的数量都要调高
    else if (enemys.length >= 8)
      defend_plan = { attack: 2, double: 2, range: 2 }

    for (const plan in defend_plan) {
      if (plan === 'attack') {
        const num = this.countMissionByName('Creep', '红球防御')
        if (num <= 0) {
          const thisTask = this.generateRedDefendMission(defend_plan[plan])
          if (thisTask) {
            this.addMission(thisTask)
            console.log(`房间 ${this.name} 红球防御任务激活!`)
          }
        }
        else {
          // 已经存在的话查看数量是否正确
          const mission = this.getMissionModelByName('Creep', '红球防御')
          if (!mission)
            continue

          if (!mission.creepBind)
            mission.creepBind = { 'defend-attack': { bind: [], num: 0 } }

          mission.creepBind['defend-attack'].num = defend_plan[plan]
        }
      }
      else if (plan === 'range') {
        const num = this.countMissionByName('Creep', '蓝球防御')
        if (num <= 0) {
          const thisTask = this.generateBlueDefendMission(defend_plan[plan])
          if (thisTask) {
            this.addMission(thisTask)
            console.log(`房间 ${this.name} 蓝球防御任务激活!`)
          }
        }
        else {
          // 已经存在的话查看数量是否正确
          const mission = this.getMissionModelByName('Creep', '蓝球防御')
          if (!mission)
            continue

          if (!mission.creepBind)
            mission.creepBind = { 'defend-range': { bind: [], num: 0 } }

          mission.creepBind['defend-range'].num = defend_plan[plan]
          // console.log(colorfyLog(`房间 ${this.name} 蓝球防御任务数量调整为 ${defend_plan[plan]}!`, 'blue'))
        }
      }
      else if (plan === 'double') {
        const num = this.countMissionByName('Creep', '双人防御')
        if (num <= 0) {
          const thisTask = this.generateDoubleDefendMission(defend_plan[plan])
          if (thisTask) {
            this.addMission(thisTask)
            console.log(`房间 ${this.name} 双人防御任务激活!`)
          }
        }
        else {
          // 已经存在的话查看数量是否正确
          const mission = this.getMissionModelByName('Creep', '蓝球防御')
          if (!mission)
            continue

          if (!mission.creepBind) {
            mission.creepBind = {
              'defend-douAttack': { bind: [], num: 0 },
              'defend-douHeal': { bind: [], num: 0 },
            }
          }

          mission.creepBind['defend-douAttack'].num = defend_plan[plan]
          mission.creepBind['defend-douHeal'].num = defend_plan[plan]
          // console.log(colorfyLog(`房间 ${this.name} 双人防御任务数量调整为 ${defend_plan[plan]}!`, 'green'))
        }
      }
    }

    // 主动防御分配系统更新 删除过期敌对爬虫数据
    for (const myCreepName in this.memory.enemy) {
      if (!Game.creeps[myCreepName]) {
        delete this.memory.enemy[myCreepName]
      }
      else {
        // 查找项目里的爬虫是否已经死亡
        for (const enemyID of this.memory.enemy[myCreepName]) {
          if (!Game.getObjectById(enemyID as Id<Creep>)) {
            const index = this.memory.enemy[myCreepName].indexOf(enemyID)
            this.memory.enemy[myCreepName].splice(index, 1)
          }
        }
      }
    }
  }

  /**
   * 红球防御
   */
  public verifyRedDefendMission(mission: MissionModel): void {
    if ((Game.time - global.Gtime[this.name]) % 10)
      return

    if (!this.checkLab(mission, 'transport', 'complex'))
      return

    if ((Game.time - global.Gtime[this.name]) % 20)
      return

    const enemys = this.find(FIND_HOSTILE_CREEPS)
      .filter(c => !Memory.whitelist?.includes(c.owner.username) && c.owner.username !== 'Invader' && deserveDefend(c))
    if (enemys.length <= 0)
      this.removeMission(mission.id)
  }

  /**
   * 蓝球防御
   */
  public verifyBlueDefendMission(mission: MissionModel): void {
    if ((Game.time - global.Gtime[this.name]) % 10)
      return

    if (!this.checkLab(mission, 'transport', 'complex'))
      return

    if ((Game.time - global.Gtime[this.name]) % 20)
      return

    const enemys = this.find(FIND_HOSTILE_CREEPS)
      .filter(c => !Memory.whitelist?.includes(c.owner.username) && c.owner.username !== 'Invader' && deserveDefend(c))
    if (enemys.length <= 0)
      this.removeMission(mission.id)
  }

  /**
   * 双人防御
   */
  public verifyDoubleDefendMission(mission: MissionModel): void {
    if ((Game.time - global.Gtime[this.name]) % 10)
      return

    if (!this.checkLab(mission, 'transport', 'complex'))
      return

    if ((Game.time - global.Gtime[this.name]) % 20)
      return

    const enemys = this.find(FIND_HOSTILE_CREEPS)
      .filter(c => !Memory.whitelist?.includes(c.owner.username) && c.owner.username !== 'Invader' && deserveDefend(c))
    if (enemys.length <= 0)
      this.removeMission(mission.id)
  }
}
