import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  deviceCategories,
  algorithmDefaults,
  northboundProtocols,
  deviceBasicAttributes
} from '../data/deviceTypes';

// 7步引导流程 - 恢复北向配置
const STEPS = [
  { id: 1, name: '项目信息' },
  { id: 2, name: '场景选择' },
  { id: 3, name: '设备选择' },
  { id: 4, name: '参数微调' },
  { id: 5, name: '电气拓扑' },
  { id: 6, name: '算法策略' },
  { id: 7, name: '北向配置' }
];

// 场景模板定义
const sceneTemplates = [
  {
    id: 'commercial_storage',
    name: '并网工商业储能',
    icon: '🏭',
    description: '适用于工厂、商业建筑的储能系统，实现削峰填谷、需量管理',
    devices: ['PCS储能变流器', '电池簇', 'BMS电池管理', '电表'],
    extraDevices: 1,
    recommendedAlgorithm: 'economic'
  },
  {
    id: 'pv_storage_charger',
    name: '光储充一体化',
    icon: '☀️',
    description: '适用于充电站，光伏自发自用、储能调峰',
    devices: ['光伏逆变器', '光伏组串', 'PCS储能变流器', '电池簇'],
    extraDevices: 2,
    recommendedAlgorithm: 'balanced'
  },
  {
    id: 'wind_pv_storage',
    name: '风光储微网',
    icon: '🌬️',
    description: '适用于园区、海岛，多能互补、支持离网运行',
    devices: ['风机', '风机变流器', '光伏逆变器', 'PCS储能变流器'],
    extraDevices: 2,
    recommendedAlgorithm: 'balanced'
  },
  {
    id: 'diesel_storage',
    name: '柴储混合',
    icon: '🚛',
    description: '适用于偏远地区，柴油机优化、储能平滑',
    devices: ['柴油机组', 'ATS切换开关', 'PCS储能变流器', '电池簇'],
    extraDevices: 0,
    recommendedAlgorithm: 'lifespan'
  },
  {
    id: 'custom',
    name: '自定义配置',
    icon: '⚙️',
    description: '完全自定义的配置方案',
    devices: [],
    extraDevices: 0,
    recommendedAlgorithm: 'custom'
  }
];

// 系统类型
const systemTypes = [
  { id: 'grid_connected', name: '并网系统', description: '与电网连接运行' },
  { id: 'off_grid', name: '离网系统', description: '独立运行不并网' },
  { id: 'hybrid', name: '混合系统', description: '支持并网和离网' }
];

// 调度模式
const schedulingModes = [
  { id: 'economic', name: '经济优先', icon: '💰', description: '最小化电费成本' },
  { id: 'lifespan', name: '寿命优先', icon: '🔋', description: '保护储能寿命' },
  { id: 'balanced', name: '均衡模式', icon: '⚖️', description: '平衡各项指标' },
  { id: 'custom', name: '自定义', icon: '⚙️', description: '自定义权重' }
];

// 告警等级
const alarmLevels = [
  { id: 'critical', name: '紧急', color: '#dc2626' },
  { id: 'major', name: '重要', color: '#f97316' },
  { id: 'minor', name: '次要', color: '#eab308' },
  { id: 'warning', name: '提示', color: '#3b82f6' }
];

// 预设告警规则
const presetAlarmRules = [
  { id: 'soc_low', name: 'SOC过低告警', condition: 'SOC < 10%', level: 'critical', enabled: true },
  { id: 'soc_high', name: 'SOC过高告警', condition: 'SOC > 95%', level: 'major', enabled: true },
  { id: 'temp_high', name: '电池温度过高', condition: '温度 > 55℃', level: 'critical', enabled: true },
  { id: 'temp_low', name: '电池温度过低', condition: '温度 < 0℃', level: 'major', enabled: true },
  { id: 'voltage_high', name: '电压过高', condition: '电压 > 上限', level: 'major', enabled: true },
  { id: 'voltage_low', name: '电压过低', condition: '电压 < 下限', level: 'major', enabled: true },
  { id: 'current_high', name: '电流过大', condition: '电流 > 额定', level: 'major', enabled: true },
  { id: 'comm_fail', name: '通讯中断', condition: '超时无响应', level: 'critical', enabled: true },
  { id: 'pcs_fault', name: 'PCS故障', condition: '故障码 ≠ 0', level: 'critical', enabled: true },
  { id: 'bms_fault', name: 'BMS故障', condition: '故障码 ≠ 0', level: 'critical', enabled: true }
];

// Phase 5: 峰谷时段重叠检测函数
const validateTimePeriods = (peakPeriods, valleyPeriods) => {
  const errors = [];
  const warnings = [];
  
  // 转换时间为分钟数便于比较
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // 检查两个时段是否重叠
  const periodsOverlap = (p1Start, p1End, p2Start, p2End) => {
    // 处理跨越午夜的情况
    if (p1End < p1Start) p1End += 24 * 60; // 跨午夜
    if (p2End < p2Start) p2End += 24 * 60;
    return p1Start < p2End && p2Start < p1End;
  };
  
  // 检查峰时段之间是否重叠
  for (let i = 0; i < peakPeriods.length; i++) {
    for (let j = i + 1; j < peakPeriods.length; j++) {
      const p1Start = timeToMinutes(peakPeriods[i].startTime);
      const p1End = timeToMinutes(peakPeriods[i].endTime);
      const p2Start = timeToMinutes(peakPeriods[j].startTime);
      const p2End = timeToMinutes(peakPeriods[j].endTime);
      
      if (periodsOverlap(p1Start, p1End, p2Start, p2End)) {
        errors.push(`峰时段 "${peakPeriods[i].name}" 与 "${peakPeriods[j].name}" 时间重叠`);
      }
    }
  }
  
  // 检查谷时段之间是否重叠
  for (let i = 0; i < valleyPeriods.length; i++) {
    for (let j = i + 1; j < valleyPeriods.length; j++) {
      const p1Start = timeToMinutes(valleyPeriods[i].startTime);
      const p1End = timeToMinutes(valleyPeriods[i].endTime);
      const p2Start = timeToMinutes(valleyPeriods[j].startTime);
      const p2End = timeToMinutes(valleyPeriods[j].endTime);
      
      if (periodsOverlap(p1Start, p1End, p2Start, p2End)) {
        errors.push(`谷时段 "${valleyPeriods[i].name}" 与 "${valleyPeriods[j].name}" 时间重叠`);
      }
    }
  }
  
  // 检查峰谷时段是否重叠
  for (const peak of peakPeriods) {
    for (const valley of valleyPeriods) {
      const pStart = timeToMinutes(peak.startTime);
      const pEnd = timeToMinutes(peak.endTime);
      const vStart = timeToMinutes(valley.startTime);
      const vEnd = timeToMinutes(valley.endTime);
      
      if (periodsOverlap(pStart, pEnd, vStart, vEnd)) {
        errors.push(`峰时段 "${peak.name}" 与谷时段 "${valley.name}" 时间重叠`);
      }
    }
  }
  
  // 计算总覆盖时间
  const totalPeakMinutes = peakPeriods.reduce((sum, p) => {
    let duration = timeToMinutes(p.endTime) - timeToMinutes(p.startTime);
    if (duration < 0) duration += 24 * 60;
    return sum + duration;
  }, 0);
  
  const totalValleyMinutes = valleyPeriods.reduce((sum, p) => {
    let duration = timeToMinutes(p.endTime) - timeToMinutes(p.startTime);
    if (duration < 0) duration += 24 * 60;
    return sum + duration;
  }, 0);
  
  const totalMinutes = totalPeakMinutes + totalValleyMinutes;
  const coverage = (totalMinutes / (24 * 60)) * 100;
  
  if (coverage < 50) {
    warnings.push(`峰谷时段仅覆盖 ${coverage.toFixed(1)}% 的时间，建议增加时段配置`);
  }
  
  if (totalPeakMinutes === 0) {
    warnings.push('未配置峰时段，将无法进行峰谷套利');
  }
  
  if (totalValleyMinutes === 0) {
    warnings.push('未配置谷时段，将无法进行低价充电');
  }
  
  return { isValid: errors.length === 0, errors, warnings, coverage };
};

// 自定义节点样式
const nodeStyles = {
  wind: { background: '#dbeafe', borderColor: '#3b82f6' },
  solar: { background: '#fef3c7', borderColor: '#f59e0b' },
  diesel: { background: '#f3f4f6', borderColor: '#6b7280' },
  storage: { background: '#d1fae5', borderColor: '#10b981' },
  charger: { background: '#ede9fe', borderColor: '#8b5cf6' },
  other: { background: '#e0f2fe', borderColor: '#06b6d4' },
  grid: { background: '#fee2e2', borderColor: '#ef4444' }
};

// Helper function to get device icon by category
const getDeviceIcon = (category) => {
  const iconMap = {
    storage: '🔋',
    solar: '☀️',
    wind: '🌬️',
    diesel: '⛽',
    charger: '🔌',
    environment: '🌡️',
    fire: '🧯',
    custom: '🔧',
    other: '⚡'
  };
  return iconMap[category] || '📦';
};

// Helper function to convert hex color to rgba with opacity
const hexToRgba = (hex, alpha = 1) => {
  if (!hex) return 'rgba(59, 130, 246, 0.1)'; // default blue with transparency
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

function ProjectConfigWizard({ onNavigate }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [validationResults, setValidationResults] = useState([]);
  const fileInputRef = useRef(null);
  
  // 步骤1: 项目基础信息 - 增强版
  const [projectInfo, setProjectInfo] = useState({
    name: '',
    location: '',
    systemType: 'grid_connected',
    ratedCapacity: 1000, // kWh
    ratedPower: 500, // kW
    manager: '',
    contact: '',
    description: ''
  });

  // 步骤2: 场景模板
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // 步骤3: 选中的设备和物模型
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);
  
  // 设备参数微调
  const [deviceParams, setDeviceParams] = useState({});
  const [paramSearchText, setParamSearchText] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedDevices, setExpandedDevices] = useState({});

  // 步骤5: 拓扑节点和边
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isTopologyFullscreen, setIsTopologyFullscreen] = useState(false);

  // 步骤6: 算法策略配置 - 综合Tab式设计（保留所有功能）
  const [algorithmTab, setAlgorithmTab] = useState('mode'); // mode, weight, peakValley, integration, advanced
  const [algorithmConfig, setAlgorithmConfig] = useState({
    // 调度模式
    schedulingMode: 'economic',
    // 目标权重 (总和应为100%)
    weights: {
      economic: 40,
      lifespan: 30,
      socBalance: 20,
      curtailmentMin: 10
    },
    // 约束参数
    constraints: {
      powerBalanceTolerance: 5, // kW
      targetSoc: 60, // %
      gridPowerLimit: 1000, // kW
      socChargeMin: 20, // %
      socDischargeMax: 90, // %
      socCoefficient: 0.5
    },
    // 高级策略
    advanced: {
      schedulingPeriod: 15, // 分钟
      predictionHorizon: 24, // 小时
      safetyMargin: 5, // %
      smoothingFactor: 0.8,
      gridPeakShaving: true,
      loadFollowing: true,
      autoSchedule: true,
      emergencyReserve: false
    },
    // 削峰填谷配置
    peakShaving: algorithmDefaults?.peakShaving || {
      enabled: true,
      peakPeriods: [
        { id: 1, name: '早高峰', startTime: '08:00', endTime: '12:00', action: 'discharge', maxPower: 200 },
        { id: 2, name: '晚高峰', startTime: '18:00', endTime: '22:00', action: 'discharge', maxPower: 200 }
      ],
      valleyPeriods: [
        { id: 1, name: '夜间低谷', startTime: '23:00', endTime: '07:00', action: 'charge', maxPower: 200 }
      ]
    },
    // 需量控制
    demandControl: algorithmDefaults?.demandControl || { 
      enabled: false, 
      demandLimit: 800,
      warningThreshold: 90, // %
      actionThreshold: 95   // %
    },
    // SOC管理
    socManagement: algorithmDefaults?.socManagement || { minSoc: 10, maxSoc: 95, targetSoc: 60 },
    // 逆功率保护
    reversePowerProtection: {
      enabled: false,
      threshold: 10, // kW
      actionDelay: 5, // 秒
      protectMode: 'cutoff' // cutoff/reduce
    },
    // 风电接入策略
    windIntegration: {
      enabled: false,
      priorityLevel: 1,
      maxPowerLimit: 1000, // kW
      rampRate: 50, // kW/min
      curtailmentEnabled: true
    },
    // 光伏接入策略
    solarIntegration: {
      enabled: false,
      priorityLevel: 2,
      maxPowerLimit: 500, // kW
      mpptOptimization: true,
      antiBackflow: true
    },
    // 柴发接入策略
    dieselIntegration: {
      enabled: false,
      startSocThreshold: 15, // %
      stopSocThreshold: 80, // %
      minRunTime: 30, // 分钟
      cooldownTime: 10 // 分钟
    },
    // 充电桩接入策略
    chargerIntegration: {
      enabled: false,
      chargingMode: 'free', // free: 自由充电, scheduled: 有序充电, v2g: V2G模式
      maxTotalPower: 300, // kW
      v2gMinSoc: 30, // V2G最低SOC
      v2gMaxPower: 50, // V2G放电功率
      loadBalancing: true,
      schedulingEnabled: true,
      peakShiftEnabled: true
    },
    // 电价配置
    electricityPrice: {
      enabled: false,
      priceType: 'tou', // tou: 分时电价, fixed: 固定电价
      fixedPrice: 0.8, // 元/kWh
      touPrices: [
        { id: 1, name: '峰时', startTime: '08:00', endTime: '12:00', price: 1.2 },
        { id: 2, name: '峰时', startTime: '18:00', endTime: '22:00', price: 1.2 },
        { id: 3, name: '平时', startTime: '12:00', endTime: '18:00', price: 0.8 },
        { id: 4, name: '谷时', startTime: '22:00', endTime: '08:00', price: 0.4 }
      ]
    }
  });

  // 告警规则配置 (保留供未来扩展)
  const [alarmRules, setAlarmRules] = useState(presetAlarmRules);
  const [showAddAlarmModal, setShowAddAlarmModal] = useState(false);
  const [newAlarmRule, setNewAlarmRule] = useState({
    name: '',
    condition: '',
    level: 'warning',
    enabled: true
  });

  // Phase 6: 配置预览和配置下发
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [deployStatus, setDeployStatus] = useState(null); // null, 'deploying', 'success', 'error'
  const [deployMessage, setDeployMessage] = useState('');

  // 步骤7: 北向配置
  const northboundFileInputRef = useRef(null);
  const [northboundConfig, setNorthboundConfig] = useState({
    enabled: false,
    protocol: 'mqtt',
    serverIp: '',
    serverPort: 1883,
    topic: 'ems/data',
    username: '',
    password: '',
    clientId: 'ems_client_001',
    keepAlive: 60,
    qos: 1,
    publishInterval: 5000,
    // 增强配置
    heartbeatInterval: 30,
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    dataFormat: 'json',
    compression: false,
    encryption: false,
    // IEC104特定配置
    iec104Config: {
      originatorAddress: 0,
      commonAddress: 1,
      k: 12,
      w: 8,
      t0: 30,
      t1: 15,
      t2: 10,
      t3: 20
    },
    // Modbus服务端配置
    modbusServerConfig: {
      unitId: 1,
      maxConnections: 5
    },
    // HTTP配置
    httpConfig: {
      method: 'POST',
      contentType: 'application/json',
      authType: 'none', // none/basic/bearer
      authToken: ''
    },
    // 点表配置
    pointTableEnabled: true,
    pointTableMapping: []
  });

  // ESC key handler for modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && showAddAlarmModal) {
        setShowAddAlarmModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showAddAlarmModal]);

  // 加载已保存的物模型
  useEffect(() => {
    try {
      const savedModels = JSON.parse(localStorage.getItem('ems_device_models') || '[]');
      setDeviceModels(Array.isArray(savedModels) ? savedModels : []);
    } catch (e) {
      console.error('Failed to load device models from localStorage:', e);
      setDeviceModels([]);
    }
  }, []);

  const updateProjectInfo = (field, value) => {
    setProjectInfo(prev => ({ ...prev, [field]: value }));
  };

  // 选择场景模板后自动推荐设备
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    // 根据模板推荐算法模式
    if (template.recommendedAlgorithm) {
      setAlgorithmConfig(prev => ({
        ...prev,
        schedulingMode: template.recommendedAlgorithm
      }));
    }
  };

  // Phase 6: 获取完整配置数据（用于预览和下发）
  const getCompleteConfig = () => {
    return {
      project: projectInfo,
      template: selectedTemplate,
      devices: selectedDevices.map(d => ({
        ...d,
        params: deviceParams[d.instanceId] || {}
      })),
      topology: { nodes, edges },
      algorithm: algorithmConfig,
      alarms: alarmRules,
      northbound: northboundConfig,
      createdAt: new Date().toISOString(),
      version: '1.0.0'
    };
  };

  // Phase 6: 配置下发函数
  const handleDeployConfig = async () => {
    setDeployStatus('deploying');
    setDeployMessage('正在下发配置...');
    
    const config = getCompleteConfig();
    
    // 模拟API调用
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 保存到localStorage作为模拟
      localStorage.setItem('ems_deployed_config', JSON.stringify(config));
      localStorage.setItem('ems_deploy_timestamp', new Date().toISOString());
      
      setDeployStatus('success');
      setDeployMessage(`✅ 配置下发成功！\n\n下发时间: ${new Date().toLocaleString()}\n项目名称: ${projectInfo.name}\n设备数量: ${selectedDevices.length}\n北向协议: ${northboundConfig.protocol.toUpperCase()}`);
    } catch (error) {
      setDeployStatus('error');
      setDeployMessage(`❌ 配置下发失败: ${error.message}`);
    }
  };

  // 设备参数更新辅助函数
  const updateDeviceParam = (deviceId, field, value, isNumeric = false) => {
    setDeviceParams(prev => ({
      ...prev,
      [deviceId]: {
        ...(prev[deviceId] || {}),
        [field]: isNumeric ? (value === '' ? '' : parseInt(value, 10) || 0) : value
      }
    }));
  };

  // 添加单个设备实例
  const handleAddDevice = (model) => {
    const existingCount = selectedDevices.filter(d => d.id === model.id).length;
    const newDevice = {
      ...model,
      instanceId: `${model.id}_${Date.now()}`,
      instanceName: `${model.modelName}_${existingCount + 1}`,
      instanceIndex: existingCount + 1
    };
    setSelectedDevices(prev => [...prev, newDevice]);
    
    const ipLastOctet = Math.min(100 + existingCount, 254);
    setDeviceParams(prev => ({
      ...prev,
      [newDevice.instanceId]: {
        slaveAddress: existingCount + 1,
        port: `COM${(existingCount % 10) + 1}`,
        ip: `192.168.1.${ipLastOctet}`,
        timeout: 3000,
        retries: 3,
        pollInterval: 1000,
        enabled: true,
        alias: '',
        location: '',
        notes: ''
      }
    }));
  };

  // 批量添加设备实例
  const handleBatchAddDevice = (model, count) => {
    const existingCount = selectedDevices.filter(d => d.id === model.id).length;
    const newDevices = [];
    const newParams = {};
    
    for (let i = 0; i < count; i++) {
      const instanceIndex = existingCount + i + 1;
      const instanceId = `${model.id}_${Date.now()}_${i}`;
      const ipLastOctet = Math.min(100 + existingCount + i, 254);
      newDevices.push({
        ...model,
        instanceId,
        instanceName: `${model.modelName}_${instanceIndex}`,
        instanceIndex
      });
      newParams[instanceId] = {
        slaveAddress: instanceIndex,
        port: `COM${((instanceIndex - 1) % 10) + 1}`,
        ip: `192.168.1.${ipLastOctet}`,
        timeout: 3000,
        retries: 3,
        pollInterval: 1000,
        enabled: true,
        alias: '',
        location: '',
        notes: ''
      };
    }
    
    setSelectedDevices(prev => [...prev, ...newDevices]);
    setDeviceParams(prev => ({ ...prev, ...newParams }));
  };

  const handleRemoveDevice = (instanceId) => {
    setSelectedDevices(prev => prev.filter(d => d.instanceId !== instanceId));
    setDeviceParams(prev => {
      const newParams = { ...prev };
      delete newParams[instanceId];
      return newParams;
    });
    setNodes(prev => prev.filter(n => n.id !== instanceId));
    setEdges(prev => prev.filter(e => e.source !== instanceId && e.target !== instanceId));
  };

  const handleDeleteTopologyNode = (nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
  };

  const handleDeviceParamChange = (instanceId, field, value) => {
    setDeviceParams(prev => ({
      ...prev,
      [instanceId]: {
        ...prev[instanceId],
        [field]: value
      }
    }));
  };

  // 拓扑相关
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#6b7280', strokeWidth: 2 }
    }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const deviceData = JSON.parse(event.dataTransfer.getData('application/json'));
      
      const reactFlowBounds = event.target.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 75,
        y: event.clientY - reactFlowBounds.top - 25
      };

      const category = deviceCategories.find(c => 
        c.devices.some(d => d.id === deviceData.deviceType)
      );

      const newNode = {
        id: deviceData.instanceId,
        type: 'default',
        position,
        data: { 
          label: (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                {category?.icon || '📦'}
              </div>
              <div style={{ fontSize: '12px', fontWeight: '500' }}>
                {deviceData.instanceName}
              </div>
            </div>
          )
        },
        style: {
          ...nodeStyles[category?.id] || nodeStyles.other,
          border: '2px solid',
          borderRadius: '8px',
          padding: '10px',
          minWidth: '120px'
        }
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const handleAutoLayout = () => {
    const spacing = { x: 180, y: 120 };
    const startPos = { x: 50, y: 50 };
    const columns = 4;

    const newNodes = nodes.map((node, index) => ({
      ...node,
      position: {
        x: startPos.x + (index % columns) * spacing.x,
        y: startPos.y + Math.floor(index / columns) * spacing.y
      }
    }));

    setNodes(newNodes);
  };

  // 添加告警规则
  const handleAddAlarmRule = () => {
    if (newAlarmRule.name && newAlarmRule.condition) {
      const rule = {
        ...newAlarmRule,
        id: `custom_${Date.now()}`
      };
      setAlarmRules(prev => [...prev, rule]);
      setNewAlarmRule({ name: '', condition: '', level: 'warning', enabled: true });
      setShowAddAlarmModal(false);
    }
  };

  // 删除告警规则
  const handleDeleteAlarmRule = (ruleId) => {
    setAlarmRules(prev => prev.filter(r => r.id !== ruleId));
  };

  // 切换告警规则启用状态
  const handleToggleAlarmRule = (ruleId) => {
    setAlarmRules(prev => prev.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    } else {
      handleValidateAndComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleValidateAndComplete = () => {
    const results = [
      { name: '项目信息完整性', status: projectInfo.name && projectInfo.location ? 'success' : 'error' },
      { name: '场景模板选择', status: selectedTemplate ? 'success' : 'warning' },
      { name: '设备配置有效性', status: selectedDevices.length > 0 ? 'success' : 'warning' },
      { name: '拓扑关系合法性', status: nodes.length > 0 ? 'success' : 'warning' },
      { name: '算法策略配置', status: 'success' },
      { name: '告警规则配置', status: alarmRules.filter(r => r.enabled).length > 0 ? 'success' : 'warning' },
      { name: '北向接口配置', status: !northboundConfig.enabled || (northboundConfig.serverIp) ? 'success' : 'warning' }
    ];
    setValidationResults(results);
    setCompleted(true);
  };

  const handleExportConfig = () => {
    const config = {
      projectInfo,
      selectedTemplate,
      devices: selectedDevices.map(d => ({
        ...d,
        params: deviceParams[d.instanceId]
      })),
      topology: {
        nodes: nodes.map(n => ({ id: n.id, position: n.position })),
        edges: edges.map(e => ({ source: e.source, target: e.target }))
      },
      algorithmConfig,
      alarmRules,
      northboundConfig,
      exportedAt: new Date().toISOString(),
      version: '2.0'
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ems_config_${projectInfo.name || 'project'}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportTemplate = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const config = JSON.parse(event.target.result);
          if (config.projectInfo) setProjectInfo(config.projectInfo);
          if (config.selectedTemplate) setSelectedTemplate(config.selectedTemplate);
          if (config.devices) {
            setSelectedDevices(config.devices);
            const params = {};
            config.devices.forEach(d => {
              params[d.instanceId] = d.params || {};
            });
            setDeviceParams(params);
          }
          if (config.algorithmConfig) setAlgorithmConfig(config.algorithmConfig);
          if (config.alarmRules) setAlarmRules(config.alarmRules);
          if (config.northboundConfig) setNorthboundConfig(config.northboundConfig);
          if (config.topology?.nodes) {
            const category = (deviceType) => deviceCategories.find(c => 
              c.devices.some(d => d.id === deviceType)
            );
            const newNodes = config.topology.nodes.map(n => {
              const device = config.devices.find(d => d.instanceId === n.id);
              const cat = category(device?.deviceType);
              return {
                id: n.id,
                position: n.position,
                data: {
                  label: (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{cat?.icon || '📦'}</div>
                      <div style={{ fontSize: '12px', fontWeight: '500' }}>{device?.instanceName || n.id}</div>
                    </div>
                  )
                },
                style: {
                  ...nodeStyles[cat?.id] || nodeStyles.other,
                  border: '2px solid',
                  borderRadius: '8px',
                  padding: '10px',
                  minWidth: '120px'
                }
              };
            });
            setNodes(newNodes);
          }
          if (config.topology?.edges) {
            const newEdges = config.topology.edges.map((e, i) => ({
              id: `e${i}`,
              source: e.source,
              target: e.target,
              type: 'smoothstep',
              animated: true,
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { stroke: '#6b7280', strokeWidth: 2 }
            }));
            setEdges(newEdges);
          }
          alert('配置模板导入成功！');
        } catch (err) {
          alert('配置文件格式错误');
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleSaveProject = () => {
    const project = {
      id: `project_${Date.now()}`,
      ...projectInfo,
      selectedTemplate,
      devices: selectedDevices.map(d => ({
        ...d,
        params: deviceParams[d.instanceId]
      })),
      topology: {
        nodes: nodes.map(n => ({ id: n.id, position: n.position })),
        edges: edges.map(e => ({ source: e.source, target: e.target }))
      },
      algorithmConfig,
      alarmRules,
      northboundConfig,
      createdAt: new Date().toISOString()
    };

    try {
      const existingProjects = JSON.parse(localStorage.getItem('ems_projects') || '[]');
      existingProjects.push(project);
      localStorage.setItem('ems_projects', JSON.stringify(existingProjects));
    } catch (e) {
      console.error('Failed to save project:', e);
      alert('保存项目失败');
    }
  };

  // 权重滑块组件
  const WeightSlider = ({ label, icon, description, value, onChange, color }) => (
    <div style={{ 
      background: 'var(--gray-50)', 
      borderRadius: '12px', 
      padding: '20px',
      border: '1px solid var(--gray-200)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span style={{ fontSize: '24px' }}>{icon}</span>
        <div>
          <div style={{ fontWeight: '600', color: 'var(--gray-800)' }}>{label}</div>
          <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{description}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ 
            flex: 1, 
            height: '8px',
            accentColor: color || 'var(--primary)'
          }}
        />
        <span style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          color: color || 'var(--primary)',
          minWidth: '50px',
          textAlign: 'right'
        }}>
          {value}%
        </span>
      </div>
    </div>
  );

  if (completed) {
    return (
      <div className="wizard-container">
        <div className="wizard-content">
          <div className="success-page">
            <div className="success-icon">✓</div>
            <h2 className="success-title">配置完成！</h2>
            <p className="success-desc">
              项目 "{projectInfo.name}" 已完成配置
            </p>
          </div>

          <div style={{ maxWidth: '500px', margin: '0 auto 32px' }}>
            <h4 style={{ marginBottom: '16px' }}>配置校验结果</h4>
            <ul className="validation-list">
              {validationResults.map((result, index) => (
                <li key={index} className="validation-item">
                  <div className={`validation-icon ${result.status}`}>
                    {result.status === 'success' ? '✓' : result.status === 'warning' ? '!' : '×'}
                  </div>
                  <span>{result.name}</span>
                  <span className={`tag tag-${result.status === 'success' ? 'green' : result.status === 'warning' ? 'yellow' : 'red'}`} style={{ marginLeft: 'auto' }}>
                    {result.status === 'success' ? '通过' : result.status === 'warning' ? '警告' : '失败'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="success-actions">
            <button className="btn btn-primary btn-lg" onClick={handleExportConfig}>
              📥 导出配置文件
            </button>
            <button 
              className="btn btn-success btn-lg"
              onClick={() => {
                handleSaveProject();
                alert('项目已保存！');
              }}
            >
              💾 保存项目
            </button>
            {/* Phase 6: 配置预览按钮 */}
            <button 
              className="btn btn-info btn-lg"
              onClick={() => setShowPreviewModal(true)}
              style={{ background: '#6366f1', borderColor: '#6366f1' }}
            >
              👁️ 配置预览
            </button>
            {/* Phase 6: 配置下发按钮 */}
            <button 
              className="btn btn-warning btn-lg"
              onClick={handleDeployConfig}
              disabled={deployStatus === 'deploying'}
              style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
            >
              {deployStatus === 'deploying' ? '⏳ 下发中...' : '🚀 下发配置'}
            </button>
            <button 
              className="btn btn-secondary btn-lg"
              onClick={() => onNavigate('project-list', '项目管理')}
            >
              查看项目列表
            </button>
          </div>

          {/* Phase 6: 配置预览模态框 */}
          {showPreviewModal && (
            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '800px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0 }}>📋 配置预览</h3>
                  <button onClick={() => setShowPreviewModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
                </div>
                <pre style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', fontSize: '12px', overflow: 'auto', maxHeight: '50vh' }}>
                  {JSON.stringify(getCompleteConfig(), null, 2)}
                </pre>
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setShowPreviewModal(false)}>关闭</button>
                  <button className="btn btn-primary" onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(getCompleteConfig(), null, 2));
                    alert('配置已复制到剪贴板！');
                  }}>📋 复制配置</button>
                </div>
              </div>
            </div>
          )}

          {/* Phase 6: 下发状态提示 */}
          {deployStatus && (
            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                {deployStatus === 'deploying' && (
                  <>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                    <h3>正在下发配置...</h3>
                    <p style={{ color: '#666' }}>请稍候，正在将配置下发到设备</p>
                  </>
                )}
                {deployStatus === 'success' && (
                  <>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                    <h3 style={{ color: '#10b981' }}>下发成功！</h3>
                    <pre style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', fontSize: '12px', textAlign: 'left', whiteSpace: 'pre-wrap' }}>{deployMessage}</pre>
                    <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setDeployStatus(null)}>确定</button>
                  </>
                )}
                {deployStatus === 'error' && (
                  <>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                    <h3 style={{ color: '#ef4444' }}>下发失败</h3>
                    <p style={{ color: '#666' }}>{deployMessage}</p>
                    <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setDeployStatus(null)}>确定</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden-input"
        accept=".json"
        onChange={handleFileImport}
      />

      {/* 步骤条 */}
      <div className="steps-container">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className={`step-item ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}>
              <div className="step-number">
                {currentStep > step.id ? '✓' : step.id}
              </div>
              <span className="step-label">{step.name}</span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`step-connector ${currentStep > step.id ? 'completed' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="wizard-container">
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleImportTemplate}>
            📤 导入配置模板
          </button>
        </div>

        <div className="wizard-content">
          {/* 步骤1: 项目基础信息 - 完全按照参考图设计 */}
          {currentStep === 1 && (
            <div className="form-section">
              <div className="form-section-header">
                <span className="form-section-icon">🏢</span>
                <div>
                  <h3 className="form-section-title">项目基础信息</h3>
                  <p className="form-section-desc">填写项目的基本信息，这些信息将用于项目识别和管理</p>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    项目名称 <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="例如：杭州工厂储能项目"
                    value={projectInfo.name}
                    onChange={(e) => updateProjectInfo('name', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    项目位置 <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="例如：浙江省杭州市"
                    value={projectInfo.location}
                    onChange={(e) => updateProjectInfo('location', e.target.value)}
                  />
                </div>
              </div>

              {/* 系统类型选择 - 三选一卡片 - 优化视觉反馈 */}
              <div className="form-group">
                <label className="form-label">
                  系统类型 <span className="required">*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {systemTypes.map(type => {
                    const isSelected = projectInfo.systemType === type.id;
                    return (
                      <div
                        key={type.id}
                        onClick={() => updateProjectInfo('systemType', type.id)}
                        style={{
                          padding: '20px',
                          borderRadius: '12px',
                          border: isSelected 
                            ? '3px solid var(--primary)' 
                            : '2px solid var(--gray-200)',
                          background: isSelected 
                            ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' 
                            : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                          boxShadow: isSelected ? '0 4px 12px rgba(76, 175, 80, 0.3)' : 'none',
                          position: 'relative'
                        }}
                      >
                        {/* 选中勾选图标 */}
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '-10px',
                            right: '-10px',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                          }}>
                            ✓
                          </div>
                        )}
                        <div style={{ 
                          fontWeight: '600', 
                          marginBottom: '6px',
                          fontSize: '15px',
                          color: isSelected ? 'var(--primary)' : 'var(--gray-800)'
                        }}>
                          {isSelected && '● '}{type.name}
                        </div>
                        <div style={{ fontSize: '13px', color: isSelected ? 'var(--gray-700)' : 'var(--gray-500)' }}>
                          {type.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 容量和功率 */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">额定容量 (kWh)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={projectInfo.ratedCapacity}
                    onChange={(e) => updateProjectInfo('ratedCapacity', Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">额定功率 (kW)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={projectInfo.ratedPower}
                    onChange={(e) => updateProjectInfo('ratedPower', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">负责人</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="输入负责人姓名"
                    value={projectInfo.manager}
                    onChange={(e) => updateProjectInfo('manager', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">联系方式</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="输入手机号/座机"
                    value={projectInfo.contact}
                    onChange={(e) => updateProjectInfo('contact', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 步骤2: 场景模板选择 - 完全按照参考图设计 */}
          {currentStep === 2 && (
            <div className="form-section">
              <div className="form-section-header">
                <span className="form-section-icon">⚙️</span>
                <div>
                  <h3 className="form-section-title">选择场景模板</h3>
                  <p className="form-section-desc">选择一个预置的场景模板，系统将自动推荐适合的设备和算法参数</p>
                </div>
              </div>

              {/* 场景选择与模板管理关系说明 */}
              <div style={{
                background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px',
                border: '1px solid #bbdefb'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>💡</span>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1565c0', marginBottom: '8px' }}>
                      场景模板与模板管理的关系
                    </div>
                    <div style={{ fontSize: '13px', color: '#424242', lineHeight: '1.6' }}>
                      <strong>场景模板</strong>：是项目配置时的快捷入口，帮助您快速选择适合的设备组合和算法配置。<br/>
                      <strong>模板管理</strong>：是模板的管理中心，您可以在那里创建、编辑、删除自定义模板。<br/>
                      <span style={{ color: '#2e7d32' }}>✨ 在模板管理中创建的自定义模板会自动出现在下方场景列表中供选择。</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '20px',
                marginTop: '20px'
              }}>
                {sceneTemplates.map(template => {
                  const isSelected = selectedTemplate?.id === template.id;
                  return (
                    <div
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      style={{
                        padding: '24px',
                        borderRadius: '12px',
                        border: isSelected 
                          ? '3px solid var(--primary)' 
                          : '2px solid var(--gray-200)',
                        background: isSelected 
                          ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' 
                          : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                        boxShadow: isSelected ? '0 4px 12px rgba(76, 175, 80, 0.3)' : 'none',
                        display: 'flex',
                        gap: '16px',
                        position: 'relative'
                      }}
                    >
                      {/* 选中勾选图标 */}
                      {isSelected && (
                        <div style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '-10px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                        }}>
                          ✓
                        </div>
                      )}
                      <div style={{ 
                        width: '60px', 
                        height: '60px', 
                        background: isSelected ? 'white' : 'var(--gray-100)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '28px',
                        flexShrink: 0
                      }}>
                        {template.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: '600', 
                          fontSize: '16px',
                          marginBottom: '6px',
                          color: isSelected ? 'var(--primary)' : 'var(--gray-800)'
                        }}>
                          {isSelected && '● '}{template.name}
                        </div>
                        <div style={{ 
                          fontSize: '13px', 
                          color: isSelected ? 'var(--gray-700)' : 'var(--gray-500)',
                          marginBottom: '10px'
                        }}>
                          {template.description}
                        </div>
                        {template.devices.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {template.devices.map((device, idx) => (
                              <span 
                                key={`${template.id}-device-${idx}`}
                                style={{
                                  fontSize: '11px',
                                  padding: '3px 8px',
                                  background: isSelected ? 'white' : 'var(--gray-100)',
                                  borderRadius: '4px',
                                  color: 'var(--gray-600)'
                                }}
                              >
                                {device}
                              </span>
                            ))}
                            {template.extraDevices > 0 && (
                              <span style={{
                                fontSize: '11px',
                                padding: '3px 8px',
                                background: isSelected ? 'white' : 'var(--gray-100)',
                                borderRadius: '4px',
                                color: 'var(--gray-600)'
                              }}>
                                +{template.extraDevices}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedTemplate && (
                <div className="notice-banner success" style={{ marginTop: '20px' }}>
                  <span>✅</span>
                  <span>已选择 "{selectedTemplate.name}" 模板，推荐使用{
                    schedulingModes.find(m => m.id === selectedTemplate.recommendedAlgorithm)?.name || '经济优先'
                  }调度模式</span>
                </div>
              )}

              {/* 跳转到模板管理 */}
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: '#fafafa',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>找不到合适的模板？</div>
                  <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
                    您可以在模板管理中创建自己的专属模板
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('template-manager', '模板管理')}
                  className="btn btn-secondary"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  🔧 去模板管理
                </button>
              </div>
            </div>
          )}

          {/* 步骤3: 设备实例配置 */}
          {currentStep === 3 && (
            <div>
              <div className="form-section">
                <div className="form-section-header">
                  <span className="form-section-icon">📦</span>
                  <div>
                    <h3 className="form-section-title">设备实例配置</h3>
                    <p className="form-section-desc">选择物模型并配置设备实例，可批量添加相同类型设备</p>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '24px' }}>
                {/* 左侧：物模型库 */}
                <div style={{ flex: 1 }}>
                  <h4 style={{ marginBottom: '12px', color: 'var(--gray-700)' }}>物模型库</h4>
                  {deviceModels.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px' }}>
                      <div className="empty-state-icon">📦</div>
                      <div className="empty-state-title">暂无物模型</div>
                      <div className="empty-state-desc">请先创建物模型</div>
                      <button 
                        className="btn btn-primary"
                        onClick={() => onNavigate('device-model-wizard', '创建物模型')}
                      >
                        🔧 创建物模型
                      </button>
                    </div>
                  ) : (
                    <div className="device-cards">
                      {deviceModels.map(model => {
                        const category = deviceCategories.find(c => c.id === model.deviceCategory);
                        const device = category?.devices.find(d => d.id === model.deviceType);
                        const existingCount = selectedDevices.filter(d => d.id === model.id).length;
                        return (
                          <div key={model.id} className="device-card" style={{ cursor: 'pointer' }}>
                            <div className="device-card-icon">{device?.icon || '📦'}</div>
                            <div className="device-card-title">{model.modelName}</div>
                            <div className="device-card-desc">
                              {model.manufacturer} | {model.voltageLevel?.toUpperCase()}
                            </div>
                            {existingCount > 0 && (
                              <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '4px' }}>
                                已添加 {existingCount} 个
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                              <button 
                                className="btn btn-sm btn-primary" 
                                style={{ flex: 1 }}
                                onClick={() => handleAddDevice(model)}
                              >
                                ➕ 添加1个
                              </button>
                              <select
                                className="form-select"
                                style={{ width: '70px', padding: '4px 6px', fontSize: '12px' }}
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleBatchAddDevice(model, parseInt(e.target.value));
                                    e.target.value = '';
                                  }
                                }}
                              >
                                <option value="">批量</option>
                                <option value="2">+2</option>
                                <option value="3">+3</option>
                                <option value="5">+5</option>
                                <option value="10">+10</option>
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 右侧：已选设备 */}
                <div style={{ width: '350px' }}>
                  <h4 style={{ marginBottom: '12px', color: 'var(--gray-700)' }}>
                    已选设备 ({selectedDevices.length})
                  </h4>
                  {selectedDevices.length === 0 ? (
                    <div style={{
                      border: '2px dashed var(--gray-300)',
                      borderRadius: '8px',
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: 'var(--gray-400)'
                    }}>
                      点击左侧物模型添加设备
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                      {selectedDevices.map(device => (
                        <div
                          key={device.instanceId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px',
                            background: 'var(--gray-50)',
                            borderRadius: '8px',
                            border: '1px solid var(--gray-200)'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {device.instanceName}
                              <span style={{ 
                                fontSize: '10px', 
                                background: 'var(--primary)', 
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '10px'
                              }}>
                                #{device.instanceIndex}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                              {device.manufacturer} | 地址: {deviceParams[device.instanceId]?.slaveAddress}
                            </div>
                          </div>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRemoveDevice(device.instanceId)}
                          >
                            删除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {deviceModels.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => onNavigate('device-model-wizard', '创建物模型')}
                  >
                    ➕ 快速新建物模型
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 步骤4: 参数微调 - 分组折叠布局 */}
          {currentStep === 4 && (() => {
            // 按设备类型分组
            const deviceGroups = selectedDevices.reduce((groups, device) => {
              const category = device.category || 'other';
              if (!groups[category]) {
                groups[category] = [];
              }
              groups[category].push(device);
              return groups;
            }, {});

            // 分组配置
            const groupConfig = {
              storage: { name: '储能设备', icon: '🔋', color: '#4caf50' },
              pv: { name: '光伏设备', icon: '☀️', color: '#ff9800' },
              wind: { name: '风电设备', icon: '🌬️', color: '#2196f3' },
              charger: { name: '充电设备', icon: '⚡', color: '#9c27b0' },
              diesel: { name: '柴油发电', icon: '🚛', color: '#795548' },
              meter: { name: '计量设备', icon: '📊', color: '#607d8b' },
              other: { name: '其他设备', icon: '🔌', color: '#9e9e9e' }
            };

            // 搜索过滤
            const filterDevices = (devices) => {
              if (!paramSearchText) return devices;
              const searchLower = paramSearchText.toLowerCase();
              return devices.filter(d => 
                (d.instanceName || '').toLowerCase().includes(searchLower) ||
                (d.modelName || '').toLowerCase().includes(searchLower) ||
                (d.deviceType || '').toLowerCase().includes(searchLower) ||
                (deviceParams[d.instanceId]?.alias || '').toLowerCase().includes(searchLower)
              );
            };

            // 统计
            const enabledCount = selectedDevices.filter(d => deviceParams[d.instanceId]?.enabled !== false).length;

            // 物理通道选项
            const physicalPorts = [
              { id: 'eth0', name: 'ETH0 (以太网口1)', type: 'ethernet' },
              { id: 'eth1', name: 'ETH1 (以太网口2)', type: 'ethernet' },
              { id: 'rs485_1', name: 'RS485-1 (串口1)', type: 'serial' },
              { id: 'rs485_2', name: 'RS485-2 (串口2)', type: 'serial' },
              { id: 'can1', name: 'CAN-1 (CAN口1)', type: 'can' },
              { id: 'can2', name: 'CAN-2 (CAN口2)', type: 'can' }
            ];

            // 判断是否需要显示串口参数
            const getPortType = (portId) => {
              const port = physicalPorts.find(p => p.id === portId);
              return port?.type || 'ethernet';
            };

            return (
              <div className="form-section">
                <div className="form-section-header">
                  <span className="form-section-icon">🔧</span>
                  <div>
                    <h3 className="form-section-title">设备参数微调</h3>
                    <p className="form-section-desc">配置各设备的物理通道、通讯参数和业务参数（按类型分组，点击展开）</p>
                  </div>
                </div>

                {selectedDevices.length === 0 ? (
                  <div style={{ 
                    padding: '60px 20px', 
                    textAlign: 'center', 
                    color: 'var(--gray-500)',
                    background: 'var(--gray-50)',
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                    <div style={{ marginBottom: '12px' }}>请先在"设备选择"步骤中选择需要配置的设备</div>
                    <button 
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setCurrentStep(3)}
                    >
                      ← 返回设备选择
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* 工具栏: 搜索和统计 */}
                    <div style={{
                      display: 'flex',
                      gap: '20px',
                      marginBottom: '20px',
                      flexWrap: 'wrap',
                      alignItems: 'center'
                    }}>
                      {/* 搜索框 */}
                      <div style={{ flex: 1, minWidth: '250px' }}>
                        <input 
                          type="text"
                          className="form-input"
                          placeholder="🔍 搜索设备（名称、类型、别名）..."
                          value={paramSearchText}
                          onChange={(e) => setParamSearchText(e.target.value)}
                          style={{ background: 'white' }}
                        />
                      </div>
                      {/* 统计信息 */}
                      <div style={{
                        display: 'flex',
                        gap: '16px',
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                        borderRadius: '8px'
                      }}>
                        <span style={{ color: '#1565c0' }}>
                          <strong>{selectedDevices.length}</strong> 台设备
                        </span>
                        <span style={{ color: '#2e7d32' }}>
                          <strong>{enabledCount}</strong> 台启用
                        </span>
                        <span style={{ color: '#f57c00' }}>
                          <strong>{Object.keys(deviceGroups).length}</strong> 个分类
                        </span>
                      </div>
                      {/* 展开/折叠全部 */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                          onClick={() => {
                            const allGroups = {};
                            Object.keys(deviceGroups).forEach(g => allGroups[g] = true);
                            setExpandedGroups(allGroups);
                          }}
                        >
                          全部展开
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                          onClick={() => setExpandedGroups({})}
                        >
                          全部折叠
                        </button>
                      </div>
                    </div>

                    {/* 分组设备列表 */}
                    {Object.entries(deviceGroups).map(([category, devices]) => {
                      const config = groupConfig[category] || groupConfig.other;
                      const filteredDevices = filterDevices(devices);
                      const isGroupExpanded = expandedGroups[category];
                      
                      if (filteredDevices.length === 0 && paramSearchText) return null;

                      return (
                        <div key={category} style={{
                          marginBottom: '16px',
                          border: '1px solid var(--gray-200)',
                          borderRadius: '12px',
                          overflow: 'hidden'
                        }}>
                          {/* 分组标题 - 可点击展开/折叠 */}
                          <div 
                            onClick={() => setExpandedGroups(prev => ({
                              ...prev,
                              [category]: !prev[category]
                            }))}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '12px 16px',
                              background: `linear-gradient(135deg, ${config.color}15 0%, ${config.color}08 100%)`,
                              borderBottom: isGroupExpanded ? '1px solid var(--gray-200)' : 'none',
                              cursor: 'pointer',
                              userSelect: 'none'
                            }}
                          >
                            <span style={{ 
                              fontSize: '20px', 
                              marginRight: '10px',
                              transform: isGroupExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s'
                            }}>▶</span>
                            <span style={{ fontSize: '24px', marginRight: '12px' }}>{config.icon}</span>
                            <span style={{ 
                              fontWeight: '600', 
                              color: config.color, 
                              flex: 1 
                            }}>{config.name}</span>
                            <span style={{
                              padding: '4px 10px',
                              background: config.color,
                              color: 'white',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              {filteredDevices.length} 台
                            </span>
                          </div>

                          {/* 设备列表 */}
                          {isGroupExpanded && (
                            <div style={{ padding: '16px', background: 'var(--gray-50)' }}>
                              {filteredDevices.map((device) => {
                                const isDeviceExpanded = expandedDevices[device.instanceId];
                                const params = deviceParams[device.instanceId] || {};
                                const portType = getPortType(params.physicalPort || 'eth0');

                                return (
                                  <div key={device.instanceId} style={{
                                    marginBottom: '12px',
                                    background: 'white',
                                    borderRadius: '8px',
                                    border: '1px solid var(--gray-200)',
                                    overflow: 'hidden'
                                  }}>
                                    {/* 设备标题行 - 可折叠 */}
                                    <div
                                      onClick={() => setExpandedDevices(prev => ({
                                        ...prev,
                                        [device.instanceId]: !prev[device.instanceId]
                                      }))}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        background: isDeviceExpanded ? 'var(--gray-50)' : 'white'
                                      }}
                                    >
                                      <span style={{ 
                                        marginRight: '10px',
                                        color: 'var(--gray-400)',
                                        transform: isDeviceExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s'
                                      }}>▶</span>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '500', color: 'var(--gray-800)' }}>
                                          {device.instanceName || device.modelName || '未命名设备'}
                                          {params.alias && <span style={{ color: 'var(--gray-500)', marginLeft: '8px', fontSize: '13px' }}>({params.alias})</span>}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>
                                          {device.deviceType || '未知类型'} | 
                                          {physicalPorts.find(p => p.id === (params.physicalPort || 'eth0'))?.name || 'ETH0'} | 
                                          {params.ip || '未配置IP'}:{params.port || '502'}
                                        </div>
                                      </div>
                                      <span style={{
                                        padding: '3px 8px',
                                        background: params.enabled !== false ? '#c8e6c9' : '#ffcdd2',
                                        color: params.enabled !== false ? '#2e7d32' : '#c62828',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: '500'
                                      }}>
                                        {params.enabled !== false ? '启用' : '禁用'}
                                      </span>
                                    </div>

                                    {/* 设备详细配置 - 展开时显示 */}
                                    {isDeviceExpanded && (() => {
                                      // 获取设备物模型参数
                                      const deviceType = device.deviceType || 'default';
                                      const modelAttributes = deviceBasicAttributes[deviceType] || [];
                                      
                                      return (
                                        <div style={{ padding: '16px', borderTop: '1px solid var(--gray-200)' }}>
                                          {/* 设备物模型参数 - 来自deviceTypes.js */}
                                          {modelAttributes.length > 0 ? (
                                            <div style={{ marginBottom: '20px' }}>
                                              <h5 style={{ 
                                                margin: '0 0 12px 0', 
                                                color: 'var(--gray-700)',
                                                fontSize: '14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                              }}>
                                                <span>📋</span> 设备物模型参数
                                                <span style={{ 
                                                  fontSize: '11px', 
                                                  color: 'var(--gray-500)',
                                                  fontWeight: 'normal',
                                                  marginLeft: '8px'
                                                }}>
                                                  (来自物模型定义，可根据实际设备微调)
                                                </span>
                                              </h5>
                                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                                {modelAttributes.map((attr) => (
                                                  <div key={attr.key}>
                                                    <label className="form-label" style={{ fontSize: '12px' }}>
                                                      {attr.name}
                                                      {attr.unit && <span style={{ color: 'var(--gray-400)', marginLeft: '4px' }}>({attr.unit})</span>}
                                                    </label>
                                                    {attr.type === 'select' ? (
                                                      <select
                                                        className="form-select"
                                                        value={params[attr.key] ?? attr.default}
                                                        onChange={(e) => updateDeviceParam(device.instanceId, attr.key, e.target.value)}
                                                      >
                                                        {(attr.options || []).map((opt) => (
                                                          <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                      </select>
                                                    ) : attr.type === 'number' ? (
                                                      <input
                                                        type="number"
                                                        className="form-input"
                                                        placeholder={String(attr.default)}
                                                        value={params[attr.key] ?? attr.default}
                                                        onChange={(e) => updateDeviceParam(device.instanceId, attr.key, e.target.value, true)}
                                                      />
                                                    ) : (
                                                      <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder={String(attr.default)}
                                                        value={params[attr.key] ?? attr.default}
                                                        onChange={(e) => updateDeviceParam(device.instanceId, attr.key, e.target.value)}
                                                      />
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          ) : (
                                            <div style={{
                                              padding: '20px',
                                              background: 'var(--gray-50)',
                                              borderRadius: '8px',
                                              textAlign: 'center',
                                              color: 'var(--gray-500)',
                                              marginBottom: '20px'
                                            }}>
                                              <span style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }}>📝</span>
                                              <span>该设备类型 ({deviceType}) 暂无物模型参数定义</span>
                                            </div>
                                          )}

                                          {/* 启用状态 */}
                                          <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'space-between',
                                            padding: '12px 16px',
                                            background: 'var(--gray-50)',
                                            borderRadius: '8px',
                                            marginTop: '8px'
                                          }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              <span>⚙️</span>
                                              <span style={{ fontWeight: '500', color: 'var(--gray-700)' }}>设备启用状态</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                              <label style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '6px', 
                                                cursor: 'pointer' 
                                              }}>
                                                <input
                                                  type="radio"
                                                  name={`enabled-${device.instanceId}`}
                                                  checked={params.enabled !== false}
                                                  onChange={() => updateDeviceParam(device.instanceId, 'enabled', true)}
                                                />
                                                <span style={{ color: '#2e7d32' }}>✓ 启用</span>
                                              </label>
                                              <label style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '6px', 
                                                cursor: 'pointer' 
                                              }}>
                                                <input
                                                  type="radio"
                                                  name={`enabled-${device.instanceId}`}
                                                  checked={params.enabled === false}
                                                  onChange={() => updateDeviceParam(device.instanceId, 'enabled', false)}
                                                />
                                                <span style={{ color: '#c62828' }}>✗ 禁用</span>
                                              </label>
                                            </div>
                                          </div>

                                          {/* 物模型配置信息提示 */}
                                          <div style={{
                                            marginTop: '12px',
                                            padding: '10px 12px',
                                            background: '#e3f2fd',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            color: '#1565c0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                          }}>
                                            <span>💡</span>
                                            <span>以上参数默认值来自物模型配置，微调后的参数将用于当前项目</span>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* 步骤5: 电气拓扑 */}
          {currentStep === 5 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div className="form-section-header" style={{ marginBottom: 0 }}>
                  <span className="form-section-icon">🔌</span>
                  <div>
                    <h3 className="form-section-title" style={{ marginBottom: 0 }}>电气拓扑配置</h3>
                    <p className="form-section-desc" style={{ marginBottom: 0 }}>拖拽设备到画布，连接设备建立电气关系</p>
                  </div>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => setIsTopologyFullscreen(true)}
                >
                  🔍 全屏编辑
                </button>
              </div>

              <div className={`topology-container ${isTopologyFullscreen ? 'fullscreen' : ''}`}
                style={isTopologyFullscreen ? {
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1000,
                  background: 'white',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column'
                } : {}}
              >
                {isTopologyFullscreen && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0 }}>电气拓扑配置 - 全屏模式</h3>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setIsTopologyFullscreen(false)}
                    >
                      ✕ 退出全屏
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', flex: 1, gap: '16px' }}>
                  {/* 左侧设备列表 */}
                  <div className="topology-sidebar" style={isTopologyFullscreen ? { width: '220px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' } : {}}>
                    <div className="topology-sidebar-title">待配置设备</div>
                    {selectedDevices.map(device => {
                      const isOnCanvas = nodes.some(n => n.id === device.instanceId);
                      const category = deviceCategories.find(c => c.id === device.deviceCategory);
                      
                      return (
                        <div
                          key={device.instanceId}
                          className="draggable-device"
                          draggable={!isOnCanvas}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/json', JSON.stringify(device));
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          style={{
                            opacity: isOnCanvas ? 0.5 : 1,
                            cursor: isOnCanvas ? 'not-allowed' : 'grab'
                          }}
                        >
                          <span style={{ fontSize: '20px' }}>{category?.icon || '📦'}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '500' }}>{device.instanceName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                              {isOnCanvas ? '已在画布' : '拖拽到画布'}
                            </div>
                          </div>
                          {isOnCanvas && (
                            <button
                              className="btn btn-sm"
                              style={{ 
                                padding: '2px 6px', 
                                fontSize: '10px',
                                background: '#fee2e2',
                                color: '#dc2626',
                                border: 'none'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTopologyNode(device.instanceId);
                              }}
                            >
                              移除
                            </button>
                          )}
                        </div>
                      );
                    })}
                    
                    {selectedDevices.length === 0 && (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-400)', fontSize: '13px' }}>
                        暂无设备，请返回上一步添加
                      </div>
                    )}
                  </div>

                  {/* 右侧拓扑画布 */}
                  <div className="topology-canvas" style={isTopologyFullscreen ? { flex: 1, height: 'calc(100vh - 180px)' } : {}}>
                    <ReactFlowProvider>
                      <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onNodeClick={(event, node) => {
                          if (event.detail === 2) {
                            if (window.confirm(`确定从画布移除设备 "${node.id}" 吗？`)) {
                              handleDeleteTopologyNode(node.id);
                            }
                          }
                        }}
                        fitView
                        style={{ background: '#f8fafc' }}
                      >
                        <Controls />
                        <MiniMap />
                        <Background variant="dots" gap={20} size={1} />
                      </ReactFlow>
                    </ReactFlowProvider>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={handleAutoLayout}>
                  📐 自动布局
                </button>
                <button className="btn btn-secondary" onClick={() => setEdges([])}>
                  🔗 清除连线
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={() => {
                    if (window.confirm('确定清空画布上的所有设备和连线吗？')) {
                      setNodes([]);
                      setEdges([]);
                    }
                  }}
                >
                  🗑️ 清空画布
                </button>
              </div>
            </div>
          )}

          {/* 步骤6: 算法策略配置 - 完全按照参考图的Tab式设计 */}
          {currentStep === 6 && (
            <div>
              <div className="form-section">
                <div className="form-section-header">
                  <span className="form-section-icon">⚙️</span>
                  <div>
                    <h3 className="form-section-title">算法策略配置</h3>
                    <p className="form-section-desc">配置EMS调度算法的目标权重、约束参数和高级策略</p>
                  </div>
                </div>
              </div>

              {/* Tab切换栏 */}
              <div style={{ 
                display: 'flex', 
                background: 'var(--gray-100)', 
                borderRadius: '12px', 
                padding: '4px',
                marginBottom: '24px',
                flexWrap: 'wrap'
              }}>
                {[
                  { id: 'mode', name: '调度模式' },
                  { id: 'weight', name: '目标权重' },
                  { id: 'peakValley', name: '峰谷/需量' },
                  { id: 'integration', name: '设备接入' },
                  { id: 'constraint', name: '约束参数' },
                  { id: 'advanced', name: '高级策略' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setAlgorithmTab(tab.id)}
                    style={{
                      flex: 1,
                      padding: '12px 20px',
                      border: 'none',
                      borderRadius: '8px',
                      background: algorithmTab === tab.id ? 'white' : 'transparent',
                      color: algorithmTab === tab.id ? 'var(--gray-800)' : 'var(--gray-500)',
                      fontWeight: algorithmTab === tab.id ? '600' : '400',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: algorithmTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>

              {/* 调度模式Tab */}
              {algorithmTab === 'mode' && (
                <div>
                  {/* 策略预设快捷配置 */}
                  <div style={{
                    marginBottom: '28px',
                    padding: '20px',
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    borderRadius: '16px',
                    border: '2px solid #86efac'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '28px' }}>🎯</span>
                      <div>
                        <div style={{ fontWeight: '700', color: '#166534', fontSize: '16px' }}>快捷策略配置（推荐新手使用）</div>
                        <div style={{ fontSize: '13px', color: '#15803d' }}>点击下方预设，系统将自动配置所有相关策略参数</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                      {[
                        { 
                          id: 'maxEconomy', 
                          name: '💰 经济最大化', 
                          desc: '最大化峰谷套利收益',
                          config: {
                            schedulingMode: 'economic',
                            weights: { economic: 60, lifespan: 20, socBalance: 10, curtailmentMin: 10 },
                            constraints: { socMin: 10, socMax: 90, maxChargePower: 100, maxDischargePower: 100 },
                            peakShaving: { enabled: true },
                            demandControl: { enabled: true }
                          }
                        },
                        { 
                          id: 'longLife', 
                          name: '🔋 设备长寿命', 
                          desc: '延长电池使用寿命',
                          config: {
                            schedulingMode: 'lifespan',
                            weights: { economic: 20, lifespan: 60, socBalance: 10, curtailmentMin: 10 },
                            constraints: { socMin: 20, socMax: 80, maxChargePower: 70, maxDischargePower: 70 },
                            peakShaving: { enabled: true },
                            demandControl: { enabled: false }
                          }
                        },
                        { 
                          id: 'emergency', 
                          name: '🛡️ 应急保障', 
                          desc: '保留充足应急电量',
                          config: {
                            schedulingMode: 'balanced',
                            weights: { economic: 25, lifespan: 25, socBalance: 25, curtailmentMin: 25 },
                            constraints: { socMin: 40, socMax: 90, maxChargePower: 50, maxDischargePower: 50 },
                            peakShaving: { enabled: false },
                            demandControl: { enabled: true }
                          }
                        },
                        { 
                          id: 'smartBalance', 
                          name: '⚖️ 智能平衡', 
                          desc: '综合优化各项指标',
                          config: {
                            schedulingMode: 'balanced',
                            weights: { economic: 25, lifespan: 25, socBalance: 25, curtailmentMin: 25 },
                            constraints: { socMin: 15, socMax: 85, maxChargePower: 80, maxDischargePower: 80 },
                            peakShaving: { enabled: true },
                            demandControl: { enabled: true }
                          }
                        }
                      ].map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => {
                            setAlgorithmConfig(prev => ({
                              ...prev,
                              schedulingMode: preset.config.schedulingMode,
                              weights: preset.config.weights,
                              constraints: { ...prev.constraints, ...preset.config.constraints },
                              peakShaving: { ...prev.peakShaving, enabled: preset.config.peakShaving.enabled },
                              demandControl: { ...prev.demandControl, enabled: preset.config.demandControl.enabled }
                            }));
                            alert(`✅ 已应用"${preset.name}"预设配置！\n\n配置内容：\n• SOC范围: ${preset.config.constraints.socMin}%-${preset.config.constraints.socMax}%\n• 功率限制: ${preset.config.constraints.maxDischargePower}%\n• 削峰填谷: ${preset.config.peakShaving.enabled ? '开启' : '关闭'}\n• 需量控制: ${preset.config.demandControl.enabled ? '开启' : '关闭'}`);
                          }}
                          style={{
                            padding: '16px 12px',
                            background: 'white',
                            border: '2px solid #a7f3d0',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#ecfdf5'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                          <div style={{ fontSize: '24px', marginBottom: '8px' }}>{preset.name.split(' ')[0]}</div>
                          <div style={{ fontWeight: '600', color: '#166534', fontSize: '13px', marginBottom: '4px' }}>{preset.name.split(' ').slice(1).join(' ')}</div>
                          <div style={{ fontSize: '11px', color: '#15803d' }}>{preset.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <h4 style={{ marginBottom: '16px', color: 'var(--gray-700)' }}>调度模式选择</h4>
                  <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '20px' }}>
                    选择调度模式后，系统将自动配置所有相关策略参数（包括权重、SOC限制、功率限制、调度周期等）
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {schedulingModes.map(mode => {
                      const isSelected = algorithmConfig.schedulingMode === mode.id;
                      // 定义各模式对应的完整策略参数配置
                      const modeFullConfig = {
                        economic: {
                          weights: { economic: 60, lifespan: 20, socBalance: 10, curtailmentMin: 10 },
                          socManagement: { minSoc: 10, maxSoc: 90, targetSoc: 50 },
                          constraints: { socChargeMin: 10, socDischargeMax: 90, powerLimit: 100 },
                          advanced: { schedulingPeriod: 15, predictionHorizon: 4, safetyMargin: 5, gridPeakShaving: true, loadFollowing: true },
                          peakShaving: { enabled: true },
                          demandControl: { enabled: true }
                        },
                        lifespan: {
                          weights: { economic: 20, lifespan: 60, socBalance: 10, curtailmentMin: 10 },
                          socManagement: { minSoc: 20, maxSoc: 80, targetSoc: 50 },
                          constraints: { socChargeMin: 20, socDischargeMax: 80, powerLimit: 70 },
                          advanced: { schedulingPeriod: 30, predictionHorizon: 2, safetyMargin: 10, gridPeakShaving: true, loadFollowing: false },
                          peakShaving: { enabled: true },
                          demandControl: { enabled: false }
                        },
                        balanced: {
                          weights: { economic: 25, lifespan: 25, socBalance: 25, curtailmentMin: 25 },
                          socManagement: { minSoc: 15, maxSoc: 85, targetSoc: 50 },
                          constraints: { socChargeMin: 15, socDischargeMax: 85, powerLimit: 85 },
                          advanced: { schedulingPeriod: 15, predictionHorizon: 4, safetyMargin: 5, gridPeakShaving: true, loadFollowing: true },
                          peakShaving: { enabled: true },
                          demandControl: { enabled: true }
                        },
                        custom: null // 自定义不自动设置
                      };
                      
                      const config = modeFullConfig[mode.id];
                      
                      return (
                        <div
                          key={mode.id}
                          onClick={() => {
                            if (config) {
                              // 非自定义模式：设置所有相关参数
                              setAlgorithmConfig(prev => ({
                                ...prev,
                                schedulingMode: mode.id,
                                weights: config.weights,
                                socManagement: { ...prev.socManagement, ...config.socManagement },
                                constraints: { ...prev.constraints, ...config.constraints },
                                advanced: { ...prev.advanced, ...config.advanced },
                                peakShaving: { ...prev.peakShaving, ...config.peakShaving },
                                demandControl: { ...prev.demandControl, ...config.demandControl }
                              }));
                              // 显示配置应用提示
                              window.alert(`已应用"${mode.name}"模式配置:\n\n` +
                                `• 权重: 经济${config.weights.economic}% / 寿命${config.weights.lifespan}%\n` +
                                `• SOC范围: ${config.socManagement.minSoc}% - ${config.socManagement.maxSoc}%\n` +
                                `• 功率限制: ${config.constraints.powerLimit}%\n` +
                                `• 调度周期: ${config.advanced.schedulingPeriod}分钟\n` +
                                `• 削峰填谷: ${config.peakShaving.enabled ? '开启' : '关闭'}\n` +
                                `• 需量控制: ${config.demandControl.enabled ? '开启' : '关闭'}`
                              );
                            } else {
                              // 自定义模式：只切换模式，不改变参数
                              setAlgorithmConfig(prev => ({
                                ...prev,
                                schedulingMode: mode.id
                              }));
                            }
                          }}
                          style={{
                            padding: '24px',
                            borderRadius: '12px',
                            border: isSelected 
                              ? '3px solid var(--primary)' 
                              : '1px solid var(--gray-200)',
                            background: isSelected 
                              ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' 
                              : 'white',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s',
                            transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                            boxShadow: isSelected ? '0 4px 12px rgba(76, 175, 80, 0.3)' : 'none',
                            position: 'relative'
                          }}
                        >
                          {/* 选中勾选图标 */}
                          {isSelected && (
                            <div style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: '#4caf50',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: 'bold'
                            }}>
                              ✓
                            </div>
                          )}
                          <div style={{ fontSize: '36px', marginBottom: '12px' }}>{mode.icon}</div>
                          <div style={{ 
                            fontWeight: '600',
                            color: isSelected ? '#2e7d32' : 'var(--gray-800)',
                            fontSize: '16px'
                          }}>
                            {mode.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '4px' }}>
                            {mode.description}
                          </div>
                          {/* 参数预览 */}
                          {config && (
                            <div style={{ 
                              marginTop: '12px', 
                              padding: '8px', 
                              background: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--gray-50)', 
                              borderRadius: '6px',
                              fontSize: '11px',
                              color: 'var(--gray-600)'
                            }}>
                              <div>SOC: {config.socManagement.minSoc}%-{config.socManagement.maxSoc}%</div>
                              <div>功率: {config.constraints.powerLimit}% · 周期: {config.advanced.schedulingPeriod}分钟</div>
                            </div>
                          )}
                          {mode.id === 'custom' && (
                            <div style={{ 
                              marginTop: '12px', 
                              padding: '8px', 
                              background: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--gray-50)', 
                              borderRadius: '6px',
                              fontSize: '11px',
                              color: 'var(--gray-600)'
                            }}>
                              手动调整各项权重
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 当前策略配置总览 */}
                  <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid var(--gray-200)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h5 style={{ margin: 0, color: 'var(--gray-700)', fontSize: '14px' }}>当前策略配置总览</h5>
                      <span style={{ 
                        fontSize: '12px', 
                        color: algorithmConfig.schedulingMode === 'custom' ? '#1976d2' : '#2e7d32',
                        fontWeight: '500'
                      }}>
                        {schedulingModes.find(m => m.id === algorithmConfig.schedulingMode)?.name || '未选择'}
                      </span>
                    </div>
                    {/* 权重配置 */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ flex: 1, padding: '8px', background: '#e8f5e9', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#2e7d32' }}>{algorithmConfig.weights.economic}%</div>
                        <div style={{ fontSize: '10px', color: '#388e3c' }}>经济性</div>
                      </div>
                      <div style={{ flex: 1, padding: '8px', background: '#e3f2fd', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1565c0' }}>{algorithmConfig.weights.lifespan}%</div>
                        <div style={{ fontSize: '10px', color: '#1976d2' }}>寿命</div>
                      </div>
                      <div style={{ flex: 1, padding: '8px', background: '#f3e5f5', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#7b1fa2' }}>{algorithmConfig.weights.socBalance}%</div>
                        <div style={{ fontSize: '10px', color: '#8e24aa' }}>SOC协同</div>
                      </div>
                      <div style={{ flex: 1, padding: '8px', background: '#fff3e0', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#e65100' }}>{algorithmConfig.weights.curtailmentMin}%</div>
                        <div style={{ fontSize: '10px', color: '#f57c00' }}>弃电最小</div>
                      </div>
                    </div>
                    {/* 核心参数配置 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '12px' }}>
                      <div style={{ padding: '8px', background: 'white', borderRadius: '6px', border: '1px solid var(--gray-200)' }}>
                        <div style={{ color: 'var(--gray-500)' }}>SOC范围</div>
                        <div style={{ fontWeight: '600', color: 'var(--gray-800)' }}>
                          {algorithmConfig.socManagement.minSoc}% - {algorithmConfig.socManagement.maxSoc}%
                        </div>
                      </div>
                      <div style={{ padding: '8px', background: 'white', borderRadius: '6px', border: '1px solid var(--gray-200)' }}>
                        <div style={{ color: 'var(--gray-500)' }}>调度周期</div>
                        <div style={{ fontWeight: '600', color: 'var(--gray-800)' }}>
                          {algorithmConfig.advanced.schedulingPeriod}分钟
                        </div>
                      </div>
                      <div style={{ padding: '8px', background: 'white', borderRadius: '6px', border: '1px solid var(--gray-200)' }}>
                        <div style={{ color: 'var(--gray-500)' }}>削峰填谷</div>
                        <div style={{ fontWeight: '600', color: algorithmConfig.peakShaving.enabled ? '#2e7d32' : '#d32f2f' }}>
                          {algorithmConfig.peakShaving.enabled ? '✓ 开启' : '✗ 关闭'}
                        </div>
                      </div>
                      <div style={{ padding: '8px', background: 'white', borderRadius: '6px', border: '1px solid var(--gray-200)' }}>
                        <div style={{ color: 'var(--gray-500)' }}>需量控制</div>
                        <div style={{ fontWeight: '600', color: algorithmConfig.demandControl.enabled ? '#2e7d32' : '#d32f2f' }}>
                          {algorithmConfig.demandControl.enabled ? '✓ 开启' : '✗ 关闭'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 目标权重Tab */}
              {algorithmTab === 'weight' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                    <WeightSlider
                      label="经济性权重"
                      icon="💵"
                      description="电费成本最小化"
                      value={algorithmConfig.weights.economic}
                      onChange={(v) => setAlgorithmConfig(prev => ({
                        ...prev,
                        weights: { ...prev.weights, economic: v }
                      }))}
                      color="#10b981"
                    />
                    <WeightSlider
                      label="寿命权重"
                      icon="🔋"
                      description="储能充放电平滑"
                      value={algorithmConfig.weights.lifespan}
                      onChange={(v) => setAlgorithmConfig(prev => ({
                        ...prev,
                        weights: { ...prev.weights, lifespan: v }
                      }))}
                      color="#3b82f6"
                    />
                    <WeightSlider
                      label="SOC协同权重"
                      icon="📊"
                      description="多储能均衡"
                      value={algorithmConfig.weights.socBalance}
                      onChange={(v) => setAlgorithmConfig(prev => ({
                        ...prev,
                        weights: { ...prev.weights, socBalance: v }
                      }))}
                      color="#8b5cf6"
                    />
                    <WeightSlider
                      label="弃电最小化权重"
                      icon="⚡"
                      description="减少弃风弃光"
                      value={algorithmConfig.weights.curtailmentMin}
                      onChange={(v) => setAlgorithmConfig(prev => ({
                        ...prev,
                        weights: { ...prev.weights, curtailmentMin: v }
                      }))}
                      color="#f59e0b"
                    />
                  </div>
                  
                  {/* 权重总和显示 */}
                  {(() => {
                    const total = algorithmConfig.weights.economic + algorithmConfig.weights.lifespan + 
                                  algorithmConfig.weights.socBalance + algorithmConfig.weights.curtailmentMin;
                    const isValid = total >= 95 && total <= 105;
                    return (
                      <div className={`notice-banner ${isValid ? 'success' : 'warning'}`} style={{ marginTop: '20px' }}>
                        <span>{isValid ? '✅' : '⚠️'}</span>
                        <span>
                          当前权重总和: <strong>{total}%</strong>
                          {isValid ? ' - 配置有效，系统会自动归一化处理' : ' - 建议调整到接近100%'}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 峰谷/需量Tab - 新增 */}
              {algorithmTab === 'peakValley' && (
                <div>
                  {/* 策略效果预览 - 实时计算 */}
                  <div style={{
                    marginBottom: '24px',
                    padding: '20px',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    borderRadius: '16px',
                    border: '2px solid #fbbf24'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '28px' }}>📊</span>
                      <div>
                        <div style={{ fontWeight: '700', color: '#92400e', fontSize: '16px' }}>当前配置效果预览</div>
                        <div style={{ fontSize: '13px', color: '#b45309' }}>根据您的配置实时计算预期效果</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div style={{ padding: '16px', background: 'white', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#78716c', marginBottom: '6px' }}>可用SOC范围</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>
                          {algorithmConfig.constraints.socMax - algorithmConfig.constraints.socMin}%
                        </div>
                        <div style={{ fontSize: '11px', color: '#78716c' }}>
                          {algorithmConfig.constraints.socMin}% - {algorithmConfig.constraints.socMax}%
                        </div>
                      </div>
                      <div style={{ padding: '16px', background: 'white', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#78716c', marginBottom: '6px' }}>预计日运行时段</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>
                          {algorithmConfig.peakShaving.enabled ? 
                            (algorithmConfig.peakShaving.peakPeriods.length + algorithmConfig.peakShaving.valleyPeriods.length) * 2 : 0}h
                        </div>
                        <div style={{ fontSize: '11px', color: '#78716c' }}>
                          {algorithmConfig.peakShaving.enabled ? '峰谷调度' : '未启用削峰'}
                        </div>
                      </div>
                      <div style={{ padding: '16px', background: 'white', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#78716c', marginBottom: '6px' }}>预计日节省</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#ea580c' }}>
                          ¥{algorithmConfig.peakShaving.enabled ? 
                            Math.round((algorithmConfig.constraints.socMax - algorithmConfig.constraints.socMin) * 
                            (algorithmConfig.pricing.peakPrice - algorithmConfig.pricing.valleyPrice) * 10) : 0}
                        </div>
                        <div style={{ fontSize: '11px', color: '#78716c' }}>基于峰谷价差</div>
                      </div>
                      <div style={{ padding: '16px', background: 'white', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#78716c', marginBottom: '6px' }}>功率利用率</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#7c3aed' }}>
                          {algorithmConfig.constraints.maxDischargePower}%
                        </div>
                        <div style={{ fontSize: '11px', color: '#78716c' }}>最大放电功率</div>
                      </div>
                    </div>
                  </div>

                  {/* 策略冲突检测 */}
                  {(algorithmConfig.constraints.socMin >= algorithmConfig.constraints.socMax || 
                    (algorithmConfig.peakShaving.enabled && !algorithmConfig.pricing.peakPrice)) && (
                    <div style={{
                      marginBottom: '24px',
                      padding: '16px',
                      background: '#fef2f2',
                      borderRadius: '12px',
                      border: '2px solid #fca5a5'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>⚠️</span>
                        <div>
                          <div style={{ fontWeight: '600', color: '#dc2626', marginBottom: '4px' }}>检测到配置问题</div>
                          <div style={{ fontSize: '13px', color: '#b91c1c' }}>
                            {algorithmConfig.constraints.socMin >= algorithmConfig.constraints.socMax && (
                              <div>• SOC下限({algorithmConfig.constraints.socMin}%)不能大于或等于上限({algorithmConfig.constraints.socMax}%)</div>
                            )}
                            {algorithmConfig.peakShaving.enabled && !algorithmConfig.pricing.peakPrice && (
                              <div>• 已启用削峰填谷但未配置峰时电价，请在下方电价配置中填写</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 快捷配置模板 */}
                  <div style={{ marginBottom: '24px', padding: '16px', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', borderRadius: '12px', border: '2px solid #818cf8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '20px' }}>⚡</span>
                      <div style={{ fontWeight: '600', color: '#4338ca' }}>快捷配置模板</div>
                      <div style={{ fontSize: '12px', color: '#6366f1' }}>一键应用常用峰谷时段配置</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      <button
                        className="btn"
                        style={{ padding: '12px', background: 'white', border: '2px solid #a5b4fc', borderRadius: '8px', cursor: 'pointer' }}
                        onClick={() => {
                          setAlgorithmConfig(prev => ({
                            ...prev,
                            peakShaving: {
                              enabled: true,
                              peakPeriods: [
                                { id: 1, name: '上午高峰', startTime: '09:00', endTime: '11:30', action: 'discharge', maxPower: 200 },
                                { id: 2, name: '下午高峰', startTime: '14:00', endTime: '17:00', action: 'discharge', maxPower: 200 },
                                { id: 3, name: '晚间高峰', startTime: '19:00', endTime: '21:00', action: 'discharge', maxPower: 200 }
                              ],
                              valleyPeriods: [
                                { id: 1, name: '夜间低谷', startTime: '23:00', endTime: '07:00', action: 'charge', maxPower: 200 }
                              ]
                            },
                            pricing: { ...prev.pricing, peakPrice: 1.2, valleyPrice: 0.35, flatPrice: 0.7 }
                          }));
                          alert('✅ 已应用"工商业峰谷"模板！\n\n峰时段: 09:00-11:30, 14:00-17:00, 19:00-21:00\n谷时段: 23:00-07:00\n峰时电价: ¥1.2/kWh\n谷时电价: ¥0.35/kWh');
                        }}
                      >
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>🏭</div>
                        <div style={{ fontWeight: '600', fontSize: '13px' }}>工商业峰谷</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>三峰一谷模式</div>
                      </button>
                      <button
                        className="btn"
                        style={{ padding: '12px', background: 'white', border: '2px solid #a5b4fc', borderRadius: '8px', cursor: 'pointer' }}
                        onClick={() => {
                          setAlgorithmConfig(prev => ({
                            ...prev,
                            peakShaving: {
                              enabled: true,
                              peakPeriods: [
                                { id: 1, name: '早高峰', startTime: '08:00', endTime: '11:00', action: 'discharge', maxPower: 150 },
                                { id: 2, name: '晚高峰', startTime: '17:00', endTime: '21:00', action: 'discharge', maxPower: 150 }
                              ],
                              valleyPeriods: [
                                { id: 1, name: '夜间低谷', startTime: '22:00', endTime: '06:00', action: 'charge', maxPower: 150 }
                              ]
                            },
                            pricing: { ...prev.pricing, peakPrice: 0.85, valleyPrice: 0.35, flatPrice: 0.55 }
                          }));
                          alert('✅ 已应用"居民用电"模板！\n\n峰时段: 08:00-11:00, 17:00-21:00\n谷时段: 22:00-06:00\n峰时电价: ¥0.85/kWh\n谷时电价: ¥0.35/kWh');
                        }}
                      >
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>🏠</div>
                        <div style={{ fontWeight: '600', fontSize: '13px' }}>居民用电</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>两峰一谷模式</div>
                      </button>
                      <button
                        className="btn"
                        style={{ padding: '12px', background: 'white', border: '2px solid #a5b4fc', borderRadius: '8px', cursor: 'pointer' }}
                        onClick={() => {
                          setAlgorithmConfig(prev => ({
                            ...prev,
                            peakShaving: {
                              enabled: true,
                              peakPeriods: [
                                { id: 1, name: '尖峰时段', startTime: '10:00', endTime: '12:00', action: 'discharge', maxPower: 300 },
                                { id: 2, name: '高峰时段1', startTime: '08:00', endTime: '10:00', action: 'discharge', maxPower: 250 },
                                { id: 3, name: '高峰时段2', startTime: '14:00', endTime: '17:00', action: 'discharge', maxPower: 250 },
                                { id: 4, name: '晚间高峰', startTime: '19:00', endTime: '22:00', action: 'discharge', maxPower: 200 }
                              ],
                              valleyPeriods: [
                                { id: 1, name: '深夜低谷', startTime: '00:00', endTime: '06:00', action: 'charge', maxPower: 250 },
                                { id: 2, name: '午间低谷', startTime: '12:00', endTime: '14:00', action: 'charge', maxPower: 150 }
                              ]
                            },
                            pricing: { ...prev.pricing, peakPrice: 1.5, valleyPrice: 0.25, flatPrice: 0.8 }
                          }));
                          alert('✅ 已应用"尖峰平谷"模板！\n\n尖峰: 10:00-12:00\n高峰: 08:00-10:00, 14:00-17:00, 19:00-22:00\n谷时: 00:00-06:00, 12:00-14:00\n尖峰电价: ¥1.5/kWh\n谷时电价: ¥0.25/kWh');
                        }}
                      >
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>⚡</div>
                        <div style={{ fontWeight: '600', fontSize: '13px' }}>尖峰平谷</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>四档电价模式</div>
                      </button>
                    </div>
                  </div>

                  {/* 24小时时段可视化 */}
                  {algorithmConfig.peakShaving.enabled && (
                    <div style={{ marginBottom: '24px', padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #86efac' }}>
                      <div style={{ fontWeight: '600', marginBottom: '12px', color: '#166534' }}>📊 24小时时段分布预览</div>
                      <div style={{ display: 'flex', height: '40px', borderRadius: '8px', overflow: 'hidden', background: '#e5e7eb' }}>
                        {Array.from({ length: 24 }, (_, hour) => {
                          // 检查当前小时是否在峰时段
                          const isPeak = algorithmConfig.peakShaving.peakPeriods.some(p => {
                            const start = parseInt(p.startTime.split(':')[0]);
                            const end = parseInt(p.endTime.split(':')[0]);
                            if (start < end) return hour >= start && hour < end;
                            return hour >= start || hour < end; // 跨午夜
                          });
                          // 检查当前小时是否在谷时段
                          const isValley = algorithmConfig.peakShaving.valleyPeriods.some(p => {
                            const start = parseInt(p.startTime.split(':')[0]);
                            const end = parseInt(p.endTime.split(':')[0]);
                            if (start < end) return hour >= start && hour < end;
                            return hour >= start || hour < end; // 跨午夜
                          });
                          return (
                            <div
                              key={hour}
                              style={{
                                flex: 1,
                                background: isPeak ? '#fbbf24' : isValley ? '#3b82f6' : '#9ca3af',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                color: 'white',
                                fontWeight: '600',
                                borderRight: '1px solid rgba(255,255,255,0.3)'
                              }}
                              title={`${hour}:00 - ${isPeak ? '峰时段(放电)' : isValley ? '谷时段(充电)' : '平时段'}`}
                            >
                              {hour}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '8px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#fbbf24' }}></div>
                          <span>峰时段(放电)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#3b82f6' }}></div>
                          <span>谷时段(充电)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#9ca3af' }}></div>
                          <span>平时段</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 削峰填谷配置 */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>⚡</span> 削峰填谷策略
                      </h4>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={algorithmConfig.peakShaving.enabled}
                          onChange={(e) => setAlgorithmConfig(prev => ({
                            ...prev,
                            peakShaving: { ...prev.peakShaving, enabled: e.target.checked }
                          }))}
                        />
                        <span>启用</span>
                      </label>
                    </div>
                    
                    {algorithmConfig.peakShaving.enabled && (
                      <>
                        {/* 峰时段配置 */}
                        <div style={{ marginBottom: '16px', padding: '16px', background: '#fef3c7', borderRadius: '8px' }}>
                          <div style={{ fontWeight: '600', marginBottom: '12px', color: '#b45309' }}>🔺 峰时段（放电）</div>
                          {algorithmConfig.peakShaving.peakPeriods.map((period, index) => (
                            <div key={period.id} style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'center' }}>
                              <input
                                type="text"
                                className="form-input"
                                style={{ width: '100px' }}
                                value={period.name}
                                onChange={(e) => {
                                  const newPeriods = [...algorithmConfig.peakShaving.peakPeriods];
                                  newPeriods[index] = { ...period, name: e.target.value };
                                  setAlgorithmConfig(prev => ({
                                    ...prev,
                                    peakShaving: { ...prev.peakShaving, peakPeriods: newPeriods }
                                  }));
                                }}
                              />
                              <input
                                type="time"
                                className="form-input"
                                style={{ width: '120px' }}
                                value={period.startTime}
                                onChange={(e) => {
                                  const newPeriods = [...algorithmConfig.peakShaving.peakPeriods];
                                  newPeriods[index] = { ...period, startTime: e.target.value };
                                  setAlgorithmConfig(prev => ({
                                    ...prev,
                                    peakShaving: { ...prev.peakShaving, peakPeriods: newPeriods }
                                  }));
                                }}
                              />
                              <span>-</span>
                              <input
                                type="time"
                                className="form-input"
                                style={{ width: '120px' }}
                                value={period.endTime}
                                onChange={(e) => {
                                  const newPeriods = [...algorithmConfig.peakShaving.peakPeriods];
                                  newPeriods[index] = { ...period, endTime: e.target.value };
                                  setAlgorithmConfig(prev => ({
                                    ...prev,
                                    peakShaving: { ...prev.peakShaving, peakPeriods: newPeriods }
                                  }));
                                }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                  type="number"
                                  className="form-input"
                                  style={{ width: '80px' }}
                                  value={period.maxPower}
                                  onChange={(e) => {
                                    const newPeriods = [...algorithmConfig.peakShaving.peakPeriods];
                                    newPeriods[index] = { ...period, maxPower: Number(e.target.value) };
                                    setAlgorithmConfig(prev => ({
                                      ...prev,
                                      peakShaving: { ...prev.peakShaving, peakPeriods: newPeriods }
                                    }));
                                  }}
                                />
                                <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>kW</span>
                              </div>
                              <button
                                className="btn btn-sm"
                                style={{ background: '#fee2e2', color: '#dc2626', border: 'none' }}
                                onClick={() => {
                                  const newPeriods = algorithmConfig.peakShaving.peakPeriods.filter((_, i) => i !== index);
                                  setAlgorithmConfig(prev => ({
                                    ...prev,
                                    peakShaving: { ...prev.peakShaving, peakPeriods: newPeriods }
                                  }));
                                }}
                              >
                                删除
                              </button>
                            </div>
                          ))}
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                              const newPeriod = { id: Date.now(), name: '新峰时段', startTime: '09:00', endTime: '11:00', action: 'discharge', maxPower: 200 };
                              setAlgorithmConfig(prev => ({
                                ...prev,
                                peakShaving: { ...prev.peakShaving, peakPeriods: [...prev.peakShaving.peakPeriods, newPeriod] }
                              }));
                            }}
                          >
                            + 添加峰时段
                          </button>
                        </div>

                        {/* 谷时段配置 */}
                        <div style={{ padding: '16px', background: '#dbeafe', borderRadius: '8px' }}>
                          <div style={{ fontWeight: '600', marginBottom: '12px', color: '#1d4ed8' }}>🔻 谷时段（充电）</div>
                          {algorithmConfig.peakShaving.valleyPeriods.map((period, index) => (
                            <div key={period.id} style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'center' }}>
                              <input
                                type="text"
                                className="form-input"
                                style={{ width: '100px' }}
                                value={period.name}
                                onChange={(e) => {
                                  const newPeriods = [...algorithmConfig.peakShaving.valleyPeriods];
                                  newPeriods[index] = { ...period, name: e.target.value };
                                  setAlgorithmConfig(prev => ({
                                    ...prev,
                                    peakShaving: { ...prev.peakShaving, valleyPeriods: newPeriods }
                                  }));
                                }}
                              />
                              <input
                                type="time"
                                className="form-input"
                                style={{ width: '120px' }}
                                value={period.startTime}
                                onChange={(e) => {
                                  const newPeriods = [...algorithmConfig.peakShaving.valleyPeriods];
                                  newPeriods[index] = { ...period, startTime: e.target.value };
                                  setAlgorithmConfig(prev => ({
                                    ...prev,
                                    peakShaving: { ...prev.peakShaving, valleyPeriods: newPeriods }
                                  }));
                                }}
                              />
                              <span>-</span>
                              <input
                                type="time"
                                className="form-input"
                                style={{ width: '120px' }}
                                value={period.endTime}
                                onChange={(e) => {
                                  const newPeriods = [...algorithmConfig.peakShaving.valleyPeriods];
                                  newPeriods[index] = { ...period, endTime: e.target.value };
                                  setAlgorithmConfig(prev => ({
                                    ...prev,
                                    peakShaving: { ...prev.peakShaving, valleyPeriods: newPeriods }
                                  }));
                                }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                  type="number"
                                  className="form-input"
                                  style={{ width: '80px' }}
                                  value={period.maxPower}
                                  onChange={(e) => {
                                    const newPeriods = [...algorithmConfig.peakShaving.valleyPeriods];
                                    newPeriods[index] = { ...period, maxPower: Number(e.target.value) };
                                    setAlgorithmConfig(prev => ({
                                      ...prev,
                                      peakShaving: { ...prev.peakShaving, valleyPeriods: newPeriods }
                                    }));
                                  }}
                                />
                                <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>kW</span>
                              </div>
                              <button
                                className="btn btn-sm"
                                style={{ background: '#fee2e2', color: '#dc2626', border: 'none' }}
                                onClick={() => {
                                  const newPeriods = algorithmConfig.peakShaving.valleyPeriods.filter((_, i) => i !== index);
                                  setAlgorithmConfig(prev => ({
                                    ...prev,
                                    peakShaving: { ...prev.peakShaving, valleyPeriods: newPeriods }
                                  }));
                                }}
                              >
                                删除
                              </button>
                            </div>
                          ))}
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                              const newPeriod = { id: Date.now(), name: '新谷时段', startTime: '00:00', endTime: '06:00', action: 'charge', maxPower: 200 };
                              setAlgorithmConfig(prev => ({
                                ...prev,
                                peakShaving: { ...prev.peakShaving, valleyPeriods: [...prev.peakShaving.valleyPeriods, newPeriod] }
                              }));
                            }}
                          >
                            + 添加谷时段
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* 需量控制配置 */}
                  <div style={{ marginBottom: '24px', padding: '20px', background: 'var(--gray-50)', borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📊</span> 需量控制
                      </h4>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={algorithmConfig.demandControl.enabled}
                          onChange={(e) => setAlgorithmConfig(prev => ({
                            ...prev,
                            demandControl: { ...prev.demandControl, enabled: e.target.checked }
                          }))}
                        />
                        <span>启用</span>
                      </label>
                    </div>
                    
                    {algorithmConfig.demandControl.enabled && (
                      <>
                        {/* 需量基本参数 */}
                        <div className="form-row form-row-4" style={{ marginBottom: '16px' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">需量限制 (kW)</label>
                            <input
                              type="number"
                              className="form-input"
                              value={algorithmConfig.demandControl.demandLimit}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev,
                                demandControl: { ...prev.demandControl, demandLimit: Number(e.target.value) }
                              }))}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">预警阈值 (%)</label>
                            <input
                              type="number"
                              className="form-input"
                              value={algorithmConfig.demandControl.warningThreshold}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev,
                                demandControl: { ...prev.demandControl, warningThreshold: Number(e.target.value) }
                              }))}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">动作阈值 (%)</label>
                            <input
                              type="number"
                              className="form-input"
                              value={algorithmConfig.demandControl.actionThreshold}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev,
                                demandControl: { ...prev.demandControl, actionThreshold: Number(e.target.value) }
                              }))}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">需量周期</label>
                            <select
                              className="form-select"
                              value={algorithmConfig.demandControl.demandPeriod || 15}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev,
                                demandControl: { ...prev.demandControl, demandPeriod: Number(e.target.value) }
                              }))}
                            >
                              <option value={15}>15分钟</option>
                              <option value={30}>30分钟</option>
                              <option value={60}>60分钟</option>
                            </select>
                          </div>
                        </div>
                        
                        {/* 需量控制策略 */}
                        <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
                          <div style={{ fontWeight: '600', marginBottom: '12px', color: '#374151' }}>控制策略</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                            {[
                              { id: 'proportional', name: '比例控制', desc: '根据需量超限比例调节功率' },
                              { id: 'stepwise', name: '阶梯控制', desc: '分阶段逐步调节功率' },
                              { id: 'predictive', name: '预测控制', desc: '预测未来需量提前响应' }
                            ].map(strategy => (
                              <label
                                key={strategy.id}
                                style={{
                                  padding: '12px',
                                  background: (algorithmConfig.demandControl.strategy || 'proportional') === strategy.id ? '#dbeafe' : '#f9fafb',
                                  border: `2px solid ${(algorithmConfig.demandControl.strategy || 'proportional') === strategy.id ? '#3b82f6' : '#e5e7eb'}`,
                                  borderRadius: '8px',
                                  cursor: 'pointer'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input
                                    type="radio"
                                    checked={(algorithmConfig.demandControl.strategy || 'proportional') === strategy.id}
                                    onChange={() => setAlgorithmConfig(prev => ({
                                      ...prev,
                                      demandControl: { ...prev.demandControl, strategy: strategy.id }
                                    }))}
                                  />
                                  <span style={{ fontWeight: '600', fontSize: '13px' }}>{strategy.name}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', marginLeft: '20px' }}>{strategy.desc}</div>
                              </label>
                            ))}
                          </div>
                          
                          {/* 响应优先级 */}
                          <div style={{ marginTop: '12px' }}>
                            <div style={{ fontWeight: '600', marginBottom: '8px', color: '#374151', fontSize: '13px' }}>响应优先级</div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {[
                                { id: 'battery_discharge', name: '储能放电', icon: '🔋' },
                                { id: 'limit_charge', name: '限制充电', icon: '🚫' },
                                { id: 'load_shedding', name: '负载切除', icon: '⚡' }
                              ].map((action, index) => (
                                <div
                                  key={action.id}
                                  style={{
                                    padding: '8px 12px',
                                    background: '#f3f4f6',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}
                                >
                                  <span style={{ fontWeight: '600', color: '#3b82f6' }}>#{index + 1}</span>
                                  <span>{action.icon}</span>
                                  <span style={{ fontSize: '12px' }}>{action.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* 电价配置 */}
                  <div style={{ padding: '20px', background: 'var(--gray-50)', borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>💰</span> 电价配置
                      </h4>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={algorithmConfig.electricityPrice.enabled}
                          onChange={(e) => setAlgorithmConfig(prev => ({
                            ...prev,
                            electricityPrice: { ...prev.electricityPrice, enabled: e.target.checked }
                          }))}
                        />
                        <span>启用电价优化</span>
                      </label>
                    </div>
                    
                    {algorithmConfig.electricityPrice.enabled && (
                      <>
                        <div style={{ marginBottom: '16px' }}>
                          <label className="form-label">电价类型</label>
                          <div style={{ display: 'flex', gap: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                checked={algorithmConfig.electricityPrice.priceType === 'fixed'}
                                onChange={() => setAlgorithmConfig(prev => ({
                                  ...prev,
                                  electricityPrice: { ...prev.electricityPrice, priceType: 'fixed' }
                                }))}
                              />
                              固定电价
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                checked={algorithmConfig.electricityPrice.priceType === 'tou'}
                                onChange={() => setAlgorithmConfig(prev => ({
                                  ...prev,
                                  electricityPrice: { ...prev.electricityPrice, priceType: 'tou' }
                                }))}
                              />
                              分时电价
                            </label>
                          </div>
                        </div>
                        
                        {algorithmConfig.electricityPrice.priceType === 'fixed' ? (
                          <div className="form-group" style={{ maxWidth: '200px' }}>
                            <label className="form-label">固定电价</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="number"
                                className="form-input"
                                step="0.01"
                                value={algorithmConfig.electricityPrice.fixedPrice}
                                onChange={(e) => setAlgorithmConfig(prev => ({
                                  ...prev,
                                  electricityPrice: { ...prev.electricityPrice, fixedPrice: Number(e.target.value) }
                                }))}
                              />
                              <span style={{ color: 'var(--gray-500)' }}>元/kWh</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {algorithmConfig.electricityPrice.touPrices.map((price, index) => (
                              <div key={price.id} style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'center' }}>
                                <select
                                  className="form-select"
                                  style={{ width: '80px' }}
                                  value={price.name}
                                  onChange={(e) => {
                                    const newPrices = [...algorithmConfig.electricityPrice.touPrices];
                                    newPrices[index] = { ...price, name: e.target.value };
                                    setAlgorithmConfig(prev => ({
                                      ...prev,
                                      electricityPrice: { ...prev.electricityPrice, touPrices: newPrices }
                                    }));
                                  }}
                                >
                                  <option value="峰时">峰时</option>
                                  <option value="平时">平时</option>
                                  <option value="谷时">谷时</option>
                                  <option value="尖峰">尖峰</option>
                                </select>
                                <input
                                  type="time"
                                  className="form-input"
                                  style={{ width: '120px' }}
                                  value={price.startTime}
                                  onChange={(e) => {
                                    const newPrices = [...algorithmConfig.electricityPrice.touPrices];
                                    newPrices[index] = { ...price, startTime: e.target.value };
                                    setAlgorithmConfig(prev => ({
                                      ...prev,
                                      electricityPrice: { ...prev.electricityPrice, touPrices: newPrices }
                                    }));
                                  }}
                                />
                                <span>-</span>
                                <input
                                  type="time"
                                  className="form-input"
                                  style={{ width: '120px' }}
                                  value={price.endTime}
                                  onChange={(e) => {
                                    const newPrices = [...algorithmConfig.electricityPrice.touPrices];
                                    newPrices[index] = { ...price, endTime: e.target.value };
                                    setAlgorithmConfig(prev => ({
                                      ...prev,
                                      electricityPrice: { ...prev.electricityPrice, touPrices: newPrices }
                                    }));
                                  }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <input
                                    type="number"
                                    className="form-input"
                                    style={{ width: '80px' }}
                                    step="0.01"
                                    value={price.price}
                                    onChange={(e) => {
                                      const newPrices = [...algorithmConfig.electricityPrice.touPrices];
                                      newPrices[index] = { ...price, price: Number(e.target.value) };
                                      setAlgorithmConfig(prev => ({
                                        ...prev,
                                        electricityPrice: { ...prev.electricityPrice, touPrices: newPrices }
                                      }));
                                    }}
                                  />
                                  <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>元/kWh</span>
                                </div>
                                <button
                                  className="btn btn-sm"
                                  style={{ background: '#fee2e2', color: '#dc2626', border: 'none' }}
                                  onClick={() => {
                                    const newPrices = algorithmConfig.electricityPrice.touPrices.filter((_, i) => i !== index);
                                    setAlgorithmConfig(prev => ({
                                      ...prev,
                                      electricityPrice: { ...prev.electricityPrice, touPrices: newPrices }
                                    }));
                                  }}
                                >
                                  删除
                                </button>
                              </div>
                            ))}
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                const newPrice = { id: Date.now(), name: '平时', startTime: '06:00', endTime: '08:00', price: 0.6 };
                                setAlgorithmConfig(prev => ({
                                  ...prev,
                                  electricityPrice: { ...prev.electricityPrice, touPrices: [...prev.electricityPrice.touPrices, newPrice] }
                                }));
                              }}
                            >
                              + 添加时段
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 设备接入策略Tab - 新增 */}
              {algorithmTab === 'integration' && (
                <div>
                  <div className="notice-banner info" style={{ marginBottom: '20px' }}>
                    <span>💡</span>
                    <span>根据项目接入的设备类型，配置相应的接入策略。启用后系统会根据策略优化调度。</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {/* 风电接入 */}
                    <div style={{ padding: '20px', background: '#dbeafe', borderRadius: '12px', border: '1px solid #93c5fd' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#1d4ed8' }}>
                          <span>🌬️</span> 风电接入
                        </h4>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={algorithmConfig.windIntegration.enabled}
                            onChange={(e) => setAlgorithmConfig(prev => ({
                              ...prev,
                              windIntegration: { ...prev.windIntegration, enabled: e.target.checked }
                            }))}
                          />
                          <span>启用</span>
                        </label>
                      </div>
                      {algorithmConfig.windIntegration.enabled && (
                        <div style={{ fontSize: '13px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>优先级</span>
                            <input type="number" className="form-input" style={{ width: '60px', padding: '4px' }}
                              value={algorithmConfig.windIntegration.priorityLevel}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev, windIntegration: { ...prev.windIntegration, priorityLevel: Number(e.target.value) }
                              }))} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>限功率 (kW)</span>
                            <input type="number" className="form-input" style={{ width: '80px', padding: '4px' }}
                              value={algorithmConfig.windIntegration.maxPowerLimit}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev, windIntegration: { ...prev.windIntegration, maxPowerLimit: Number(e.target.value) }
                              }))} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>爬坡率 (kW/min)</span>
                            <input type="number" className="form-input" style={{ width: '80px', padding: '4px' }}
                              value={algorithmConfig.windIntegration.rampRate}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev, windIntegration: { ...prev.windIntegration, rampRate: Number(e.target.value) }
                              }))} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 光伏接入 */}
                    <div style={{ padding: '20px', background: '#fef3c7', borderRadius: '12px', border: '1px solid #fcd34d' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309' }}>
                          <span>☀️</span> 光伏接入
                        </h4>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={algorithmConfig.solarIntegration.enabled}
                            onChange={(e) => setAlgorithmConfig(prev => ({
                              ...prev,
                              solarIntegration: { ...prev.solarIntegration, enabled: e.target.checked }
                            }))}
                          />
                          <span>启用</span>
                        </label>
                      </div>
                      {algorithmConfig.solarIntegration.enabled && (
                        <div style={{ fontSize: '13px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>优先级</span>
                            <input type="number" className="form-input" style={{ width: '60px', padding: '4px' }}
                              value={algorithmConfig.solarIntegration.priorityLevel}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev, solarIntegration: { ...prev.solarIntegration, priorityLevel: Number(e.target.value) }
                              }))} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>限功率 (kW)</span>
                            <input type="number" className="form-input" style={{ width: '80px', padding: '4px' }}
                              value={algorithmConfig.solarIntegration.maxPowerLimit}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev, solarIntegration: { ...prev.solarIntegration, maxPowerLimit: Number(e.target.value) }
                              }))} />
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={algorithmConfig.solarIntegration.antiBackflow}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev, solarIntegration: { ...prev.solarIntegration, antiBackflow: e.target.checked }
                              }))} />
                            <span>防逆流</span>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* 柴发接入 */}
                    <div style={{ padding: '20px', background: '#f3f4f6', borderRadius: '12px', border: '1px solid #d1d5db' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563' }}>
                          <span>⛽</span> 柴发接入
                        </h4>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={algorithmConfig.dieselIntegration.enabled}
                            onChange={(e) => setAlgorithmConfig(prev => ({
                              ...prev,
                              dieselIntegration: { ...prev.dieselIntegration, enabled: e.target.checked }
                            }))}
                          />
                          <span>启用</span>
                        </label>
                      </div>
                      {algorithmConfig.dieselIntegration.enabled && (
                        <div style={{ fontSize: '13px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>启动SOC阈值 (%)</span>
                            <input type="number" className="form-input" style={{ width: '60px', padding: '4px' }}
                              value={algorithmConfig.dieselIntegration.startSocThreshold}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev, dieselIntegration: { ...prev.dieselIntegration, startSocThreshold: Number(e.target.value) }
                              }))} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>停止SOC阈值 (%)</span>
                            <input type="number" className="form-input" style={{ width: '60px', padding: '4px' }}
                              value={algorithmConfig.dieselIntegration.stopSocThreshold}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev, dieselIntegration: { ...prev.dieselIntegration, stopSocThreshold: Number(e.target.value) }
                              }))} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>最小运行时间 (分钟)</span>
                            <input type="number" className="form-input" style={{ width: '60px', padding: '4px' }}
                              value={algorithmConfig.dieselIntegration.minRunTime}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev, dieselIntegration: { ...prev.dieselIntegration, minRunTime: Number(e.target.value) }
                              }))} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 充电桩接入 */}
                    <div style={{ padding: '20px', background: '#ede9fe', borderRadius: '12px', border: '1px solid #c4b5fd' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#6d28d9' }}>
                          <span>🔌</span> 充电桩接入
                        </h4>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={algorithmConfig.chargerIntegration.enabled}
                            onChange={(e) => setAlgorithmConfig(prev => ({
                              ...prev,
                              chargerIntegration: { ...prev.chargerIntegration, enabled: e.target.checked }
                            }))}
                          />
                          <span>启用</span>
                        </label>
                      </div>
                      {algorithmConfig.chargerIntegration.enabled && (
                        <div style={{ fontSize: '13px' }}>
                          {/* 充电模式 */}
                          <div style={{ marginBottom: '12px' }}>
                            <label className="form-label" style={{ fontSize: '13px', marginBottom: '8px' }}>充电模式</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {[
                                { id: 'free', name: '自由充电' },
                                { id: 'scheduled', name: '有序充电' },
                                { id: 'v2g', name: 'V2G模式' }
                              ].map(mode => (
                                <button
                                  key={mode.id}
                                  type="button"
                                  onClick={() => setAlgorithmConfig(prev => ({
                                    ...prev, chargerIntegration: { ...prev.chargerIntegration, chargingMode: mode.id }
                                  }))}
                                  style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    border: algorithmConfig.chargerIntegration.chargingMode === mode.id 
                                      ? '2px solid #6d28d9' 
                                      : '1px solid #c4b5fd',
                                    borderRadius: '6px',
                                    background: algorithmConfig.chargerIntegration.chargingMode === mode.id 
                                      ? '#ddd6fe' 
                                      : 'white',
                                    cursor: 'pointer',
                                    fontWeight: algorithmConfig.chargerIntegration.chargingMode === mode.id ? '600' : '400',
                                    fontSize: '12px'
                                  }}
                                >
                                  {mode.name}
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* 功率限制 */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>总功率限制 (kW)</span>
                            <input type="number" className="form-input" style={{ width: '80px', padding: '4px' }}
                              value={algorithmConfig.chargerIntegration.maxTotalPower}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev, chargerIntegration: { ...prev.chargerIntegration, maxTotalPower: Number(e.target.value) }
                              }))} />
                          </div>
                          {/* V2G相关参数 */}
                          {algorithmConfig.chargerIntegration.chargingMode === 'v2g' && (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>放电SOC下限 (%)</span>
                                <input type="number" className="form-input" style={{ width: '80px', padding: '4px' }}
                                  value={algorithmConfig.chargerIntegration.v2gMinSoc || 30}
                                  onChange={(e) => setAlgorithmConfig(prev => ({
                                    ...prev, chargerIntegration: { ...prev.chargerIntegration, v2gMinSoc: Number(e.target.value) }
                                  }))} />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>放电功率限制 (kW)</span>
                                <input type="number" className="form-input" style={{ width: '80px', padding: '4px' }}
                                  value={algorithmConfig.chargerIntegration.v2gMaxPower || 50}
                                  onChange={(e) => setAlgorithmConfig(prev => ({
                                    ...prev, chargerIntegration: { ...prev.chargerIntegration, v2gMaxPower: Number(e.target.value) }
                                  }))} />
                              </div>
                            </>
                          )}
                          {/* 策略开关 */}
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                            <input type="checkbox" checked={algorithmConfig.chargerIntegration.loadBalancing}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev, chargerIntegration: { ...prev.chargerIntegration, loadBalancing: e.target.checked }
                              }))} />
                            <span>负载均衡</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={algorithmConfig.chargerIntegration.peakShiftEnabled}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev, chargerIntegration: { ...prev.chargerIntegration, peakShiftEnabled: e.target.checked }
                              }))} />
                            <span>削峰充电</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 逆功率保护 */}
                  <div style={{ marginTop: '20px', padding: '20px', background: '#fee2e2', borderRadius: '12px', border: '1px solid #fca5a5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
                        <span>🛡️</span> 逆功率保护
                      </h4>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={algorithmConfig.reversePowerProtection.enabled}
                          onChange={(e) => setAlgorithmConfig(prev => ({
                            ...prev,
                            reversePowerProtection: { ...prev.reversePowerProtection, enabled: e.target.checked }
                          }))}
                        />
                        <span>启用</span>
                      </label>
                    </div>
                    {algorithmConfig.reversePowerProtection.enabled && (
                      <div className="form-row form-row-3">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">保护阈值</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="number"
                              className="form-input"
                              value={algorithmConfig.reversePowerProtection.threshold}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev,
                                reversePowerProtection: { ...prev.reversePowerProtection, threshold: Number(e.target.value) }
                              }))}
                            />
                            <span style={{ color: 'var(--gray-500)' }}>kW</span>
                          </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">动作延时</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="number"
                              className="form-input"
                              value={algorithmConfig.reversePowerProtection.actionDelay}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev,
                                reversePowerProtection: { ...prev.reversePowerProtection, actionDelay: Number(e.target.value) }
                              }))}
                            />
                            <span style={{ color: 'var(--gray-500)' }}>秒</span>
                          </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">保护模式</label>
                          <select
                            className="form-select"
                            value={algorithmConfig.reversePowerProtection.protectMode}
                            onChange={(e) => setAlgorithmConfig(prev => ({
                              ...prev,
                              reversePowerProtection: { ...prev.reversePowerProtection, protectMode: e.target.value }
                            }))}
                          >
                            <option value="cutoff">切断</option>
                            <option value="reduce">降功率</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 约束参数Tab */}
              {algorithmTab === 'constraint' && (
                <div>
                  {/* 功率约束 */}
                  <div style={{ marginBottom: '24px' }}>
                    <div className="form-row form-row-3">
                      <div className="form-group">
                        <label className="form-label">
                          <span style={{ marginRight: '6px' }}>⚡</span>功率平衡容差
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            className="form-input"
                            value={algorithmConfig.constraints.powerBalanceTolerance}
                            onChange={(e) => setAlgorithmConfig(prev => ({
                              ...prev,
                              constraints: { ...prev.constraints, powerBalanceTolerance: Number(e.target.value) }
                            }))}
                          />
                          <span style={{ color: 'var(--gray-500)' }}>kW</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '4px' }}>
                          允许的功率不平衡范围
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          <span style={{ marginRight: '6px' }}>🎯</span>目标SOC
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            className="form-input"
                            value={algorithmConfig.constraints.targetSoc}
                            onChange={(e) => setAlgorithmConfig(prev => ({
                              ...prev,
                              constraints: { ...prev.constraints, targetSoc: Number(e.target.value) }
                            }))}
                          />
                          <span style={{ color: 'var(--gray-500)' }}>%</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '4px' }}>
                          储能目标充电状态
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          <span style={{ marginRight: '6px' }}>🔌</span>并网功率限制
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            className="form-input"
                            value={algorithmConfig.constraints.gridPowerLimit}
                            onChange={(e) => setAlgorithmConfig(prev => ({
                              ...prev,
                              constraints: { ...prev.constraints, gridPowerLimit: Number(e.target.value) }
                            }))}
                          />
                          <span style={{ color: 'var(--gray-500)' }}>kW</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '4px' }}>
                          最大并网功率
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SOC管理参数 */}
                  <div style={{ 
                    background: 'var(--gray-50)', 
                    borderRadius: '12px', 
                    padding: '20px',
                    border: '1px solid var(--gray-200)'
                  }}>
                    <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🔋</span> SOC管理参数
                    </h4>
                    <div className="form-row form-row-3">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">SOC充电下限</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            className="form-input"
                            value={algorithmConfig.constraints.socChargeMin}
                            onChange={(e) => setAlgorithmConfig(prev => ({
                              ...prev,
                              constraints: { ...prev.constraints, socChargeMin: Number(e.target.value) }
                            }))}
                          />
                          <span style={{ color: 'var(--gray-500)' }}>%</span>
                        </div>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">SOC放电上限</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            className="form-input"
                            value={algorithmConfig.constraints.socDischargeMax}
                            onChange={(e) => setAlgorithmConfig(prev => ({
                              ...prev,
                              constraints: { ...prev.constraints, socDischargeMax: Number(e.target.value) }
                            }))}
                          />
                          <span style={{ color: 'var(--gray-500)' }}>%</span>
                        </div>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">SOC协同系数</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            className="form-input"
                            step="0.1"
                            min="0"
                            max="1"
                            value={algorithmConfig.constraints.socCoefficient}
                            onChange={(e) => setAlgorithmConfig(prev => ({
                              ...prev,
                              constraints: { ...prev.constraints, socCoefficient: Number(e.target.value) }
                            }))}
                          />
                          <span style={{ color: 'var(--gray-500)' }}>-</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 高级策略Tab */}
              {algorithmTab === 'advanced' && (
                <div>
                  <div className="form-row form-row-3">
                    <div className="form-group">
                      <label className="form-label">调度周期</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          className="form-input"
                          value={algorithmConfig.advanced.schedulingPeriod}
                          onChange={(e) => setAlgorithmConfig(prev => ({
                            ...prev,
                            advanced: { ...prev.advanced, schedulingPeriod: Number(e.target.value) }
                          }))}
                        />
                        <span style={{ color: 'var(--gray-500)' }}>分钟</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">预测时间窗</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          className="form-input"
                          value={algorithmConfig.advanced.predictionHorizon}
                          onChange={(e) => setAlgorithmConfig(prev => ({
                            ...prev,
                            advanced: { ...prev.advanced, predictionHorizon: Number(e.target.value) }
                          }))}
                        />
                        <span style={{ color: 'var(--gray-500)' }}>小时</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">安全余量</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          className="form-input"
                          value={algorithmConfig.advanced.safetyMargin}
                          onChange={(e) => setAlgorithmConfig(prev => ({
                            ...prev,
                            advanced: { ...prev.advanced, safetyMargin: Number(e.target.value) }
                          }))}
                        />
                        <span style={{ color: 'var(--gray-500)' }}>%</span>
                      </div>
                    </div>
                  </div>

                  {/* 策略开关 - 移除逆功率保护(已在设备接入Tab中配置) */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '16px',
                    marginTop: '20px'
                  }}>
                    {[
                      { key: 'gridPeakShaving', name: '电网削峰', desc: '高峰期储能放电' },
                      { key: 'loadFollowing', name: '负载跟踪', desc: '跟踪负载变化调节' },
                      { key: 'autoSchedule', name: '自动调度', desc: '系统自动优化调度' },
                      { key: 'emergencyReserve', name: '应急备用', desc: '保留应急电量储备' }
                    ].map(item => (
                      <div 
                        key={item.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px',
                          background: 'var(--gray-50)',
                          borderRadius: '8px',
                          border: '1px solid var(--gray-200)'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '500' }}>{item.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{item.desc}</div>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                          <input
                            type="checkbox"
                            checked={algorithmConfig.advanced[item.key]}
                            onChange={(e) => setAlgorithmConfig(prev => ({
                              ...prev,
                              advanced: { ...prev.advanced, [item.key]: e.target.checked }
                            }))}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: algorithmConfig.advanced[item.key] ? 'var(--primary)' : '#ccc',
                            borderRadius: '24px',
                            transition: '0.3s'
                          }}>
                            <span style={{
                              position: 'absolute',
                              height: '18px',
                              width: '18px',
                              left: algorithmConfig.advanced[item.key] ? '27px' : '3px',
                              bottom: '3px',
                              backgroundColor: 'white',
                              borderRadius: '50%',
                              transition: '0.3s'
                            }} />
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}


          {/* 步骤7: 北向配置 */}
          {currentStep === 7 && (
            <div>
              <div className="form-section">
                <div className="form-section-header">
                  <span className="form-section-icon">🌐</span>
                  <div>
                    <h3 className="form-section-title">北向接口配置</h3>
                    <p className="form-section-desc">配置数据上报到上级平台的接口参数，包括协议、地址、点表映射等</p>
                  </div>
                </div>
              </div>

              {/* 北向配置启用开关 */}
              <div style={{ 
                marginBottom: '24px', 
                padding: '20px', 
                background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)', 
                borderRadius: '12px',
                color: 'white'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={northboundConfig.enabled}
                    onChange={(e) => setNorthboundConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '16px' }}>启用北向数据上报</div>
                    <div style={{ fontSize: '13px', opacity: 0.8 }}>开启后EMS将向上级平台上报数据</div>
                  </div>
                </label>
              </div>

              {northboundConfig.enabled && (
                <>
                  {/* 协议选择和基本配置 */}
                  <div style={{ marginBottom: '24px', padding: '20px', background: 'var(--gray-50)', borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
                    <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📡</span> 协议配置
                    </h4>
                    <div className="form-row form-row-4">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">协议类型</label>
                        <select
                          className="form-select"
                          value={northboundConfig.protocol}
                          onChange={(e) => {
                            const protocol = northboundProtocols?.find(p => p.id === e.target.value);
                            setNorthboundConfig(prev => ({
                              ...prev,
                              protocol: e.target.value,
                              serverPort: protocol?.port || 1883
                            }));
                          }}
                        >
                          <option value="mqtt">MQTT</option>
                          <option value="iec104_server">IEC 104 服务端</option>
                          <option value="modbus_tcp_server">Modbus TCP 服务端</option>
                          <option value="http">HTTP REST API</option>
                          <option value="https">HTTPS REST API</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">服务器地址</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="192.168.1.200"
                          value={northboundConfig.serverIp}
                          onChange={(e) => setNorthboundConfig(prev => ({ ...prev, serverIp: e.target.value }))}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">端口号</label>
                        <input
                          type="number"
                          className="form-input"
                          value={northboundConfig.serverPort}
                          onChange={(e) => setNorthboundConfig(prev => ({ ...prev, serverPort: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">上报周期 (ms)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={northboundConfig.publishInterval}
                          onChange={(e) => setNorthboundConfig(prev => ({ ...prev, publishInterval: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* MQTT特定配置 */}
                  {northboundConfig.protocol === 'mqtt' && (
                    <div style={{ marginBottom: '24px', padding: '20px', background: '#dbeafe', borderRadius: '12px', border: '1px solid #93c5fd' }}>
                      <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1d4ed8' }}>
                        <span>📨</span> MQTT配置
                      </h4>
                      <div className="form-row form-row-3">
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                          <label className="form-label">Topic</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="ems/data"
                            value={northboundConfig.topic}
                            onChange={(e) => setNorthboundConfig(prev => ({ ...prev, topic: e.target.value }))}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                          <label className="form-label">Client ID</label>
                          <input
                            type="text"
                            className="form-input"
                            value={northboundConfig.clientId}
                            onChange={(e) => setNorthboundConfig(prev => ({ ...prev, clientId: e.target.value }))}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                          <label className="form-label">QoS等级</label>
                          <select
                            className="form-select"
                            value={northboundConfig.qos}
                            onChange={(e) => setNorthboundConfig(prev => ({ ...prev, qos: Number(e.target.value) }))}
                          >
                            <option value={0}>QoS 0 - 最多一次</option>
                            <option value={1}>QoS 1 - 至少一次</option>
                            <option value={2}>QoS 2 - 恰好一次</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-row form-row-3">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Keep Alive (s)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={northboundConfig.keepAlive}
                            onChange={(e) => setNorthboundConfig(prev => ({ ...prev, keepAlive: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">用户名</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="可选"
                            value={northboundConfig.username}
                            onChange={(e) => setNorthboundConfig(prev => ({ ...prev, username: e.target.value }))}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">密码</label>
                          <input
                            type="password"
                            className="form-input"
                            placeholder="可选"
                            value={northboundConfig.password}
                            onChange={(e) => setNorthboundConfig(prev => ({ ...prev, password: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* IEC104特定配置 */}
                  {northboundConfig.protocol === 'iec104_server' && (
                    <div style={{ marginBottom: '24px', padding: '20px', background: '#fef3c7', borderRadius: '12px', border: '1px solid #fcd34d' }}>
                      <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309' }}>
                        <span>⚡</span> IEC 104配置
                      </h4>
                      <div className="form-row form-row-3">
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                          <label className="form-label">公共地址</label>
                          <input
                            type="number"
                            className="form-input"
                            value={northboundConfig.iec104Config.commonAddress}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              iec104Config: { ...prev.iec104Config, commonAddress: Number(e.target.value) }
                            }))}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                          <label className="form-label">K值</label>
                          <input
                            type="number"
                            className="form-input"
                            value={northboundConfig.iec104Config.k}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              iec104Config: { ...prev.iec104Config, k: Number(e.target.value) }
                            }))}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                          <label className="form-label">W值</label>
                          <input
                            type="number"
                            className="form-input"
                            value={northboundConfig.iec104Config.w}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              iec104Config: { ...prev.iec104Config, w: Number(e.target.value) }
                            }))}
                          />
                        </div>
                      </div>
                      <div className="form-row form-row-3">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">T1超时 (s)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={northboundConfig.iec104Config.t1}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              iec104Config: { ...prev.iec104Config, t1: Number(e.target.value) }
                            }))}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">T2超时 (s)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={northboundConfig.iec104Config.t2}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              iec104Config: { ...prev.iec104Config, t2: Number(e.target.value) }
                            }))}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">T3超时 (s)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={northboundConfig.iec104Config.t3}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              iec104Config: { ...prev.iec104Config, t3: Number(e.target.value) }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* HTTP特定配置 */}
                  {(northboundConfig.protocol === 'http' || northboundConfig.protocol === 'https') && (
                    <div style={{ marginBottom: '24px', padding: '20px', background: '#d1fae5', borderRadius: '12px', border: '1px solid #6ee7b7' }}>
                      <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#047857' }}>
                        <span>🌐</span> HTTP配置
                      </h4>
                      <div className="form-row form-row-3">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">请求方法</label>
                          <select
                            className="form-select"
                            value={northboundConfig.httpConfig.method}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              httpConfig: { ...prev.httpConfig, method: e.target.value }
                            }))}
                          >
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Content-Type</label>
                          <select
                            className="form-select"
                            value={northboundConfig.httpConfig.contentType}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              httpConfig: { ...prev.httpConfig, contentType: e.target.value }
                            }))}
                          >
                            <option value="application/json">application/json</option>
                            <option value="application/xml">application/xml</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">认证方式</label>
                          <select
                            className="form-select"
                            value={northboundConfig.httpConfig.authType}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              httpConfig: { ...prev.httpConfig, authType: e.target.value }
                            }))}
                          >
                            <option value="none">无认证</option>
                            <option value="basic">Basic Auth</option>
                            <option value="bearer">Bearer Token</option>
                          </select>
                        </div>
                      </div>
                      {northboundConfig.httpConfig.authType === 'bearer' && (
                        <div className="form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
                          <label className="form-label">Token</label>
                          <input
                            type="password"
                            className="form-input"
                            placeholder="Bearer Token"
                            value={northboundConfig.httpConfig.authToken}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              httpConfig: { ...prev.httpConfig, authToken: e.target.value }
                            }))}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Modbus TCP服务端配置 */}
                  {northboundConfig.protocol === 'modbus_tcp_server' && (
                    <div style={{ marginBottom: '24px', padding: '20px', background: '#ede9fe', borderRadius: '12px', border: '1px solid #c4b5fd' }}>
                      <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#6d28d9' }}>
                        <span>🔌</span> Modbus TCP服务端配置
                      </h4>
                      <div className="form-row">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">从站地址</label>
                          <input
                            type="number"
                            className="form-input"
                            min="1"
                            max="247"
                            value={northboundConfig.modbusServerConfig.unitId}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              modbusServerConfig: { ...prev.modbusServerConfig, unitId: Number(e.target.value) }
                            }))}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">最大连接数</label>
                          <input
                            type="number"
                            className="form-input"
                            value={northboundConfig.modbusServerConfig.maxConnections}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              modbusServerConfig: { ...prev.modbusServerConfig, maxConnections: Number(e.target.value) }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 高级配置 */}
                  <div style={{ marginBottom: '24px', padding: '20px', background: 'var(--gray-50)', borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
                    <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>⚙️</span> 高级配置
                    </h4>
                    <div className="form-row form-row-3">
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label className="form-label">心跳间隔 (s)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={northboundConfig.heartbeatInterval}
                          onChange={(e) => setNorthboundConfig(prev => ({ ...prev, heartbeatInterval: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label className="form-label">重连间隔 (ms)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={northboundConfig.reconnectInterval}
                          onChange={(e) => setNorthboundConfig(prev => ({ ...prev, reconnectInterval: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label className="form-label">最大重连次数</label>
                        <input
                          type="number"
                          className="form-input"
                          value={northboundConfig.maxReconnectAttempts}
                          onChange={(e) => setNorthboundConfig(prev => ({ ...prev, maxReconnectAttempts: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '24px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={northboundConfig.compression}
                          onChange={(e) => setNorthboundConfig(prev => ({ ...prev, compression: e.target.checked }))}
                        />
                        <span>启用数据压缩</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={northboundConfig.encryption}
                          onChange={(e) => setNorthboundConfig(prev => ({ ...prev, encryption: e.target.checked }))}
                        />
                        <span>启用数据加密</span>
                      </label>
                    </div>
                  </div>

                  {/* 点表配置 - 协议专用点位类型 */}
                  <div style={{ padding: '20px', background: 'var(--gray-50)', borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
                    {/* 协议点位类型说明 */}
                    <div style={{ marginBottom: '16px', padding: '12px', background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px', color: '#1e40af' }}>
                        📋 {northboundConfig.protocol === 'iec104' ? 'IEC104协议点位类型' : 
                            northboundConfig.protocol === 'mqtt' ? 'MQTT协议点位类型' :
                            northboundConfig.protocol === 'http' ? 'HTTP协议点位类型' : 'Modbus协议点位类型'}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '12px' }}>
                        {northboundConfig.protocol === 'iec104' && (
                          <>
                            <span style={{ padding: '2px 8px', background: '#dbeafe', borderRadius: '4px' }}>M_ME_NA 归一化遥测</span>
                            <span style={{ padding: '2px 8px', background: '#dbeafe', borderRadius: '4px' }}>M_ME_NB 标度化遥测</span>
                            <span style={{ padding: '2px 8px', background: '#dbeafe', borderRadius: '4px' }}>M_ME_NC 浮点型遥测</span>
                            <span style={{ padding: '2px 8px', background: '#dcfce7', borderRadius: '4px' }}>M_SP_NA 单点遥信</span>
                            <span style={{ padding: '2px 8px', background: '#dcfce7', borderRadius: '4px' }}>M_DP_NA 双点遥信</span>
                            <span style={{ padding: '2px 8px', background: '#fef3c7', borderRadius: '4px' }}>M_IT_NA 累计量</span>
                            <span style={{ padding: '2px 8px', background: '#fce7f3', borderRadius: '4px' }}>C_SC_NA 单点遥控</span>
                            <span style={{ padding: '2px 8px', background: '#fce7f3', borderRadius: '4px' }}>C_DC_NA 双点遥控</span>
                            <span style={{ padding: '2px 8px', background: '#fce7f3', borderRadius: '4px' }}>C_RC_NA 步位置调节</span>
                            <span style={{ padding: '2px 8px', background: '#e0e7ff', borderRadius: '4px' }}>C_SE_NA 归一化设值</span>
                            <span style={{ padding: '2px 8px', background: '#e0e7ff', borderRadius: '4px' }}>C_SE_NB 标度化设值</span>
                            <span style={{ padding: '2px 8px', background: '#e0e7ff', borderRadius: '4px' }}>C_SE_NC 浮点型设值</span>
                          </>
                        )}
                        {northboundConfig.protocol === 'mqtt' && (
                          <>
                            <span style={{ padding: '2px 8px', background: '#dbeafe', borderRadius: '4px' }}>遥测点 Telemetry</span>
                            <span style={{ padding: '2px 8px', background: '#dcfce7', borderRadius: '4px' }}>遥信点 Status</span>
                            <span style={{ padding: '2px 8px', background: '#fce7f3', borderRadius: '4px' }}>遥控点 Control</span>
                            <span style={{ padding: '2px 8px', background: '#e0e7ff', borderRadius: '4px' }}>设置点 Setting</span>
                          </>
                        )}
                        {northboundConfig.protocol === 'http' && (
                          <>
                            <span style={{ padding: '2px 8px', background: '#dbeafe', borderRadius: '4px' }}>GET端点 读取数据</span>
                            <span style={{ padding: '2px 8px', background: '#dcfce7', borderRadius: '4px' }}>POST端点 写入数据</span>
                            <span style={{ padding: '2px 8px', background: '#fce7f3', borderRadius: '4px' }}>推送端点 主动上报</span>
                          </>
                        )}
                        {northboundConfig.protocol === 'modbus_tcp' && (
                          <>
                            <span style={{ padding: '2px 8px', background: '#dbeafe', borderRadius: '4px' }}>线圈 Coil (01/05)</span>
                            <span style={{ padding: '2px 8px', background: '#dcfce7', borderRadius: '4px' }}>离散输入 DI (02)</span>
                            <span style={{ padding: '2px 8px', background: '#fce7f3', borderRadius: '4px' }}>保持寄存器 HR (03/06)</span>
                            <span style={{ padding: '2px 8px', background: '#e0e7ff', borderRadius: '4px' }}>输入寄存器 IR (04)</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* 南向物模型点表关联提示 */}
                    <div style={{ marginBottom: '16px', padding: '10px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d', fontSize: '13px' }}>
                      <span style={{ marginRight: '8px' }}>💡</span>
                      <strong>点位来源:</strong> 源点位应来自本项目已配置的物模型点表或虚拟点。选择设备后可快速添加其点位。
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📋</span> 点表映射配置
                      </h4>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="file"
                          ref={northboundFileInputRef}
                          className="hidden-input"
                          accept=".json"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = '';
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                try {
                                  const pointTable = JSON.parse(event.target.result);
                                  if (Array.isArray(pointTable)) {
                                    const validatedPoints = pointTable.map((point, index) => ({
                                      id: point.id || Date.now() + index,
                                      sourcePath: point.sourcePath || '',
                                      targetPath: point.targetPath || '',
                                      dataType: point.dataType || 'float',
                                      scale: typeof point.scale === 'number' ? point.scale : 1,
                                      offset: typeof point.offset === 'number' ? point.offset : 0,
                                      enabled: point.enabled !== false
                                    }));
                                    setNorthboundConfig(prev => ({
                                      ...prev,
                                      pointTableMapping: validatedPoints
                                    }));
                                    alert(`成功导入 ${validatedPoints.length} 个点位配置`);
                                  } else {
                                    alert('点表格式错误，请使用数组格式');
                                  }
                                } catch (err) {
                                  alert('点表文件解析失败');
                                }
                              };
                              reader.readAsText(file);
                            }
                          }}
                        />
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => northboundFileInputRef.current?.click()}
                        >
                          📤 导入点表
                        </button>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(northboundConfig.pointTableMapping, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'northbound_point_table.json';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                        >
                          📥 导出点表
                        </button>
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            const newPoint = {
                              id: Date.now(),
                              sourcePath: '',
                              targetPath: '',
                              dataType: 'float',
                              scale: 1,
                              offset: 0,
                              enabled: true
                            };
                            setNorthboundConfig(prev => ({
                              ...prev,
                              pointTableMapping: [...prev.pointTableMapping, newPoint]
                            }));
                          }}
                        >
                          ➕ 新增点位
                        </button>
                      </div>
                    </div>

                    {northboundConfig.pointTableMapping.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)' }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
                        <div>暂无点表配置，点击"新增点位"或"导入点表"开始配置</div>
                      </div>
                    ) : (
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: 'var(--gray-100)' }}>
                              <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px' }}>源路径</th>
                              <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px' }}>目标路径</th>
                              <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px' }}>数据类型</th>
                              <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px' }}>系数</th>
                              <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px' }}>偏移</th>
                              <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px' }}>启用</th>
                              <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px' }}>操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {northboundConfig.pointTableMapping.map((point, index) => (
                              <tr key={point.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                                <td style={{ padding: '8px' }}>
                                  <select
                                    className="form-input"
                                    style={{ fontSize: '12px', padding: '6px', minWidth: '200px' }}
                                    value={point.sourcePath}
                                    onChange={(e) => {
                                      const newPoints = [...northboundConfig.pointTableMapping];
                                      newPoints[index] = { ...point, sourcePath: e.target.value };
                                      setNorthboundConfig(prev => ({ ...prev, pointTableMapping: newPoints }));
                                    }}
                                  >
                                    <option value="">-- 选择源点位 --</option>
                                    {/* 从已选设备的点表中获取点位 */}
                                    {selectedDevices.map(device => {
                                      const pointTable = pointTableTemplates[device.type] || pointTableTemplates.bms || [];
                                      return (
                                        <optgroup key={device.instanceId} label={`📦 ${device.name} (${device.type})`}>
                                          {pointTable.map((pt, ptIdx) => (
                                            <option key={ptIdx} value={`${device.name}.${pt.name}`}>
                                              {device.name} &gt; {pt.name}
                                            </option>
                                          ))}
                                        </optgroup>
                                      );
                                    })}
                                    {/* 虚拟设备点表 */}
                                    <optgroup label="🔮 虚拟设备点">
                                      <option value="virtual.system_total_power">系统计算点 &gt; 系统总功率</option>
                                      <option value="virtual.system_total_soc">系统计算点 &gt; 系统总SOC</option>
                                      <option value="virtual.daily_charge_energy">系统计算点 &gt; 日充电量</option>
                                      <option value="virtual.daily_discharge_energy">系统计算点 &gt; 日放电量</option>
                                      <option value="virtual.pv_total_power">光伏汇总 &gt; 光伏总功率</option>
                                      <option value="virtual.grid_power">电网计算 &gt; 电网功率</option>
                                    </optgroup>
                                  </select>
                                </td>
                                <td style={{ padding: '8px' }}>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{ fontSize: '12px', padding: '6px' }}
                                    placeholder="如: 1001"
                                    value={point.targetPath}
                                    onChange={(e) => {
                                      const newPoints = [...northboundConfig.pointTableMapping];
                                      newPoints[index] = { ...point, targetPath: e.target.value };
                                      setNorthboundConfig(prev => ({ ...prev, pointTableMapping: newPoints }));
                                    }}
                                  />
                                </td>
                                <td style={{ padding: '8px' }}>
                                  <select
                                    className="form-select"
                                    style={{ fontSize: '12px', padding: '6px' }}
                                    value={point.dataType}
                                    onChange={(e) => {
                                      const newPoints = [...northboundConfig.pointTableMapping];
                                      newPoints[index] = { ...point, dataType: e.target.value };
                                      setNorthboundConfig(prev => ({ ...prev, pointTableMapping: newPoints }));
                                    }}
                                  >
                                    <option value="float">Float</option>
                                    <option value="int">Int</option>
                                    <option value="bool">Bool</option>
                                    <option value="string">String</option>
                                  </select>
                                </td>
                                <td style={{ padding: '8px' }}>
                                  <input
                                    type="number"
                                    className="form-input"
                                    style={{ width: '70px', fontSize: '12px', padding: '6px' }}
                                    step="0.01"
                                    value={point.scale}
                                    onChange={(e) => {
                                      const newPoints = [...northboundConfig.pointTableMapping];
                                      newPoints[index] = { ...point, scale: Number(e.target.value) };
                                      setNorthboundConfig(prev => ({ ...prev, pointTableMapping: newPoints }));
                                    }}
                                  />
                                </td>
                                <td style={{ padding: '8px' }}>
                                  <input
                                    type="number"
                                    className="form-input"
                                    style={{ width: '70px', fontSize: '12px', padding: '6px' }}
                                    value={point.offset}
                                    onChange={(e) => {
                                      const newPoints = [...northboundConfig.pointTableMapping];
                                      newPoints[index] = { ...point, offset: Number(e.target.value) };
                                      setNorthboundConfig(prev => ({ ...prev, pointTableMapping: newPoints }));
                                    }}
                                  />
                                </td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                  <input
                                    type="checkbox"
                                    checked={point.enabled}
                                    onChange={(e) => {
                                      const newPoints = [...northboundConfig.pointTableMapping];
                                      newPoints[index] = { ...point, enabled: e.target.checked };
                                      setNorthboundConfig(prev => ({ ...prev, pointTableMapping: newPoints }));
                                    }}
                                  />
                                </td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                  <button
                                    className="btn btn-sm"
                                    style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '4px 8px' }}
                                    onClick={() => {
                                      const newPoints = northboundConfig.pointTableMapping.filter((_, i) => i !== index);
                                      setNorthboundConfig(prev => ({ ...prev, pointTableMapping: newPoints }));
                                    }}
                                  >
                                    删除
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 底部导航按钮 */}
        <div className="wizard-footer">
          <button
            className="btn btn-secondary btn-lg"
            onClick={handlePrev}
            disabled={currentStep === 1}
          >
            ← 上一步
          </button>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleNext}
          >
            {currentStep === 7 ? '完成配置 →' : '下一步 →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectConfigWizard;
