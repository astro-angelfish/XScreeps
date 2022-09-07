import { isOPWR } from "@/mount/powercreep/misson/constant"

/* 超能powercreep相关任务 */
export default class PowerCreepMisson extends Room {
    /* Pc任务管理器 */
    public PowerCreep_TaskManager(): void {
        if (this.controller.level < 8) return
        var storage_ = this.storage as StructureStorage
        if (!storage_) return
        var pc = Game.powerCreeps[`${this.name}/queen/${Game.shard.name}`]
        // console.log(this.name,`${this.name}/queen/${Game.shard.name}`,JSON.stringify(pc))
        if (!pc)
            return
        else {
            /* 看看是否存活，没存活就孵化 */
            if (!pc.ticksToLive) {
                var pcspawn = Game.rooms[this.name].GetStructData('powerspawn') as StructurePowerSpawn
                if (pcspawn) {
                    pc.spawn(pcspawn)
                    return
                }
            }
        }
        this.enhance_storage(pc)
        this.enhance_lab(pc)
        this.enhance_extension(pc)
        this.enhance_spawn(pc)
        this.enhance_tower(pc)
        // this.enhance_factory()
        this.enhance_powerspawn(pc)
        this.enhance_source(pc)
    }
    /* 挂载增强storage的任务 适用于queen类型pc */
    public enhance_storage(pc: PowerCreep): void {
        if ((Game.time - global.Gtime[this.name]) % 7) return
        if (this.memory.switch.StopEnhanceStorage) return
        var storage_ = this.storage as StructureStorage
        if (!storage_) return
        if (storage_.store.getUsedCapacity() < 900000) return;
        if (!pc.powers[PWR_OPERATE_STORAGE] || pc.powers[PWR_OPERATE_STORAGE].cooldown) return
        let effectDelay: boolean = false
        if (!storage_.effects) storage_.effects = []
        if (!isOPWR(storage_) && this.MissionNum('PowerCreep', '仓库扩容') <= 0) {
            /* 发布任务 */
            var thisTask: MissionModel = {
                name: "仓库扩容",
                delayTick: 40,
                range: 'PowerCreep',
            }
            thisTask.CreepBind = { 'queen': { num: 1, bind: [] } }
            this.AddMission(thisTask)
        }
    }
    /* 挂载增强lab的任务 适用于queen类型pc */
    public enhance_lab(pc: PowerCreep): void {
        if ((Game.time - global.Gtime[this.name]) % 10) return
        if (this.memory.switch.StopEnhanceLab) return
        var storage_ = this.storage as StructureStorage
        if (!storage_) return
        if (!pc.powers[PWR_OPERATE_LAB] || pc.powers[PWR_OPERATE_LAB].cooldown) return
        let disTask = this.MissionName('Room', '资源合成')
        if (!disTask) return
        if (this.MissionNum('PowerCreep', '合成加速') > 0) return
        let list = []
        for (let id in this.memory.RoomLabBind) {
            let lab_data = this.memory.RoomLabBind[id];
            if (lab_data.type == 'com') {
                var lab_ = Game.getObjectById(id as Id<StructureLab>) as StructureLab
                if (lab_ && !isOPWR(lab_))
                    list.push(id)
            }

        }
        if (list.length <= 0) return
        var thisTask: MissionModel = {
            name: "合成加速",
            delayTick: 50,
            range: 'PowerCreep',
            Data: {
                lab: list
            }
        }
        thisTask.CreepBind = { 'queen': { num: 1, bind: [] } }
        this.AddMission(thisTask)
    }
    /* 挂载防御塔任务 适用于queen类型pc 配合主动防御 */
    public enhance_tower(pc: PowerCreep): void {
        if ((Game.time - global.Gtime[this.name]) % 11) return
        if (this.memory.switch.StopEnhanceTower) return
        var storage_ = this.storage as StructureStorage
        if (!storage_) return
        if (!pc.powers[PWR_OPERATE_TOWER] || pc.powers[PWR_OPERATE_TOWER].cooldown) return
        if (this.memory.state == 'war' && this.memory.switch.AutoDefend) {
            let towers_list = []
            if (this.memory.StructureIdData.AtowerID.length > 0)
                for (var o of this.memory.StructureIdData.AtowerID) {
                    var otower = Game.getObjectById(o) as StructureTower
                    if (otower && !isOPWR(otower)) {
                        towers_list.push(otower.id)
                    }
                }
            if (towers_list.length <= 0 || this.MissionNum('PowerCreep', '塔防增强') > 0) return
            /* 发布任务 */
            var thisTask: MissionModel = {
                name: "塔防增强",
                delayTick: 70,
                range: 'PowerCreep',
                Data: {
                    tower: towers_list
                }
            }
            thisTask.CreepBind = { 'queen': { num: 1, bind: [] } }
            this.AddMission(thisTask)
        }
    }
    /* 挂载填充拓展任务 适用于queen类型pc */
    public enhance_extension(pc: PowerCreep): void {
        if ((Game.time - global.Gtime[this.name]) % 25) return
        if (this.memory.switch.StopEnhanceExtension) return
        var storage_ = this.storage as StructureStorage
        if (!storage_ || storage_.store.getUsedCapacity('energy') < 20000) return
        if (!pc.powers[PWR_OPERATE_EXTENSION] || pc.powers[PWR_OPERATE_EXTENSION].cooldown) return
        if (this.energyAvailable < this.energyCapacityAvailable * 0.5 && this.MissionNum('PowerCreep', '拓展填充') <= 0) {
            var thisTask: MissionModel = {
                name: "扩展填充",
                delayTick: 30,
                range: 'PowerCreep',
                Data: {
                }
            }
            thisTask.CreepBind = { 'queen': { num: 1, bind: [] } }
            this.AddMission(thisTask)
        }

    }
    /* 挂载spawn加速任务 适用于queen类型pc */
    public enhance_spawn(pc: PowerCreep): void {
        if ((Game.time - global.Gtime[this.name]) % 13) return
        if (this.memory.switch.StopEnhanceSpawn) return
        var storage_ = this.storage as StructureStorage
        if (!storage_) return
        if (!pc.powers[PWR_OPERATE_SPAWN] || pc.powers[PWR_OPERATE_SPAWN].cooldown) return
        // 在战争时期、对外战争时期，启动
        var ssss = false
        let list = ['攻防一体', '双人小队', '四人小队', '紧急支援']
        for (let i of list) if (this.MissionNum('Creep', i) > 0) ssss = true
        if (this.memory.state == 'war' && this.memory.switch.AutoDefend) ssss = true
        if (ssss) {
            var thisTask: MissionModel = {
                name: "虫卵强化",
                delayTick: 50,
                range: 'PowerCreep',
                Data: {
                }
            }
            thisTask.CreepBind = { 'queen': { num: 1, bind: [] } }
            this.AddMission(thisTask)
        }
    }
    /* 挂载升级工厂任务 适用于queen类型pc */
    public enhance_factory(force: boolean = false): void {
        if ((Game.time - global.Gtime[this.name]) % 15 && !force) return
        if (this.memory.switch.StopEnhanceFactory) return
        var storage_ = this.storage as StructureStorage
        if (!storage_) return
        let pc = Game.powerCreeps[`${this.name}/queen/${Game.shard.name}`]
        if (!pc || !pc.powers[PWR_OPERATE_FACTORY] || pc.powers[PWR_OPERATE_FACTORY].cooldown) return
        if (this.MissionNum("PowerCreep", '工厂合成') > 0) return
        var thisTask: MissionModel = {
            name: "工厂强化",
            delayTick: 50,
            range: 'PowerCreep',
            Data: {
            }
        }
        thisTask.CreepBind = { 'queen': { num: 1, bind: [] } }
        this.AddMission(thisTask)
    }
    /* 挂载powerspawn增强任务 适用于queen类型pc */
    public enhance_powerspawn(pc: PowerCreep): void {
        if ((Game.time - global.Gtime[this.name]) % 13) return
        if (this.memory.switch.StopEnhancePowerSpawn) return
        var storage_ = this.storage as StructureStorage
        if (!storage_) return
        if (!pc.powers[PWR_OPERATE_POWER] || pc.powers[PWR_OPERATE_POWER].cooldown) return
        if (this.MissionNum("PowerCreep", 'power升级') > 0) return
        var thisTask: MissionModel = {
            name: "power强化",
            delayTick: 50,
            range: 'PowerCreep',
            Data: {
            }
        }
        thisTask.CreepBind = { 'queen': { num: 1, bind: [] } }
        this.AddMission(thisTask)
    }
    /*挂载source再生任务 适用于queen类型pc */
    public enhance_source(pc: PowerCreep): void {
        if ((Game.time - global.Gtime[this.name]) % 6) return
        if (this.memory.switch.StopEnhanceSource) return
        if (!this.memory.StructureIdData.source) return;
        if (!pc.powers[PWR_REGEN_SOURCE] || pc.powers[PWR_REGEN_SOURCE].cooldown) return
        if (this.MissionNum("PowerCreep", 'source强化') > 0) return
        for (let i in this.memory.StructureIdData.source) {
            let _source_data = Game.getObjectById(this.memory.StructureIdData.source[i]) as Source
            if (!_source_data) { continue }
            if (_source_data.effects) {
                if (_source_data.effects.length > 0) {
                    continue;
                }
            }
            var thisTask: MissionModel = {
                name: "source强化",
                delayTick: 50,
                range: 'PowerCreep',
                Data: {
                    source_id: _source_data.id
                },
                maxTime: 2
            }
            thisTask.CreepBind = { 'queen': { num: 1, bind: [] } }
            this.AddMission(thisTask)
        }
    }
}