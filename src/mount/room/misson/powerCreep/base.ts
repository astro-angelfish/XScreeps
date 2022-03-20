import { isOPWR } from "@/mount/powercreep/misson/constant"

/* 超能powercreep相关任务 */
export default class PowerCreepMisson extends Room {
    /* Pc任务管理器 */
    public PowerCreep_TaskManager():void{
        if (this.controller.level < 8) return
        var storage_ = global.Stru[this.name]['storage'] as StructureStorage
        if (!storage_) return
        var pc = Game.powerCreeps[`${this.name}/queen/${Game.shard.name}`]
        var pcspawn = global.Stru[this.name]['powerspawn'] as StructurePowerSpawn
        if (!pc)
            return
        else
        {
            /* 看看是否存活，没存活就孵化 */
            if (!pc.ticksToLive && pcspawn)
            {
                pc.spawn(pcspawn)
                return
            }
        }
        this.enhance_storage()
        this.enhance_lab()
        this.enhance_extension()
        this.enhance_spawn()
        this.enhance_tower()
        this.enhance_factory()
        this.enhance_powerspawn()
    }
    /* 挂载增强storage的任务 适用于queen类型pc */
    public enhance_storage():void{
        if ((Game.time - global.Gtime[this.name]) % 7) return
        if (this.memory.switch.StopEnhanceStorage) return
        var storage_ = global.Stru[this.name]['storage'] as StructureStorage
        if (!storage_) return
        let pc = Game.powerCreeps[`${this.name}/queen/${Game.shard.name}`]
        if (!pc || !pc.powers[PWR_OPERATE_STORAGE]) return
        let effectDelay:boolean = false
        if (!storage_.effects) storage_.effects = []
        if (!isOPWR(storage_) && this.MissionNum('PowerCreep','仓库扩容') <= 0)
        {
            /* 发布任务 */
            var thisTask:MissionModel = {
                name:"仓库扩容",
                delayTick:40,
                range:'PowerCreep',
            }
            thisTask.CreepBind = {'queen':{num:1,bind:[]}}
            this.AddMission(thisTask)
        }
    }
    /* 挂载增强lab的任务 适用于queen类型pc */
    public enhance_lab():void{
        if ((Game.time - global.Gtime[this.name]) % 10) return
        if (this.memory.switch.StopEnhanceLab) return
        var storage_ = global.Stru[this.name]['storage'] as StructureStorage
        if (!storage_) return
        let pc = Game.powerCreeps[`${this.name}/queen/${Game.shard.name}`]
        if (!pc || !pc.powers[PWR_OPERATE_LAB] || pc.powers[PWR_OPERATE_LAB].cooldown) return
        let disTask = this.MissionName('Room','资源合成')
        if (!disTask) return
        if (this.MissionNum('PowerCreep','合成加速') > 0) return
        let list = []
        for (let id of disTask.Data.comData)
        {
            var lab_ = Game.getObjectById(id) as StructureLab
            if (lab_ && !isOPWR(lab_))
                list.push(id)
        }
        if (list.length <= 0) return
        var thisTask:MissionModel = {
            name:"合成加速",
            delayTick:50,
            range:'PowerCreep',
            Data:{
                lab: list
            }
        }
        thisTask.CreepBind = {'queen':{num:1,bind:[]}}
        this.AddMission(thisTask)
    }
    /* 挂载防御塔任务 适用于queen类型pc 配合主动防御 */
    public enhance_tower():void{
        if ((Game.time - global.Gtime[this.name]) % 11) return
        if (this.memory.switch.StopEnhanceTower) return
        var storage_ = global.Stru[this.name]['storage'] as StructureStorage
        if (!storage_) return
        let pc = Game.powerCreeps[`${this.name}/queen/${Game.shard.name}`]
        if (!pc || !pc.powers[PWR_OPERATE_TOWER] || pc.powers[PWR_OPERATE_TOWER].cooldown) return
        if (this.memory.state == 'war' && this.memory.switch.AutoDefend)
        {
            let towers_list = []
            if (this.memory.StructureIdData.AtowerID.length > 0) 
            for (var o of this.memory.StructureIdData.AtowerID){
                var otower = Game.getObjectById(o) as StructureTower
                if (otower && !isOPWR(otower))
                {
                    towers_list.push(otower.id)
                }
            }
            if (towers_list.length <=0 || this.MissionNum('PowerCreep','塔防增强') > 0) return
            /* 发布任务 */
            var thisTask:MissionModel = {
                name:"塔防增强",
                delayTick:70,
                range:'PowerCreep',
                Data:{
                    tower:towers_list
                }
            }
            thisTask.CreepBind = {'queen':{num:1,bind:[]}}
            this.AddMission(thisTask)
        }
    }
    /* 挂载填充拓展任务 适用于queen类型pc */
    public enhance_extension():void{
        if ((Game.time - global.Gtime[this.name]) % 25) return
        if (this.memory.switch.StopEnhanceExtension) return
        var storage_ = global.Stru[this.name]['storage'] as StructureStorage
        if (!storage_ || storage_.store.getUsedCapacity('energy') < 20000) return
        let pc = Game.powerCreeps[`${this.name}/queen/${Game.shard.name}`]
        if (!pc || !pc.powers[PWR_OPERATE_EXTENSION]) return
        if (this.energyAvailable < this.energyCapacityAvailable*0.3 && this.MissionNum('PowerCreep','拓展填充') <= 0)
        {
            var thisTask:MissionModel = {
                name:"扩展填充",
                delayTick:30,
                range:'PowerCreep',
                Data:{
                }
            }
            thisTask.CreepBind = {'queen':{num:1,bind:[]}}
            this.AddMission(thisTask)
        }

    }
    /* 挂载spawn加速任务 适用于queen类型pc */
    public enhance_spawn():void{
        if ((Game.time - global.Gtime[this.name]) % 13) return
        if (this.memory.switch.StopEnhanceSpawn) return
        var storage_ = global.Stru[this.name]['storage'] as StructureStorage
        if (!storage_) return
        let pc = Game.powerCreeps[`${this.name}/queen/${Game.shard.name}`]
        if (!pc || !pc.powers[PWR_OPERATE_SPAWN]) return
        // 在战争时期、对外战争时期，启动
        var ssss = false
        let list = ['攻防一体','双人小队','四人小队','紧急支援']
        for (let i of list) if (this.MissionNum('Creep',i) > 0) ssss = true
        if (this.memory.state == 'war' && this.memory.switch.AutoDefend) ssss = true
        if (ssss)
        {
            var thisTask:MissionModel = {
                name:"虫卵强化",
                delayTick:50,
                range:'PowerCreep',
                Data:{
                }
            }
            thisTask.CreepBind = {'queen':{num:1,bind:[]}}
            this.AddMission(thisTask)
        }
    }
    /* 挂载升级工厂任务 适用于queen类型pc */
    public enhance_factory():void{
        if ((Game.time - global.Gtime[this.name]) % 14) return
        if (this.memory.switch.StopEnhanceFactory) return
        var storage_ = global.Stru[this.name]['storage'] as StructureStorage
        if (!storage_) return
        let pc = Game.powerCreeps[`${this.name}/queen/${Game.shard.name}`]
        if (!pc || !pc.powers[PWR_OPERATE_FACTORY]) return
        if (this.MissionNum("Room",'工厂合成') <= 0) return
        var thisTask:MissionModel = {
            name:"工厂强化",
            delayTick:50,
            range:'PowerCreep',
            Data:{
            }
        }
        thisTask.CreepBind = {'queen':{num:1,bind:[]}}
        this.AddMission(thisTask)
    }
    /* 挂载powerspawn增强任务 适用于queen类型pc */
    public enhance_powerspawn():void{
        if ((Game.time - global.Gtime[this.name]) % 13) return
        if (this.memory.switch.StopEnhancePowerSpawn) return
        var storage_ = global.Stru[this.name]['storage'] as StructureStorage
        if (!storage_) return
        let pc = Game.powerCreeps[`${this.name}/queen/${Game.shard.name}`]
        if (!pc || !pc.powers[PWR_OPERATE_POWER]) return
        if (this.MissionNum("Room",'power升级') <= 0) return
        var thisTask:MissionModel = {
            name:"power强化",
            delayTick:50,
            range:'PowerCreep',
            Data:{
            }
        }
        thisTask.CreepBind = {'queen':{num:1,bind:[]}}
        this.AddMission(thisTask)
    }
}