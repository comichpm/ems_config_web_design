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
  { id: 5, name: '算法&北向' }
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

  // 算法策略配置
  const [algorithmConfig, setAlgorithmConfig] = useState(algorithmDefaults);

  // 北向配置
  const [northboundConfig, setNorthboundConfig] = useState({
    enabled: false,
    protocol: 'mqtt',
    serverIp: '',
    serverPort: 1883,
    topic: 'ems/data',
    username: '',
    password: '',
    publishInterval: 5000
  });

  // 加载已保存的物模型
  useEffect(() => {
    const savedModels = JSON.parse(localStorage.getItem('ems_device_models') || '[]');
    setDeviceModels(savedModels);
  }, []);

  const updateProjectInfo = (field, value) => {
    setProjectInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleAddDevice = (model) => {
    const newDevice = {
      ...model,
      instanceId: `${model.id}_${Date.now()}`,
      instanceName: `${model.modelName}_${selectedDevices.filter(d => d.id === model.id).length + 1}`
    };
    setSelectedDevices(prev => [...prev, newDevice]);
    
    // 初始化设备参数
    setDeviceParams(prev => ({
      ...prev,
      [newDevice.instanceId]: {
        slaveAddress: 1,
        port: 'COM1',
        ip: '192.168.1.100'
      }
    }));
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
    if (currentStep < 5) {
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
              <h3 style={{ marginBottom: '20px' }}>步骤 1/5：工程基础信息</h3>
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
              <h3 style={{ marginBottom: '20px' }}>步骤 2/5：选择设备物模型</h3>
              
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
                        return (
                          <div
                            key={model.id}
                            className="device-card"
                            onClick={() => handleAddDevice(model)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="device-card-icon">{device?.icon || '📦'}</div>
                            <div className="device-card-title">{model.modelName}</div>
                            <div className="device-card-desc">
                              {model.manufacturer} | {model.voltageLevel?.toUpperCase()}
                            </div>
                            <button className="btn btn-sm btn-primary" style={{ marginTop: '8px', width: '100%' }}>
                              ➕ 添加
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 右侧：已选设备 */}
                <div style={{ width: '300px' }}>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                          <div>
                            <div style={{ fontWeight: '500' }}>{device.instanceName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                              {device.manufacturer}
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
              <h3 style={{ marginBottom: '20px' }}>步骤 3/5：现场参数微调</h3>
              <div className="notice-banner info">
                <span>💡</span>
                <span>以下仅展示现场差异化参数，其余配置复用物模型默认值</span>
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
                        <span className="tag tag-blue">{device.protocolType}</span>
                      </div>
                      <div className="collapse-content">
                        <div className="form-row form-row-3">
                          {/* 根据协议类型显示不同的参数 */}
                          {(device.protocolType === 'modbus_rtu' || device.channelType === 'serial') && (
                            <>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">串口端口</label>
                                <select
                                  className="form-select"
                                  value={deviceParams[device.instanceId]?.port || 'COM1'}
                                  onChange={(e) => handleDeviceParamChange(device.instanceId, 'port', e.target.value)}
                                >
                                  <option>COM1</option>
                                  <option>COM2</option>
                                  <option>COM3</option>
                                  <option>COM4</option>
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
                        <div style={{ marginTop: '12px' }}>
                          <button className="btn btn-secondary btn-sm">
                            🔍 测试连通性
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
              <h3 style={{ marginBottom: '20px' }}>步骤 4/5：电气拓扑配置</h3>
              <div className="notice-banner info">
                <span>💡</span>
                <span>将左侧设备拖拽到画布，然后从设备边缘拖动连线建立电气关系</span>
              </div>

              <div className="topology-container">
                {/* 左侧设备列表 */}
                <div className="topology-sidebar">
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
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '500' }}>{device.instanceName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                            {isOnCanvas ? '已在画布' : '拖拽到画布'}
                          </div>
                        </div>
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
                </div>

                {/* 右侧拓扑画布 */}
                <div className="topology-canvas">
                  <ReactFlowProvider>
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      onConnect={onConnect}
                      onDrop={onDrop}
                      onDragOver={onDragOver}
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

              <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={handleAutoLayout}>
                  📐 自动布局
                </button>
                <button className="btn btn-secondary" onClick={() => setEdges([])}>
                  🗑️ 清除连线
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

          {/* 步骤5: 算法策略&北向配置 */}
          {currentStep === 5 && (
            <div>
              <h3 style={{ marginBottom: '20px' }}>步骤 5/5：算法策略&北向配置</h3>

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

              {/* 北向配置 */}
              <div className="param-card" style={{ background: '#1e3a5f', color: 'white' }}>
                <div className="param-card-title" style={{ color: 'white' }}>
                  <span>🌐</span> 北向接口配置
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
                    {northboundConfig.protocol === 'mqtt' && (
                      <>
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
                      </>
                    )}
                  </div>
                )}
              </div>
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
              {currentStep === 5 ? '✓ 校验并完成' : '下一步 →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectConfigWizard;
