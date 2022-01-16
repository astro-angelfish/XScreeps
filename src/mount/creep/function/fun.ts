/* 爬虫原型拓展   --功能  --功能 */


export default class CreepFunctionExtension extends Creep {
    /**
     * 
     * working状态
     */
    public workstate(rType:ResourceConstant = RESOURCE_ENERGY):void
    {
        if (!this.memory.working) this.memory.working = false;
        if(this.memory.working && this.store[rType] == 0 ) {
            this.memory.working = false;
        }
        if(!this.memory.working && this.store.getFreeCapacity() == 0) {
            this.memory.working = true;
        }
    }

    public harvest_(source_:Source):void{
        if (this.harvest(source_) == ERR_NOT_IN_RANGE)
        {
            this.goTo(source_.pos,1)
            this.memory.standed = false
        }
        else this.memory.standed = true

    }

    public transfer_(distination:Structure,rType:ResourceConstant = RESOURCE_ENERGY) : void{
        if (this.transfer(distination,rType) == ERR_NOT_IN_RANGE)
        {
            this.goTo(distination.pos,1)
        }
        this.memory.standed = false
    }

    public upgrade_():void{
        if (this.room.controller)
        {
            if (this.upgradeController(this.room.controller) == ERR_NOT_IN_RANGE) 
            {
                this.goTo(this.room.controller.pos,1)
                this.memory.standed = false
            }
            else this.memory.standed = true
        }
    }

    // 考虑到建筑和修复有可能造成堵虫，所以解除钉扎状态
    public build_(distination:ConstructionSite) : void {
        if  (this.build(distination) == ERR_NOT_IN_RANGE)
        {
            this.goTo(distination.pos,1)
            this.memory.standed = false
        }
        else
        this.memory.standed = true
    }

    public repair_(distination:Structure) : void {
        if (this.repair(distination) == ERR_NOT_IN_RANGE)
        {
            this.goTo(distination.pos,1)
            this.memory.standed = false
        }
        else
            this.memory.standed = true
    }
    
    public withdraw_(distination:Structure,rType:ResourceConstant = RESOURCE_ENERGY) : void{
        if (this.withdraw(distination,rType) == ERR_NOT_IN_RANGE)
        {
            this.goTo(distination.pos,1)
        }
        this.memory.standed = false
    }
}