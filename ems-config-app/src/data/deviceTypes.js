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
  },
  {
    id: 'environment',
    name: '动环监控',
    icon: '🌡️',
    color: '#16a34a',
    devices: [
      { id: 'temp_sensor', name: '温度传感器', icon: '🌡️', description: '环境温度监测' },
      { id: 'humidity_sensor', name: '湿度传感器', icon: '💧', description: '环境湿度监测' },
      { id: 'water_sensor', name: '水浸传感器', icon: '💦', description: '水浸检测报警' },
      { id: 'smoke_sensor', name: '烟感探测器', icon: '💨', description: '烟雾检测报警' },
      { id: 'door_sensor', name: '门磁传感器', icon: '🚪', description: '门禁状态监测' },
      { id: 'ac_unit', name: '空调', icon: '❄️', description: '温控空调设备' },
      { id: 'fan', name: '风机', icon: '🌀', description: '通风散热风机' },
      { id: 'ups', name: 'UPS', icon: '🔌', description: '不间断电源' }
    ]
  },
  {
    id: 'fire',
    name: '消防系统',
    icon: '🧯',
    color: '#dc2626',
    devices: [
      { id: 'fire_alarm_panel', name: '消防主机', icon: '🚨', description: '火灾报警控制器' },
      { id: 'fire_detector', name: '火灾探测器', icon: '🔥', description: '火灾探测设备' },
      { id: 'gas_suppression', name: '气体灭火', icon: '🧯', description: '七氟丙烷/IG541灭火系统' },
      { id: 'water_spray', name: '水喷淋', icon: '🚿', description: '水喷淋灭火系统' },
      { id: 'exhaust_fan', name: '排烟风机', icon: '🌬️', description: '消防排烟设备' },
      { id: 'emergency_light', name: '应急照明', icon: '💡', description: '消防应急照明' },
      { id: 'fire_door', name: '防火门', icon: '🚪', description: '防火门监控' }
    ]
  },
  {
    id: 'custom',
    name: '自定义设备',
    icon: '🔧',
    color: '#6366f1',
    devices: [
      { id: 'custom_device', name: '自定义设备', icon: '🔧', description: '用户自定义设备类型' },
      { id: 'custom_sensor', name: '自定义传感器', icon: '📡', description: '用户自定义传感器' },
      { id: 'custom_controller', name: '自定义控制器', icon: '🎛️', description: '用户自定义控制器' }
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

// 厂商列表 - 通用
export const manufacturers = [
  '华为', '阳光电源', '科华数据', '比亚迪', '宁德时代', 
  '南都电源', '派能科技', '科陆电子', '固德威', '锦浪科技',
  '特变电工', '通威股份', '正泰电器', '许继电气', '国电南瑞',
  '金风科技', '远景能源', '明阳智能', '运达股份', '电气风电',
  'ABB', '施耐德', '西门子', 'GE', '其他'
];

// 按设备分类的厂商列表
export const manufacturersByCategory = {
  wind: ['金风科技', '远景能源', '明阳智能', '运达股份', '电气风电', 'GE', '西门子', 'Vestas', '其他'],
  solar: ['华为', '阳光电源', '固德威', '锦浪科技', '特变电工', '通威股份', '隆基绿能', '晶科能源', '天合光能', 'SMA', '其他'],
  diesel: ['康明斯', '卡特彼勒', '沃尔沃', '珀金斯', '玉柴', '潍柴', '上柴', '中国重汽', '其他'],
  storage: ['宁德时代', '比亚迪', '阳光电源', '科华数据', '南都电源', '派能科技', '海辰储能', '亿纬锂能', 'LG新能源', '三星SDI', '其他'],
  charger: ['特来电', '星星充电', '国家电网', '南方电网', '普天新能源', '万马新能源', 'ABB', '西门子', '其他'],
  other: ['正泰电器', '许继电气', '国电南瑞', 'ABB', '施耐德', '西门子', '威胜集团', '海兴电力', '其他'],
  environment: ['海康威视', '大华科技', '施耐德', 'ABB', '霍尼韦尔', '西门子', '艾默生', '维谛技术', '科华数据', '英维克', '其他'],
  fire: ['海湾安全', '青鸟消防', '首安工业', '泰科消防', '霍尼韦尔', '久远银海', '依爱消防', '中消云', '其他'],
  custom: ['自定义厂商', '其他']
};

// 电压等级 - 通用（交流）
export const voltageLevels = [
  { id: '220v', name: '220V', description: '单相低压', type: 'ac' },
  { id: '380v', name: '380V', description: '三相低压', type: 'ac' },
  { id: '10kv', name: '10kV', description: '中压', type: 'ac' },
  { id: '35kv', name: '35kV', description: '高压', type: 'ac' },
  { id: '110kv', name: '110kV', description: '超高压', type: 'ac' }
];

// 按设备类型的电压等级
export const voltageLevelsByDevice = {
  // 电池簇/BMS - 直流电压
  battery_cluster: [
    { id: 'dc48v', name: 'DC 48V', description: '低压直流', type: 'dc' },
    { id: 'dc96v', name: 'DC 96V', description: '低压直流', type: 'dc' },
    { id: 'dc192v', name: 'DC 192V', description: '中压直流', type: 'dc' },
    { id: 'dc384v', name: 'DC 384V', description: '中压直流', type: 'dc' },
    { id: 'dc512v', name: 'DC 512V', description: '高压直流', type: 'dc' },
    { id: 'dc600v', name: 'DC 600V', description: '高压直流', type: 'dc' },
    { id: 'dc750v', name: 'DC 750V', description: '高压直流', type: 'dc' },
    { id: 'dc1000v', name: 'DC 1000V', description: '高压直流', type: 'dc' },
    { id: 'dc1500v', name: 'DC 1500V', description: '超高压直流', type: 'dc' }
  ],
  bms: [
    { id: 'dc48v', name: 'DC 48V', description: '低压直流', type: 'dc' },
    { id: 'dc96v', name: 'DC 96V', description: '低压直流', type: 'dc' },
    { id: 'dc192v', name: 'DC 192V', description: '中压直流', type: 'dc' },
    { id: 'dc384v', name: 'DC 384V', description: '中压直流', type: 'dc' },
    { id: 'dc512v', name: 'DC 512V', description: '高压直流', type: 'dc' },
    { id: 'dc600v', name: 'DC 600V', description: '高压直流', type: 'dc' },
    { id: 'dc750v', name: 'DC 750V', description: '高压直流', type: 'dc' },
    { id: 'dc1000v', name: 'DC 1000V', description: '高压直流', type: 'dc' },
    { id: 'dc1500v', name: 'DC 1500V', description: '超高压直流', type: 'dc' }
  ],
  // 直流充电桩 - 直流输出
  dc_charger: [
    { id: 'dc200v', name: 'DC 200V', description: '直流输出', type: 'dc' },
    { id: 'dc400v', name: 'DC 400V', description: '直流输出', type: 'dc' },
    { id: 'dc500v', name: 'DC 500V', description: '直流输出', type: 'dc' },
    { id: 'dc750v', name: 'DC 750V', description: '直流输出', type: 'dc' },
    { id: 'dc1000v', name: 'DC 1000V', description: '直流输出', type: 'dc' }
  ],
  charger_module: [
    { id: 'dc200v', name: 'DC 200V', description: '直流输出', type: 'dc' },
    { id: 'dc500v', name: 'DC 500V', description: '直流输出', type: 'dc' },
    { id: 'dc750v', name: 'DC 750V', description: '直流输出', type: 'dc' },
    { id: 'dc1000v', name: 'DC 1000V', description: '直流输出', type: 'dc' }
  ],
  // 光伏组串 - 直流电压
  pv_string: [
    { id: 'dc600v', name: 'DC 600V', description: '低压直流', type: 'dc' },
    { id: 'dc1000v', name: 'DC 1000V', description: '高压直流', type: 'dc' },
    { id: 'dc1100v', name: 'DC 1100V', description: '高压直流', type: 'dc' },
    { id: 'dc1500v', name: 'DC 1500V', description: '超高压直流', type: 'dc' }
  ],
  // PCS - 交直流两侧
  pcs: [
    { id: '380v', name: '380V AC', description: '三相交流侧', type: 'ac' },
    { id: '10kv', name: '10kV AC', description: '中压交流侧', type: 'ac' },
    { id: '35kv', name: '35kV AC', description: '高压交流侧', type: 'ac' }
  ],
  // 逆变器 - 交流侧
  pv_inverter: [
    { id: '220v', name: '220V', description: '单相低压', type: 'ac' },
    { id: '380v', name: '380V', description: '三相低压', type: 'ac' },
    { id: '10kv', name: '10kV', description: '中压', type: 'ac' }
  ],
  // 交流桩 - 交流
  ac_charger: [
    { id: '220v', name: 'AC 220V', description: '单相交流', type: 'ac' },
    { id: '380v', name: 'AC 380V', description: '三相交流', type: 'ac' }
  ],
  // 变压器 - 多电压等级
  transformer: [
    { id: '380v_10kv', name: '380V/10kV', description: '低压/中压', type: 'ac' },
    { id: '10kv_35kv', name: '10kV/35kV', description: '中压/高压', type: 'ac' },
    { id: '35kv_110kv', name: '35kV/110kV', description: '高压/超高压', type: 'ac' }
  ],
  // 默认交流设备
  default: [
    { id: '220v', name: '220V', description: '单相低压', type: 'ac' },
    { id: '380v', name: '380V', description: '三相低压', type: 'ac' },
    { id: '10kv', name: '10kV', description: '中压', type: 'ac' },
    { id: '35kv', name: '35kV', description: '高压', type: 'ac' },
    { id: '110kv', name: '110kV', description: '超高压', type: 'ac' }
  ]
};

// 设备特定的基础属性配置
export const deviceBasicAttributes = {
  // 电池簇
  battery_cluster: [
    { key: 'capacity', name: '电池容量', unit: 'kWh', type: 'number', default: 100 },
    { key: 'cellCount', name: '电芯数量', unit: '个', type: 'number', default: 16 },
    { key: 'moduleCount', name: '模组数量', unit: '个', type: 'number', default: 8 },
    { key: 'nominalVoltage', name: '标称电压', unit: 'V', type: 'number', default: 512 },
    { key: 'maxChargeCurrent', name: '最大充电电流', unit: 'A', type: 'number', default: 100 },
    { key: 'maxDischargeCurrent', name: '最大放电电流', unit: 'A', type: 'number', default: 100 },
    { key: 'cellType', name: '电芯类型', unit: '', type: 'select', options: ['磷酸铁锂', '三元锂', '钠离子', '铅酸'], default: '磷酸铁锂' }
  ],
  // BMS
  bms: [
    { key: 'maxVoltage', name: '最高工作电压', unit: 'V', type: 'number', default: 600 },
    { key: 'minVoltage', name: '最低工作电压', unit: 'V', type: 'number', default: 400 },
    { key: 'maxCurrent', name: '最大工作电流', unit: 'A', type: 'number', default: 200 },
    { key: 'stringCount', name: '电池串数', unit: '串', type: 'number', default: 16 },
    { key: 'tempSensorCount', name: '温度传感器数量', unit: '个', type: 'number', default: 4 },
    { key: 'balanceMode', name: '均衡模式', unit: '', type: 'select', options: ['主动均衡', '被动均衡', '无均衡'], default: '被动均衡' }
  ],
  // PCS
  pcs: [
    { key: 'ratedPower', name: '额定功率', unit: 'kW', type: 'number', default: 500 },
    { key: 'maxPower', name: '最大功率', unit: 'kW', type: 'number', default: 550 },
    { key: 'dcVoltageRange', name: '直流电压范围', unit: 'V', type: 'text', default: '480-850' },
    { key: 'acVoltage', name: '交流电压', unit: 'V', type: 'number', default: 380 },
    { key: 'efficiency', name: '转换效率', unit: '%', type: 'number', default: 98.5 },
    { key: 'coolingType', name: '散热方式', unit: '', type: 'select', options: ['风冷', '液冷', '自然散热'], default: '风冷' }
  ],
  // 光伏逆变器
  pv_inverter: [
    { key: 'ratedPower', name: '额定功率', unit: 'kW', type: 'number', default: 100 },
    { key: 'maxInputVoltage', name: '最大输入电压', unit: 'V', type: 'number', default: 1100 },
    { key: 'mpptCount', name: 'MPPT路数', unit: '路', type: 'number', default: 6 },
    { key: 'stringPerMppt', name: '每MPPT组串数', unit: '串', type: 'number', default: 2 },
    { key: 'efficiency', name: '最高效率', unit: '%', type: 'number', default: 98.8 },
    { key: 'acFrequency', name: '电网频率', unit: 'Hz', type: 'select', options: ['50', '60', '50/60自适应'], default: '50' }
  ],
  // 直流充电桩
  dc_charger: [
    { key: 'ratedPower', name: '额定功率', unit: 'kW', type: 'number', default: 120 },
    { key: 'outputVoltage', name: '输出电压范围', unit: 'V', type: 'text', default: '200-750' },
    { key: 'maxCurrent', name: '最大输出电流', unit: 'A', type: 'number', default: 250 },
    { key: 'gunCount', name: '充电枪数量', unit: '个', type: 'number', default: 2 },
    { key: 'connectorType', name: '接口类型', unit: '', type: 'select', options: ['国标', 'CCS1', 'CCS2', 'CHAdeMO'], default: '国标' }
  ],
  // 交流充电桩
  ac_charger: [
    { key: 'ratedPower', name: '额定功率', unit: 'kW', type: 'number', default: 7 },
    { key: 'ratedCurrent', name: '额定电流', unit: 'A', type: 'number', default: 32 },
    { key: 'phase', name: '相数', unit: '', type: 'select', options: ['单相', '三相'], default: '单相' },
    { key: 'gunCount', name: '充电枪数量', unit: '个', type: 'number', default: 1 }
  ],
  // 电表
  meter: [
    { key: 'accuracy', name: '精度等级', unit: '级', type: 'select', options: ['0.2S', '0.5S', '1.0', '2.0'], default: '0.5S' },
    { key: 'ctRatio', name: '电流互感器变比', unit: '', type: 'text', default: '100/5' },
    { key: 'ptRatio', name: '电压互感器变比', unit: '', type: 'text', default: '10000/100' },
    { key: 'ratedVoltage', name: '额定电压', unit: 'V', type: 'number', default: 380 },
    { key: 'ratedCurrent', name: '额定电流', unit: 'A', type: 'number', default: 5 }
  ],
  // 风机
  wind_turbine: [
    { key: 'ratedPower', name: '额定功率', unit: 'kW', type: 'number', default: 2000 },
    { key: 'rotorDiameter', name: '叶轮直径', unit: 'm', type: 'number', default: 100 },
    { key: 'hubHeight', name: '轮毂高度', unit: 'm', type: 'number', default: 80 },
    { key: 'cutInSpeed', name: '切入风速', unit: 'm/s', type: 'number', default: 3 },
    { key: 'ratedSpeed', name: '额定风速', unit: 'm/s', type: 'number', default: 11 },
    { key: 'cutOutSpeed', name: '切出风速', unit: 'm/s', type: 'number', default: 25 }
  ],
  // 风机控制器
  wind_controller: [
    { key: 'controlMode', name: '控制模式', unit: '', type: 'select', options: ['变桨控制', '变速控制', '失速控制'], default: '变桨控制' },
    { key: 'pitchAngleRange', name: '桨距角范围', unit: '°', type: 'text', default: '0-90' },
    { key: 'yawSpeed', name: '偏航速度', unit: '°/s', type: 'number', default: 0.5 },
    { key: 'responseTime', name: '响应时间', unit: 'ms', type: 'number', default: 100 }
  ],
  // 风电变流器
  wind_converter: [
    { key: 'ratedPower', name: '额定功率', unit: 'kW', type: 'number', default: 2000 },
    { key: 'inputVoltage', name: '输入电压范围', unit: 'V', type: 'text', default: '400-900' },
    { key: 'outputVoltage', name: '输出电压', unit: 'V', type: 'number', default: 690 },
    { key: 'efficiency', name: '转换效率', unit: '%', type: 'number', default: 97 },
    { key: 'coolingType', name: '冷却方式', unit: '', type: 'select', options: ['风冷', '液冷'], default: '液冷' }
  ],
  // 光伏组串
  pv_string: [
    { key: 'moduleCount', name: '组件数量', unit: '块', type: 'number', default: 22 },
    { key: 'moduleType', name: '组件类型', unit: '', type: 'select', options: ['单晶硅', '多晶硅', '薄膜'], default: '单晶硅' },
    { key: 'modulePower', name: '单块功率', unit: 'Wp', type: 'number', default: 550 },
    { key: 'openCircuitVoltage', name: '开路电压', unit: 'V', type: 'number', default: 49.5 },
    { key: 'shortCircuitCurrent', name: '短路电流', unit: 'A', type: 'number', default: 14.0 },
    { key: 'mppVoltage', name: '最大功率点电压', unit: 'V', type: 'number', default: 41.5 },
    { key: 'mppCurrent', name: '最大功率点电流', unit: 'A', type: 'number', default: 13.3 }
  ],
  // 汇流箱
  pv_combiner: [
    { key: 'inputChannels', name: '输入路数', unit: '路', type: 'number', default: 16 },
    { key: 'maxInputCurrent', name: '单路最大电流', unit: 'A', type: 'number', default: 15 },
    { key: 'maxInputVoltage', name: '最大输入电压', unit: 'V', type: 'number', default: 1500 },
    { key: 'outputCurrent', name: '输出电流', unit: 'A', type: 'number', default: 240 },
    { key: 'hasFuse', name: '熔断器', unit: '', type: 'select', options: ['有', '无'], default: '有' },
    { key: 'hasAntiReverse', name: '防逆流', unit: '', type: 'select', options: ['有', '无'], default: '有' },
    { key: 'hasSurgeProtection', name: '防雷保护', unit: '', type: 'select', options: ['有', '无'], default: '有' }
  ],
  // 柴油发电机组
  diesel_generator: [
    { key: 'ratedPower', name: '额定功率', unit: 'kW', type: 'number', default: 500 },
    { key: 'standbyPower', name: '备用功率', unit: 'kW', type: 'number', default: 550 },
    { key: 'ratedVoltage', name: '额定电压', unit: 'V', type: 'number', default: 400 },
    { key: 'ratedFrequency', name: '额定频率', unit: 'Hz', type: 'select', options: ['50', '60'], default: '50' },
    { key: 'phase', name: '相数', unit: '', type: 'select', options: ['单相', '三相'], default: '三相' },
    { key: 'fuelConsumption', name: '油耗', unit: 'L/h', type: 'number', default: 120 },
    { key: 'tankCapacity', name: '油箱容量', unit: 'L', type: 'number', default: 500 },
    { key: 'engineBrand', name: '发动机品牌', unit: '', type: 'text', default: '' },
    { key: 'startMode', name: '启动方式', unit: '', type: 'select', options: ['电启动', '手动启动', '自动启动'], default: '自动启动' }
  ],
  // ATS切换开关
  ats_switch: [
    { key: 'ratedCurrent', name: '额定电流', unit: 'A', type: 'number', default: 630 },
    { key: 'ratedVoltage', name: '额定电压', unit: 'V', type: 'number', default: 400 },
    { key: 'poleCount', name: '极数', unit: 'P', type: 'select', options: ['3P', '4P'], default: '4P' },
    { key: 'transferTime', name: '转换时间', unit: 's', type: 'number', default: 0.3 },
    { key: 'atsType', name: 'ATS类型', unit: '', type: 'select', options: ['CB级', 'PC级'], default: 'PC级' },
    { key: 'controlMode', name: '控制模式', unit: '', type: 'select', options: ['自动', '手动', '自动+手动'], default: '自动+手动' }
  ],
  // 充电模块
  charger_module: [
    { key: 'ratedPower', name: '额定功率', unit: 'kW', type: 'number', default: 30 },
    { key: 'outputVoltage', name: '输出电压范围', unit: 'V', type: 'text', default: '200-1000' },
    { key: 'maxCurrent', name: '最大输出电流', unit: 'A', type: 'number', default: 50 },
    { key: 'efficiency', name: '转换效率', unit: '%', type: 'number', default: 95 },
    { key: 'powerFactor', name: '功率因数', unit: '', type: 'number', default: 0.99 }
  ],
  // 配电柜
  cabinet: [
    { key: 'ratedVoltage', name: '额定电压', unit: 'V', type: 'number', default: 400 },
    { key: 'ratedCurrent', name: '额定电流', unit: 'A', type: 'number', default: 3150 },
    { key: 'shortCircuitCurrent', name: '短路耐受电流', unit: 'kA', type: 'number', default: 50 },
    { key: 'cabinetType', name: '柜型', unit: '', type: 'select', options: ['GGD', 'GCK', 'GCS', 'MNS', 'Blokset'], default: 'GCS' },
    { key: 'incomingCount', name: '进线回路数', unit: '路', type: 'number', default: 1 },
    { key: 'outgoingCount', name: '出线回路数', unit: '路', type: 'number', default: 8 }
  ],
  // 变压器
  transformer: [
    { key: 'ratedCapacity', name: '额定容量', unit: 'kVA', type: 'number', default: 1000 },
    { key: 'primaryVoltage', name: '一次电压', unit: 'kV', type: 'number', default: 10 },
    { key: 'secondaryVoltage', name: '二次电压', unit: 'V', type: 'number', default: 400 },
    { key: 'connectionGroup', name: '接线组别', unit: '', type: 'select', options: ['Dyn11', 'Yyn0', 'YNd11'], default: 'Dyn11' },
    { key: 'coolingType', name: '冷却方式', unit: '', type: 'select', options: ['油浸自冷(ONAN)', '油浸风冷(ONAF)', '干式自冷(AN)', '干式风冷(AF)'], default: '干式风冷(AF)' },
    { key: 'impedance', name: '阻抗电压', unit: '%', type: 'number', default: 6 }
  ],
  // EMS主控
  ems_controller: [
    { key: 'cpuType', name: 'CPU类型', unit: '', type: 'text', default: 'ARM Cortex-A53' },
    { key: 'memorySize', name: '内存大小', unit: 'GB', type: 'number', default: 4 },
    { key: 'storageSize', name: '存储容量', unit: 'GB', type: 'number', default: 64 },
    { key: 'serialPorts', name: '串口数量', unit: '个', type: 'number', default: 4 },
    { key: 'ethernetPorts', name: '网口数量', unit: '个', type: 'number', default: 2 },
    { key: 'canPorts', name: 'CAN口数量', unit: '个', type: 'number', default: 2 },
    { key: 'diCount', name: 'DI数量', unit: '路', type: 'number', default: 8 },
    { key: 'doCount', name: 'DO数量', unit: '路', type: 'number', default: 4 }
  ],
  // 负载
  load: [
    { key: 'ratedPower', name: '额定功率', unit: 'kW', type: 'number', default: 100 },
    { key: 'powerFactor', name: '功率因数', unit: '', type: 'number', default: 0.85 },
    { key: 'loadType', name: '负载类型', unit: '', type: 'select', options: ['恒功率', '恒阻抗', '恒电流', '综合负载'], default: '综合负载' },
    { key: 'priority', name: '负载优先级', unit: '', type: 'select', options: ['关键负载', '重要负载', '一般负载', '可切负载'], default: '一般负载' }
  ],
  // 电网
  grid: [
    { key: 'ratedVoltage', name: '额定电压', unit: 'kV', type: 'number', default: 10 },
    { key: 'ratedFrequency', name: '额定频率', unit: 'Hz', type: 'select', options: ['50', '60'], default: '50' },
    { key: 'shortCircuitCapacity', name: '短路容量', unit: 'MVA', type: 'number', default: 250 },
    { key: 'connectionType', name: '并网类型', unit: '', type: 'select', options: ['低压并网', '中压并网', '高压并网'], default: '中压并网' }
  ],
  // 温度传感器
  temp_sensor: [
    { key: 'measureRange', name: '测量范围', unit: '°C', type: 'text', default: '-40~85' },
    { key: 'accuracy', name: '测量精度', unit: '°C', type: 'number', default: 0.5 },
    { key: 'sensorType', name: '传感器类型', unit: '', type: 'select', options: ['PT100', 'PT1000', 'NTC', 'K型热电偶'], default: 'PT100' },
    { key: 'outputSignal', name: '输出信号', unit: '', type: 'select', options: ['4-20mA', '0-10V', 'RS485', '无线'], default: '4-20mA' }
  ],
  // 湿度传感器
  humidity_sensor: [
    { key: 'measureRange', name: '测量范围', unit: '%RH', type: 'text', default: '0-100' },
    { key: 'accuracy', name: '测量精度', unit: '%RH', type: 'number', default: 3 },
    { key: 'sensorType', name: '传感器类型', unit: '', type: 'select', options: ['电容式', '电阻式', '热传导式'], default: '电容式' },
    { key: 'outputSignal', name: '输出信号', unit: '', type: 'select', options: ['4-20mA', '0-10V', 'RS485', '无线'], default: 'RS485' }
  ],
  // 水浸传感器
  water_sensor: [
    { key: 'detectionType', name: '检测类型', unit: '', type: 'select', options: ['点式', '线式', '面式'], default: '线式' },
    { key: 'cableLength', name: '感应线长度', unit: 'm', type: 'number', default: 10 },
    { key: 'responseTime', name: '响应时间', unit: 's', type: 'number', default: 1 },
    { key: 'outputType', name: '输出类型', unit: '', type: 'select', options: ['干接点', 'RS485', '4-20mA'], default: '干接点' }
  ],
  // 烟感探测器
  smoke_sensor: [
    { key: 'detectionType', name: '探测类型', unit: '', type: 'select', options: ['光电感烟', '离子感烟', '复合型'], default: '光电感烟' },
    { key: 'coverageArea', name: '保护面积', unit: 'm²', type: 'number', default: 60 },
    { key: 'sensitivityLevel', name: '灵敏度等级', unit: '', type: 'select', options: ['一级', '二级', '三级'], default: '二级' },
    { key: 'alarmOutput', name: '报警输出', unit: '', type: 'select', options: ['二线制', '四线制', '无线'], default: '二线制' }
  ],
  // 门磁传感器
  door_sensor: [
    { key: 'sensorType', name: '传感器类型', unit: '', type: 'select', options: ['磁感应', '微动开关', '红外'], default: '磁感应' },
    { key: 'detectionGap', name: '检测间隙', unit: 'mm', type: 'number', default: 20 },
    { key: 'outputType', name: '输出类型', unit: '', type: 'select', options: ['常开', '常闭', '常开+常闭'], default: '常开+常闭' }
  ],
  // 空调
  ac_unit: [
    { key: 'coolingCapacity', name: '制冷量', unit: 'kW', type: 'number', default: 12 },
    { key: 'heatingCapacity', name: '制热量', unit: 'kW', type: 'number', default: 14 },
    { key: 'ratedPower', name: '额定功率', unit: 'kW', type: 'number', default: 4 },
    { key: 'acType', name: '空调类型', unit: '', type: 'select', options: ['精密空调', '普通空调', '机房专用空调'], default: '精密空调' },
    { key: 'supplyVoltage', name: '电源电压', unit: 'V', type: 'select', options: ['220', '380'], default: '380' },
    { key: 'tempControlRange', name: '温控范围', unit: '°C', type: 'text', default: '18-28' }
  ],
  // 风机
  fan: [
    { key: 'airVolume', name: '风量', unit: 'm³/h', type: 'number', default: 5000 },
    { key: 'staticPressure', name: '静压', unit: 'Pa', type: 'number', default: 300 },
    { key: 'ratedPower', name: '额定功率', unit: 'kW', type: 'number', default: 3 },
    { key: 'fanType', name: '风机类型', unit: '', type: 'select', options: ['轴流', '离心', '混流'], default: '轴流' },
    { key: 'speedControl', name: '调速方式', unit: '', type: 'select', options: ['定速', '变频', '多速'], default: '变频' }
  ],
  // UPS
  ups: [
    { key: 'ratedPower', name: '额定功率', unit: 'kVA', type: 'number', default: 20 },
    { key: 'inputVoltage', name: '输入电压', unit: 'V', type: 'text', default: '380±20%' },
    { key: 'outputVoltage', name: '输出电压', unit: 'V', type: 'number', default: 380 },
    { key: 'backupTime', name: '后备时间', unit: 'min', type: 'number', default: 30 },
    { key: 'upsType', name: 'UPS类型', unit: '', type: 'select', options: ['在线式', '后备式', '在线互动式'], default: '在线式' },
    { key: 'batteryType', name: '电池类型', unit: '', type: 'select', options: ['铅酸', '锂电', '镍氢'], default: '铅酸' }
  ],
  // 消防主机
  fire_alarm_panel: [
    { key: 'loopCount', name: '回路数量', unit: '回路', type: 'number', default: 8 },
    { key: 'pointsPerLoop', name: '每回路点数', unit: '点', type: 'number', default: 200 },
    { key: 'displayType', name: '显示类型', unit: '', type: 'select', options: ['字符液晶', '中文液晶', '触摸屏'], default: '中文液晶' },
    { key: 'networkType', name: '联网方式', unit: '', type: 'select', options: ['RS485', 'CAN', '以太网', '光纤'], default: 'RS485' }
  ],
  // 火灾探测器
  fire_detector: [
    { key: 'detectorType', name: '探测器类型', unit: '', type: 'select', options: ['感烟探测器', '感温探测器', '火焰探测器', '复合探测器'], default: '感烟探测器' },
    { key: 'coverageArea', name: '保护面积', unit: 'm²', type: 'number', default: 60 },
    { key: 'installHeight', name: '安装高度', unit: 'm', type: 'text', default: '3-8' },
    { key: 'alarmOutput', name: '报警输出', unit: '', type: 'select', options: ['编码型', '非编码型'], default: '编码型' }
  ],
  // 气体灭火系统
  gas_suppression: [
    { key: 'agentType', name: '灭火剂类型', unit: '', type: 'select', options: ['七氟丙烷', 'IG541', 'CO2', '全氟己酮'], default: '七氟丙烷' },
    { key: 'agentWeight', name: '灭火剂重量', unit: 'kg', type: 'number', default: 100 },
    { key: 'protectedVolume', name: '保护区容积', unit: 'm³', type: 'number', default: 200 },
    { key: 'dischargeTime', name: '喷放时间', unit: 's', type: 'number', default: 10 },
    { key: 'triggerMode', name: '启动方式', unit: '', type: 'select', options: ['自动', '手动', '机械应急'], default: '自动' }
  ],
  // 水喷淋系统
  water_spray: [
    { key: 'sprayType', name: '喷淋类型', unit: '', type: 'select', options: ['湿式', '干式', '预作用', '雨淋'], default: '湿式' },
    { key: 'sprinklerK', name: '喷头K系数', unit: '', type: 'select', options: ['K80', 'K115', 'K160', 'K200'], default: 'K80' },
    { key: 'designPressure', name: '设计压力', unit: 'MPa', type: 'number', default: 0.1 },
    { key: 'coverageArea', name: '保护面积', unit: 'm²', type: 'number', default: 12 }
  ],
  // 排烟风机
  exhaust_fan: [
    { key: 'airVolume', name: '排烟量', unit: 'm³/h', type: 'number', default: 15000 },
    { key: 'staticPressure', name: '全压', unit: 'Pa', type: 'number', default: 500 },
    { key: 'ratedPower', name: '额定功率', unit: 'kW', type: 'number', default: 11 },
    { key: 'fireResistance', name: '耐火时间', unit: 'h', type: 'select', options: ['0.5', '1', '1.5', '2'], default: '1' },
    { key: 'fanType', name: '风机类型', unit: '', type: 'select', options: ['轴流', '离心', '混流'], default: '轴流' }
  ],
  // 应急照明
  emergency_light: [
    { key: 'lightType', name: '灯具类型', unit: '', type: 'select', options: ['疏散指示灯', '安全出口灯', '应急照明灯', '消防指示灯'], default: '疏散指示灯' },
    { key: 'emergencyTime', name: '应急时间', unit: 'min', type: 'number', default: 90 },
    { key: 'luminousFlux', name: '光通量', unit: 'lm', type: 'number', default: 100 },
    { key: 'batteryType', name: '电池类型', unit: '', type: 'select', options: ['镍镉', '镍氢', '磷酸铁锂'], default: '磷酸铁锂' }
  ],
  // 防火门
  fire_door: [
    { key: 'fireRating', name: '耐火等级', unit: '', type: 'select', options: ['甲级', '乙级', '丙级'], default: '甲级' },
    { key: 'doorType', name: '门扇类型', unit: '', type: 'select', options: ['单扇', '双扇', '子母'], default: '双扇' },
    { key: 'doorWidth', name: '门宽', unit: 'mm', type: 'number', default: 1200 },
    { key: 'doorHeight', name: '门高', unit: 'mm', type: 'number', default: 2100 },
    { key: 'hasDoorCloser', name: '闭门器', unit: '', type: 'select', options: ['有', '无'], default: '有' },
    { key: 'hasSequencer', name: '顺序器', unit: '', type: 'select', options: ['有', '无'], default: '有' }
  ],
  // 自定义设备
  custom_device: [
    { key: 'ratedVoltage', name: '额定电压', unit: 'V', type: 'number', default: 380 },
    { key: 'ratedPower', name: '额定功率', unit: 'kW', type: 'number', default: 0 },
    { key: 'description', name: '设备描述', unit: '', type: 'text', default: '' }
  ],
  // 自定义传感器
  custom_sensor: [
    { key: 'measureRange', name: '测量范围', unit: '', type: 'text', default: '' },
    { key: 'accuracy', name: '测量精度', unit: '', type: 'text', default: '' },
    { key: 'outputSignal', name: '输出信号', unit: '', type: 'select', options: ['4-20mA', '0-10V', 'RS485', '数字量', '其他'], default: 'RS485' }
  ],
  // 自定义控制器
  custom_controller: [
    { key: 'inputChannels', name: '输入通道数', unit: '路', type: 'number', default: 8 },
    { key: 'outputChannels', name: '输出通道数', unit: '路', type: 'number', default: 4 },
    { key: 'commInterface', name: '通信接口', unit: '', type: 'select', options: ['RS485', 'RS232', '以太网', 'CAN'], default: 'RS485' }
  ],
  // 默认属性
  default: [
    { key: 'ratedVoltage', name: '额定电压', unit: 'V', type: 'number', default: 380 },
    { key: 'ratedCurrent', name: '额定电流', unit: 'A', type: 'number', default: 100 },
    { key: 'ratedPower', name: '额定功率', unit: 'kW', type: 'number', default: 50 }
  ]
};

// 设备高级属性配置
export const deviceAdvancedAttributes = {
  // 电池簇高级属性
  battery_cluster: [
    { key: 'cycleLife', name: '循环寿命', unit: '次', type: 'number', default: 6000 },
    { key: 'calendarLife', name: '日历寿命', unit: '年', type: 'number', default: 15 },
    { key: 'operatingTemp', name: '工作温度范围', unit: '°C', type: 'text', default: '-20~55' },
    { key: 'ipRating', name: '防护等级', unit: '', type: 'select', options: ['IP20', 'IP54', 'IP65', 'IP67'], default: 'IP54' },
    { key: 'fireProtection', name: '消防系统', unit: '', type: 'select', options: ['无', '气体灭火', '水消防', '液冷+气体'], default: '气体灭火' }
  ],
  // BMS高级属性
  bms: [
    { key: 'commProtocol', name: '通信协议', unit: '', type: 'select', options: ['CAN', 'RS485', 'Modbus TCP'], default: 'CAN' },
    { key: 'isolationVoltage', name: '隔离电压', unit: 'V', type: 'number', default: 1500 },
    { key: 'samplingRate', name: '采样频率', unit: 'Hz', type: 'number', default: 10 },
    { key: 'socAlgorithm', name: 'SOC算法', unit: '', type: 'select', options: ['安时积分', '卡尔曼滤波', 'OCV法', '综合法'], default: '综合法' }
  ],
  // PCS高级属性
  pcs: [
    { key: 'harmonicFilter', name: '谐波滤波器', unit: '', type: 'select', options: ['无', '有源滤波', '无源滤波'], default: '有源滤波' },
    { key: 'gridSupport', name: '电网支撑功能', unit: '', type: 'select', options: ['无功补偿', '调频', '调压', '黑启动'], default: '无功补偿' },
    { key: 'responseTime', name: '响应时间', unit: 'ms', type: 'number', default: 50 },
    { key: 'antiIsland', name: '防孤岛保护', unit: '', type: 'select', options: ['主动', '被动', '主动+被动'], default: '主动+被动' }
  ],
  // 光伏逆变器高级属性
  pv_inverter: [
    { key: 'mpptAlgorithm', name: 'MPPT算法', unit: '', type: 'select', options: ['扰动观察法', '电导增量法', '智能优化'], default: '电导增量法' },
    { key: 'antiPid', name: '抗PID功能', unit: '', type: 'select', options: ['有', '无'], default: '有' },
    { key: 'nightSvg', name: '夜间SVG功能', unit: '', type: 'select', options: ['有', '无'], default: '无' },
    { key: 'dcSwitchIntegrated', name: '内置直流开关', unit: '', type: 'select', options: ['有', '无'], default: '有' }
  ],
  // 风机高级属性
  wind_turbine: [
    { key: 'bladeCount', name: '叶片数量', unit: '片', type: 'number', default: 3 },
    { key: 'bladeMaterial', name: '叶片材料', unit: '', type: 'select', options: ['玻璃钢', '碳纤维复合材料'], default: '玻璃钢' },
    { key: 'generatorType', name: '发电机类型', unit: '', type: 'select', options: ['双馈', '直驱永磁', '半直驱'], default: '双馈' },
    { key: 'survivalSpeed', name: '生存风速', unit: 'm/s', type: 'number', default: 52.5 }
  ],
  // 柴油发电机高级属性
  diesel_generator: [
    { key: 'emissionStandard', name: '排放标准', unit: '', type: 'select', options: ['国三', '国四', '国五', '欧Ⅲ', '欧Ⅳ'], default: '国四' },
    { key: 'noiseLevel', name: '噪音等级', unit: 'dB(A)', type: 'number', default: 75 },
    { key: 'governorType', name: '调速方式', unit: '', type: 'select', options: ['机械调速', '电子调速', 'ECU控制'], default: '电子调速' },
    { key: 'coolingSystem', name: '冷却系统', unit: '', type: 'select', options: ['水冷', '风冷'], default: '水冷' }
  ],
  // 充电桩高级属性
  dc_charger: [
    { key: 'chargeStandard', name: '充电标准', unit: '', type: 'select', options: ['GB/T 27930-2015', 'GB/T 27930-2023', 'ChaoJi'], default: 'GB/T 27930-2015' },
    { key: 'v2gSupport', name: 'V2G支持', unit: '', type: 'select', options: ['支持', '不支持'], default: '不支持' },
    { key: 'orderedCharging', name: '有序充电', unit: '', type: 'select', options: ['支持', '不支持'], default: '支持' },
    { key: 'paymentMethod', name: '支付方式', unit: '', type: 'select', options: ['刷卡', '扫码', '即插即充', '综合'], default: '综合' }
  ],
  ac_charger: [
    { key: 'chargeStandard', name: '充电标准', unit: '', type: 'select', options: ['GB/T 20234.2', 'Type 2', 'Type 1'], default: 'GB/T 20234.2' },
    { key: 'scheduledCharge', name: '预约充电', unit: '', type: 'select', options: ['支持', '不支持'], default: '支持' },
    { key: 'leakageProtection', name: '漏电保护', unit: '', type: 'select', options: ['6mA DC', '30mA AC'], default: '6mA DC' }
  ],
  // 变压器高级属性
  transformer: [
    { key: 'tapChanger', name: '分接开关', unit: '', type: 'select', options: ['无励磁', '有载', '无'], default: '无励磁' },
    { key: 'tapRange', name: '分接范围', unit: '%', type: 'text', default: '±5%' },
    { key: 'noLoadLoss', name: '空载损耗', unit: 'W', type: 'number', default: 1500 },
    { key: 'loadLoss', name: '负载损耗', unit: 'W', type: 'number', default: 8000 }
  ],
  // 空调高级属性
  ac_unit: [
    { key: 'copRatio', name: 'COP能效比', unit: '', type: 'number', default: 3.5 },
    { key: 'refrigerant', name: '制冷剂', unit: '', type: 'select', options: ['R410A', 'R32', 'R22', 'R134a'], default: 'R410A' },
    { key: 'humidifyFunction', name: '加湿功能', unit: '', type: 'select', options: ['有', '无'], default: '无' },
    { key: 'airFilter', name: '空气过滤', unit: '', type: 'select', options: ['初效', '中效', '高效', '无'], default: '中效' }
  ],
  // UPS高级属性
  ups: [
    { key: 'inputPowerFactor', name: '输入功率因数', unit: '', type: 'number', default: 0.99 },
    { key: 'outputPowerFactor', name: '输出功率因数', unit: '', type: 'number', default: 0.9 },
    { key: 'efficiency', name: '效率', unit: '%', type: 'number', default: 96 },
    { key: 'parallelCount', name: '并机数量', unit: '台', type: 'number', default: 1 },
    { key: 'bypassSupport', name: '旁路功能', unit: '', type: 'select', options: ['有', '无'], default: '有' }
  ],
  // 默认高级属性
  default: [
    { key: 'warranty', name: '质保期', unit: '年', type: 'number', default: 5 },
    { key: 'ipRating', name: '防护等级', unit: '', type: 'select', options: ['IP20', 'IP54', 'IP65', 'IP67'], default: 'IP54' },
    { key: 'altitude', name: '工作海拔', unit: 'm', type: 'number', default: 2000 }
  ]
};

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
  ],
  // IEC 61850点表
  iec61850_pcs: [
    { reference: 'PCSC1.MMXU1.TotW', name: '有功功率', type: 'FLOAT', rw: 'R', fc: 'MX', description: '总有功功率' },
    { reference: 'PCSC1.MMXU1.TotVAr', name: '无功功率', type: 'FLOAT', rw: 'R', fc: 'MX', description: '总无功功率' },
    { reference: 'PCSC1.MMXU1.TotPF', name: '功率因数', type: 'FLOAT', rw: 'R', fc: 'MX', description: '总功率因数' },
    { reference: 'PCSC1.MMXU1.PhV.phsA', name: 'A相电压', type: 'FLOAT', rw: 'R', fc: 'MX', description: '单位:V' },
    { reference: 'PCSC1.MMXU1.PhV.phsB', name: 'B相电压', type: 'FLOAT', rw: 'R', fc: 'MX', description: '单位:V' },
    { reference: 'PCSC1.MMXU1.PhV.phsC', name: 'C相电压', type: 'FLOAT', rw: 'R', fc: 'MX', description: '单位:V' },
    { reference: 'PCSC1.CSWI1.Pos', name: '运行状态', type: 'INT', rw: 'R', fc: 'ST', description: '开关位置' },
    { reference: 'PCSC1.GGIO1.SPCSO1', name: '启停控制', type: 'BOOL', rw: 'RW', fc: 'CO', description: '远程启停' }
  ],
  // IEC 104点表
  iec104_pcs: [
    { ioa: 1, name: '系统运行状态', type: 'M_SP_NA_1', cot: '3', description: '单点遥信' },
    { ioa: 2, name: '充放电状态', type: 'M_DP_NA_1', cot: '3', description: '双点遥信' },
    { ioa: 100, name: '有功功率', type: 'M_ME_NC_1', cot: '3', description: '短浮点遥测' },
    { ioa: 101, name: '无功功率', type: 'M_ME_NC_1', cot: '3', description: '短浮点遥测' },
    { ioa: 102, name: '直流电压', type: 'M_ME_NC_1', cot: '3', description: '短浮点遥测' },
    { ioa: 103, name: '直流电流', type: 'M_ME_NC_1', cot: '3', description: '短浮点遥测' },
    { ioa: 1000, name: '启停控制', type: 'C_SC_NA_1', cot: '6', description: '单点遥控' },
    { ioa: 1001, name: '功率设定', type: 'C_SE_NC_1', cot: '6', description: '浮点遥调' }
  ],
  // CAN总线点表
  can_bms: [
    { canId: '0x18FF50E5', name: '系统SOC', byte: '0-1', type: 'uint16', factor: 0.1, description: '电池SOC' },
    { canId: '0x18FF50E5', name: '系统SOH', byte: '2-3', type: 'uint16', factor: 0.1, description: '电池SOH' },
    { canId: '0x18FF51E5', name: '总电压', byte: '0-1', type: 'uint16', factor: 0.1, description: '电池总电压' },
    { canId: '0x18FF51E5', name: '总电流', byte: '2-3', type: 'int16', factor: 0.1, description: '电池总电流' },
    { canId: '0x18FF52E5', name: '最高单体电压', byte: '0-1', type: 'uint16', factor: 1, description: '单位:mV' },
    { canId: '0x18FF52E5', name: '最低单体电压', byte: '2-3', type: 'uint16', factor: 1, description: '单位:mV' },
    { canId: '0x18FF53E5', name: '最高温度', byte: '0', type: 'int8', factor: 1, offset: -40, description: '单位:°C' },
    { canId: '0x18FF53E5', name: '最低温度', byte: '1', type: 'int8', factor: 1, offset: -40, description: '单位:°C' }
  ],
  // DL/T 645电表点表
  dlt645_meter: [
    { dataId: '00010000', name: '正向有功总电能', type: 'float', unit: 'kWh', description: '正向有功电度' },
    { dataId: '00020000', name: '反向有功总电能', type: 'float', unit: 'kWh', description: '反向有功电度' },
    { dataId: '02010100', name: 'A相电压', type: 'float', unit: 'V', description: '线电压' },
    { dataId: '02010200', name: 'B相电压', type: 'float', unit: 'V', description: '线电压' },
    { dataId: '02010300', name: 'C相电压', type: 'float', unit: 'V', description: '线电压' },
    { dataId: '02020100', name: 'A相电流', type: 'float', unit: 'A', description: '相电流' },
    { dataId: '02020200', name: 'B相电流', type: 'float', unit: 'A', description: '相电流' },
    { dataId: '02020300', name: 'C相电流', type: 'float', unit: 'A', description: '相电流' },
    { dataId: '02030000', name: '瞬时有功功率', type: 'float', unit: 'kW', description: '有功功率' },
    { dataId: '02040000', name: '瞬时无功功率', type: 'float', unit: 'kVar', description: '无功功率' }
  ],
  // OPC点表
  opc_pcs: [
    { nodeId: 'ns=2;s=PCS.Status', name: '运行状态', type: 'Int32', rw: 'R', description: '设备状态' },
    { nodeId: 'ns=2;s=PCS.ActivePower', name: '有功功率', type: 'Float', rw: 'R', description: '单位:kW' },
    { nodeId: 'ns=2;s=PCS.ReactivePower', name: '无功功率', type: 'Float', rw: 'R', description: '单位:kVar' },
    { nodeId: 'ns=2;s=PCS.DcVoltage', name: '直流电压', type: 'Float', rw: 'R', description: '单位:V' },
    { nodeId: 'ns=2;s=PCS.DcCurrent', name: '直流电流', type: 'Float', rw: 'R', description: '单位:A' },
    { nodeId: 'ns=2;s=PCS.PowerSetpoint', name: '功率设定', type: 'Float', rw: 'RW', description: '单位:kW' },
    { nodeId: 'ns=2;s=PCS.StartStop', name: '启停控制', type: 'Boolean', rw: 'RW', description: '远程启停' }
  ]
};

// 协议对应的点表类型
export const protocolPointTableTypes = {
  modbus_rtu: ['modbus_pcs', 'modbus_bms', 'modbus_meter', 'modbus_inverter'],
  modbus_tcp: ['modbus_pcs', 'modbus_bms', 'modbus_meter', 'modbus_inverter'],
  iec61850: ['iec61850_pcs'],
  iec104: ['iec104_pcs'],
  can: ['can_bms'],
  dlt645_97: ['dlt645_meter'],
  dlt645_07: ['dlt645_meter'],
  opc: ['opc_pcs'],
  private: []
};

// 点表类型名称映射
export const pointTableNames = {
  modbus_pcs: 'Modbus PCS点表',
  modbus_bms: 'Modbus BMS点表',
  modbus_meter: 'Modbus 电表点表',
  modbus_inverter: 'Modbus 逆变器点表',
  iec61850_pcs: 'IEC 61850 PCS点表',
  iec104_pcs: 'IEC 104 PCS点表',
  can_bms: 'CAN总线 BMS点表',
  dlt645_meter: 'DL/T 645 电表点表',
  opc_pcs: 'OPC UA PCS点表'
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
