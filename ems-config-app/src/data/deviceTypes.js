// 设备类型数据 - 风光柴储充应用场景
export const deviceCategories = [
  {
    id: 'wind',
    name: '风力发电',
    icon: '🌬️',
    color: '#3b82f6',
    devices: [
      { id: 'wind_turbine', name: '风机', icon: '💨', description: '风力发电机组' },
      { id: 'wind_controller', name: '风机控制器', icon: '🎛️', description: '风机运行控制单元' },
      { id: 'wind_converter', name: '变流器', icon: '⚡', description: '风电变流装置' }
    ]
  },
  {
    id: 'solar',
    name: '光伏发电',
    icon: '☀️',
    color: '#f59e0b',
    devices: [
      { id: 'pv_string', name: '光伏组串', icon: '🔆', description: '光伏电池组件串联' },
      { id: 'pv_inverter', name: '逆变器', icon: '🔌', description: '直流转交流设备' },
      { id: 'pv_combiner', name: '汇流箱', icon: '📦', description: '光伏电流汇集设备' }
    ]
  },
  {
    id: 'diesel',
    name: '柴油发电机',
    icon: '⛽',
    color: '#6b7280',
    devices: [
      { id: 'diesel_generator', name: '柴油机组', icon: '🏭', description: '柴油发电机组' },
      { id: 'ats_switch', name: 'ATS切换开关', icon: '🔀', description: '自动转换开关' }
    ]
  },
  {
    id: 'storage',
    name: '储能系统',
    icon: '🔋',
    color: '#10b981',
    devices: [
      { id: 'battery_cluster', name: '电池簇', icon: '🔋', description: '电池组集群' },
      { id: 'bms', name: 'BMS', icon: '📊', description: '电池管理系统' },
      { id: 'pcs', name: 'PCS', icon: '⚡', description: '储能变流器' }
    ]
  },
  {
    id: 'charger',
    name: '充电桩',
    icon: '🔌',
    color: '#8b5cf6',
    devices: [
      { id: 'ac_charger', name: '交流桩', icon: '🔌', description: '交流充电桩' },
      { id: 'dc_charger', name: '直流桩', icon: '⚡', description: '直流快充桩' },
      { id: 'charger_module', name: '充电模块', icon: '📦', description: '充电功率模块' }
    ]
  },
  {
    id: 'other',
    name: '其他设备',
    icon: '⚙️',
    color: '#06b6d4',
    devices: [
      { id: 'meter', name: '电表', icon: '📊', description: '电能计量表' },
      { id: 'cabinet', name: '配电柜', icon: '🗄️', description: '配电控制柜' },
      { id: 'transformer', name: '变压器', icon: '🔄', description: '电压变换设备' },
      { id: 'ems_controller', name: 'EMS主控', icon: '🖥️', description: 'EMS控制主机' },
      { id: 'load', name: '负载', icon: '💡', description: '用电负载设备' },
      { id: 'grid', name: '电网', icon: '🌐', description: '市电/电网接入点' }
    ]
  }
];

// 协议类型数据
export const protocolTypes = [
  { 
    id: 'modbus_rtu', 
    name: 'Modbus RTU', 
    description: '串口通信协议',
    channelTypes: ['serial'],
    defaultConfig: {
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      slaveAddress: 1,
      timeout: 3000,
      retries: 3,
      reconnectInterval: 5000
    }
  },
  { 
    id: 'modbus_tcp', 
    name: 'Modbus TCP', 
    description: 'TCP/IP通信协议',
    channelTypes: ['ethernet'],
    defaultConfig: {
      port: 502,
      unitId: 1,
      timeout: 3000,
      retries: 3,
      reconnectInterval: 5000
    }
  },
  { 
    id: 'iec61850', 
    name: 'IEC 61850', 
    description: '变电站通信标准',
    channelTypes: ['ethernet'],
    defaultConfig: {
      port: 102,
      timeout: 5000,
      retries: 2,
      reconnectInterval: 10000
    }
  },
  { 
    id: 'can', 
    name: 'CAN总线', 
    description: '控制器局域网络',
    channelTypes: ['can'],
    defaultConfig: {
      baudRate: 250000,
      timeout: 1000,
      retries: 3
    }
  },
  { 
    id: 'dlt645_97', 
    name: 'DL/T 645-1997', 
    description: '电表通信规约(97版)',
    channelTypes: ['serial'],
    defaultConfig: {
      baudRate: 2400,
      dataBits: 8,
      stopBits: 1,
      parity: 'even',
      timeout: 5000,
      retries: 3
    }
  },
  { 
    id: 'dlt645_07', 
    name: 'DL/T 645-2007', 
    description: '电表通信规约(07版)',
    channelTypes: ['serial'],
    defaultConfig: {
      baudRate: 2400,
      dataBits: 8,
      stopBits: 1,
      parity: 'even',
      timeout: 5000,
      retries: 3
    }
  },
  { 
    id: 'iec104', 
    name: 'IEC 104', 
    description: '远动通信规约',
    channelTypes: ['ethernet'],
    defaultConfig: {
      port: 2404,
      timeout: 10000,
      retries: 2,
      reconnectInterval: 30000
    }
  },
  { 
    id: 'opc', 
    name: 'OPC', 
    description: 'OPC DA/UA协议',
    channelTypes: ['ethernet'],
    defaultConfig: {
      port: 4840,
      timeout: 5000,
      retries: 3
    }
  },
  { 
    id: 'private', 
    name: '私有协议', 
    description: '厂商自定义协议',
    channelTypes: ['serial', 'ethernet'],
    defaultConfig: {
      timeout: 3000,
      retries: 3
    }
  }
];

// 通道类型数据
export const channelTypes = [
  {
    id: 'serial',
    name: '串口',
    icon: '📟',
    config: [
      { key: 'port', name: '串口号', type: 'select', options: ['COM1', 'COM2', 'COM3', 'COM4', '/dev/ttyS0', '/dev/ttyS1', '/dev/ttyUSB0'] },
      { key: 'baudRate', name: '波特率', type: 'select', options: [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200] },
      { key: 'dataBits', name: '数据位', type: 'select', options: [7, 8] },
      { key: 'stopBits', name: '停止位', type: 'select', options: [1, 2] },
      { key: 'parity', name: '校验位', type: 'select', options: ['none', 'odd', 'even'] }
    ]
  },
  {
    id: 'ethernet',
    name: '网口',
    icon: '🌐',
    config: [
      { key: 'ip', name: 'IP地址', type: 'text', placeholder: '192.168.1.100' },
      { key: 'port', name: '端口号', type: 'number', placeholder: '502' },
      { key: 'gateway', name: '网关', type: 'text', placeholder: '192.168.1.1' },
      { key: 'subnet', name: '子网掩码', type: 'text', placeholder: '255.255.255.0' }
    ]
  },
  {
    id: '4g',
    name: '4G模块',
    icon: '📡',
    config: [
      { key: 'apn', name: 'APN', type: 'text', placeholder: 'cmnet' },
      { key: 'simCard', name: 'SIM卡号', type: 'text', placeholder: '' },
      { key: 'serverIp', name: '服务器IP', type: 'text', placeholder: '' },
      { key: 'serverPort', name: '服务器端口', type: 'number', placeholder: '8080' }
    ]
  },
  {
    id: 'can',
    name: 'CAN总线',
    icon: '🔗',
    config: [
      { key: 'channel', name: '通道号', type: 'select', options: ['CAN0', 'CAN1'] },
      { key: 'baudRate', name: '波特率', type: 'select', options: [125000, 250000, 500000, 1000000] },
      { key: 'canId', name: 'CAN ID', type: 'text', placeholder: '0x001' }
    ]
  }
];

// 告警级别
export const alarmLevels = [
  { id: 'info', name: '提示', color: '#3b82f6', icon: 'ℹ️' },
  { id: 'warning', name: '警告', color: '#f59e0b', icon: '⚠️' },
  { id: 'error', name: '错误', color: '#ef4444', icon: '❌' },
  { id: 'critical', name: '严重', color: '#dc2626', icon: '🚨' }
];

// 告警通知方式
export const notificationMethods = [
  { id: 'sound', name: '声光报警', icon: '🔔' },
  { id: 'popup', name: '屏幕弹窗', icon: '💻' },
  { id: 'email', name: '邮件通知', icon: '📧' },
  { id: 'sms', name: '短信通知', icon: '📱' },
  { id: 'wechat', name: '微信推送', icon: '💬' }
];

// 预设告警规则模板
export const defaultAlarmRules = {
  pcs: [
    { name: '过压告警', condition: 'voltage > threshold', threshold: 10500, unit: 'V', level: 'warning' },
    { name: '欠压告警', condition: 'voltage < threshold', threshold: 9500, unit: 'V', level: 'warning' },
    { name: '过流告警', condition: 'current > threshold', threshold: 600, unit: 'A', level: 'error' },
    { name: '过温告警', condition: 'temperature > threshold', threshold: 85, unit: '°C', level: 'error' },
    { name: '通信中断', condition: 'offline_time > threshold', threshold: 30, unit: 's', level: 'critical' }
  ],
  bms: [
    { name: '电池过压', condition: 'cell_voltage > threshold', threshold: 3.65, unit: 'V', level: 'warning' },
    { name: '电池欠压', condition: 'cell_voltage < threshold', threshold: 2.5, unit: 'V', level: 'error' },
    { name: 'SOC过低', condition: 'soc < threshold', threshold: 10, unit: '%', level: 'warning' },
    { name: '温度过高', condition: 'temperature > threshold', threshold: 50, unit: '°C', level: 'error' },
    { name: '温差过大', condition: 'temp_diff > threshold', threshold: 5, unit: '°C', level: 'warning' }
  ],
  pv_inverter: [
    { name: '直流过压', condition: 'dc_voltage > threshold', threshold: 850, unit: 'V', level: 'warning' },
    { name: '交流过压', condition: 'ac_voltage > threshold', threshold: 270, unit: 'V', level: 'warning' },
    { name: '过温停机', condition: 'temperature > threshold', threshold: 80, unit: '°C', level: 'critical' },
    { name: '绝缘故障', condition: 'insulation_resistance < threshold', threshold: 100, unit: 'kΩ', level: 'error' }
  ],
  meter: [
    { name: '电压异常', condition: 'voltage_deviation > threshold', threshold: 10, unit: '%', level: 'warning' },
    { name: '功率因数低', condition: 'power_factor < threshold', threshold: 0.85, unit: '', level: 'info' },
    { name: '需量超限', condition: 'demand > threshold', threshold: 1000, unit: 'kW', level: 'warning' }
  ]
};

// 北向接口协议
export const northboundProtocols = [
  { id: 'mqtt', name: 'MQTT', description: '轻量级消息队列协议', port: 1883 },
  { id: 'http', name: 'HTTP/REST', description: 'RESTful API接口', port: 8080 },
  { id: 'websocket', name: 'WebSocket', description: '双向实时通信', port: 8081 },
  { id: 'iec104_server', name: 'IEC 104服务端', description: '电力调度通信', port: 2404 },
  { id: 'modbus_tcp_server', name: 'Modbus TCP服务端', description: 'Modbus从站服务', port: 502 }
];

// 厂商列表
export const manufacturers = [
  '华为', '阳光电源', '科华数据', '比亚迪', '宁德时代', 
  '南都电源', '派能科技', '科陆电子', '固德威', '锦浪科技',
  '特变电工', '通威股份', '正泰电器', '许继电气', '国电南瑞',
  '金风科技', '远景能源', '明阳智能', '运达股份', '电气风电',
  'ABB', '施耐德', '西门子', 'GE', '其他'
];

// 电压等级
export const voltageLevels = [
  { id: '220v', name: '220V', description: '单相低压' },
  { id: '380v', name: '380V', description: '三相低压' },
  { id: '10kv', name: '10kV', description: '中压' },
  { id: '35kv', name: '35kV', description: '高压' },
  { id: '110kv', name: '110kV', description: '超高压' }
];

// 示例点表数据
export const samplePointTables = {
  modbus_pcs: [
    { address: 0, name: 'PCS运行状态', type: 'uint16', rw: 'R', description: '0-停机 1-运行 2-故障' },
    { address: 1, name: 'PCS运行模式', type: 'uint16', rw: 'RW', description: '0-待机 1-充电 2-放电' },
    { address: 2, name: '直流电压', type: 'float32', rw: 'R', description: '单位:V', factor: 0.1 },
    { address: 4, name: '直流电流', type: 'float32', rw: 'R', description: '单位:A', factor: 0.1 },
    { address: 6, name: '有功功率', type: 'float32', rw: 'R', description: '单位:kW', factor: 0.1 },
    { address: 8, name: '无功功率', type: 'float32', rw: 'R', description: '单位:kVar', factor: 0.1 },
    { address: 10, name: '功率设定值', type: 'float32', rw: 'RW', description: '单位:kW', factor: 0.1 },
    { address: 12, name: 'A相电压', type: 'float32', rw: 'R', description: '单位:V', factor: 0.1 },
    { address: 14, name: 'B相电压', type: 'float32', rw: 'R', description: '单位:V', factor: 0.1 },
    { address: 16, name: 'C相电压', type: 'float32', rw: 'R', description: '单位:V', factor: 0.1 },
    { address: 18, name: 'A相电流', type: 'float32', rw: 'R', description: '单位:A', factor: 0.01 },
    { address: 20, name: 'B相电流', type: 'float32', rw: 'R', description: '单位:A', factor: 0.01 },
    { address: 22, name: 'C相电流', type: 'float32', rw: 'R', description: '单位:A', factor: 0.01 },
    { address: 24, name: 'IGBT温度', type: 'int16', rw: 'R', description: '单位:°C', factor: 0.1 },
    { address: 25, name: '环境温度', type: 'int16', rw: 'R', description: '单位:°C', factor: 0.1 }
  ],
  modbus_bms: [
    { address: 0, name: 'BMS系统状态', type: 'uint16', rw: 'R', description: '0-停机 1-运行 2-故障' },
    { address: 1, name: '充放电状态', type: 'uint16', rw: 'R', description: '0-静置 1-充电 2-放电' },
    { address: 2, name: '系统SOC', type: 'uint16', rw: 'R', description: '单位:%', factor: 0.1 },
    { address: 3, name: '系统SOH', type: 'uint16', rw: 'R', description: '单位:%', factor: 0.1 },
    { address: 4, name: '总电压', type: 'float32', rw: 'R', description: '单位:V', factor: 0.1 },
    { address: 6, name: '总电流', type: 'float32', rw: 'R', description: '单位:A', factor: 0.1 },
    { address: 8, name: '最高单体电压', type: 'uint16', rw: 'R', description: '单位:mV' },
    { address: 9, name: '最低单体电压', type: 'uint16', rw: 'R', description: '单位:mV' },
    { address: 10, name: '最高温度', type: 'int16', rw: 'R', description: '单位:°C', factor: 0.1 },
    { address: 11, name: '最低温度', type: 'int16', rw: 'R', description: '单位:°C', factor: 0.1 },
    { address: 12, name: '绝缘电阻', type: 'uint16', rw: 'R', description: '单位:kΩ' },
    { address: 13, name: '充电允许标志', type: 'uint16', rw: 'R', description: '0-禁止 1-允许' },
    { address: 14, name: '放电允许标志', type: 'uint16', rw: 'R', description: '0-禁止 1-允许' }
  ],
  modbus_meter: [
    { address: 0, name: 'A相电压', type: 'float32', rw: 'R', description: '单位:V', factor: 0.1 },
    { address: 2, name: 'B相电压', type: 'float32', rw: 'R', description: '单位:V', factor: 0.1 },
    { address: 4, name: 'C相电压', type: 'float32', rw: 'R', description: '单位:V', factor: 0.1 },
    { address: 6, name: 'A相电流', type: 'float32', rw: 'R', description: '单位:A', factor: 0.01 },
    { address: 8, name: 'B相电流', type: 'float32', rw: 'R', description: '单位:A', factor: 0.01 },
    { address: 10, name: 'C相电流', type: 'float32', rw: 'R', description: '单位:A', factor: 0.01 },
    { address: 12, name: '有功功率', type: 'float32', rw: 'R', description: '单位:kW', factor: 0.001 },
    { address: 14, name: '无功功率', type: 'float32', rw: 'R', description: '单位:kVar', factor: 0.001 },
    { address: 16, name: '功率因数', type: 'float32', rw: 'R', description: '', factor: 0.001 },
    { address: 18, name: '频率', type: 'float32', rw: 'R', description: '单位:Hz', factor: 0.01 },
    { address: 20, name: '正向有功电能', type: 'float32', rw: 'R', description: '单位:kWh', factor: 0.01 },
    { address: 22, name: '反向有功电能', type: 'float32', rw: 'R', description: '单位:kWh', factor: 0.01 }
  ],
  modbus_inverter: [
    { address: 0, name: '逆变器状态', type: 'uint16', rw: 'R', description: '0-停机 1-运行 2-故障 3-待机' },
    { address: 1, name: '发电功率', type: 'float32', rw: 'R', description: '单位:kW', factor: 0.1 },
    { address: 3, name: '日发电量', type: 'float32', rw: 'R', description: '单位:kWh', factor: 0.1 },
    { address: 5, name: '累计发电量', type: 'float32', rw: 'R', description: '单位:MWh', factor: 0.1 },
    { address: 7, name: 'PV1电压', type: 'float32', rw: 'R', description: '单位:V', factor: 0.1 },
    { address: 9, name: 'PV1电流', type: 'float32', rw: 'R', description: '单位:A', factor: 0.1 },
    { address: 11, name: 'PV2电压', type: 'float32', rw: 'R', description: '单位:V', factor: 0.1 },
    { address: 13, name: 'PV2电流', type: 'float32', rw: 'R', description: '单位:A', factor: 0.1 },
    { address: 15, name: '机内温度', type: 'int16', rw: 'R', description: '单位:°C', factor: 0.1 },
    { address: 16, name: '电网频率', type: 'float32', rw: 'R', description: '单位:Hz', factor: 0.01 }
  ]
};

// 算法策略参数默认值（参考EMS核心算法设计说明书）
export const algorithmDefaults = {
  // 削峰填谷策略
  peakShaving: {
    enabled: true,
    peakPeriods: [
      { name: '早高峰', startTime: '08:00', endTime: '11:00', action: 'discharge', maxPower: 500 },
      { name: '午高峰', startTime: '14:00', endTime: '17:00', action: 'discharge', maxPower: 500 },
      { name: '晚高峰', startTime: '19:00', endTime: '22:00', action: 'discharge', maxPower: 500 }
    ],
    valleyPeriods: [
      { name: '谷电时段', startTime: '23:00', endTime: '07:00', action: 'charge', maxPower: 300 }
    ],
    flatPeriods: [
      { name: '平段1', startTime: '07:00', endTime: '08:00', action: 'standby', maxPower: 0 },
      { name: '平段2', startTime: '11:00', endTime: '14:00', action: 'standby', maxPower: 0 },
      { name: '平段3', startTime: '17:00', endTime: '19:00', action: 'standby', maxPower: 0 },
      { name: '平段4', startTime: '22:00', endTime: '23:00', action: 'standby', maxPower: 0 }
    ]
  },
  // 需量控制策略
  demandControl: {
    enabled: true,
    demandLimit: 1000, // kW
    warningThreshold: 85, // %
    actionThreshold: 95, // %
    responseTime: 30, // 秒
    controlMode: 'auto', // auto/manual
    priorityList: ['非关键负载', '空调系统', '照明系统']
  },
  // SOC管理策略
  socManagement: {
    minSoc: 10, // %
    maxSoc: 95, // %
    targetSoc: 50, // %
    emergencyReserve: 20, // %
    chargingCurve: [
      { socRange: '10-20%', cRate: 0.5 },
      { socRange: '20-80%', cRate: 1.0 },
      { socRange: '80-95%', cRate: 0.3 }
    ],
    dischargingCurve: [
      { socRange: '95-80%', cRate: 1.0 },
      { socRange: '80-20%', cRate: 1.0 },
      { socRange: '20-10%', cRate: 0.5 }
    ]
  },
  // 功率控制策略
  powerControl: {
    rampRate: 100, // kW/min
    maxChargePower: 500, // kW
    maxDischargePower: 500, // kW
    powerFactor: 0.95,
    voltageRegulation: {
      enabled: true,
      targetVoltage: 380, // V
      deadband: 5, // %
      responseTime: 100 // ms
    },
    frequencyRegulation: {
      enabled: false,
      deadband: 0.1, // Hz
      droop: 4 // %
    }
  },
  // 经济优化策略
  economicOptimization: {
    enabled: true,
    electricityPrice: {
      peak: 1.2,
      flat: 0.8,
      valley: 0.4
    },
    targetMode: 'cost_minimize', // cost_minimize / revenue_maximize / self_consumption
    forecastEnabled: true,
    optimizationPeriod: 24 // 小时
  }
};

// 虚拟点规则模板
export const virtualPointRules = [
  {
    id: 'vp_total_power',
    name: '系统总功率',
    formula: 'SUM(pcs_power) + SUM(inverter_power) - SUM(load_power)',
    description: '计算系统总功率',
    unit: 'kW'
  },
  {
    id: 'vp_self_consumption',
    name: '自发自用率',
    formula: '(total_generation - grid_export) / total_generation * 100',
    description: '计算光伏自发自用比例',
    unit: '%'
  },
  {
    id: 'vp_system_efficiency',
    name: '系统效率',
    formula: 'output_energy / input_energy * 100',
    description: '计算储能系统效率',
    unit: '%'
  },
  {
    id: 'vp_carbon_reduction',
    name: '减碳量',
    formula: 'green_energy * 0.785',
    description: '根据绿色发电量计算减碳量',
    unit: 'kg'
  }
];
