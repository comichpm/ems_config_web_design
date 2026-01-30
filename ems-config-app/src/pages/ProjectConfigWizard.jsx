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
  northboundProtocols
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
      antiReversePower: true,
      antiReversePowerThreshold: 10, // kW
      gridPeakShaving: true,
      loadFollowing: true
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
      maxTotalPower: 300, // kW
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
            <button 
              className="btn btn-secondary btn-lg"
              onClick={() => onNavigate('project-list', '项目管理')}
            >
              查看项目列表
            </button>
          </div>
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

          {/* 步骤4: 参数微调 */}
          {currentStep === 4 && (
            <div className="form-section">
              <div className="form-section-header">
                <span className="form-section-icon">🔧</span>
                <div>
                  <h3 className="form-section-title">设备参数微调</h3>
                  <p className="form-section-desc">根据现场实际情况，微调选中设备的通讯参数和业务参数（仅显示第3步选择的设备）</p>
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
                  {/* 显示选中设备统计 */}
                  <div style={{
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: '20px' }}>📊</span>
                    <span style={{ color: '#1565c0', fontWeight: '500' }}>
                      已选择 {selectedDevices.length} 台设备，请配置各设备的通讯和业务参数
                    </span>
                  </div>

                  {selectedDevices.map((device) => (
                    <div key={device.instanceId} style={{ 
                      marginBottom: '24px', 
                      background: 'var(--gray-50)', 
                      borderRadius: '12px', 
                      padding: '20px',
                      border: '1px solid var(--gray-200)'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        marginBottom: '20px',
                        paddingBottom: '16px',
                        borderBottom: '1px solid var(--gray-200)'
                      }}>
                        <span style={{ fontSize: '24px' }}>{getDeviceIcon(device.category)}</span>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, color: 'var(--gray-800)' }}>{device.instanceName || device.modelName || '未命名设备'}</h4>
                          <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
                            类型: {device.deviceType || '未知'} | 物模型: {device.modelName || '-'}
                          </span>
                        </div>
                        <span style={{
                          padding: '4px 10px',
                          background: deviceParams[device.instanceId]?.enabled !== false ? '#c8e6c9' : '#ffcdd2',
                          color: deviceParams[device.instanceId]?.enabled !== false ? '#2e7d32' : '#c62828',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {deviceParams[device.instanceId]?.enabled !== false ? '已启用' : '已禁用'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        {/* 通讯参数 */}
                        <div>
                          <label className="form-label" htmlFor={`protocol-${device.instanceId}`} style={{ fontSize: '13px' }}>通讯协议</label>
                          <select 
                            id={`protocol-${device.instanceId}`}
                            className="form-select"
                            value={deviceParams[device.instanceId]?.protocol || 'modbus_tcp'}
                            onChange={(e) => updateDeviceParam(device.instanceId, 'protocol', e.target.value)}
                          >
                            <option value="modbus_tcp">Modbus TCP</option>
                            <option value="modbus_rtu">Modbus RTU</option>
                            <option value="iec104">IEC 104</option>
                            <option value="iec61850">IEC 61850</option>
                            <option value="can">CAN总线</option>
                            <option value="dlt645">DL/T 645</option>
                          </select>
                        </div>

                        <div>
                          <label className="form-label" htmlFor={`ip-${device.instanceId}`} style={{ fontSize: '13px' }}>IP地址</label>
                          <input 
                            id={`ip-${device.instanceId}`}
                            type="text" 
                            className="form-input"
                            placeholder="192.168.1.100"
                            value={deviceParams[device.instanceId]?.ip || ''}
                            onChange={(e) => updateDeviceParam(device.instanceId, 'ip', e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="form-label" htmlFor={`slaveAddress-${device.instanceId}`} style={{ fontSize: '13px' }}>从站地址</label>
                          <input 
                            id={`slaveAddress-${device.instanceId}`}
                            type="number" 
                            className="form-input"
                            min="1"
                            max="247"
                            placeholder="1"
                            value={deviceParams[device.instanceId]?.slaveAddress ?? ''}
                            onChange={(e) => updateDeviceParam(device.instanceId, 'slaveAddress', e.target.value, true)}
                          />
                        </div>

                        <div>
                          <label className="form-label" htmlFor={`pollInterval-${device.instanceId}`} style={{ fontSize: '13px' }}>轮询周期(ms)</label>
                          <input 
                            id={`pollInterval-${device.instanceId}`}
                            type="number" 
                            className="form-input"
                            min="100"
                            step="100"
                            placeholder="1000"
                            value={deviceParams[device.instanceId]?.pollInterval ?? ''}
                            onChange={(e) => updateDeviceParam(device.instanceId, 'pollInterval', e.target.value, true)}
                          />
                        </div>

                        <div>
                          <label className="form-label" htmlFor={`timeout-${device.instanceId}`} style={{ fontSize: '13px' }}>超时时间(ms)</label>
                          <input 
                            id={`timeout-${device.instanceId}`}
                            type="number" 
                            className="form-input"
                            min="100"
                            step="100"
                            placeholder="3000"
                            value={deviceParams[device.instanceId]?.timeout ?? ''}
                            onChange={(e) => updateDeviceParam(device.instanceId, 'timeout', e.target.value, true)}
                          />
                        </div>

                        <div>
                          <label className="form-label" htmlFor={`retries-${device.instanceId}`} style={{ fontSize: '13px' }}>重试次数</label>
                          <input 
                            id={`retries-${device.instanceId}`}
                            type="number" 
                            className="form-input"
                            min="0"
                            max="10"
                            placeholder="3"
                            value={deviceParams[device.instanceId]?.retries ?? ''}
                            onChange={(e) => updateDeviceParam(device.instanceId, 'retries', e.target.value, true)}
                          />
                        </div>

                        <div>
                          <label className="form-label" htmlFor={`alias-${device.instanceId}`} style={{ fontSize: '13px' }}>设备别名</label>
                          <input 
                            id={`alias-${device.instanceId}`}
                            type="text" 
                            className="form-input"
                            placeholder="输入设备别名"
                            value={deviceParams[device.instanceId]?.alias || ''}
                            onChange={(e) => updateDeviceParam(device.instanceId, 'alias', e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="form-label" htmlFor={`location-${device.instanceId}`} style={{ fontSize: '13px' }}>安装位置</label>
                          <input 
                            id={`location-${device.instanceId}`}
                            type="text" 
                            className="form-input"
                            placeholder="如: 1#配电室"
                            value={deviceParams[device.instanceId]?.location || ''}
                            onChange={(e) => updateDeviceParam(device.instanceId, 'location', e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="form-label" htmlFor={`enabled-${device.instanceId}`} style={{ fontSize: '13px' }}>启用状态</label>
                          <select 
                            id={`enabled-${device.instanceId}`}
                            className="form-select"
                            value={deviceParams[device.instanceId]?.enabled !== false ? 'true' : 'false'}
                            onChange={(e) => updateDeviceParam(device.instanceId, 'enabled', e.target.value === 'true')}
                          >
                            <option value="true">启用</option>
                            <option value="false">禁用</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
                  <h4 style={{ marginBottom: '16px', color: 'var(--gray-700)' }}>调度模式选择</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {schedulingModes.map(mode => (
                      <div
                        key={mode.id}
                        onClick={() => setAlgorithmConfig(prev => ({ ...prev, schedulingMode: mode.id }))}
                        style={{
                          padding: '24px',
                          borderRadius: '12px',
                          border: algorithmConfig.schedulingMode === mode.id 
                            ? '2px solid var(--primary)' 
                            : '1px solid var(--gray-200)',
                          background: algorithmConfig.schedulingMode === mode.id 
                            ? 'var(--primary-light)' 
                            : 'white',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>{mode.icon}</div>
                        <div style={{ 
                          fontWeight: '600',
                          color: algorithmConfig.schedulingMode === mode.id ? 'var(--primary)' : 'var(--gray-800)'
                        }}>
                          {mode.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '4px' }}>
                          {mode.description}
                        </div>
                      </div>
                    ))}
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
                      <div className="form-row form-row-3">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">需量限制</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="number"
                              className="form-input"
                              value={algorithmConfig.demandControl.demandLimit}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev,
                                demandControl: { ...prev.demandControl, demandLimit: Number(e.target.value) }
                              }))}
                            />
                            <span style={{ color: 'var(--gray-500)' }}>kW</span>
                          </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">预警阈值</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="number"
                              className="form-input"
                              value={algorithmConfig.demandControl.warningThreshold}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev,
                                demandControl: { ...prev.demandControl, warningThreshold: Number(e.target.value) }
                              }))}
                            />
                            <span style={{ color: 'var(--gray-500)' }}>%</span>
                          </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">动作阈值</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="number"
                              className="form-input"
                              value={algorithmConfig.demandControl.actionThreshold}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev,
                                demandControl: { ...prev.demandControl, actionThreshold: Number(e.target.value) }
                              }))}
                            />
                            <span style={{ color: 'var(--gray-500)' }}>%</span>
                          </div>
                        </div>
                      </div>
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
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>总功率限制 (kW)</span>
                            <input type="number" className="form-input" style={{ width: '80px', padding: '4px' }}
                              value={algorithmConfig.chargerIntegration.maxTotalPower}
                              onChange={(e) => setAlgorithmConfig(prev => ({
                                ...prev, chargerIntegration: { ...prev.chargerIntegration, maxTotalPower: Number(e.target.value) }
                              }))} />
                          </div>
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

                  {/* 策略开关 */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '16px',
                    marginTop: '20px'
                  }}>
                    {[
                      { key: 'antiReversePower', name: '逆功率保护', desc: '防止电力倒送电网' },
                      { key: 'gridPeakShaving', name: '电网削峰', desc: '高峰期储能放电' },
                      { key: 'loadFollowing', name: '负载跟踪', desc: '跟踪负载变化调节' }
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

                  {/* 逆功率保护阈值 */}
                  {algorithmConfig.advanced.antiReversePower && (
                    <div style={{ marginTop: '16px' }}>
                      <div className="form-group" style={{ maxWidth: '300px' }}>
                        <label className="form-label">逆功率保护阈值</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            className="form-input"
                            value={algorithmConfig.advanced.antiReversePowerThreshold}
                            onChange={(e) => setAlgorithmConfig(prev => ({
                              ...prev,
                              advanced: { ...prev.advanced, antiReversePowerThreshold: Number(e.target.value) }
                            }))}
                          />
                          <span style={{ color: 'var(--gray-500)' }}>kW</span>
                        </div>
                      </div>
                    </div>
                  )}
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

                  {/* 点表配置 */}
                  <div style={{ padding: '20px', background: 'var(--gray-50)', borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📋</span> 点表配置
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
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{ fontSize: '12px', padding: '6px' }}
                                    placeholder="如: device1.voltage"
                                    value={point.sourcePath}
                                    onChange={(e) => {
                                      const newPoints = [...northboundConfig.pointTableMapping];
                                      newPoints[index] = { ...point, sourcePath: e.target.value };
                                      setNorthboundConfig(prev => ({ ...prev, pointTableMapping: newPoints }));
                                    }}
                                  />
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
