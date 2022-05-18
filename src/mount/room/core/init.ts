import { getDistance, isInArray } from "@/utils"

/* 房间原型拓展   --内核  --房间初始化 */
export default class RoomCoreInitExtension extends Room {
    /**
     * 房间初始化主函数
     */
    public RoomInit(): void {
        var cpu_test = false
        let cpu_list = [];
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        this.RoomMemoryInit()
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        this.RoomStructureInit()
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        this.RoomSpawnListInit()
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        this.RoomGlobalStructure()
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        this.RoomGlobalDynamicconfig()
        if (cpu_test) {
            cpu_list.push(Game.cpu.getUsed())
            console.log(
                'RoomMemoryInit' + (cpu_list[1] - cpu_list[0]).toFixed(3),
                'RoomStructureInit' + (cpu_list[2] - cpu_list[1]).toFixed(3),
                'RoomSpawnListInit' + (cpu_list[3] - cpu_list[2]).toFixed(3),
                'RoomGlobalStructure' + (cpu_list[4] - cpu_list[3]).toFixed(3),
                'RoomGlobalDynamicconfig' + (cpu_list[5] - cpu_list[4]).toFixed(3),
                this.name,
                '总计' + (cpu_list[5] - cpu_list[0]).toFixed(3),
            )
        }

    }

    /**
     * 所有RoomMemory的1级key都需要在这里注册
     */
    public RoomMemoryInit(): void {
        if (!global.Stru[this.name]) {
            global.Stru[this.name] = {}
            if (!this.memory.StructureIdData) this.memory.StructureIdData = {}
            if (!this.memory.RoomLabBind) this.memory.RoomLabBind = {}
            if (!this.memory.SpawnConfig) this.memory.SpawnConfig = {}
            if (!this.memory.UpgradespawnConfig) this.memory.UpgradespawnConfig = {}
            if (!this.memory.originLevel) this.memory.originLevel = 0
            if (!this.memory.SpawnList) this.memory.SpawnList = []
            if (!this.memory.state) this.memory.state = 'peace'
            if (!this.memory.CoolDownDic) this.memory.CoolDownDic = {}
            if (!this.memory.Misson) this.memory.Misson = {}
            if (!this.memory.Misson['Structure']) this.memory.Misson['Structure'] = []
            if (!this.memory.Misson['Room']) this.memory.Misson['Room'] = []
            if (!this.memory.Misson['Creep']) this.memory.Misson['Creep'] = []
            if (!this.memory.Misson['PowerCreep']) this.memory.Misson['PowerCreep'] = []
            // if (!global.HostileData[this.name]) global.HostileData[this.name] = {}
            if (!this.memory.TerminalData) this.memory.TerminalData = { 'energy': { num: 50000, fill: true } }
            if (!this.memory.market) this.memory.market = { 'deal': [], 'order': [] }
            if (!global.ResourceLimit[this.name]) global.ResourceLimit[this.name] = {}
            if (!this.memory.ComDispatchData) this.memory.ComDispatchData = {}
            if (!this.memory.switch) this.memory.switch = {}
            if (!this.memory.enemy) this.memory.enemy = {}
            if (!this.memory.productData) this.memory.productData = { level: 0, state: 'sleep', baseList: {}, balanceData: {} }
            if (!this.memory.DynamicConfig) this.memory.DynamicConfig = {}
            if (!this.memory.DynamicConfig.Dynamicupgrade) this.memory.DynamicConfig.Dynamicupgrade = false
            if (!global.Repairlist[this.name]) global.Repairlist[this.name] = []
            if (!this.memory.MarketPrice) { this.memory.MarketPrice = { Dynamicprice: true, order_list: [], buy: { low: 0, high: 0 }, sell: { low: 0, high: 0 } } }
            if (!global.controllerData[this.name]) { global.controllerData[this.name] = [] }
            if (!this.memory.CoolDownDic) this.memory.CoolDownDic = {}
            if (!this.memory.Visualdisplay) this.memory.Visualdisplay = false
            if (!this.memory.Labautomatic) this.memory.Labautomatic = { 'automaticData': [], 'automaticState': false }
            if (!this.memory.ExcludeRampart) { this.memory.ExcludeRampart = [] }
            if (!this.memory.Enemydistribution) { this.memory.Enemydistribution = {} }
        }
        global.HostileCreeps[this.name] = [];
        global.HostileGroup[this.name] = [];
        global.getStructure[this.name] = {};
        delete this.memory.DefendDouId;/*每个Tick都进行重置操作*/
    }

    /**
     * 定时刷新房间内的建筑，将建筑id储存起来  【已测试】 <能用就行，不想改了QAQ> 
     */
    public RoomStructureInit(): void {
        let tickratio = 6;
        if (Game.time % tickratio != 0) { return }
        var cpu_test = false
        let cpu_list = [];
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        let level = this.controller.level
        let StructureData = this.memory.StructureIdData
        /* Spawn建筑记忆更新 */
        if (!StructureData.spawn) StructureData.spawn = []
        if (StructureData.spawn.length < 3) {
            if (level <= 6 && StructureData.spawn.length < 1) {
                let ASpawn = this.getStructure('spawn') as StructureSpawn[]
                for (let sp of ASpawn) {
                    StructureData.spawn.push(sp.id)
                }
            }
            else if ((level == 7 && StructureData.spawn.length < 2) || (level >= 8 && StructureData.spawn.length < 3)) {
                if (Game.time % tickratio * 2 == 0) {
                    let ASpawn = this.getStructure('spawn') as StructureSpawn[]
                    for (let sp of ASpawn) {
                        if (!isInArray(StructureData.spawn, sp.id))
                            StructureData.spawn.push(sp.id)
                    }
                }
            }
        }
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        /* 中心点依赖建筑*/
        if (Memory.RoomControlData[this.name].center.length == 2) {
            let centerlist = Memory.RoomControlData[this.name].center
            /* 近塔记忆更新 (用于维护道路和container的塔) */
            if (!this.memory.StructureIdData.NtowerID && this.controller.level >= 3) {
                let position = new RoomPosition(centerlist[0], centerlist[1], this.name)
                var NTower = position.getClosestStructure([STRUCTURE_TOWER], 0) as StructureTower
                if (NTower && NTower.my)
                    if (getDistance(NTower.pos, position) < 7) this.memory.StructureIdData.NtowerID = NTower.id
            }
        }
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        /* 资源矿记忆更新 */
        if (!StructureData.mineralID) {
            let Mineral_ = this.find(FIND_MINERALS)
            if (Mineral_.length == 1) this.memory.StructureIdData.mineralID = Mineral_[0].id
        }
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        /* 能量矿记忆更新*/
        if (!StructureData.source) StructureData.source = []
        if (StructureData.source.length <= 0) {
            let allSource = this.find(FIND_SOURCES)
            let sourceIDs = []
            allSource.forEach(sou => sourceIDs.push(sou.id))
            StructureData.source = sourceIDs
        }
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        /* 升级Link记忆更新 */
        if (!StructureData.source_links) StructureData.source_links = []
        if (level >= 6 && !StructureData.upgrade_link) {
            if (Game.time % tickratio * 4 == 0) {
                let upgrade_link = this.controller.pos.getRangedStructure([STRUCTURE_LINK], 3, 0) as StructureLink[]
                if (upgrade_link.length >= 1)
                    for (let ul of upgrade_link) {
                        if (!isInArray(StructureData.source_links, ul.id)) {
                            StructureData.upgrade_link = ul.id
                            break
                        }
                    }
            }
        }
        if (!StructureData.comsume_link) {
            StructureData.comsume_link = []
        }
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        /* 矿点link记忆更新 */
        if (level == 5 || level == 6) {
            if (level == 5) {
                if (StructureData.source_links.length <= 0) {
                    let temp_link_list = []
                    for (let sID of StructureData.source) {
                        let source_ = Game.getObjectById(sID) as Source
                        let nearlink = source_.pos.getRangedStructure(['link'], 2, 0) as StructureLink[]
                        LoopLink:
                        for (let l of nearlink) {
                            if (StructureData.upgrade_link && l.id == StructureData.upgrade_link) continue LoopLink
                            temp_link_list.push(l.id)
                        }
                    }
                    StructureData.source_links = temp_link_list
                }
            }
            if (level == 6 && !StructureData.upgrade_link) {
                if (StructureData.source_links.length < StructureData.source.length) {
                    let temp_link_list = []
                    for (let sID of StructureData.source) {
                        let source_ = Game.getObjectById(sID) as Source
                        let nearlink = source_.pos.getRangedStructure(['link'], 2, 0) as StructureLink[]
                        LoopLink:
                        for (let l of nearlink) {
                            if (StructureData.upgrade_link && l.id == StructureData.upgrade_link) continue LoopLink
                            temp_link_list.push(l.id)
                        }
                    }
                    StructureData.source_links = temp_link_list
                }
            }
        }
        else if (level >= 7) {
            if (StructureData.source_links.length < StructureData.source.length) {
                let temp_link_list = []
                for (let sID of StructureData.source) {
                    let source_ = Game.getObjectById(sID) as Source
                    let nearlink = source_.pos.getRangedStructure(['link'], 2, 0) as StructureLink[]
                    LoopLink:
                    for (let l of nearlink) {
                        if (StructureData.upgrade_link && l.id == StructureData.upgrade_link) continue LoopLink
                        temp_link_list.push(l.id)
                    }
                }
                StructureData.source_links = temp_link_list
            }
        }
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        /* 仓库记忆更新 */
        if (level >= 4 && !this.memory.StructureIdData.storageID) {
            if (this.storage) this.memory.StructureIdData.storageID = this.storage.id
        }
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        /* 通过仓库抓取中央link */
        if (level >= 5 && !StructureData.center_link && this.memory.StructureIdData.storageID) {
            let storage_ = this.storage as StructureStorage
            if (storage_) {
                let center_links = storage_.pos.getRangedStructure(['link'], 2, 0) as StructureLink[]
                if (center_links.length >= 1) StructureData.center_link = center_links[0].id
            }
        }
        if (cpu_test) {
            cpu_list.push(Game.cpu.getUsed())
        }
        /* 防御塔记忆更新 */
        if (Game.time % tickratio * 25 == 0 && this.controller.level >= 3) {
            if (!this.memory.StructureIdData.AtowerID) this.memory.StructureIdData.AtowerID = []
            this.memory.StructureIdData.AtowerID as string[]
            var ATowers = this.getStructure(STRUCTURE_TOWER) as StructureTower[]
            if (ATowers.length > this.memory.StructureIdData.AtowerID.length) {
                for (var t of ATowers)
                    if (t.my && !isInArray(this.memory.StructureIdData.AtowerID as string[], t.id)) {
                        var AtowerID = this.memory.StructureIdData.AtowerID as string[]
                        AtowerID.push(t.id)
                    }
            }
        }
        if (cpu_test) {
            cpu_list.push(Game.cpu.getUsed())
        }
        /* 终端识别 */
        if (!this.memory.StructureIdData.terminalID && level >= 6) {
            if (this.terminal) this.memory.StructureIdData.terminalID = this.terminal.id
        }
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        /* 提取器识别 */
        if (!this.memory.StructureIdData.extractID && this.controller.level >= 5) {
            var extract = this.getStructure(STRUCTURE_EXTRACTOR)
            if (extract.length == 1) this.memory.StructureIdData.extractID = extract[0].id
        }
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        /* 实验室识别 */
        if (Game.time % tickratio * 34 == 0) {
            var ALabs = this.getStructure(STRUCTURE_LAB) as StructureLab[]
            if (ALabs.length >= 1) {
                if (!this.memory.StructureIdData.labs) this.memory.StructureIdData.labs = []
                for (var llab of ALabs) {
                    if (llab.my && !isInArray(this.memory.StructureIdData.labs as string[], llab.id)) {
                        var labs = this.memory.StructureIdData.labs as string[]
                        labs.push(llab.id)
                    }
                }
            }
            /* 删除无用lab */
            if (this.memory.StructureIdData.labs) {
                for (let labID of this.memory.StructureIdData.labs) {
                    let theLab = Game.getObjectById(labID) as StructureLab
                    if (!theLab) {
                        let index = this.memory.StructureIdData.labs.indexOf(labID)
                        this.memory.StructureIdData.labs.splice(index, 1)
                    }
                }
            }
            /* 实验室合成数据 需要手动挂载，如果没有实验室合成数据，无法执行合成任务 */
            /* 里面包含自动合成相关的原料lab和产出lab数据 */
            if (!this.memory.StructureIdData.labInspect) {
                this.memory.StructureIdData.labInspect = {}
            }

        }
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        /* 观察器识别 */
        if (!this.memory.StructureIdData.ObserverID && this.controller.level >= 8) {
            var observer_ = this.getStructure(STRUCTURE_OBSERVER)
            if (observer_.length > 0) {
                this.memory.StructureIdData.ObserverID = observer_[0].id
            }
        }
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        /* PowerSpawn识别 */
        if (!this.memory.StructureIdData.PowerSpawnID && this.controller.level >= 8) {
            var powerSpawn = this.getStructure(STRUCTURE_POWER_SPAWN)
            if (powerSpawn.length > 0)
                this.memory.StructureIdData.PowerSpawnID = powerSpawn[0].id
        }
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        /* 核弹识别 */
        if (!this.memory.StructureIdData.NukerID && this.controller.level >= 8) {
            var nuke_ = this.getStructure(STRUCTURE_NUKER)
            if (nuke_.length > 0) {
                this.memory.StructureIdData.NukerID = nuke_[0].id
            }
        }
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        /* 工厂识别 */
        if (!this.memory.StructureIdData.FactoryId && this.controller.level >= 8) {
            var factory_ = this.getStructure(STRUCTURE_FACTORY)
            if (factory_.length > 0) {
                this.memory.StructureIdData.FactoryId = factory_[0].id
            }
        }
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        // harvestData 数据更新
        if (!this.memory.harvestData) {
            this.memory.harvestData = {}
            for (let source_ of this.memory.StructureIdData.source) {
                this.memory.harvestData[source_] = {}
            }
        }
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        let carry_num = 0;
        if (Game.time % tickratio * 3 == 0) {
            for (let id in this.memory.harvestData) {
                if (!this.memory.harvestData[id].containerID) {
                    let source = Game.getObjectById(id) as Source
                    let containers = source.pos.findInRange(FIND_STRUCTURES, 1, { filter: (stru) => { return stru.structureType == 'container' } })
                    if (containers.length > 0) {
                        this.memory.harvestData[id].containerID = containers[0].id
                        carry_num++;
                    }
                } else {
                    carry_num++;
                }
                if (level >= 5 && !this.memory.harvestData[id].linkID) {
                    let source = Game.getObjectById(id) as Source
                    let links = source.pos.findInRange(FIND_STRUCTURES, 2, { filter: (stru) => { return stru.structureType == 'link' } })
                    if (links.length > 0) {
                        this.memory.harvestData[id].linkID = links[0].id
                        carry_num--;
                    }
                } else if (this.memory.harvestData[id].linkID) {
                    carry_num--;
                }
            }
        }
        this.memory.SpawnConfig.carry.num = carry_num;
        if (cpu_test) {
            cpu_list.push(Game.cpu.getUsed())
            let cpu_text = '';
            for (let i in cpu_list) {
                if (Number(i) > 0) {
                    cpu_text += "模块" + i + "[" + (cpu_list[i] - cpu_list[Number(i) - 1]).toFixed(3) + "]"
                }
            }
            console.log(this.name, cpu_text)
        }
    }

    /**
     * 房间孵化队列初始化
     */
    public RoomSpawnListInit(): void {
        if (!global.CreepBodyData) global.CreepBodyData = {}
        if (!global.CreepBodyData[this.name]) global.CreepBodyData[this.name] = {}
        if (!global.CreepNumData) global.CreepNumData = {}
        if (!global.CreepNumData[this.name]) global.CreepNumData[this.name] = {}

    }

    /**
     * 房间全局建筑初始化
     */
    public RoomGlobalStructure(): void {
        if (Game.time % 7 != 0) { return }
        // 目前只支持 storage terminal factory powerspawn
        if (this.memory.StructureIdData.storageID) {
            global.Stru[this.name]['storage'] = this.storage as StructureStorage
            if (!global.Stru[this.name]['storage']) {
                delete this.memory.StructureIdData.storageID
            }
        }
        if (this.memory.StructureIdData.terminalID) {
            global.Stru[this.name]['terminal'] = this.terminal as StructureTerminal
            if (!global.Stru[this.name]['terminal']) {
                delete this.memory.StructureIdData.terminalID
            }
        }
        if (this.memory.StructureIdData.PowerSpawnID) {
            global.Stru[this.name]['powerspawn'] = Game.getObjectById(this.memory.StructureIdData.PowerSpawnID) as StructurePowerSpawn
            if (!global.Stru[this.name]['powerspawn']) {
                delete this.memory.StructureIdData.PowerSpawnID
            }
        }
        if (this.memory.StructureIdData.FactoryId) {
            global.Stru[this.name]['factory'] = Game.getObjectById(this.memory.StructureIdData.FactoryId) as StructureFactory
            if (!global.Stru[this.name]['factory']) {
                delete this.memory.StructureIdData.FactoryId
            }
        }
        if (this.memory.StructureIdData.NtowerID) {
            global.Stru[this.name]['Ntower'] = Game.getObjectById(this.memory.StructureIdData.NtowerID) as StructureTower
            if (!global.Stru[this.name]['Ntower']) {
                delete this.memory.StructureIdData.NtowerID
            }
        }
        if (this.memory.StructureIdData.AtowerID && this.memory.StructureIdData.AtowerID.length > 0) {
            var otlist = global.Stru[this.name]['Atower'] = [] as StructureTower[]
            for (var ti of this.memory.StructureIdData.AtowerID) {
                var ot = Game.getObjectById(ti) as StructureTower
                if (!ot) {
                    var index = this.memory.StructureIdData.AtowerID.indexOf(ti)
                    this.memory.StructureIdData.AtowerID.splice(index, 1)
                    continue
                }
                otlist.push(ot)
            }
        }
    }

    /**
     * 房间自适应动态配置
     */
    public RoomGlobalDynamicconfig(): void {
        if (Game.time % 50 != 0) { return }
        let level = this.controller.level
        if (this.memory.DynamicConfig.Dynamicupgrade && level < 8) {
            let room_energy = 0;
            if (!this.storage) { return }
            room_energy = this.storage.store.getUsedCapacity(RESOURCE_ENERGY)
            if (this.terminal) {
                room_energy += this.terminal.store.getUsedCapacity(RESOURCE_ENERGY)
            }
            let creep_num = Math.floor(room_energy / 100000) + 1;
            creep_num = creep_num > 5 ? 5 : creep_num
            if (this.memory.SpawnConfig.upgrade.num != creep_num) { console.log(this.name, 'upgrade动态调整', creep_num); }
            this.memory.SpawnConfig.upgrade.num = creep_num;
        } else {
            if (!this.memory.economy) {
                if (this.MissionNum('Creep', '急速冲级') > 0) {
                    this.memory.SpawnConfig.upgrade.num = 0;
                } else {
                    if (level >= 8) {
                        this.memory.SpawnConfig.upgrade.num = 1;
                    } else {
                        this.memory.SpawnConfig.upgrade.num = 2;
                    }
                }
            }
        }
        let transport_num = this.memory.SpawnConfig.transport.num;
        if (this.memory.state == 'peace') {
            /*调整物流人员的数量*/
            transport_num = 1;
        } else if (this.memory.state == 'war') {
            transport_num = 2;
        }
        if (this.memory.DynamicConfig.Dynamictransport) {
            transport_num += this.memory.DynamicConfig.Dynamictransport;
        }
        this.NumSpawn('transport', transport_num)
    }
}