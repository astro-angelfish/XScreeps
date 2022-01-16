interface Room {
    Public_Carry(creepData:BindData,delayTick:number,sR:string,sX:number,sY:number,tR:string,tX:number,tY:number,rType?:ResourceConstant,num?:number):MissionModel
    public_repair(Rtype:'global' | 'special' | 'nuker',num:number,boostType:ResourceConstant,vindicate:boolean):MissionModel
}