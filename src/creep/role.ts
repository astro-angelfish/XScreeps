/**
 * 存放非任务类型角色相关的函数
*/

// 采矿工
export function harvest_(creep: Creep): void {
  if (!Game.rooms[creep.memory.belong])
    return
  creep.processBasicWorkState('energy')
  if (!Game.rooms[creep.memory.belong].memory.harvestData)
    return
  if (creep.memory.working) {
    const data = Game.rooms[creep.memory.belong].memory.harvestData[creep.memory.targetID as Id<Source>]
    if (!data)
      return
    // 优先寻找link
    if (data.linkID) {
      const link = Game.getObjectById(data.linkID) as StructureLink
      if (!link) { delete data.linkID }
      else {
        if (link.hits < link.hitsMax) { creep.repair(link); return }
        if (creep.pos.isNearTo(link))
          creep.transfer(link, 'energy')
        else creep.goTo(link.pos, 1)
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
        if (creep.pos.isNearTo(container))
          creep.transfer(container, 'energy')
        else creep.goTo(container.pos, 1)
      }
      return
    }
    /* 最后寻找附近的建筑工地 */
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
      for (const i in Game.rooms[creep.memory.belong].memory.harvestData) {
        const data_ = Game.rooms[creep.memory.belong].memory.harvestData[i as Id<Source>]
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
    /* 寻找target附近的container */
    const source = Game.getObjectById(creep.memory.targetID as Id<Source>)
    if (!source)
      return
    if (!creep.pos.isNearTo(source)) { creep.goTo(source.pos, 1); return }
    const data = Game.rooms[creep.memory.belong].memory.harvestData[creep.memory.targetID as Id<Source>]
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
      if (is.length > 0 && is[0].amount > 20 && is[0].resourceType === 'energy') {
        creep.pickup(is[0])
        return
      }
    }
    creep.harvest(source)
  }
}

// 搬运工
export function carry_(creep: Creep): void {
  if (!Game.rooms[creep.memory.belong])
    return
  creep.processBasicWorkState('energy')
  if (!creep.memory.containerID) {
    const harvestData = Game.rooms[creep.memory.belong].memory.harvestData
    if (!harvestData)
      return
    if (Object.keys(harvestData).length === 0) {
      return
    }
    else if (Object.keys(harvestData).length > 1) {
      for (const i in Game.rooms[creep.memory.belong].memory.harvestData) {
        const data_ = Game.rooms[creep.memory.belong].memory.harvestData[i as Id<Source>]
        if (!data_.containerID)
          continue
        if (data_.carry === creep.name) {
          creep.memory.containerID = data_.containerID
          break
        }
        if ((!data_.carry || !Game.creeps[data_.carry]) && data_.containerID) {
          creep.memory.containerID = data_.containerID
          data_.carry = creep.name
          break
        }
      }
      return
    }
    else {
      const harvestData_ = harvestData[Object.keys(harvestData)[0] as Id<Source>]
      if (harvestData_.containerID) {
        const container = Game.getObjectById(harvestData_.containerID)
        if (!container)
          delete harvestData_.containerID
        else
          creep.memory.containerID = harvestData_.containerID
      }
      else { creep.say('oh No!') }
      return
    }
  }
  if (creep.memory.working) {
    let target = null
    // 优先仓库
    if (Game.rooms[creep.memory.belong].memory.structureIdData?.storageID) {
      target = Game.getObjectById(Game.rooms[creep.memory.belong].memory.structureIdData!.storageID!)
      if (!target)
        delete Game.rooms[creep.memory.belong].memory.structureIdData!.storageID
    }

    // 其次虫卵
    if (!target)
      target = creep.pos.getClosestStore()

    // 再其次防御塔
    if (!target) {
      target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (stru) => {
          return stru.structureType === 'tower' && stru.store.getFreeCapacity('energy') > creep.store.getUsedCapacity('energy')
        },
      })
    }
    if (!target)
      return
    creep.processBasicTransfer(target, 'energy')
  }
  else {
    const container = Game.getObjectById(creep.memory.containerID) as StructureContainer
    if (!container) {
      /* 删除房间相关的记忆 */
      for (const hdata in Game.rooms[creep.memory.belong].memory.harvestData) {
        if (Game.rooms[creep.memory.belong].memory.harvestData[hdata as Id<Source>].containerID && Game.rooms[creep.memory.belong].memory.harvestData[hdata as Id<Source>].containerID === creep.memory.containerID)
          delete Game.rooms[creep.memory.belong].memory.harvestData[hdata as Id<Source>].containerID
      }
      /* 删除爬虫相关记忆 */
      delete creep.memory.containerID
      return
    }
    if (!creep.pos.isNearTo(container))
      creep.goTo(container.pos, 1)
    else if (container.store.getUsedCapacity('energy') > creep.store.getFreeCapacity())
      creep.withdraw(container, 'energy')
  }
}

// 升级工
export function upgrade_(creep: Creep): void {
  if (!Game.rooms[creep.memory.belong])
    return
  creep.processBasicWorkState('energy')
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
          if (i.store.getUsedCapacity('energy') > 0) { creep.withdraw(i, 'energy'); swi = true; return }

        if (!swi)
          Game.flags[`${creep.memory.belong}/ruin`].remove()
      }
      return
    }
    if (!creep.memory.targetID) {
      let target = null
      // 优先Link
      if (Game.rooms[creep.memory.belong].memory.structureIdData?.upgradeLink) {
        target = Game.getObjectById(Game.rooms[creep.memory.belong].memory.structureIdData!.upgradeLink!) as StructureLink
        if (!target)
          delete Game.rooms[creep.memory.belong].memory.structureIdData!.upgradeLink
      }
      // 优先仓库
      else if (Game.rooms[creep.memory.belong].memory.structureIdData?.storageID) {
        target = Game.getObjectById(Game.rooms[creep.memory.belong].memory.structureIdData!.storageID!) as StructureStorage
        if (!target)
          delete Game.rooms[creep.memory.belong].memory.structureIdData!.storageID
      }
      // 其次container
      if (!target) {
        target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (stru) => {
            return stru.structureType === 'container' && stru.store.getUsedCapacity('energy') > creep.store.getFreeCapacity()
          },
        })
      }
      if (!target)
        creep.say('😑', true)
      else creep.memory.targetID = target.id
    }
    else {
      const target = Game.getObjectById(creep.memory.targetID as Id<StorageStructures>)
      if (target)
        creep.processBasicWithdraw(target, 'energy')
    }
  }
}

// 建筑工
export function build_(creep: Creep): void {
  const thisRoom = Game.rooms[creep.memory.belong]
  if (!thisRoom)
    return
  if (!creep.memory.standed)
    creep.memory.standed = false
  creep.processBasicWorkState('energy')
  if (creep.memory.working) {
    const construction = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)
    if (construction) {
      creep.processBasicBuild(construction)
    }
    else {
      if (!creep.room.controller || creep.room.controller.level < 3) {
        /* 没有建筑物则考虑道路维护 */
        const roads = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: (structure) => {
            return structure.structureType === 'road' && structure.hits < structure.hitsMax
          },
        })
        if (roads) {
          creep.say('🛠️', true)
          if (creep.repair(roads) === ERR_NOT_IN_RANGE)
            creep.goTo(roads.pos, 1)

          if (creep.pos.getRangeTo(roads.pos) <= 3)
            creep.memory.standed = false
        }
      }
    }
  }
  else {
    creep.memory.standed = false
    if (Game.flags[`${creep.memory.belong}/ruin`]) {
      if (!creep.pos.isNearTo(Game.flags[`${creep.memory.belong}/ruin`])) { creep.goTo(Game.flags[`${creep.memory.belong}/ruin`].pos, 1) }
      else {
        const ruin = Game.flags[`${creep.memory.belong}/ruin`].pos.lookFor(LOOK_RUINS)
        let swi = false
        for (const i of ruin)
          if (i.store.getUsedCapacity('energy') > 0) { creep.withdraw(i, 'energy'); swi = true; return }

        if (!swi)
          Game.flags[`${creep.memory.belong}/ruin`].remove()
      }
      return
    }
    /* 如果有storage就去storage里找，没有就自己采集 */
    if (thisRoom.memory.structureIdData?.storageID || thisRoom.memory.structureIdData?.terminalID) {
      const storage = thisRoom.memory.structureIdData.storageID && Game.getObjectById(thisRoom.memory.structureIdData.storageID)
      if (!storage)
        delete thisRoom.memory.structureIdData.storageID

      if (storage && storage.store.getUsedCapacity('energy') >= creep.store.getCapacity()) {
        creep.processBasicWithdraw(storage, 'energy')
      }
      else {
        const terminal_ = thisRoom.memory.structureIdData.terminalID && Game.getObjectById(thisRoom.memory.structureIdData.terminalID)
        if (terminal_ && terminal_.store.getUsedCapacity('energy') >= creep.store.getCapacity())
          creep.processBasicWithdraw(terminal_, 'energy')
      }
    }
    else {
      const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (stru) => {
          return stru.structureType === 'container' && stru.store.getUsedCapacity('energy') > creep.store.getCapacity()
        },
      })
      if (container) {
        if (!creep.pos.isNearTo(container))
          creep.goTo(container.pos, 1)
        else
          creep.withdraw(container, 'energy')
      }
      else {
        /* 进行资源采集 */
        const target = creep.pos.findClosestByPath(FIND_SOURCES)
        if (target && creep.harvest(target) === ERR_NOT_IN_RANGE)
          creep.moveTo(target)
      }
    }
  }
}
