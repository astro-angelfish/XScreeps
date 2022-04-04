export const t3:ResourceConstant[] = ['XKH2O','XKHO2','XZH2O','XZHO2','XGH2O','XGHO2','XLHO2','XLH2O','XUH2O','XUHO2']
export const t2:ResourceConstant[] = ['KH2O','KHO2','ZH2O','ZHO2','GH2O','GHO2','LHO2','LH2O','UH2O','UHO2']
export const t1:ResourceConstant[] = ['KH','KO','GH','GO','LH','LO','ZO','ZH','UH','UO']

interface labRawMap{
    [mykey:string]:{raw1:ResourceConstant,raw2:ResourceConstant}
}

// lab合成相关常量信息
export const LabMap:labRawMap = {
    // 基本元素
    'OH':{raw1:'H',raw2:'O'},
    'ZK':{raw1:'Z',raw2:'K'},
    'UL':{raw1:'U',raw2:'L'},
    'G':{raw1:'ZK',raw2:'UL'},
    'GH':{raw1:'G',raw2:'H'},
    'GH2O':{raw1:'GH',raw2:'OH'},
    'XGH2O':{raw1:'GH2O',raw2:'X'},
    'ZO':{raw1:'Z',raw2:'O'},
    'ZHO2':{raw1:'ZO',raw2:'OH'},
    'XZHO2':{raw1:'ZHO2',raw2:'X'},
    'UH':{raw1:'U',raw2:'H'},
    'UH2O':{raw1:'UH',raw2:'OH'},
    'XUH2O':{raw1:'UH2O',raw2:'X'},
    'KH':{raw1:'K',raw2:'H'},
    'KH2O':{raw1:'KH',raw2:'OH'},
    'XKH2O':{raw1:'KH2O',raw2:'X'},
    'KO':{raw1:'K',raw2:'O'},
    'KHO2':{raw1:'KO',raw2:'OH'},
    'XKHO2':{raw1:'KHO2',raw2:'X'},
    'LH':{raw1:'L',raw2:'H'},
    'LH2O':{raw1:'LH',raw2:'OH'},
    'XLH2O':{raw1:'LH2O',raw2:'X'},
    'LO':{raw1:'L',raw2:'O'},
    'LHO2':{raw1:'LO',raw2:'OH'},
    'XLHO2':{raw1:'LHO2',raw2:'X'},
    'GO':{raw1:'G',raw2:'O'},
    'GHO2':{raw1:'GO',raw2:'OH'},
    'XGHO2':{raw1:'GHO2',raw2:'X'},
    'ZH':{raw1:'Z',raw2:'H'},
    'ZH2O':{raw1:'ZH',raw2:'OH'},
    'XZH2O':{raw1:'ZH2O',raw2:'X'},
    'UO':{raw1:'U',raw2:'O'},
    'UHO2':{raw1:'UO',raw2:'OH'},
    'XUHO2':{raw1:'UHO2',raw2:'X'},
}

// 化合物合成顺序 映射
export const ResourceMapData:{source:ResourceConstant,dis:ResourceConstant,map:ResourceConstant[]}[] = [
    /*  */
    {source:'ZK',dis:'G',map:[]},
    {source:'ZK',dis:'GH2O',map:['G','GH',]},
    {source:'ZK',dis:'GHO2',map:['G','GO']},
    {source:'ZK',dis:'XGH2O',map:['G','GH','GH2O']},    
    {source:'ZK',dis:'XGHO2',map:['G','GO','GHO2']},
    {source:'G',dis:'GH2O',map:[]},
    {source:'G',dis:'XGH2O',map:['GH2O','GH']},
    {source:'G',dis:'GHO2',map:[]},
    {source:'G',dis:'XGHO2',map:['GHO2','GO']},
    {source:'GO',dis:'GHO2',map:[]},
    {source:'GO',dis:'XGHO2',map:['GHO2']},
    {source:'GH',dis:'GH2O',map:[]},
    {source:'GH',dis:'XGH2O',map:['GH2O']},
    {source:'GHO2',dis:'XGHO2',map:[]},
    {source:'GH2O',dis:'XGH2O',map:[]},
    {source:'UL',dis:'G',map:[]},
    {source:'UL',dis:'GH2O',map:['G','GH',]},
    {source:'UL',dis:'GHO2',map:['G','GO',]},
    {source:'UL',dis:'XGH2O',map:['G','GH','GH2O']},
    {source:'UL',dis:'XGHO2',map:['G','GO','GHO2']},
    {source:'UH',dis:'UH2O',map:[]},
    {source:'UH',dis:'XUH2O',map:['UH2O',]},
    {source:'UH2O',dis:'XUH2O',map:[]},    
    {source:'UO',dis:'UHO2',map:[]},
    {source:'UO',dis:'XUHO2',map:['UHO2',]},
    {source:'UHO2',dis:'XUHO2',map:[]},
    {source:'KH',dis:'KH2O',map:[]},
    {source:'KH',dis:'XKH2O',map:['KH2O']},
    {source:'KH2O',dis:'XKH2O',map:[]},
    {source:'KO',dis:'KHO2',map:[]},
    {source:'KO',dis:'XKHO2',map:['KHO2',]},
    {source:'KHO2',dis:'XKHO2',map:[]},
    {source:'LH',dis:'LH2O',map:[]},
    {source:'LH',dis:'XLH2O',map:['LH2O']},
    {source:'LH2O',dis:'XLH2O',map:[]},
    {source:'LO',dis:'LHO2',map:[]},
    {source:'LO',dis:'XLHO2',map:['LHO2']},
    {source:'LHO2',dis:'XLHO2',map:[]},
    {source:'ZH',dis:'ZH2O',map:[]},
    {source:'ZH',dis:'XZH2O',map:['ZH2O']},
    {source:'ZH2O',dis:'XZH2O',map:[]},
    {source:'ZO',dis:'ZHO2',map:[]},
    {source:'ZO',dis:'XZHO2',map:['ZHO2']},
    {source:'ZHO2',dis:'XZHO2',map:[]},
    {source:'OH',dis:'GH2O',map:[]},
    {source:'OH',dis:'GHO2',map:[]},
    {source:'OH',dis:'XGH2O',map:['GH2O']},
    {source:'OH',dis:'XGHO2',map:['GHO2']},
    {source:'OH',dis:'UH2O',map:[]},
    {source:'OH',dis:'XUH2O',map:['UH2O']},
    {source:'OH',dis:'UHO2',map:[]},
    {source:'OH',dis:'XUHO2',map:['UHO2']},
    {source:'OH',dis:'LH2O',map:[]},
    {source:'OH',dis:'XLH2O',map:['LH2O']},
    {source:'OH',dis:'LHO2',map:[]},
    {source:'OH',dis:'XLHO2',map:['LHO2']},
    {source:'OH',dis:'KH2O',map:[]},
    {source:'OH',dis:'XKH2O',map:['KH2O']},
    {source:'OH',dis:'KHO2',map:[]},
    {source:'OH',dis:'XKHO2',map:['KHO2']},
    {source:'OH',dis:'ZH2O',map:[]},
    {source:'OH',dis:'XZH2O',map:['ZH2O']},
    {source:'OH',dis:'ZHO2',map:[]},
    {source:'OH',dis:'XZHO2',map:['ZHO2']},
]

// 化合物合成规划数据
export const resourceComDispatch = {
    'G':['ZK','UL','G'],
    'UH':['UH'],
    'UH2O':['UH','OH','UH2O'],
    'XUH2O':['UH','OH','UH2O','XUH2O'],
    'UO':['UO'],
    'UHO2':['UO','OH','UHO2'],
    'XUHO2':['UO','OH','UHO2','XUHO2'],
    'GH':['ZK','UL','G','GH'],
    'GH2O':['ZK','UL','G','GH','OH','GH2O'],
    'XGH2O':['ZK','UL','G','GH','OH','GH2O','XGH2O'],
    'GO':['ZK','UL','G',,'GO'],
    'GHO2':['ZK','UL','G','GO','OH','GHO2'],
    'XGHO2':['ZK','UL','G','GO','OH','GHO2','XGHO2'],
    'LH':['LH'],
    'LH2O':['LH','LH2O'],
    'XLH2O':['LH','OH','LH2O','XLH2O'],
    'LO':['LO'],
    'LHO2':['LO','OH','LHO2'],
    'XLHO2':['LO','OH','LHO2','XLHO2'],
    'KH':['KH'],
    'KH2O':['KH','OH','KH2O'],
    'XKH2O':['KH','OH','KH2O','XKH2O'],
    'KO':['KO'],
    'KHO2':['KO','OH','KHO2'],
    'XKHO2':['KO','OH','KHO2','XKHO2'],
    'ZH':['ZH'],
    'ZH2O':['ZH','OH','ZH2O'],
    'XZH2O':['ZH','OH','ZH2O','XZH2O'],
    'ZO':['ZO'],
    'ZHO2':['ZO','OH','ZHO2'],
    'XZHO2':['ZO','OH','ZHO2','XZHO2'],
    'UL':['UL'],
    'ZK':['ZK'],
    'OH':['OH']
}

export const CompoundColor = {
    'L':'#6cf0a9',
    'LH':'#6cf0a9',
    'LHO2':'#6cf0a9',
    'XLHO2':'#6cf0a9',
    'LH2O':'#6cf0a9',
    'LO':'#6cf0a9',
    'XLH2O':'#6cf0a9',
    'U':'#4ca7e5',
    'UH':'#4ca7e5',
    'UO':'#4ca7e5',
    'UH2O':'#4ca7e5',
    'UHO2':'#4ca7e5',
    'XUH2O':'#4ca7e5',
    'XUHO2':'#4ca7e5',
    'Z':'#f7d492',
    'ZO':'#f7d492',
    'ZH':'#f7d492',
    'ZH2O':'#f7d492',
    'ZHO2':'#f7d492',
    'XZH2O':'#f7d492',
    'XZHO2':'#f7d492',
    'K':'#da6Bf5',
    'KH':'#da6Bf5',
    'KO':'#da6Bf5',
    'KH2O':'#da6Bf5',
    'KHO2':'#da6Bf5',
    'XKH2O':'#da6Bf5',
    'XKHO2':'#da6Bf5',
    'G':'#d9d6c3',
    'GH':'#d9d6c3',
    'GO':'#d9d6c3',
    'GH2O':'#d9d6c3',
    'GHO2':'#d9d6c3',
    'XGH2O':'#d9d6c3',
    'XGHO2':'#d9d6c3',
    'X':'#aa2116',
    'ZK':'#74787c',
    'UL':'#7c8577'
}