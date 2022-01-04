/**
 * 存放非任务类型角色相关的函数
*/
export function harvest_(creep_:Creep):void{
    if (!creep_.memory.working) creep_.memory.working = false
    if(creep_.memory.working && creep_.store.getUsedCapacity("energy") == 0 ) {
        creep_.memory.working = false;
    }
    if(!creep_.memory.working && creep_.store.getFreeCapacity() == 0) {
        creep_.memory.working = true;
    }
    if (creep_.memory.working)
    {
        
    }
    else
    {

    }
}