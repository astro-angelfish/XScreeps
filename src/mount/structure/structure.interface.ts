interface StructureLink{
    ManageMission():void
}
interface StructureTerminal{
    ManageMission():void
}

interface RoomMemory{
    TerminalData:{[resource:string]:{num:number,fill?:boolean}}
}