import { deserveDefend } from '@/module/fun/funtion'
import { isInArray, unzipPosition, zipPosition } from '@/utils'

/* 房间原型拓展   --任务  --防御战争 */
export default class DefendWarExtension extends Room {
  // 核弹防御
  public Nuke_Defend(): void {
    if (this.memory.nukeData && this.memory.nukeData.damage && Object.keys(this.memory.nukeData.damage).length > 0) {
      for (var i in this.memory.nukeData.damage) {
        var thisPos = unzipPosition(i)
        new RoomVisual(this.name).text(`${this.memory.nukeData.damage[i] / 1000000}M`, thisPos.x, thisPos.y, { color: this.memory.nukeData.damage[i] == 0 ? 'green' : 'red', font: 0.5 })
      }
    }
    if (Game.time % 41)
      return
    const nuke_ = this.find(FIND_NUKES)
    if (this.controller.level < 6)
      return
    // var nuke_ = this.find(FIND_FLAGS,{filter:(flag_)=>{return flag_.color == COLOR_ORANGE}})
    if (!this.memory.nukeID)
      this.memory.nukeID = []
    if (!this.memory.nukeData)
      this.memory.nukeData = { damage: {}, rampart: {} }
    if (nuke_.length > 0) {
      /* 发现核弹，激活核防御任务 */
      const data = this.memory.nukeData.damage
      const rampart = this.memory.nukeData.rampart
      for (const n of nuke_) {
        if (isInArray(this.memory.nukeID, n.id))
          continue
        const strPos = zipPosition(n.pos)
        if (n.pos.getStructureList(['spawn', 'rampart', 'terminal', 'powerSpawn', 'factory', 'nuker', 'lab', 'tower', 'storage']).length > 0) {
          if (!data[strPos])
            data[strPos] = 10000000
          else data[strPos] += 10000000
          if (!rampart[strPos]) {
            var rampart_ = n.pos.getStructure('rampart')
            if (rampart_)
              rampart[strPos] = rampart_.hits
            else rampart[strPos] = 0
          }
        }
        LoopA:
        for (let nX = n.pos.x - 2; nX < n.pos.x + 3; nX++) {
          LoopB:
          for (let nY = n.pos.y - 2; nY < n.pos.y + 3; nY++) {
            var thisPos = new RoomPosition(nX, nY, this.name)
            if (nX == n.pos.x && nY == n.pos.y)
              continue LoopB
            if (thisPos.GetStructureList(['spawn', 'rampart', 'terminal', 'powerSpawn', 'factory', 'nuker', 'lab', 'tower']).length <= 0)
              continue LoopB
            if (nX > 0 && nY > 0 && nX < 49 && nY < 49) {
              const strThisPos = zipPosition(thisPos)
              if (!data[strThisPos])
                data[strThisPos] = 5000000
              else data[strThisPos] += 5000000
              if (!rampart[strThisPos]) {
                var rampart_ = n.pos.getStructure('rampart')
                if (rampart_)
                  rampart[strThisPos] = rampart_.hits
                else rampart[strThisPos] = 0
              }
            }
          }
        }
        this.memory.nukeID.push (n.id)
      }
      let allDamageNum = 0
      for (var i in data) {
        /*  */
        var thisPos = unzipPosition(i)
        if (data[i] == 0) {
          const rampart__ = thisPos.GetStructure('rampart')
          if (rampart__)
            rampart[i] = rampart__.hits
        }
        allDamageNum += data[i]
      }
      /* 计算总核弹需要维修的伤害确定 */
      let boostType: ResourceConstant = null
      if (allDamageNum >= 50000000)
        boostType = 'XLH2O'
      let num = 1
      if (allDamageNum >= 10000000 && allDamageNum < 20000000)
        num = 2
      else if (allDamageNum >= 20000000 && allDamageNum < 40000000)
        num = 3
      else if (allDamageNum >= 40000000)
        num = 3
      let task: MissionModel
      for (const t of this.memory.mission.Creep) {
        if (t.name == '墙体维护' && t.data.RepairType == 'nuker')
          task = t
      }
      if (task) {
        task.data.num = num
        if (task.creepBind.repair.num != num)
          task.creepBind.repair.num = num
        if (task.data.boostType == undefined && boostType == 'XLH2O') {
          /* 删除现有任务，重新挂载有boost的任务 */
          this.removeMission(task.id)
        }
      }
      /* 激活维修防核任务 */
      else {
        const thisTask: MissionModel = this.generateRepairMission('nuker', num, boostType, 'T0')
        if (thisTask && allDamageNum > 0)
          this.addMission(thisTask)
      }

      /* 去除废除的维护坐标 例如核弹已经砸过了，但是还没有修完 */
      if (Game.time % 9 == 0) {
        LoopP:
        for (const po in this.memory.nukeData.damage) {
          var thisPos = unzipPosition(po)
          for (const nuk of nuke_) {
            if (thisPos.inRangeTo(nuk, 2))
              continue LoopP
          }
          if (this.memory.nukeData.rampart[po])
            delete this.memory.nukeData.rampart[po]
          delete this.memory.nukeData.damage[po]
        }
      }
    }
    else {
      for (const m of this.memory.mission.Creep) {
        if (m.name == '墙体维护' && m.data.RepairType == 'nuker')
          this.removeMission(m.id)
      }
      if (this.memory.nukeID.length > 0)
        this.memory.nukeID = []
      this.memory.nukeData = { damage: {}, rampart: {} }
    }
  }

  /* 主动防御任务发布 */
  public Task_Auto_Defend(): void {
    if (Game.time % 5)
      return
    if (this.controller.level < 6)
      return
    if (!this.memory.state)
      return
    if (this.memory.state != 'war') { this.memory.toggle.AutoDefend = false; this.memory.enemy = {}; return }
    /* 激活主动防御 */
    const enemys = this.find(FIND_HOSTILE_CREEPS, {
      filter: (creep) => {
        return !isInArray(Memory.whitelist, creep.owner.username) && (creep.owner.username != 'Invader') && deserveDefend(creep)
      },
    })
    if (enemys.length <= 0)
      return
    /* 如果有合成任务，删除合成任务 */
    const compoundTask = this.getMissionModelByName('Room', '资源合成')
    if (compoundTask) {
      this.removeMission(compoundTask.id)
      return
    }
    if (!this.memory.toggle.AutoDefend) {
      this.memory.toggle.AutoDefend = true // 表示房间存在主动防御任务
      /* 寻找攻击方 */
      const users = []
      for (const c of enemys) {
        if (!isInArray(users, c.owner.username))
          users.push(c.owner.username)
      }
      let str = ''; for (const s of users) str += ` ${s}`
      Game.notify(`房间${this.name}激活主动防御! 目前检测到的攻击方为:${str},爬虫数为:${enemys.length},我们将抗战到底!`)
      console.log(`房间${this.name}激活主动防御! 目前检测到的攻击方为:${str},爬虫数为:${enemys.length},我们将抗战到底!`)
    }
    /* 分析敌对爬虫的数量,应用不同的主防任务应对 */
    let defend_plan = {}
    if (enemys.length <= 2) // 1 2

      defend_plan = { attack: 1 }

    else if (enemys.length > 2 && enemys.length < 5) // 3-4

      defend_plan = { attack: 1, double: 1, range: 0 }

    else if (enemys.length >= 5 && enemys.length < 8) // 5-7

      defend_plan = { attack: 1, double: 1, range: 1 }

    else if (enemys.length >= 8) // >8     一般这种情况下各个类型的防御任务爬虫的数量都要调高

      defend_plan = { attack: 2, double: 2, range: 2 }

    for (const plan in defend_plan) {
      if (plan == 'attack') {
        const num = this.countMissionByName('Creep', '红球防御')
        if (num <= 0) {
          const thisTask = this.generateRedDefendMission(defend_plan[plan])
          if (thisTask) {
            this.addMission(thisTask)
            console.log(`房间${this.name}红球防御任务激活!`)
          }
        }
        else {
          /* 已经存在的话查看数量是否正确 */
          const task = this.getMissionModelByName('Creep', '红球防御')
          if (task)
            task.creepBind['defend-attack'].num = defend_plan[plan]
            // console.log(Colorful(`房间${this.name}红球防御任务数量调整为${defend_plan[plan]}!`,'red'))
        }
      }
      else if (plan == 'range') {
        const num = this.countMissionByName('Creep', '蓝球防御')
        if (num <= 0) {
          const thisTask = this.generateBlueDefendMission(defend_plan[plan])
          if (thisTask) {
            this.addMission(thisTask)
            console.log(`房间${this.name}蓝球防御任务激活!`)
          }
        }
        else {
          /* 已经存在的话查看数量是否正确 */
          const task = this.getMissionModelByName('Creep', '蓝球防御')
          if (task)
            task.creepBind['defend-range'].num = defend_plan[plan]
            // console.log(Colorful(`房间${this.name}蓝球防御任务数量调整为${defend_plan[plan]}!`,'blue'))
        }
      }
      else if (plan == 'double') {
        const num = this.countMissionByName('Creep', '双人防御')
        if (num <= 0) {
          const thisTask = this.generateDoubleDefendMission(defend_plan[plan])
          if (thisTask) {
            this.addMission(thisTask)
            console.log(`房间${this.name}双人防御任务激活!`)
          }
        }
        else {
          /* 已经存在的话查看数量是否正确 */
          const task = this.getMissionModelByName('Creep', '双人防御')
          if (task) {
            task.creepBind['defend-douAttack'].num = defend_plan[plan]
            task.creepBind['defend-douHeal'].num = defend_plan[plan]
            // console.log(Colorful(`房间${this.name}双人防御任务数量调整为${defend_plan[plan]}!`,'green'))
          }
        }
      }
    }
    /* 主动防御分配系统更新 删除过期敌对爬虫数据 */
    for (const myCreepName in this.memory.enemy) {
      if (!Game.creeps[myCreepName]) { delete this.memory.enemy[myCreepName] }
      else {
        /* 查找项目里的爬虫是否已经死亡 */
        for (const enemyID of this.memory.enemy[myCreepName]) {
          if (!Game.getObjectById(enemyID)) {
            const index = this.memory.enemy[myCreepName].indexOf(enemyID)
            this.memory.enemy[myCreepName].splice(index, 1)
          }
        }
      }
    }
  }

  /* 红球防御 */
  public Task_Red_Defend(mission: MissionModel): void {
    if ((Game.time - global.Gtime[this.name]) % 10)
      return
    if (!this.checkLab(mission, 'transport', 'complex'))
      return
    if ((Game.time - global.Gtime[this.name]) % 20)
      return
    const enemys = this.find(FIND_HOSTILE_CREEPS, {
      filter: (creep) => {
        return !isInArray(Memory.whitelist, creep.owner.username) && (creep.owner.username != 'Invader' && deserveDefend(creep))
      },
    })
    if (enemys.length <= 0)
      this.removeMission(mission.id)
  }

  /* 蓝球防御 */
  public Task_Blue_Defend(mission: MissionModel): void {
    if ((Game.time - global.Gtime[this.name]) % 10)
      return
    if (!this.checkLab(mission, 'transport', 'complex'))
      return
    if ((Game.time - global.Gtime[this.name]) % 20)
      return
    const enemys = this.find(FIND_HOSTILE_CREEPS, {
      filter: (creep) => {
        return !isInArray(Memory.whitelist, creep.owner.username) && (creep.owner.username != 'Invader' && deserveDefend(creep))
      },
    })
    if (enemys.length <= 0)
      this.removeMission(mission.id)
  }

  /* 双人防御 */
  public Task_Double_Defend(mission: MissionModel): void {
    if ((Game.time - global.Gtime[this.name]) % 10)
      return
    if (!this.checkLab(mission, 'transport', 'complex'))
      return
    if ((Game.time - global.Gtime[this.name]) % 20)
      return
    const enemys = this.find(FIND_HOSTILE_CREEPS, {
      filter: (creep) => {
        return !isInArray(Memory.whitelist, creep.owner.username) && (creep.owner.username != '1Invader' && deserveDefend(creep))
      },
    })
    if (enemys.length <= 0)
      this.removeMission(mission.id)
  }
}
