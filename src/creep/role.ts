/**
 * 存放非任务类型角色相关的函数
*/

// 采矿工
export function harvestCreep(creep: Creep): void {
  const belongRoom = Game.rooms[creep.memory.belong]
  if (!belongRoom)
    return

  creep.processBasicWorkState(RESOURCE_ENERGY)

  if (!belongRoom.memory.harvestData)
    return

  if (creep.memory.working) {
    const data = belongRoom.memory.harvestData[creep.memory.targetID as Id<Source>]
    if (!data)
      return

    // 优先寻找link
    if (data.linkID) {
      const link = Game.getObjectById(data.linkID)
      if (!link) {
        delete data.linkID
      }
      else {
        if (link.hits < link.hitsMax) {
          creep.repair(link)
          return
        }

        creep.processBasicTransfer(link, RESOURCE_ENERGY)
      }
      return
    }

    // 其次寻找container
    if (data.containerID) {
      const container = Game.getObjectById(data.containerID)
      if (!container) {
        delete data.containerID
      }
      else {
        if (container.hits < container.hitsMax) {
          creep.repair(container)
          return
        }

        creep.processBasicTransfer(container, RESOURCE_ENERGY)
      }
      return
    }

    // 最后寻找附近的建筑工地
    const cons = creep.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 3)
    if (cons.length > 0)
      creep.build(cons[0])
    else creep.pos.createConstructionSite('container')
  }

  else {
    // 如果不具备挖矿功能了，就自杀
    if (creep.getActiveBodyparts('work') <= 0)
      creep.suicide()

    // 绑定矿点
    if (!creep.memory.targetID) {
      for (const i in belongRoom.memory.harvestData) {
        const data_ = belongRoom.memory.harvestData[i as Id<Source>]
        if (data_.carry === creep.name) {
          creep.memory.targetID = i
          break
        }
        if (!data_.harvest || !Game.creeps[data_.harvest]) {
          creep.memory.targetID = i
          data_.harvest = creep.name
          break
        }
      }
      return
    }

    // 寻找 target 附近的 container
    const source = Game.getObjectById(creep.memory.targetID as Id<Source>)
    if (!source)
      return

    if (!creep.pos.isNearTo(source)) {
      creep.goTo(source.pos, 1)
      return
    }

    const data = belongRoom.memory.harvestData[creep.memory.targetID as Id<Source>]
    if (!data)
      return

    if (data.linkID || data.containerID) {
      if (!['superbitch', 'ExtraDim'].includes(creep.owner.username))
        creep.say('😒', true)
      else
        creep.say('🌱', true)
    }
    else {
      creep.say('🤪', true)
    }

    if (Game.time % 5 === 0) {
      const is = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1)
      if (is.length > 0 && is[0].amount > 20 && is[0].resourceType === RESOURCE_ENERGY) {
        creep.pickup(is[0])
        return
      }
    }

    creep.harvest(source)
  }
}

// 搬运工
export function carryCreep(creep: Creep): void {
  const belongRoom = Game.rooms[creep.memory.belong]
  if (!belongRoom)
    return

  creep.processBasicWorkState(RESOURCE_ENERGY)

  if (!creep.memory.containerID) {
    const harvestData = belongRoom.memory.harvestData
    if (!harvestData || Object.keys(harvestData).length === 0)
      return

    if (Object.keys(harvestData).length > 1) {
      for (const i in belongRoom.memory.harvestData) {
        const data = belongRoom.memory.harvestData[i as Id<Source>]
        if (!data.containerID)
          continue

        if (data.carry === creep.name) {
          creep.memory.containerID = data.containerID
          break
        }

        if ((!data.carry || !Game.creeps[data.carry]) && data.containerID) {
          creep.memory.containerID = data.containerID
          data.carry = creep.name
          break
        }
      }
      return
    }

    const sourceData = harvestData[Object.keys(harvestData)[0] as Id<Source>]
    if (sourceData.containerID) {
      const container = Game.getObjectById(sourceData.containerID)
      if (!container)
        delete sourceData.containerID
      else
        creep.memory.containerID = sourceData.containerID
    }
    else {
      creep.say('oh No!')
    }

    return
  }

  if (creep.memory.working) {
    let target = null

    // 优先仓库
    if (belongRoom.memory.structureIdData?.storageID) {
      target = Game.getObjectById(belongRoom.memory.structureIdData!.storageID!)
      if (!target)
        delete belongRoom.memory.structureIdData!.storageID
    }

    // 其次虫卵
    if (!target)
      target = creep.pos.getClosestStore()

    // 再其次防御塔
    if (!target) {
      target = creep.pos.findClosestByRange(
        creep.room.getStructureWithType(STRUCTURE_TOWER)
          .filter(tower => (tower.store.energy || 0) < tower.store.getCapacity(RESOURCE_ENERGY) / 2))
    }

    if (!target)
      return

    creep.processBasicTransfer(target, RESOURCE_ENERGY)
  }

  else {
    const container = Game.getObjectById(creep.memory.containerID)
    if (!container) {
      // 删除房间相关的记忆
      for (const hdata in belongRoom.memory.harvestData) {
        if (belongRoom.memory.harvestData[hdata as Id<Source>].containerID === creep.memory.containerID)
          delete belongRoom.memory.harvestData[hdata as Id<Source>].containerID
      }

      // 删除爬虫相关记忆
      delete creep.memory.containerID

      return
    }

    creep.processBasicWithdraw(container, RESOURCE_ENERGY)
  }
}

// 升级工
export function upgradeCreep(creep: Creep): void {
  const belongRoom = Game.rooms[creep.memory.belong]
  if (!belongRoom)
    return

  creep.processBasicWorkState(RESOURCE_ENERGY)

  if (creep.memory.working) {
    creep.processBasicUpgrade()
    delete creep.memory.targetID
  }

  else {
    if (Game.flags[`${creep.memory.belong}/ruin`]) {
      if (!creep.pos.isNearTo(Game.flags[`${creep.memory.belong}/ruin`])) { creep.goTo(Game.flags[`${creep.memory.belong}/ruin`].pos, 1) }
      else {
        const ruin = Game.flags[`${creep.memory.belong}/ruin`].pos.lookFor(LOOK_RUINS)
        let swi = false
        for (const i of ruin)
          if (i.store.getUsedCapacity(RESOURCE_ENERGY) > 0) { creep.withdraw(i, RESOURCE_ENERGY); swi = true; return }

        if (!swi)
          Game.flags[`${creep.memory.belong}/ruin`].remove()
      }
      return
    }

    if (!creep.memory.targetID) {
      let target = null
      // 优先Link
      if (belongRoom.memory.structureIdData?.upgradeLink) {
        target = Game.getObjectById(belongRoom.memory.structureIdData!.upgradeLink!) as StructureLink
        if (!target)
          delete belongRoom.memory.structureIdData!.upgradeLink
      }

      // 优先仓库
      else if (belongRoom.memory.structureIdData?.storageID) {
        target = Game.getObjectById(belongRoom.memory.structureIdData!.storageID!) as StructureStorage
        if (!target)
          delete belongRoom.memory.structureIdData!.storageID
      }

      // 其次container
      if (!target) {
        target = creep.pos.findClosestByRange(
          creep.room.getStructureWithType(STRUCTURE_CONTAINER)
            .filter(c => c.store.energy > c.store.getCapacity(RESOURCE_ENERGY) / 2))
      }

      if (!target)
        creep.say('😑', true)
      else creep.memory.targetID = target.id
    }

    else {
      const target = Game.getObjectById(creep.memory.targetID as Id<StorageStructures>)
      if (target)
        creep.processBasicWithdraw(target, RESOURCE_ENERGY)
    }
  }
}

// 建筑工
export function buildCreep(creep: Creep): void {
  const belongRoom = Game.rooms[creep.memory.belong]
  if (!belongRoom)
    return

  if (!creep.memory.standed)
    creep.memory.standed = false

  creep.processBasicWorkState(RESOURCE_ENERGY)

  if (creep.memory.working) {
    const construction = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)
    if (construction) {
      creep.processBasicBuild(construction)
      return
    }

    if (!creep.room.controller || creep.room.controller.level < 3) {
      // 没有建筑物则考虑道路维护
      const road = creep.pos.findClosestByPath(
        creep.room.getStructureWithType(STRUCTURE_ROAD)
          .filter(road => road.hits < road.hitsMax))
      if (road) {
        creep.say('🛠️', true)
        creep.processBasicRepair(road)
      }
    }
  }

  else {
    creep.memory.standed = false

    if (Game.flags[`${creep.memory.belong}/ruin`]) {
      if (!creep.pos.isNearTo(Game.flags[`${creep.memory.belong}/ruin`])) {
        creep.goTo(Game.flags[`${creep.memory.belong}/ruin`].pos, 1)
      }
      else {
        const ruin = Game.flags[`${creep.memory.belong}/ruin`].pos.lookFor(LOOK_RUINS)
        let swi = false
        for (const i of ruin) {
          if (i.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
            creep.withdraw(i, RESOURCE_ENERGY)
            swi = true
            return
          }
        }
        if (!swi)
          Game.flags[`${creep.memory.belong}/ruin`].remove()
      }
      return
    }

    // 如果有 storage 就去 storage 里找，没有就自己采集
    const storage = belongRoom.memory.structureIdData?.storageID ? Game.getObjectById(belongRoom.memory.structureIdData.storageID) : null
    if (storage && storage.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getCapacity()) {
      creep.processBasicWithdraw(storage, RESOURCE_ENERGY)
      return
    }

    const terminal = belongRoom.memory.structureIdData?.terminalID ? Game.getObjectById(belongRoom.memory.structureIdData.terminalID) : null
    if (terminal && terminal.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getCapacity()) {
      creep.processBasicWithdraw(terminal, RESOURCE_ENERGY)
      return
    }

    const container = creep.pos.findClosestByPath(
      creep.room.getStructureWithType(STRUCTURE_CONTAINER)
        .filter(struct => struct.store.getUsedCapacity(RESOURCE_ENERGY) > creep.store.getCapacity()))
    if (container) {
      creep.processBasicWithdraw(container, RESOURCE_ENERGY)
      return
    }

    // 进行资源采集
    const target = creep.pos.findClosestByPath(FIND_SOURCES)
    if (target)
      creep.processBasicHarvest(target)
  }
}
