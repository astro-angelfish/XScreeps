/**
 * Memory初始化
 */
export function MemoryInit():void {
    if(!Memory.whitesheet) Memory.whitesheet = []
    if(!Memory.bypassRooms) Memory.bypassRooms = []
    if (!Memory.ignoreMissonName) Memory.ignoreMissonName = []
}