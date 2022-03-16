import { isInArray } from "@/utils"

export default class CreepMissonWarExtension extends Creep {
    // 红球防御
    public handle_defend_attack():void{
        if (!this.BoostCheck(['move','attack'])) return
        if (this.hitsMax - this.hits > 200) this.optTower('heal',this)
        /* 如果周围1格发现敌人，爬虫联合防御塔攻击 */
        var nearCreep = this.pos.findInRange(FIND_HOSTILE_CREEPS,1,{filter:(creep)=>{
            return !isInArray(Memory.whitesheet,creep.name)
        }})
        if (nearCreep.length > 0)
        {
            this.attack(nearCreep[0])
            this.optTower('attack',nearCreep[0])
        }
        /* 寻路去距离敌对爬虫最近的rampart */
        var hostileCreep = Game.rooms[this.memory.belong].find(FIND_HOSTILE_CREEPS,{filter:(creep)=>{
            return !isInArray(Memory.whitesheet,creep.name)
        }})
        if (hostileCreep.length > 0)
        {
            for (var c of hostileCreep)
            /* 如果发现Hits/hitsMax低于百分之80的爬虫，直接防御塔攻击 */
            if (c.hits/c.hitsMax <= 0.8)
            this.optTower('attack',c)
        }
        // 以gather_attack开头的旗帜  例如： gather_attack_0 优先前往该旗帜附近
        let gatherFlag = this.pos.findClosestByPath(FIND_FLAGS,{filter:(flag)=>{
                return flag.name.indexOf('gather_attack') == 0
        }})
        if (gatherFlag){
            this.goTo(gatherFlag.pos,0)
            return
        }
        var ramparts = Game.rooms[this.memory.belong].find(FIND_MY_STRUCTURES,{filter:(stru)=>{
            return stru.structureType == 'rampart' && stru.pos.GetStructureList(['extension','link','observer','tower','controller','extractor']).length <= 0 && stru.pos.lookFor(LOOK_CREEPS).length <= 0
        }})
        if (ramparts.length > 0)
        {
            var ramData= {num:0,ram:null}
            for(var r of ramparts)
            {
                var nearCreeps = r.pos.findInRange(FIND_HOSTILE_CREEPS,Game.shard.name == 'shard3'?1:5,{filter:(creep)=>{
                    return !isInArray(Memory.whitesheet,creep.name)
                }})
                if (nearCreeps.length > ramData.num) {ramData.num = nearCreeps.length;ramData.ram = r}
            }
            if (!ramData.ram)
            {
                var closestCreep = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS,{filter:(creep)=>{
                    return !isInArray(Memory.whitesheet,creep.name)
                }})
                
                if (closestCreep && !this.pos.inRangeTo(closestCreep.pos,3))
                {
                    /* 找离虫子最近的rampart */
                    var nearstram = closestCreep.pos.findClosestByRange(FIND_MY_STRUCTURES,{filter:(stru)=>{
                        return stru.structureType == 'rampart' && stru.pos.GetStructureList(['extension','link','observer','tower','controller','extractor']).length <= 0 && (stru.pos.lookFor(LOOK_CREEPS).length <= 0 ||stru.pos.lookFor(LOOK_CREEPS)[0] == this )
                    }})
                    this.goTo_defend(nearstram.pos,0)
                }
            }
            else
            {
                this.goTo_defend(ramData.ram.pos,0)
            }
        }
        else
        {
            this.moveTo(hostileCreep[0])
        }
        if (this.pos.x >= 48 || this.pos.x <= 1 || this.pos.y >= 48 || this.pos.y <= 1)
        {
            this.moveTo(new RoomPosition(Memory.RoomControlData[this.memory.belong].center[0],Memory.RoomControlData[this.memory.belong].center[1],this.memory.belong))
        }
    }

    // 蓝球防御
    public handle_defend_range():void{
        if (!this.BoostCheck(['move','ranged_attack'])) return
        if (this.hitsMax - this.hits > 200) this.optTower('heal',this)
        /* 如果周围1格发现敌人，爬虫联合防御塔攻击 */
        var nearCreep = this.pos.findInRange(FIND_HOSTILE_CREEPS,3,{filter:(creep)=>{
            return !isInArray(Memory.whitesheet,creep.name)
        }})
        if (nearCreep.length > 0)
        {
            var nearstCreep = this.pos.findInRange(FIND_HOSTILE_CREEPS,1,{filter:(creep)=>{
                return !isInArray(Memory.whitesheet,creep.name)
            }})
            if (nearstCreep) this.rangedMassAttack()
            else this.rangedAttack(nearCreep[0])
            this.optTower('attack',nearCreep[0])
        }
        /* 寻路去距离敌对爬虫最近的rampart */
        var hostileCreep = Game.rooms[this.memory.belong].find(FIND_HOSTILE_CREEPS,{filter:(creep)=>{
            return !isInArray(Memory.whitesheet,creep.name)
        }})
        if (hostileCreep.length > 0)
        {
            for (var c of hostileCreep)
            /* 如果发现Hits/hitsMax低于百分之80的爬虫，直接防御塔攻击 */
            if (c.hits/c.hitsMax <= 0.8)
            this.optTower('attack',c)
        }
        // 以gather_attack开头的旗帜  例如： gather_range_0 优先前往该旗帜附近
        let gatherFlag = this.pos.findClosestByPath(FIND_FLAGS,{filter:(flag)=>{
                return flag.name.indexOf('gather_range') == 0
        }})
        if (gatherFlag){
            this.goTo(gatherFlag.pos,0)
            return
        }
        var ramparts = Game.rooms[this.memory.belong].find(FIND_MY_STRUCTURES,{filter:(stru)=>{
            return stru.structureType == 'rampart' && stru.pos.GetStructureList(['extension','link','observer','tower','controller','extractor']).length <= 0 && stru.pos.lookFor(LOOK_CREEPS).length <= 0
        }})
        if (ramparts.length > 0)
        {
            var ramData= {num:0,ram:null}
            for(var r of ramparts)
            {
                var nearCreeps = r.pos.findInRange(FIND_HOSTILE_CREEPS,Game.shard.name == 'shard3'?1:5,{filter:(creep)=>{
                    return !isInArray(Memory.whitesheet,creep.name)
                }})
                if (nearCreeps.length > ramData.num) {ramData.num = nearCreeps.length;ramData.ram = r}
            }
            if (!ramData.ram)
            {
                var closestCreep = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS,{filter:(creep)=>{
                    return !isInArray(Memory.whitesheet,creep.name)
                }})
                
                if (closestCreep && !this.pos.inRangeTo(closestCreep.pos,3))
                {
                    /* 找离虫子最近的rampart */
                    var nearstram = closestCreep.pos.findClosestByRange(FIND_MY_STRUCTURES,{filter:(stru)=>{
                        return stru.structureType == 'rampart' && stru.pos.GetStructureList(['extension','link','observer','tower','controller','extractor']).length <= 0 && (stru.pos.lookFor(LOOK_CREEPS).length <= 0 ||stru.pos.lookFor(LOOK_CREEPS)[0] == this )
                    }})
                    this.goTo_defend(nearstram.pos,0)
                }
            }
            else
            {
                this.goTo_defend(ramData.ram.pos,0)
            }
        }
        else
        {
            this.moveTo(hostileCreep[0])
        }
        if (this.pos.x >= 48 || this.pos.x <= 1 || this.pos.y >= 48 || this.pos.y <= 1)
        {
            this.moveTo(new RoomPosition(Memory.RoomControlData[this.memory.belong].center[0],Memory.RoomControlData[this.memory.belong].center[1],this.memory.belong))
        }
    }

    // 双人防御
    public handle_defend_double():void{
        if (this.memory.role == 'defend-douAttack')
        {
            if (!this.BoostCheck(['move','attack','tough'])) return
        }
        else
        {
            if (!this.BoostCheck(['move','heal','tough'])) return
        }
        if (!this.memory.double)
        {
            if (this.memory.role == 'double-heal')
            {
                /* 由heal来进行组队 */
                if (Game.time % 7 == 0)
                {
                    var disCreep = this.pos.findClosestByRange(FIND_MY_CREEPS,{filter:(creep)=>{
                        return creep.memory.role == 'double-attack' && !creep.memory.double
                    }})
                    if (disCreep)
                    {
                        this.memory.double = disCreep.name
                        disCreep.memory.double = this.name
                        this.memory.captain = false
                        disCreep.memory.captain = true
                    }
                }
            }
            return
        }
        if (this.memory.role == 'defend-douAttack')
        {
            if (this.hitsMax - this.hits > 1200) this.optTower('heal',this)
            if (!Game.creeps[this.memory.double]) return
            if (this.fatigue || Game.creeps[this.memory.double].fatigue) return
            if (Game.creeps[this.memory.double] && !this.pos.isNearTo(Game.creeps[this.memory.double]) && (!isInArray([0,49],this.pos.x) && !isInArray([0,49],this.pos.y)))
            return
        /* 去目标房间 */
        if (this.room.name != this.memory.belong)
        {
            this.goTo(new RoomPosition(24,24,this.memory.belong),23)
        }
        else
        {
            let flag = this.pos.findClosestByPath(FIND_FLAGS,{filter:(flag)=>{
                    return flag.name.indexOf('gather_double') == 0
            }})
            if (flag)
            {
                let creeps = this.pos.findInRange(FIND_HOSTILE_CREEPS,1,{filter:(creep)=>{
                    return !isInArray(Memory.whitesheet,creep.owner.username )
                }})
                if (creeps[0])this.attack(creeps[0])
                this.goTo(flag.pos,0)
                return
            }
            let creeps = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS,{filter:(creep)=>{
                return !isInArray(Memory.whitesheet,creep.owner.username )
            }})
            if (creeps && !isInArray([0,49],creeps.pos.x) && !isInArray([0,49],creeps.pos.y))
            {
                if (this.attack(creeps) == ERR_NOT_IN_RANGE) this.goTo(creeps.pos,1)
            }
            if (this.pos.x >= 48 || this.pos.x <= 1 || this.pos.y >= 48 || this.pos.y <= 1)
            {
                this.moveTo(new RoomPosition(Memory.RoomControlData[this.memory.belong].center[0],Memory.RoomControlData[this.memory.belong].center[1],this.memory.belong))
            }
        }
        }
        else
        {
            if (this.hitsMax - this.hits > 600) this.optTower('heal',this)
            this.moveTo(Game.creeps[this.memory.double])
            if(Game.creeps[this.memory.double])this.heal(Game.creeps[this.memory.double])
            else this.heal(this)
            if (!Game.creeps[this.memory.double]){this.suicide();return}
            else
            {
                if (this.pos.isNearTo(Game.creeps[this.memory.double]))
                {
                    var caption_hp = Game.creeps[this.memory.double].hits
                    var this_hp = this.hits
                    if (this_hp == this.hitsMax && caption_hp == Game.creeps[this.memory.double].hitsMax) this.heal(Game.creeps[this.memory.double])
                    if (caption_hp < this_hp)
                    {
                        this.heal(Game.creeps[this.memory.double])
                    }
                    else
                    {
                        this.heal(this)
                    }
                    let otherCreeps = this.pos.findInRange(FIND_MY_CREEPS,3,{filter:(creep)=>{return creep.hits < creep.hitsMax - 300}})
                    if (otherCreeps[0] && this.hits == this.hitsMax && Game.creeps[this.memory.double].hits == Game.creeps[this.memory.double].hitsMax)
                    {
                        if (otherCreeps[0].pos.isNearTo(this))
                        this.heal(otherCreeps[0])
                        else this.rangedHeal(otherCreeps[0])
                    }
                }
                else
                {
                    this.heal(this)
                    this.moveTo(Game.creeps[this.memory.double])
                }
            }
        }
    }
}