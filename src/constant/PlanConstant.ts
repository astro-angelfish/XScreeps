/* 图标 */
export const icon = {
    "spawn": "◎",
    "extension": "ⓔ",
    "link": "◈",
    "road": "•",
    "constructedWall": "▓",
    "rampart": "⊙",
    "storage": "▤",
    "tower": "🔫",
    "observer": "👀",
    "powerSpawn": "❂",
    "extractor": "⇌",
    "terminal": "✡",
    "lab": "☢",
    "container": "□",
    "nuker": "▲",
    "factory": "☭"
}

/* 图标颜色 */
export const iconColor = {
    "spawn": "cyan",
    "extension": "#0bb118",
    "link": "yellow",
    "road": "#fa6f6f",
    "constructedWall": "#003fff",
    "rampart": "#003fff",
    "storage": "yellow",
    "tower": "cyan",
    "observer": "yellow",
    "powerSpawn": "cyan",
    "extractor": "cyan",
    "terminal": "yellow",
    "lab": "#d500ff",
    "container": "yellow",
    "nuker": "cyan",
    "factory": "yellow"
}

/* dev布局信息 */
export const devPlanConstant:BluePrint = [
    /* 2级规划 */
    {x:-1,y:3,structureType:'extension',level:2},       // extension
    {x:-2,y:3,structureType:'extension',level:2},
    {x:-3,y:3,structureType:'extension',level:2},
    {x:-2,y:4,structureType:'extension',level:2},
    {x:-3,y:4,structureType:'extension',level:2},
    {x:-1,y:2,structureType:'road',level:2},            // road
    {x:1,y:2,structureType:'road',level:2},
    {x:0,y:2,structureType:'road',level:2},
    {x:-1,y:1,structureType:'road',level:2},
    {x:-2,y:1,structureType:'road',level:2},
    {x:-3,y:0,structureType:'road',level:2},
    {x:-2,y:-1,structureType:'road',level:2},
    {x:-1,y:-2,structureType:'road',level:2},
    {x:-1,y:-1,structureType:'road',level:2},
    {x:0,y:-3,structureType:'road',level:2},
    {x:1,y:-2,structureType:'road',level:2},
    {x:1,y:-1,structureType:'road',level:2},
    {x:2,y:-1,structureType:'road',level:2},
    {x:3,y:0,structureType:'road',level:2},
    {x:2,y:1,structureType:'road',level:2},
]

/* hoho布局信息 */
export const hohoPlanConstant:BluePrint = [

]