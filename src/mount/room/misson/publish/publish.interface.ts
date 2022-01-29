interface Room {
    Public_Carry(creepData:BindData,delayTick:number,sR:string,sX:number,sY:number,tR:string,tX:number,tY:number,rType?:ResourceConstant,num?:number):MissionModel
    public_repair(Rtype:'global' | 'special' | 'nuker',num:number,boostType:ResourceConstant,vindicate:boolean):MissionModel
    public_planC(disRoom:string):MissionModel
    Public_link(structure:string[],disStructure:string,level:number,delayTick?:number):MissionModel
    Public_dismantle(disRoom:string,num:number,interval?:number,boost?:boolean):MissionModel
    Check_Lab(misson:MissionModel,role:string,tankType:'storage' | 'terminal' | 'complex')
    Public_quick(num:number,boostType:ResourceConstant | null):MissionModel
}