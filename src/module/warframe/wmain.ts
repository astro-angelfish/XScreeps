import { AppLifecycleCallbacks } from "../framework/types"
export function warFrame():void {
    // 战争框架数据刷新
    warDataUpdate()
    // 具体战争逻辑 
}

export function warDataUpdate():void {
    // 刷新爬虫
    for (let c in Memory.warframe.creep)
    {
        if (!Memory.warframe.creep) delete Memory.warframe.creep[c]
    }
}

export const warFrameMoudle:AppLifecycleCallbacks = {
    tickEnd:warFrame
}