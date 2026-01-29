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
  protocolTypes,
  northboundProtocols,
  algorithmDefaults
} from '../data/deviceTypes';

const STEPS = [
  { id: 1, name: '工程信息' },
  { id: 2, name: '设备选择' },
  { id: 3, name: '参数微调' },
  { id: 4, name: '电气拓扑' },
  { id: 5, name: '算法策略' },
  { id: 6, name: '北向配置' }
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

function ProjectConfigWizard({ onNavigate }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [validationResults, setValidationResults] = useState([]);
  const fileInputRef = useRef(null);
  const northboundFileInputRef = useRef(null);
  
  // 工程信息
  const [projectInfo, setProjectInfo] = useState({
    name: '',
    location: '',
    manager: '',
    contact: '',
    description: ''
  });

  // 选中的设备和物模型
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);
  
  // 设备参数微调
  const [deviceParams, setDeviceParams] = useState({});

  // 拓扑节点和边
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 拓扑全屏模式
  const [isTopologyFullscreen, setIsTopologyFullscreen] = useState(false);

  // 算法策略配置 - 增强版
  const [algorithmConfig, setAlgorithmConfig] = useState({
    ...algorithmDefaults,
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
    }
  });

  // 北向配置 - 增强版
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
    
    // 初始化设备参数 - 增强版
    const ipLastOctet = Math.min(100 + existingCount, 254);
    setDeviceParams(prev => ({
      ...prev,
      [newDevice.instanceId]: {
        slaveAddress: existingCount + 1,
        port: `COM${(existingCount % 10) + 1}`,
        ip: `192.168.1.${ipLastOctet}`,
        // 增强参数
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
    // 从拓扑中移除节点
    setNodes(prev => prev.filter(n => n.id !== instanceId));
    setEdges(prev => prev.filter(e => e.source !== instanceId && e.target !== instanceId));
  };

  // 删除拓扑中的设备节点
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
    // 简单的自动布局算法
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

  const handleNext = () => {
    if (currentStep < 6) {
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

  // 北向点表导入
  const handleNorthboundPointTableImport = (e) => {
    const file = e.target.files?.[0];
    // Reset file input immediately
    e.target.value = '';
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const pointTable = JSON.parse(event.target.result);
          if (Array.isArray(pointTable)) {
            // Validate and normalize point table entries
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
  };

  // 计数器用于生成唯一ID
  const pointIdCounter = React.useRef(0);

  // 添加北向点位
  const handleAddNorthboundPoint = () => {
    pointIdCounter.current += 1;
    const newPoint = {
      id: `point_${Date.now()}_${pointIdCounter.current}`,
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
  };

  // 删除北向点位
  const handleDeleteNorthboundPoint = (pointId) => {
    setNorthboundConfig(prev => ({
      ...prev,
      pointTableMapping: prev.pointTableMapping.filter(p => p.id !== pointId)
    }));
  };

  const handleValidateAndComplete = () => {
    // 执行验证
    const results = [
      { name: '工程信息完整性', status: projectInfo.name && projectInfo.location ? 'success' : 'error' },
      { name: '设备配置有效性', status: selectedDevices.length > 0 ? 'success' : 'warning' },
      { name: '通信参数校验', status: 'success' },
      { name: '拓扑关系合法性', status: nodes.length > 0 ? 'success' : 'warning' },
      { name: '算法策略配置', status: 'success' }
    ];
    setValidationResults(results);
    setCompleted(true);
  };

  const handleExportConfig = () => {
    const config = {
      projectInfo,
      devices: selectedDevices.map(d => ({
        ...d,
        params: deviceParams[d.instanceId]
      })),
      topology: {
        nodes: nodes.map(n => ({ id: n.id, position: n.position })),
        edges: edges.map(e => ({ source: e.source, target: e.target }))
      },
      algorithmConfig,
      northboundConfig,
      exportedAt: new Date().toISOString(),
      version: '1.0'
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
          if (config.projectInfo) {
            setProjectInfo(config.projectInfo);
          }
          if (config.devices) {
            setSelectedDevices(config.devices);
            const params = {};
            config.devices.forEach(d => {
              params[d.instanceId] = d.params || {};
            });
            setDeviceParams(params);
          }
          if (config.algorithmConfig) {
            setAlgorithmConfig(config.algorithmConfig);
          }
          if (config.northboundConfig) {
            setNorthboundConfig(config.northboundConfig);
          }
          if (config.topology?.nodes) {
            // 重建拓扑节点
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
      devices: selectedDevices.map(d => ({
        ...d,
        params: deviceParams[d.instanceId]
      })),
      topology: {
        nodes: nodes.map(n => ({ id: n.id, position: n.position })),
        edges: edges.map(e => ({ source: e.source, target: e.target }))
      },
      algorithmConfig,
      northboundConfig,
      createdAt: new Date().toISOString()
    };

    const existingProjects = JSON.parse(localStorage.getItem('ems_projects') || '[]');
    existingProjects.push(project);
    localStorage.setItem('ems_projects', JSON.stringify(existingProjects));
  };

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

          {/* 校验结果 */}
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
          {/* 步骤1: 工程基础信息 */}
          {currentStep === 1 && (
            <div>
              <h3 style={{ marginBottom: '20px' }}>步骤 1/6：工程基础信息</h3>
              <div className="notice-banner info">
                <span>💡</span>
                <span>填写项目基本信息，便于后续管理和维护</span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  工程名称 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="如：XX工厂1号配电房EMS配置"
                  value={projectInfo.name}
                  onChange={(e) => updateProjectInfo('name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  工程位置 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="如：XX市XX区XX路XX号 配电室"
                  value={projectInfo.location}
                  onChange={(e) => updateProjectInfo('location', e.target.value)}
                />
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

              <div className="form-group">
                <label className="form-label">项目描述</label>
                <textarea
                  className="form-textarea"
                  placeholder="描述项目概况，如系统规模、主要设备等"
                  value={projectInfo.description}
                  onChange={(e) => updateProjectInfo('description', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* 步骤2: 物模型选择 */}
          {currentStep === 2 && (
            <div>
              <h3 style={{ marginBottom: '20px' }}>步骤 2/6：选择设备物模型</h3>
              <div className="notice-banner info">
                <span>💡</span>
                <span>可以批量添加相同类型的多个设备实例，系统会自动分配端口和地址</span>
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
                          <div
                            key={model.id}
                            className="device-card"
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="device-card-icon">{device?.icon || '📦'}</div>
                            <div className="device-card-title">{model.modelName}</div>
                            <div className="device-card-desc">
                              {model.manufacturer} | {model.voltageLevel?.toUpperCase()}
                            </div>
                            {existingCount > 0 && (
                              <div style={{ 
                                fontSize: '11px', 
                                color: 'var(--primary)', 
                                marginTop: '4px' 
                              }}>
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

          {/* 步骤3: 参数微调 */}
          {currentStep === 3 && (
            <div>
              <h3 style={{ marginBottom: '20px' }}>步骤 3/6：现场参数微调</h3>
              <div className="notice-banner info">
                <span>💡</span>
                <span>以下仅展示现场差异化参数，其余配置复用物模型默认值。批量添加的设备已自动分配不同的端口和地址。</span>
              </div>

              {selectedDevices.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">⚙️</div>
                  <div className="empty-state-title">暂无已选设备</div>
                  <div className="empty-state-desc">请返回上一步添加设备</div>
                </div>
              ) : (
                <div>
                  {selectedDevices.map(device => (
                    <div key={device.instanceId} className="collapse-panel">
                      <div className="collapse-header">
                        <span style={{ fontWeight: '600' }}>{device.instanceName}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span className="tag tag-blue">{device.protocolType || 'modbus_rtu'}</span>
                          <span className={`tag ${deviceParams[device.instanceId]?.enabled !== false ? 'tag-green' : 'tag-gray'}`}>
                            {deviceParams[device.instanceId]?.enabled !== false ? '已启用' : '已禁用'}
                          </span>
                        </div>
                      </div>
                      <div className="collapse-content">
                        {/* 启用开关 */}
                        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={deviceParams[device.instanceId]?.enabled !== false}
                              onChange={(e) => handleDeviceParamChange(device.instanceId, 'enabled', e.target.checked)}
                            />
                            启用此设备
                          </label>
                        </div>
                        
                        <div className="form-row form-row-3">
                          {/* 根据协议类型显示不同的参数 */}
                          {(device.protocolType === 'modbus_rtu' || device.channelType === 'serial' || !device.protocolType) && (
                            <>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">串口端口</label>
                                <select
                                  className="form-select"
                                  value={deviceParams[device.instanceId]?.port || 'COM1'}
                                  onChange={(e) => handleDeviceParamChange(device.instanceId, 'port', e.target.value)}
                                >
                                  {[...Array(10)].map((_, i) => (
                                    <option key={i} value={`COM${i + 1}`}>COM{i + 1}</option>
                                  ))}
                                  <option value="/dev/ttyS0">/dev/ttyS0</option>
                                  <option value="/dev/ttyS1">/dev/ttyS1</option>
                                  <option value="/dev/ttyUSB0">/dev/ttyUSB0</option>
                                  <option value="/dev/ttyUSB1">/dev/ttyUSB1</option>
                                </select>
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">从站地址</label>
                                <input
                                  type="number"
                                  className="form-input"
                                  min="1"
                                  max="247"
                                  value={deviceParams[device.instanceId]?.slaveAddress || 1}
                                  onChange={(e) => handleDeviceParamChange(device.instanceId, 'slaveAddress', Number(e.target.value))}
                                />
                              </div>
                            </>
                          )}
                          {(device.protocolType === 'modbus_tcp' || device.channelType === 'ethernet') && (
                            <>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">设备IP地址</label>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="192.168.1.100"
                                  value={deviceParams[device.instanceId]?.ip || ''}
                                  onChange={(e) => handleDeviceParamChange(device.instanceId, 'ip', e.target.value)}
                                />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">端口号</label>
                                <input
                                  type="number"
                                  className="form-input"
                                  value={deviceParams[device.instanceId]?.portNum || 502}
                                  onChange={(e) => handleDeviceParamChange(device.instanceId, 'portNum', Number(e.target.value))}
                                />
                              </div>
                            </>
                          )}
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">设备实例名称</label>
                            <input
                              type="text"
                              className="form-input"
                              value={device.instanceName}
                              onChange={(e) => {
                                setSelectedDevices(prev => prev.map(d => 
                                  d.instanceId === device.instanceId 
                                    ? { ...d, instanceName: e.target.value }
                                    : d
                                ));
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* 增强参数 */}
                        <div className="form-row form-row-3" style={{ marginTop: '16px' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">超时时间 (ms)</label>
                            <input
                              type="number"
                              className="form-input"
                              value={deviceParams[device.instanceId]?.timeout || 3000}
                              onChange={(e) => handleDeviceParamChange(device.instanceId, 'timeout', Number(e.target.value))}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">重试次数</label>
                            <input
                              type="number"
                              className="form-input"
                              min="0"
                              max="10"
                              value={deviceParams[device.instanceId]?.retries || 3}
                              onChange={(e) => handleDeviceParamChange(device.instanceId, 'retries', Number(e.target.value))}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">轮询周期 (ms)</label>
                            <input
                              type="number"
                              className="form-input"
                              value={deviceParams[device.instanceId]?.pollInterval || 1000}
                              onChange={(e) => handleDeviceParamChange(device.instanceId, 'pollInterval', Number(e.target.value))}
                            />
                          </div>
                        </div>
                        
                        {/* 位置和备注 */}
                        <div className="form-row" style={{ marginTop: '16px' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">设备别名</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="如: 1号电池柜"
                              value={deviceParams[device.instanceId]?.alias || ''}
                              onChange={(e) => handleDeviceParamChange(device.instanceId, 'alias', e.target.value)}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">安装位置</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="如: 配电室A区"
                              value={deviceParams[device.instanceId]?.location || ''}
                              onChange={(e) => handleDeviceParamChange(device.instanceId, 'location', e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
                          <label className="form-label">备注</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="其他说明信息"
                            value={deviceParams[device.instanceId]?.notes || ''}
                            onChange={(e) => handleDeviceParamChange(device.instanceId, 'notes', e.target.value)}
                          />
                        </div>
                        
                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                          <button className="btn btn-secondary btn-sm">
                            🔍 测试连通性
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveDevice(device.instanceId)}
                          >
                            🗑️ 删除设备
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 步骤4: 电气拓扑 */}
          {currentStep === 4 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>步骤 4/6：电气拓扑配置</h3>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setIsTopologyFullscreen(true)}
                >
                  🔍 全屏模式
                </button>
              </div>
              <div className="notice-banner info">
                <span>💡</span>
                <span>将左侧设备拖拽到画布，从设备边缘拖动连线建立电气关系。双击画布上的设备可删除。</span>
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
                    <div style={{ 
                      padding: '20px', 
                      textAlign: 'center', 
                      color: 'var(--gray-400)',
                      fontSize: '13px'
                    }}>
                      暂无设备，请返回上一步添加
                    </div>
                  )}
                  
                  {/* 画布上的设备列表 */}
                  {nodes.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <div className="topology-sidebar-title">画布上的设备 ({nodes.length})</div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '8px' }}>
                        点击"移除"可从画布删除设备
                      </div>
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
                        // 双击删除节点
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
                <button className="btn btn-secondary" onClick={() => {
                  // 拓扑校验
                  if (nodes.length === 0) {
                    alert('请先添加设备到画布');
                  } else if (edges.length === 0) {
                    alert('请建立设备间的电气连接关系');
                  } else {
                    alert('✅ 拓扑配置合法！设备数量: ' + nodes.length + ', 连接数量: ' + edges.length);
                  }
                }}>
                  ✅ 拓扑校验
                </button>
              </div>
            </div>
          )}

          {/* 步骤5: 算法策略 */}
          {currentStep === 5 && (
            <div>
              <h3 style={{ marginBottom: '20px' }}>步骤 5/6：算法策略配置</h3>
              <div className="notice-banner info">
                <span>💡</span>
                <span>配置储能系统的运行策略，包括削峰填谷、需量控制和SOC管理等</span>
              </div>

              {/* 算法策略配置 */}
              <div className="param-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <div className="param-card-title" style={{ color: 'white' }}>
                  <span>⚡</span> 削峰填谷策略
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={algorithmConfig.peakShaving.enabled}
                      onChange={(e) => setAlgorithmConfig(prev => ({
                        ...prev,
                        peakShaving: { ...prev.peakShaving, enabled: e.target.checked }
                      }))}
                    />
                    <span>启用削峰填谷策略</span>
                  </label>
                </div>
                
                {algorithmConfig.peakShaving.enabled && (
                  <div>
                    <h5 style={{ marginBottom: '12px' }}>峰时段配置</h5>
                    <div className="time-period-table" style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px' }}>
                      <div className="time-period-row time-period-header">
                        <span>时段名称</span>
                        <span>开始时间</span>
                        <span>结束时间</span>
                        <span>动作</span>
                        <span>功率</span>
                      </div>
                      {algorithmConfig.peakShaving.peakPeriods.map((period, index) => (
                        <div key={index} className="time-period-row">
                          <span>{period.name}</span>
                          <input
                            type="time"
                            className="form-input"
                            value={period.startTime}
                            onChange={(e) => {
                              const newPeriods = [...algorithmConfig.peakShaving.peakPeriods];
                              newPeriods[index] = { ...period, startTime: e.target.value };
                              setAlgorithmConfig(prev => ({
                                ...prev,
                                peakShaving: { ...prev.peakShaving, peakPeriods: newPeriods }
                              }));
                            }}
                            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }}
                          />
                          <input
                            type="time"
                            className="form-input"
                            value={period.endTime}
                            onChange={(e) => {
                              const newPeriods = [...algorithmConfig.peakShaving.peakPeriods];
                              newPeriods[index] = { ...period, endTime: e.target.value };
                              setAlgorithmConfig(prev => ({
                                ...prev,
                                peakShaving: { ...prev.peakShaving, peakPeriods: newPeriods }
                              }));
                            }}
                            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }}
                          />
                          <span className="tag tag-red">{period.action === 'discharge' ? '放电' : '充电'}</span>
                          <span>{period.maxPower}kW</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 需量控制 */}
              <div className="param-card">
                <div className="param-card-title">
                  <span>📊</span> 需量控制策略
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={algorithmConfig.demandControl.enabled}
                      onChange={(e) => setAlgorithmConfig(prev => ({
                        ...prev,
                        demandControl: { ...prev.demandControl, enabled: e.target.checked }
                      }))}
                    />
                    <span>启用需量控制</span>
                  </label>
                </div>
                {algorithmConfig.demandControl.enabled && (
                  <div className="param-grid">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">需量限值 (kW)</label>
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
                      <label className="form-label">响应时间 (s)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={algorithmConfig.demandControl.responseTime}
                        onChange={(e) => setAlgorithmConfig(prev => ({
                          ...prev,
                          demandControl: { ...prev.demandControl, responseTime: Number(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SOC管理 */}
              <div className="param-card">
                <div className="param-card-title">
                  <span>🔋</span> SOC管理策略
                </div>
                <div className="param-grid">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">最低SOC (%)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={algorithmConfig.socManagement.minSoc}
                      onChange={(e) => setAlgorithmConfig(prev => ({
                        ...prev,
                        socManagement: { ...prev.socManagement, minSoc: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">最高SOC (%)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={algorithmConfig.socManagement.maxSoc}
                      onChange={(e) => setAlgorithmConfig(prev => ({
                        ...prev,
                        socManagement: { ...prev.socManagement, maxSoc: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">目标SOC (%)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={algorithmConfig.socManagement.targetSoc}
                      onChange={(e) => setAlgorithmConfig(prev => ({
                        ...prev,
                        socManagement: { ...prev.socManagement, targetSoc: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">应急储备 (%)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={algorithmConfig.socManagement.emergencyReserve}
                      onChange={(e) => setAlgorithmConfig(prev => ({
                        ...prev,
                        socManagement: { ...prev.socManagement, emergencyReserve: Number(e.target.value) }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* 功率控制 */}
              <div className="param-card">
                <div className="param-card-title">
                  <span>⚙️</span> 功率控制参数
                </div>
                <div className="param-grid">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">功率变化率 (kW/min)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={algorithmConfig.powerControl.rampRate}
                      onChange={(e) => setAlgorithmConfig(prev => ({
                        ...prev,
                        powerControl: { ...prev.powerControl, rampRate: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">最大充电功率 (kW)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={algorithmConfig.powerControl.maxChargePower}
                      onChange={(e) => setAlgorithmConfig(prev => ({
                        ...prev,
                        powerControl: { ...prev.powerControl, maxChargePower: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">最大放电功率 (kW)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={algorithmConfig.powerControl.maxDischargePower}
                      onChange={(e) => setAlgorithmConfig(prev => ({
                        ...prev,
                        powerControl: { ...prev.powerControl, maxDischargePower: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">功率因数</label>
                    <input
                      type="number"
                      className="form-input"
                      step="0.01"
                      value={algorithmConfig.powerControl.powerFactor}
                      onChange={(e) => setAlgorithmConfig(prev => ({
                        ...prev,
                        powerControl: { ...prev.powerControl, powerFactor: Number(e.target.value) }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* 逆功率保护 */}
              <div className="param-card" style={{ background: '#dc2626' }}>
                <div className="param-card-title" style={{ color: 'white' }}>
                  <span>🛡️</span> 逆功率保护
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'white' }}>
                    <input
                      type="checkbox"
                      checked={algorithmConfig.reversePowerProtection?.enabled || false}
                      onChange={(e) => setAlgorithmConfig(prev => ({
                        ...prev,
                        reversePowerProtection: { ...prev.reversePowerProtection, enabled: e.target.checked }
                      }))}
                    />
                    <span>启用逆功率保护</span>
                  </label>
                </div>
                {algorithmConfig.reversePowerProtection?.enabled && (
                  <div className="param-grid">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>逆功率阈值 (kW)</label>
                      <input
                        type="number"
                        className="form-input"
                        min="0"
                        max="10000"
                        value={algorithmConfig.reversePowerProtection?.threshold || 10}
                        onChange={(e) => setAlgorithmConfig(prev => ({
                          ...prev,
                          reversePowerProtection: { ...prev.reversePowerProtection, threshold: Math.max(0, Number(e.target.value)) }
                        }))}
                        style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>动作延迟 (s)</label>
                      <input
                        type="number"
                        className="form-input"
                        min="0"
                        max="300"
                        value={algorithmConfig.reversePowerProtection?.actionDelay || 5}
                        onChange={(e) => setAlgorithmConfig(prev => ({
                          ...prev,
                          reversePowerProtection: { ...prev.reversePowerProtection, actionDelay: Math.max(0, Number(e.target.value)) }
                        }))}
                        style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>保护模式</label>
                      <select
                        className="form-select"
                        value={algorithmConfig.reversePowerProtection?.protectMode || 'cutoff'}
                        onChange={(e) => setAlgorithmConfig(prev => ({
                          ...prev,
                          reversePowerProtection: { ...prev.reversePowerProtection, protectMode: e.target.value }
                        }))}
                        style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }}
                      >
                        <option value="cutoff" style={{ color: 'black' }}>切断</option>
                        <option value="reduce" style={{ color: 'black' }}>降功率</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* 新能源接入策略 */}
              <div className="param-card">
                <div className="param-card-title">
                  <span>🌿</span> 新能源接入策略
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {/* 风电接入 */}
                  <div style={{ padding: '16px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px' }}>
                      <input
                        type="checkbox"
                        checked={algorithmConfig.windIntegration?.enabled || false}
                        onChange={(e) => setAlgorithmConfig(prev => ({
                          ...prev,
                          windIntegration: { ...prev.windIntegration, enabled: e.target.checked }
                        }))}
                      />
                      <span style={{ fontWeight: '600' }}>🌬️ 风电接入</span>
                    </label>
                    {algorithmConfig.windIntegration?.enabled && (
                      <div style={{ fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span>优先级</span>
                          <input type="number" className="form-input" style={{ width: '60px', padding: '4px' }} 
                            value={algorithmConfig.windIntegration?.priorityLevel || 1}
                            onChange={(e) => setAlgorithmConfig(prev => ({
                              ...prev, windIntegration: { ...prev.windIntegration, priorityLevel: Number(e.target.value) }
                            }))} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>限功率 (kW)</span>
                          <input type="number" className="form-input" style={{ width: '80px', padding: '4px' }}
                            value={algorithmConfig.windIntegration?.maxPowerLimit || 1000}
                            onChange={(e) => setAlgorithmConfig(prev => ({
                              ...prev, windIntegration: { ...prev.windIntegration, maxPowerLimit: Number(e.target.value) }
                            }))} />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 光伏接入 */}
                  <div style={{ padding: '16px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px' }}>
                      <input
                        type="checkbox"
                        checked={algorithmConfig.solarIntegration?.enabled || false}
                        onChange={(e) => setAlgorithmConfig(prev => ({
                          ...prev,
                          solarIntegration: { ...prev.solarIntegration, enabled: e.target.checked }
                        }))}
                      />
                      <span style={{ fontWeight: '600' }}>☀️ 光伏接入</span>
                    </label>
                    {algorithmConfig.solarIntegration?.enabled && (
                      <div style={{ fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span>优先级</span>
                          <input type="number" className="form-input" style={{ width: '60px', padding: '4px' }}
                            value={algorithmConfig.solarIntegration?.priorityLevel || 2}
                            onChange={(e) => setAlgorithmConfig(prev => ({
                              ...prev, solarIntegration: { ...prev.solarIntegration, priorityLevel: Number(e.target.value) }
                            }))} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>限功率 (kW)</span>
                          <input type="number" className="form-input" style={{ width: '80px', padding: '4px' }}
                            value={algorithmConfig.solarIntegration?.maxPowerLimit || 500}
                            onChange={(e) => setAlgorithmConfig(prev => ({
                              ...prev, solarIntegration: { ...prev.solarIntegration, maxPowerLimit: Number(e.target.value) }
                            }))} />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 柴发接入 */}
                  <div style={{ padding: '16px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px' }}>
                      <input
                        type="checkbox"
                        checked={algorithmConfig.dieselIntegration?.enabled || false}
                        onChange={(e) => setAlgorithmConfig(prev => ({
                          ...prev,
                          dieselIntegration: { ...prev.dieselIntegration, enabled: e.target.checked }
                        }))}
                      />
                      <span style={{ fontWeight: '600' }}>⛽ 柴发接入</span>
                    </label>
                    {algorithmConfig.dieselIntegration?.enabled && (
                      <div style={{ fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span>启动SOC阈值 (%)</span>
                          <input type="number" className="form-input" style={{ width: '60px', padding: '4px' }}
                            value={algorithmConfig.dieselIntegration?.startSocThreshold || 15}
                            onChange={(e) => setAlgorithmConfig(prev => ({
                              ...prev, dieselIntegration: { ...prev.dieselIntegration, startSocThreshold: Number(e.target.value) }
                            }))} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>停止SOC阈值 (%)</span>
                          <input type="number" className="form-input" style={{ width: '60px', padding: '4px' }}
                            value={algorithmConfig.dieselIntegration?.stopSocThreshold || 80}
                            onChange={(e) => setAlgorithmConfig(prev => ({
                              ...prev, dieselIntegration: { ...prev.dieselIntegration, stopSocThreshold: Number(e.target.value) }
                            }))} />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 充电桩接入 */}
                  <div style={{ padding: '16px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px' }}>
                      <input
                        type="checkbox"
                        checked={algorithmConfig.chargerIntegration?.enabled || false}
                        onChange={(e) => setAlgorithmConfig(prev => ({
                          ...prev,
                          chargerIntegration: { ...prev.chargerIntegration, enabled: e.target.checked }
                        }))}
                      />
                      <span style={{ fontWeight: '600' }}>🔌 充电桩接入</span>
                    </label>
                    {algorithmConfig.chargerIntegration?.enabled && (
                      <div style={{ fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span>总功率限制 (kW)</span>
                          <input type="number" className="form-input" style={{ width: '80px', padding: '4px' }}
                            value={algorithmConfig.chargerIntegration?.maxTotalPower || 300}
                            onChange={(e) => setAlgorithmConfig(prev => ({
                              ...prev, chargerIntegration: { ...prev.chargerIntegration, maxTotalPower: Number(e.target.value) }
                            }))} />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={algorithmConfig.chargerIntegration?.loadBalancing !== false}
                            onChange={(e) => setAlgorithmConfig(prev => ({
                              ...prev, chargerIntegration: { ...prev.chargerIntegration, loadBalancing: e.target.checked }
                            }))} />
                          <span>负载均衡</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 步骤6: 北向配置 */}
          {currentStep === 6 && (
            <div>
              <h3 style={{ marginBottom: '20px' }}>步骤 6/6：北向接口配置</h3>
              <div className="notice-banner info">
                <span>💡</span>
                <span>配置数据上报到上级平台的接口参数，包括协议、地址、点表映射等</span>
              </div>

              {/* 北向配置 */}
              <div className="param-card" style={{ background: '#1e3a5f', color: 'white' }}>
                <div className="param-card-title" style={{ color: 'white' }}>
                  <span>🌐</span> 北向接口基础配置
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={northboundConfig.enabled}
                      onChange={(e) => setNorthboundConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    />
                    <span>启用北向数据上报</span>
                  </label>
                </div>
                
                {northboundConfig.enabled && (
                  <>
                    <div className="param-grid">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>协议类型</label>
                        <select
                          className="form-select"
                          value={northboundConfig.protocol}
                          onChange={(e) => {
                            const protocol = northboundProtocols.find(p => p.id === e.target.value);
                            setNorthboundConfig(prev => ({
                              ...prev,
                              protocol: e.target.value,
                              serverPort: protocol?.port || 1883
                            }));
                          }}
                          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                        >
                          {northboundProtocols.map(p => (
                            <option key={p.id} value={p.id} style={{ color: 'black' }}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>服务器地址</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="192.168.1.200"
                          value={northboundConfig.serverIp}
                          onChange={(e) => setNorthboundConfig(prev => ({ ...prev, serverIp: e.target.value }))}
                          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>端口号</label>
                        <input
                          type="number"
                          className="form-input"
                          value={northboundConfig.serverPort}
                          onChange={(e) => setNorthboundConfig(prev => ({ ...prev, serverPort: Number(e.target.value) }))}
                          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>上报周期 (ms)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={northboundConfig.publishInterval}
                          onChange={(e) => setNorthboundConfig(prev => ({ ...prev, publishInterval: Number(e.target.value) }))}
                          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                        />
                      </div>
                    </div>
                    
                    {/* MQTT特定配置 */}
                    {northboundConfig.protocol === 'mqtt' && (
                      <div className="param-grid" style={{ marginTop: '16px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Topic</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="ems/data"
                            value={northboundConfig.topic}
                            onChange={(e) => setNorthboundConfig(prev => ({ ...prev, topic: e.target.value }))}
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Client ID</label>
                          <input
                            type="text"
                            className="form-input"
                            value={northboundConfig.clientId}
                            onChange={(e) => setNorthboundConfig(prev => ({ ...prev, clientId: e.target.value }))}
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>QoS等级</label>
                          <select
                            className="form-select"
                            value={northboundConfig.qos}
                            onChange={(e) => setNorthboundConfig(prev => ({ ...prev, qos: Number(e.target.value) }))}
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                          >
                            <option value={0} style={{ color: 'black' }}>QoS 0 - 最多一次</option>
                            <option value={1} style={{ color: 'black' }}>QoS 1 - 至少一次</option>
                            <option value={2} style={{ color: 'black' }}>QoS 2 - 恰好一次</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Keep Alive (s)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={northboundConfig.keepAlive}
                            onChange={(e) => setNorthboundConfig(prev => ({ ...prev, keepAlive: Number(e.target.value) }))}
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>用户名</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="可选"
                            value={northboundConfig.username}
                            onChange={(e) => setNorthboundConfig(prev => ({ ...prev, username: e.target.value }))}
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>密码</label>
                          <input
                            type="password"
                            className="form-input"
                            placeholder="可选"
                            value={northboundConfig.password}
                            onChange={(e) => setNorthboundConfig(prev => ({ ...prev, password: e.target.value }))}
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* IEC104特定配置 */}
                    {northboundConfig.protocol === 'iec104_server' && (
                      <div className="param-grid" style={{ marginTop: '16px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>公共地址</label>
                          <input
                            type="number"
                            className="form-input"
                            value={northboundConfig.iec104Config?.commonAddress || 1}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              iec104Config: { ...prev.iec104Config, commonAddress: Number(e.target.value) }
                            }))}
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>K值</label>
                          <input
                            type="number"
                            className="form-input"
                            value={northboundConfig.iec104Config?.k || 12}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              iec104Config: { ...prev.iec104Config, k: Number(e.target.value) }
                            }))}
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>W值</label>
                          <input
                            type="number"
                            className="form-input"
                            value={northboundConfig.iec104Config?.w || 8}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              iec104Config: { ...prev.iec104Config, w: Number(e.target.value) }
                            }))}
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>T1超时 (s)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={northboundConfig.iec104Config?.t1 || 15}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              iec104Config: { ...prev.iec104Config, t1: Number(e.target.value) }
                            }))}
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>T2超时 (s)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={northboundConfig.iec104Config?.t2 || 10}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              iec104Config: { ...prev.iec104Config, t2: Number(e.target.value) }
                            }))}
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>T3超时 (s)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={northboundConfig.iec104Config?.t3 || 20}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              iec104Config: { ...prev.iec104Config, t3: Number(e.target.value) }
                            }))}
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* HTTP/REST API特定配置 */}
                    {(northboundConfig.protocol === 'http' || northboundConfig.protocol === 'https') && (
                      <div className="param-grid" style={{ marginTop: '16px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>请求方法</label>
                          <select
                            className="form-select"
                            value={northboundConfig.httpConfig?.method || 'POST'}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              httpConfig: { ...prev.httpConfig, method: e.target.value }
                            }))}
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                          >
                            <option value="POST" style={{ color: 'black' }}>POST</option>
                            <option value="PUT" style={{ color: 'black' }}>PUT</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Content-Type</label>
                          <select
                            className="form-select"
                            value={northboundConfig.httpConfig?.contentType || 'application/json'}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              httpConfig: { ...prev.httpConfig, contentType: e.target.value }
                            }))}
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                          >
                            <option value="application/json" style={{ color: 'black' }}>application/json</option>
                            <option value="application/xml" style={{ color: 'black' }}>application/xml</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>认证方式</label>
                          <select
                            className="form-select"
                            value={northboundConfig.httpConfig?.authType || 'none'}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              httpConfig: { ...prev.httpConfig, authType: e.target.value }
                            }))}
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                          >
                            <option value="none" style={{ color: 'black' }}>无认证</option>
                            <option value="basic" style={{ color: 'black' }}>Basic Auth</option>
                            <option value="bearer" style={{ color: 'black' }}>Bearer Token</option>
                          </select>
                        </div>
                        {northboundConfig.httpConfig?.authType === 'bearer' && (
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Token</label>
                            <input
                              type="password"
                              className="form-input"
                              placeholder="Bearer Token"
                              value={northboundConfig.httpConfig?.authToken || ''}
                              onChange={(e) => setNorthboundConfig(prev => ({ 
                                ...prev, 
                                httpConfig: { ...prev.httpConfig, authToken: e.target.value }
                              }))}
                              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Modbus TCP服务端配置 */}
                    {northboundConfig.protocol === 'modbus_tcp_server' && (
                      <div className="param-grid" style={{ marginTop: '16px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>从站地址</label>
                          <input
                            type="number"
                            className="form-input"
                            min="1"
                            max="247"
                            value={northboundConfig.modbusServerConfig?.unitId || 1}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              modbusServerConfig: { ...prev.modbusServerConfig, unitId: Number(e.target.value) }
                            }))}
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>最大连接数</label>
                          <input
                            type="number"
                            className="form-input"
                            value={northboundConfig.modbusServerConfig?.maxConnections || 5}
                            onChange={(e) => setNorthboundConfig(prev => ({ 
                              ...prev, 
                              modbusServerConfig: { ...prev.modbusServerConfig, maxConnections: Number(e.target.value) }
                            }))}
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* 高级配置 */}
                    <div className="param-grid" style={{ marginTop: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>心跳间隔 (s)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={northboundConfig.heartbeatInterval}
                          onChange={(e) => setNorthboundConfig(prev => ({ ...prev, heartbeatInterval: Number(e.target.value) }))}
                          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>重连间隔 (ms)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={northboundConfig.reconnectInterval}
                          onChange={(e) => setNorthboundConfig(prev => ({ ...prev, reconnectInterval: Number(e.target.value) }))}
                          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>最大重连次数</label>
                        <input
                          type="number"
                          className="form-input"
                          value={northboundConfig.maxReconnectAttempts}
                          onChange={(e) => setNorthboundConfig(prev => ({ ...prev, maxReconnectAttempts: Number(e.target.value) }))}
                          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>数据格式</label>
                        <select
                          className="form-select"
                          value={northboundConfig.dataFormat}
                          onChange={(e) => setNorthboundConfig(prev => ({ ...prev, dataFormat: e.target.value }))}
                          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                        >
                          <option value="json" style={{ color: 'black' }}>JSON</option>
                          <option value="xml" style={{ color: 'black' }}>XML</option>
                          <option value="binary" style={{ color: 'black' }}>Binary</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* 点表配置 */}
              {northboundConfig.enabled && (
                <div className="param-card">
                  <div className="param-card-title">
                    <span>📋</span> 点表映射配置
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                      <input
                        type="file"
                        ref={northboundFileInputRef}
                        onChange={handleNorthboundPointTableImport}
                        accept=".json"
                        style={{ display: 'none' }}
                      />
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => northboundFileInputRef.current?.click()}
                      >
                        📥 导入点表
                      </button>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={handleAddNorthboundPoint}
                      >
                        ➕ 添加点位
                      </button>
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={northboundConfig.pointTableEnabled}
                        onChange={(e) => setNorthboundConfig(prev => ({ ...prev, pointTableEnabled: e.target.checked }))}
                      />
                      <span>启用点表映射</span>
                    </label>
                  </div>
                  
                  {northboundConfig.pointTableEnabled && (
                    <div>
                      {northboundConfig.pointTableMapping.length === 0 ? (
                        <div style={{ 
                          padding: '30px', 
                          textAlign: 'center', 
                          color: 'var(--gray-400)',
                          border: '1px dashed var(--gray-300)',
                          borderRadius: '8px'
                        }}>
                          暂无点位配置，点击"添加点位"或"导入点表"
                        </div>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                              <tr style={{ background: 'var(--gray-100)' }}>
                                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>源路径</th>
                                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>目标路径</th>
                                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>数据类型</th>
                                <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid var(--gray-200)' }}>倍率</th>
                                <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid var(--gray-200)' }}>偏移</th>
                                <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid var(--gray-200)' }}>操作</th>
                              </tr>
                            </thead>
                            <tbody>
                              {northboundConfig.pointTableMapping.map((point, index) => (
                                <tr key={point.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                  <td style={{ padding: '6px' }}>
                                    <input
                                      type="text"
                                      className="form-input"
                                      style={{ padding: '4px 8px', fontSize: '12px' }}
                                      placeholder="如: pcs/power"
                                      value={point.sourcePath}
                                      onChange={(e) => {
                                        const newMapping = [...northboundConfig.pointTableMapping];
                                        newMapping[index] = { ...point, sourcePath: e.target.value };
                                        setNorthboundConfig(prev => ({ ...prev, pointTableMapping: newMapping }));
                                      }}
                                    />
                                  </td>
                                  <td style={{ padding: '6px' }}>
                                    <input
                                      type="text"
                                      className="form-input"
                                      style={{ padding: '4px 8px', fontSize: '12px' }}
                                      placeholder="如: data/active_power"
                                      value={point.targetPath}
                                      onChange={(e) => {
                                        const newMapping = [...northboundConfig.pointTableMapping];
                                        newMapping[index] = { ...point, targetPath: e.target.value };
                                        setNorthboundConfig(prev => ({ ...prev, pointTableMapping: newMapping }));
                                      }}
                                    />
                                  </td>
                                  <td style={{ padding: '6px' }}>
                                    <select
                                      className="form-select"
                                      style={{ padding: '4px 8px', fontSize: '12px' }}
                                      value={point.dataType}
                                      onChange={(e) => {
                                        const newMapping = [...northboundConfig.pointTableMapping];
                                        newMapping[index] = { ...point, dataType: e.target.value };
                                        setNorthboundConfig(prev => ({ ...prev, pointTableMapping: newMapping }));
                                      }}
                                    >
                                      <option value="float">Float</option>
                                      <option value="int">Int</option>
                                      <option value="bool">Bool</option>
                                      <option value="string">String</option>
                                    </select>
                                  </td>
                                  <td style={{ padding: '6px', width: '80px' }}>
                                    <input
                                      type="number"
                                      className="form-input"
                                      style={{ padding: '4px 8px', fontSize: '12px', textAlign: 'center' }}
                                      value={point.scale}
                                      onChange={(e) => {
                                        const newMapping = [...northboundConfig.pointTableMapping];
                                        newMapping[index] = { ...point, scale: Number(e.target.value) };
                                        setNorthboundConfig(prev => ({ ...prev, pointTableMapping: newMapping }));
                                      }}
                                    />
                                  </td>
                                  <td style={{ padding: '6px', width: '80px' }}>
                                    <input
                                      type="number"
                                      className="form-input"
                                      style={{ padding: '4px 8px', fontSize: '12px', textAlign: 'center' }}
                                      value={point.offset}
                                      onChange={(e) => {
                                        const newMapping = [...northboundConfig.pointTableMapping];
                                        newMapping[index] = { ...point, offset: Number(e.target.value) };
                                        setNorthboundConfig(prev => ({ ...prev, pointTableMapping: newMapping }));
                                      }}
                                    />
                                  </td>
                                  <td style={{ padding: '6px', textAlign: 'center' }}>
                                    <button
                                      className="btn btn-sm btn-danger"
                                      onClick={() => handleDeleteNorthboundPoint(point.id)}
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
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="wizard-footer">
          <div className="wizard-footer-left">
            <button
              className="btn btn-secondary"
              disabled={currentStep === 1}
              onClick={handlePrev}
            >
              ← 上一步
            </button>
          </div>
          <div className="wizard-footer-right">
            <button className="btn btn-primary" onClick={handleNext}>
              {currentStep === 6 ? '✓ 校验并完成' : '下一步 →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectConfigWizard;
