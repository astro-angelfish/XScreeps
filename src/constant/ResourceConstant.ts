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