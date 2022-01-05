/**
 * 存放非任务类型角色相关的函数
*/
export function harvest_(creep_:Creep):void{
    if (!Game.rooms[creep_.memory.belong]) return
    if (!creep_.memory.working) creep_.memory.working = false
    if(creep_.memory.working && creep_.store.getUsedCapacity("energy") == 0 ) {
        creep_.memory.working = false;
    }
    if(!creep_.memory.working && creep_.store.getFreeCapacity() == 0) {
        creep_.memory.working = true;
    }
    if (creep_.memory.working)
    {
        var data = Game.rooms[creep_.memory.belong].memory.harvestData[creep_.memory.targetID]
        if (!data) return
        if (data.linkID)
        {
            let link = Game.getObjectById(data.linkID) as StructureLink
            if (!link) delete data.linkID
            else
            {
                if (link.hits < link.hitsMax) creep_.repair(link)
                if (creep_.pos.isNearTo(link))creep_.transfer(link,'energy')
                else creep_.goTo(link.pos,1)
            }
            return
        }
        if (data.containerID)
        {
            let container = Game.getObjectById(data.containerID) as StructureLink
            if (!container) delete data.containerID
            else
            {
                if (container.hits < container.hitsMax) creep_.repair(container)
                if (creep_.pos.isNearTo(container))creep_.transfer(container,'energy')
                else creep_.goTo(container.pos,1)
            }
            return
        }
        /* 都没有就寻找附近范围内的container */
        let cons = creep_.pos.findInRange(FIND_MY_CONSTRUCTION_SITES,3)
        if (cons.length > 0) creep_.build(cons[0])
        return
    }
    else
    {
        if (!creep_.memory.targetID)
        {
            /* 寻找目标 */
            LoopA:
            for (var sourceID of Game.rooms[creep_.memory.belong].memory.StructureIdData.source)
            {
                /* 寻找是否有爬虫记忆里有这个id了 */
                for (var creep of Game.rooms[creep_.memory.belong].find(FIND_MY_CREEPS,{filter:(creep)=>{return creep.memory.role && creep.memory.role == 'harvest'}}) as Creep[])
                if (creep.memory.targetID && creep.memory.targetID == sourceID) continue LoopA
                else creep_.memory.targetID = sourceID
            }
            /* 如果还没有，就说明该房间只有1个矿 */
            creep_.say("找不到目标source!")
            return
        }
        /* 寻找target附近的container */
        let source = Game.getObjectById(creep_.memory.targetID) as Source
        if (!source) return
        if (!creep_.pos.isNearTo(source)){creep_.goTo(source.pos,1);return}
        let data = Game.rooms[creep_.memory.belong].memory.harvestData[creep_.memory.targetID]
        if (!data) return
        if (data.linkID || data.containerID)
        {
            creep_.harvest(source)
            creep_.say("采集")
            return
        }
        /* 寻找或者建造 */
        let constru = source.pos.findInRange(FIND_CONSTRUCTION_SITES,1,{filter:(cons)=>{return cons.structureType == 'container'}})
        if (constru.length > 0 && Game.rooms[creep_.memory.belong].controller.level > 7) {creep_.harvest(source);return}
        if (constru.length > 0)
        {
            creep_.harvest(source)
        }
        else
        {
            creep_.pos.createConstructionSite('container')
        }

    }
}

export function carry_(creep_:Creep):void{
    if (!Game.rooms[creep_.memory.belong]) return
    if (!creep_.memory.working) creep_.memory.working = false
    if(creep_.memory.working && creep_.store.getUsedCapacity("energy") == 0 ) {
        creep_.memory.working = false;
    }
    if(!creep_.memory.working && creep_.store.getFreeCapacity() == 0) {
        creep_.memory.working = true;
    }
    if (creep_.memory.working)
    {
        let extension = creep_.pos.getClosestStore()
        if (extension)
        {
            if (!creep_.pos.isNearTo(extension)) creep_.goTo(extension.pos,1)
            else creep_.transfer(extension,'energy')
        }
        delete creep_.memory.targetID
    }
    else
    {
        if (!creep_.memory.targetID)
        {
            let container = creep_.pos.findClosestByRange(FIND_STRUCTURES,{filter:(stru)=>{return stru.structureType == 'container' && stru.store.getUsedCapacity('energy') > creep_.store.getCapacity()}}) as StructureContainer
            if (container) creep_.memory.targetID = container.id
        }
        let container = Game.getObjectById(creep_.memory.targetID) as StructureContainer
        if (!container)
        {
            delete creep_.memory.targetID
            return
        }
        if (!creep_.pos.isNearTo(container)) creep_.goTo(container.pos,1)
        else creep_.withdraw(container,'energy')
    }
}

export function upgrade_(creep_:Creep):void{
    if (!Game.rooms[creep_.memory.belong]) return
    if (!creep_.memory.working) creep_.memory.working = false
    if(creep_.memory.working && creep_.store.getUsedCapacity("energy") == 0 ) {
        creep_.memory.working = false;
    }
    if(!creep_.memory.working && creep_.store.getFreeCapacity() == 0) {
        creep_.memory.working = true;
    }
    if (creep_.memory.working)
    {
        if (creep_.upgradeController(Game.rooms[creep_.memory.belong].controller) == ERR_NOT_IN_RANGE) creep_.goTo(Game.rooms[creep_.memory.belong].controller.pos,2)
        else
            creep_.memory.standed = true
        delete creep_.memory.targetID
    }
    else
    {
        creep_.memory.standed = false
        if (!creep_.memory.targetID)
        if (Game.rooms[creep_.memory.belong].memory.StructureIdData.upgrade_link)
        {
            let upgrade_link = Game.getObjectById(Game.rooms[creep_.memory.belong].memory.StructureIdData.upgrade_link)
            if (upgrade_link) creep_.memory.targetID = Game.rooms[creep_.memory.belong].memory.StructureIdData.upgrade_link
            else delete Game.rooms[creep_.memory.belong].memory.StructureIdData.upgrade_link
        }
        else
        {
            let container = creep_.pos.findClosestByRange(FIND_STRUCTURES,{filter:(stru)=>{return stru.structureType == 'container' && stru.store.getUsedCapacity('energy') > creep_.store.getCapacity()}}) as StructureContainer
            if (container) creep_.memory.targetID = container.id
        }
        let container = Game.getObjectById(creep_.memory.targetID) as StructureContainer | StructureLink
        if (!container)
        {
            delete creep_.memory.targetID
            return
        }
        if (!creep_.pos.isNearTo(container)) creep_.goTo(container.pos,1)
        else creep_.withdraw(container,'energy')

    }

}