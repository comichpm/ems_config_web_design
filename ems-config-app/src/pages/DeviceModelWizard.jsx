import React, { useState, useRef } from 'react';
import {
  deviceCategories,
  protocolTypes,
  channelTypes,
  manufacturers,
  manufacturersByCategory,
  voltageLevels,
  voltageLevelsByDevice,
  deviceBasicAttributes,
  deviceAdvancedAttributes,
  alarmLevels,
  notificationMethods,
  defaultAlarmRules,
  samplePointTables,
  protocolPointTableTypes,
  pointTableNames,
  virtualPointRules
} from '../data/deviceTypes';

const STEPS = [
  { id: 1, name: '基础信息' },
  { id: 2, name: '设备属性' },
  { id: 3, name: '协议&通道' },
  { id: 4, name: '告警规则' },
  { id: 5, name: '拓扑&虚拟点' }
];

function DeviceModelWizard({ onNavigate }) {
  const [currentStep, setCurrentStep] = useState(1);
  const customFieldCounter = useRef(0);
  const pointTableFileRef = useRef(null);
  const [customPointTable, setCustomPointTable] = useState([]);
  
  // 点表编辑状态
  const [pointModalOpen, setPointModalOpen] = useState(false);
  const [editingPointIndex, setEditingPointIndex] = useState(-1); // -1表示新增
  const [pointForm, setPointForm] = useState({
    name: '',
    address: '',
    type: 'uint16',
    rw: 'R',
    functionCode: '03',
    byteOrder: 'big',
    scale: 1,
    offset: 0,
    unit: '',
    description: ''
  });
  
  // 触发条件类型定义
  const triggerConditionTypes = [
    { id: 'gt', name: '大于 (>)', symbol: '>', category: 'compare' },
    { id: 'lt', name: '小于 (<)', symbol: '<', category: 'compare' },
    { id: 'eq', name: '等于 (==)', symbol: '==', category: 'compare' },
    { id: 'ne', name: '不等于 (!=)', symbol: '!=', category: 'compare' },
    { id: 'gte', name: '大于等于 (>=)', symbol: '>=', category: 'compare' },
    { id: 'lte', name: '小于等于 (<=)', symbol: '<=', category: 'compare' },
    { id: 'between', name: '在范围内', symbol: 'between', category: 'range' },
    { id: 'outside', name: '超出范围', symbol: 'outside', category: 'range' },
    { id: 'rising', name: '上升沿 (0→1)', symbol: 'rising', category: 'state' },
    { id: 'falling', name: '下降沿 (1→0)', symbol: 'falling', category: 'state' },
    { id: 'changed', name: '状态改变', symbol: 'changed', category: 'state' },
    { id: 'duration', name: '持续超限N秒', symbol: 'duration', category: 'time' }
  ];
  const [formData, setFormData] = useState({
    // 基础信息
    deviceCategory: '',
    deviceType: '',
    modelName: '',
    manufacturer: '',
    modelNumber: '',
    description: '',
    voltageLevel: '',
    // 自定义字段
    customFields: [],
    // 设备属性（动态）
    basicAttributes: {},
    advancedAttributes: {},
    // 算法参数（PCS相关）
    adjustThreshold: 220,
    responseTime: 0.5,
    pidKp: 2.5,
    pidKi: 0.1,
    pidKd: 0.05,
    compensationFactor: 1.02,
    // 协议配置
    protocolType: 'modbus_rtu',
    channelType: 'serial',
    protocolConfig: {},
    channelConfig: {},
    selectedPointTable: '',
    // 通信参数
    timeout: 3000,
    retries: 3,
    reconnectInterval: 5000,
    pollInterval: 1000,
    // 告警规则
    alarmRules: [],
    // 拓扑元数据
    upstreamDevices: [],
    downstreamDevices: [],
    // 虚拟点
    virtualPoints: []
  });

  const [completed, setCompleted] = useState(false);

  // 获取当前协议可用的点表类型
  const getAvailablePointTables = () => {
    const tables = protocolPointTableTypes[formData.protocolType] || [];
    return tables.map(tableId => ({
      id: tableId,
      name: pointTableNames[tableId] || tableId
    }));
  };

  // 导入点表模板
  const handlePointTableImport = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const points = JSON.parse(event.target.result);
          if (Array.isArray(points)) {
            setCustomPointTable(points);
            updateFormData('selectedPointTable', 'custom');
            alert(`成功导入 ${points.length} 个点位`);
          } else {
            alert('点表格式错误，请使用JSON数组格式');
          }
        } catch (err) {
          alert('点表文件解析失败');
        }
      };
      reader.readAsText(file);
    }
  };

  // 获取当前点表数据
  const getCurrentPointTableData = () => {
    if (formData.selectedPointTable === 'custom') {
      return customPointTable;
    }
    return samplePointTables[formData.selectedPointTable] || [];
  };

  // 点表CRUD函数
  const handleOpenAddPoint = () => {
    setPointForm({
      name: '',
      address: '',
      type: 'uint16',
      rw: 'R',
      functionCode: '03',
      byteOrder: 'big',
      scale: 1,
      offset: 0,
      unit: '',
      description: ''
    });
    setEditingPointIndex(-1);
    setPointModalOpen(true);
  };

  const handleOpenEditPoint = (index) => {
    const points = getCurrentPointTableData();
    const point = points[index];
    setPointForm({
      name: point.name || '',
      address: point.address || point.ioa || point.reference || point.nodeId || point.canId || point.dataId || '',
      type: point.type || 'uint16',
      rw: point.rw || 'R',
      functionCode: point.functionCode || '03',
      byteOrder: point.byteOrder || 'big',
      scale: point.scale || 1,
      offset: point.offset || 0,
      unit: point.unit || '',
      description: point.description || ''
    });
    setEditingPointIndex(index);
    setPointModalOpen(true);
  };

  const handleSavePoint = () => {
    if (!pointForm.name || !pointForm.address) {
      alert('请填写点位名称和地址');
      return;
    }
    
    // 构建点位对象（根据协议类型设置地址字段）
    const newPoint = {
      name: pointForm.name,
      type: pointForm.type,
      rw: pointForm.rw,
      functionCode: pointForm.functionCode,
      byteOrder: pointForm.byteOrder,
      scale: pointForm.scale,
      offset: pointForm.offset,
      unit: pointForm.unit,
      description: pointForm.description
    };
    
    // 根据协议类型设置正确的地址字段
    if (formData.protocolType.startsWith('modbus')) {
      newPoint.address = pointForm.address;
    } else if (formData.protocolType === 'iec104') {
      newPoint.ioa = pointForm.address;
    } else if (formData.protocolType === 'iec61850') {
      newPoint.reference = pointForm.address;
    } else if (formData.protocolType === 'opc') {
      newPoint.nodeId = pointForm.address;
    } else if (formData.protocolType === 'can') {
      newPoint.canId = pointForm.address;
    } else if (formData.protocolType.startsWith('dlt645')) {
      newPoint.dataId = pointForm.address;
    } else {
      newPoint.address = pointForm.address;
    }
    
    // 确保使用自定义点表
    if (formData.selectedPointTable !== 'custom') {
      // 复制当前点表到自定义
      const currentPoints = [...getCurrentPointTableData()];
      setCustomPointTable(currentPoints);
      updateFormData('selectedPointTable', 'custom');
    }
    
    const updatedPoints = [...customPointTable];
    if (editingPointIndex >= 0) {
      updatedPoints[editingPointIndex] = newPoint;
    } else {
      updatedPoints.push(newPoint);
    }
    setCustomPointTable(updatedPoints);
    setPointModalOpen(false);
  };

  const handleDeletePoint = (index) => {
    if (!confirm('确定要删除此点位吗？')) return;
    
    // 确保使用自定义点表
    if (formData.selectedPointTable !== 'custom') {
      const currentPoints = [...getCurrentPointTableData()];
      setCustomPointTable(currentPoints);
      updateFormData('selectedPointTable', 'custom');
    }
    
    const updatedPoints = customPointTable.filter((_, i) => i !== index);
    setCustomPointTable(updatedPoints);
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 获取当前设备分类对应的厂商列表
  const getCurrentManufacturers = () => {
    if (formData.deviceCategory && manufacturersByCategory[formData.deviceCategory]) {
      return manufacturersByCategory[formData.deviceCategory];
    }
    return manufacturers;
  };

  // 获取当前设备类型对应的电压等级
  const getCurrentVoltageLevels = () => {
    if (formData.deviceType && voltageLevelsByDevice[formData.deviceType]) {
      return voltageLevelsByDevice[formData.deviceType];
    }
    return voltageLevelsByDevice.default || voltageLevels;
  };

  // 获取当前设备类型的基础属性配置
  const getCurrentBasicAttributes = () => {
    if (formData.deviceType && deviceBasicAttributes[formData.deviceType]) {
      return deviceBasicAttributes[formData.deviceType];
    }
    return deviceBasicAttributes.default || [];
  };

  // 获取当前设备类型的高级属性配置
  const getCurrentAdvancedAttributes = () => {
    if (formData.deviceType && deviceAdvancedAttributes[formData.deviceType]) {
      return deviceAdvancedAttributes[formData.deviceType];
    }
    return deviceAdvancedAttributes.default || [];
  };

  // 初始化设备属性（当设备类型变化时）
  const initializeDeviceAttributes = (deviceType) => {
    const basicAttrs = deviceBasicAttributes[deviceType] || deviceBasicAttributes.default || [];
    const advancedAttrs = deviceAdvancedAttributes[deviceType] || deviceAdvancedAttributes.default || [];
    
    const newBasicAttributes = {};
    basicAttrs.forEach(attr => {
      newBasicAttributes[attr.key] = attr.default;
    });
    
    const newAdvancedAttributes = {};
    advancedAttrs.forEach(attr => {
      newAdvancedAttributes[attr.key] = attr.default;
    });
    
    // 设置默认电压等级
    const voltageLevelsForDevice = voltageLevelsByDevice[deviceType] || voltageLevelsByDevice.default;
    const defaultVoltageLevel = voltageLevelsForDevice?.[0]?.id || '380v';
    
    setFormData(prev => ({
      ...prev,
      basicAttributes: newBasicAttributes,
      advancedAttributes: newAdvancedAttributes,
      voltageLevel: defaultVoltageLevel
    }));
  };

  // 添加自定义字段
  const handleAddCustomField = () => {
    customFieldCounter.current += 1;
    const newField = {
      id: `custom_${Date.now()}_${customFieldCounter.current}`,
      name: '',
      value: '',
      unit: ''
    };
    updateFormData('customFields', [...formData.customFields, newField]);
  };

  // 更新自定义字段
  const handleUpdateCustomField = (index, field, value) => {
    const newFields = [...formData.customFields];
    newFields[index] = { ...newFields[index], [field]: value };
    updateFormData('customFields', newFields);
  };

  // 删除自定义字段
  const handleDeleteCustomField = (index) => {
    const newFields = formData.customFields.filter((_, i) => i !== index);
    updateFormData('customFields', newFields);
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // 保存物模型到localStorage
    const newModel = {
      ...formData,
      id: `model_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const existingModels = JSON.parse(localStorage.getItem('ems_device_models') || '[]');
    existingModels.push(newModel);
    localStorage.setItem('ems_device_models', JSON.stringify(existingModels));
    setCompleted(true);
  };

  const handleSaveDraft = () => {
    const draft = {
      ...formData,
      id: `draft_${Date.now()}`,
      isDraft: true,
      savedAt: new Date().toISOString()
    };
    const drafts = JSON.parse(localStorage.getItem('ems_model_drafts') || '[]');
    drafts.push(draft);
    localStorage.setItem('ems_model_drafts', JSON.stringify(drafts));
    alert('草稿保存成功！');
  };

  const handleAddAlarmRule = () => {
    const newRule = {
      id: Date.now(),
      name: '',
      condition: '',
      threshold: 0,
      unit: '',
      level: 'warning',
      notifications: ['popup']
    };
    updateFormData('alarmRules', [...formData.alarmRules, newRule]);
  };

  const handleUpdateAlarmRule = (index, field, value) => {
    const newRules = [...formData.alarmRules];
    newRules[index] = { ...newRules[index], [field]: value };
    updateFormData('alarmRules', newRules);
  };

  const handleDeleteAlarmRule = (index) => {
    const newRules = formData.alarmRules.filter((_, i) => i !== index);
    updateFormData('alarmRules', newRules);
  };

  const handleAddVirtualPoint = () => {
    const newVP = {
      id: Date.now(),
      name: '',
      formula: '',
      description: '',
      unit: ''
    };
    updateFormData('virtualPoints', [...formData.virtualPoints, newVP]);
  };

  const handleUpdateVirtualPoint = (index, field, value) => {
    const newVPs = [...formData.virtualPoints];
    newVPs[index] = { ...newVPs[index], [field]: value };
    updateFormData('virtualPoints', newVPs);
  };

  const loadDefaultAlarms = () => {
    const deviceType = formData.deviceType;
    const defaults = defaultAlarmRules[deviceType] || defaultAlarmRules.pcs || [];
    const rules = defaults.map((rule, index) => ({
      id: Date.now() + index,
      name: rule.name,
      condition: rule.condition,
      threshold: rule.threshold,
      unit: rule.unit,
      level: rule.level,
      notifications: ['popup', 'sound']
    }));
    updateFormData('alarmRules', rules);
  };

  if (completed) {
    return (
      <div className="wizard-container">
        <div className="success-page">
          <div className="success-icon">✓</div>
          <h2 className="success-title">物模型创建成功！</h2>
          <p className="success-desc">
            物模型 "{formData.modelName}" 已成功创建，您可以在物模型库中查看或在现场配置中使用。
          </p>
          <div className="success-actions">
            <button 
              className="btn btn-primary btn-lg"
              onClick={() => onNavigate('project-config-wizard', '现场配置')}
            >
              开始现场配置
            </button>
            <button 
              className="btn btn-secondary btn-lg"
              onClick={() => {
                setCompleted(false);
                setCurrentStep(1);
                setFormData({
                  deviceCategory: '',
                  deviceType: '',
                  modelName: '',
                  manufacturer: '',
                  modelNumber: '',
                  description: '',
                  ratedVoltage: 380,
                  ratedCurrent: 100,
                  ratedPower: 50,
                  voltageLevel: '380v',
                  adjustThreshold: 220,
                  responseTime: 0.5,
                  pidKp: 2.5,
                  pidKi: 0.1,
                  pidKd: 0.05,
                  compensationFactor: 1.02,
                  protocolType: 'modbus_rtu',
                  channelType: 'serial',
                  protocolConfig: {},
                  channelConfig: {},
                  selectedPointTable: '',
                  timeout: 3000,
                  retries: 3,
                  reconnectInterval: 5000,
                  pollInterval: 1000,
                  alarmRules: [],
                  upstreamDevices: [],
                  downstreamDevices: [],
                  virtualPoints: []
                });
              }}
            >
              继续创建物模型
            </button>
            <button 
              className="btn btn-secondary btn-lg"
              onClick={() => onNavigate('device-model-list', '物模型库')}
            >
              查看物模型库
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
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
        <div className="wizard-content">
          {/* 步骤1: 基础信息 */}
          {currentStep === 1 && (
            <div>
              <h3 style={{ marginBottom: '20px' }}>步骤 1/5：基础信息配置</h3>
              <div className="notice-banner info">
                <span>💡</span>
                <span>选择设备类型后，系统将自动加载对应的厂商、电压等级和属性配置</span>
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  设备分类 <span className="required">*</span>
                </label>
                <select
                  className="form-select"
                  value={formData.deviceCategory}
                  onChange={(e) => {
                    updateFormData('deviceCategory', e.target.value);
                    updateFormData('deviceType', '');
                    updateFormData('manufacturer', '');
                    updateFormData('voltageLevel', '');
                    updateFormData('basicAttributes', {});
                    updateFormData('advancedAttributes', {});
                  }}
                >
                  <option value="">请选择设备分类</option>
                  {deviceCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>

              {formData.deviceCategory && (
                <div className="form-group">
                  <label className="form-label">
                    设备类型 <span className="required">*</span>
                  </label>
                  <div className="device-cards">
                    {deviceCategories
                      .find(c => c.id === formData.deviceCategory)
                      ?.devices.map(device => (
                        <div
                          key={device.id}
                          className={`device-card ${formData.deviceType === device.id ? 'selected' : ''}`}
                          onClick={() => {
                            updateFormData('deviceType', device.id);
                            const currentMfrs = manufacturersByCategory[formData.deviceCategory] || manufacturers;
                            const defaultMfr = currentMfrs.length > 0 ? currentMfrs[0] : '其他';
                            updateFormData('modelName', `${device.name}-${defaultMfr}`);
                            initializeDeviceAttributes(device.id);
                          }}
                        >
                          <div className="device-card-icon">{device.icon}</div>
                          <div className="device-card-title">{device.name}</div>
                          <div className="device-card-desc">{device.description}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    物模型名称 <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="例如：10kV储能PCS-华为"
                    value={formData.modelName}
                    onChange={(e) => updateFormData('modelName', e.target.value)}
                  />
                  <div className="form-hint">建议格式：电压等级+设备类型+厂商</div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    厂商 <span className="required">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.manufacturer}
                    onChange={(e) => updateFormData('manufacturer', e.target.value)}
                  >
                    <option value="">请选择厂商</option>
                    {getCurrentManufacturers().map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <div className="form-hint">厂商列表已根据设备分类自动过滤</div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">型号</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="输入设备型号"
                    value={formData.modelNumber}
                    onChange={(e) => updateFormData('modelNumber', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">电压等级</label>
                  <select
                    className="form-select"
                    value={formData.voltageLevel}
                    onChange={(e) => updateFormData('voltageLevel', e.target.value)}
                  >
                    <option value="">请选择电压等级</option>
                    {getCurrentVoltageLevels().map(v => (
                      <option key={v.id} value={v.id}>{v.name} - {v.description}</option>
                    ))}
                  </select>
                  <div className="form-hint">
                    {formData.deviceType && (voltageLevelsByDevice[formData.deviceType] ? 
                      '已根据设备类型显示对应电压等级' : '使用通用交流电压等级')}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">描述</label>
                <textarea
                  className="form-textarea"
                  placeholder="描述该物模型的用途和适用场景，如：适用于XX厂商10kV储能系统"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                />
              </div>

              {/* 自定义字段 */}
              <div className="param-card" style={{ marginTop: '20px' }}>
                <div className="param-card-title">
                  <span>✏️</span> 自定义字段
                  <button 
                    className="btn btn-sm btn-secondary" 
                    style={{ marginLeft: 'auto' }}
                    onClick={handleAddCustomField}
                  >
                    ➕ 添加字段
                  </button>
                </div>
                <div className="form-hint" style={{ marginBottom: '12px' }}>
                  添加自定义字段以记录设备特有的信息
                </div>
                {formData.customFields.length === 0 ? (
                  <div style={{ 
                    padding: '16px', 
                    textAlign: 'center', 
                    color: 'var(--gray-400)',
                    border: '1px dashed var(--gray-300)',
                    borderRadius: '8px'
                  }}>
                    暂无自定义字段，点击"添加字段"开始
                  </div>
                ) : (
                  formData.customFields.map((field, index) => (
                    <div key={field.id} style={{ 
                      display: 'flex', 
                      gap: '12px', 
                      alignItems: 'center',
                      marginBottom: '8px',
                      padding: '8px',
                      background: 'white',
                      borderRadius: '6px',
                      border: '1px solid var(--gray-200)'
                    }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="字段名称"
                        style={{ flex: 1 }}
                        value={field.name}
                        onChange={(e) => handleUpdateCustomField(index, 'name', e.target.value)}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="字段值"
                        style={{ flex: 1 }}
                        value={field.value}
                        onChange={(e) => handleUpdateCustomField(index, 'value', e.target.value)}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="单位(可选)"
                        style={{ width: '80px' }}
                        value={field.unit}
                        onChange={(e) => handleUpdateCustomField(index, 'unit', e.target.value)}
                      />
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteCustomField(index)}
                      >
                        删除
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '20px' }}>
                物模型ID将自动生成：EMS_M{Date.now().toString().slice(-6)}
              </div>
            </div>
          )}

          {/* 步骤2: 设备属性 */}
          {currentStep === 2 && (
            <div>
              <h3 style={{ marginBottom: '20px' }}>步骤 2/5：设备属性配置</h3>
              <div className="notice-banner info">
                <span>💡</span>
                <span>属性配置已根据设备类型自动加载，您可以根据实际情况修改</span>
              </div>
              
              {/* 设备特定基础属性 */}
              <div className="param-card">
                <div className="param-card-title">
                  <span>📊</span> 基础属性
                  <span style={{ fontSize: '12px', color: 'var(--gray-400)', marginLeft: 'auto', fontWeight: 'normal' }}>
                    {formData.deviceType ? `${deviceCategories.find(c => c.devices.some(d => d.id === formData.deviceType))?.devices.find(d => d.id === formData.deviceType)?.name || '设备'}专属配置` : '通用配置'}
                  </span>
                </div>
                <div className="param-grid">
                  {getCurrentBasicAttributes().map(attr => (
                    <div key={attr.key} className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">
                        {attr.name}
                        {attr.unit && <span style={{ color: 'var(--gray-400)', fontSize: '12px' }}> ({attr.unit})</span>}
                      </label>
                      {attr.type === 'select' ? (
                        <select
                          className="form-select"
                          value={formData.basicAttributes[attr.key] ?? attr.default}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            basicAttributes: { ...prev.basicAttributes, [attr.key]: e.target.value }
                          }))}
                        >
                          {attr.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : attr.type === 'text' ? (
                        <input
                          type="text"
                          className="form-input"
                          value={formData.basicAttributes[attr.key] ?? attr.default}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            basicAttributes: { ...prev.basicAttributes, [attr.key]: e.target.value }
                          }))}
                        />
                      ) : (
                        <input
                          type="number"
                          className="form-input"
                          value={formData.basicAttributes[attr.key] ?? attr.default}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            basicAttributes: { ...prev.basicAttributes, [attr.key]: Number(e.target.value) }
                          }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 高级属性 */}
              <div className="param-card" style={{ marginTop: '20px', background: '#f8fafc' }}>
                <div className="param-card-title">
                  <span>⚙️</span> 高级属性
                  <span style={{ fontSize: '12px', color: 'var(--gray-400)', marginLeft: 'auto', fontWeight: 'normal' }}>
                    可选配置
                  </span>
                </div>
                <div className="param-grid">
                  {getCurrentAdvancedAttributes().map(attr => (
                    <div key={attr.key} className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">
                        {attr.name}
                        {attr.unit && <span style={{ color: 'var(--gray-400)', fontSize: '12px' }}> ({attr.unit})</span>}
                      </label>
                      {attr.type === 'select' ? (
                        <select
                          className="form-select"
                          value={formData.advancedAttributes[attr.key] ?? attr.default}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            advancedAttributes: { ...prev.advancedAttributes, [attr.key]: e.target.value }
                          }))}
                        >
                          {attr.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : attr.type === 'text' ? (
                        <input
                          type="text"
                          className="form-input"
                          value={formData.advancedAttributes[attr.key] ?? attr.default}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            advancedAttributes: { ...prev.advancedAttributes, [attr.key]: e.target.value }
                          }))}
                        />
                      ) : (
                        <input
                          type="number"
                          className="form-input"
                          value={formData.advancedAttributes[attr.key] ?? attr.default}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            advancedAttributes: { ...prev.advancedAttributes, [attr.key]: Number(e.target.value) }
                          }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 算法参数（仅对PCS储能变流器显示 - 这是功率控制核心设备） */}
              {formData.deviceType === 'pcs' && (
                <div className="algorithm-params" style={{ marginTop: '20px' }}>
                  <div className="param-card-title" style={{ color: 'white' }}>
                    <span>⚡</span> 电力调节算法参数
                  </div>
                  <div className="param-grid">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">
                        调节阈值
                        <span className="tooltip-container">
                          <span className="tooltip-trigger" style={{ background: 'rgba(255,255,255,0.3)', color: 'white' }}>?</span>
                          <span className="tooltip-content">启动调节的电压临界值</span>
                        </span>
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="number"
                          className="form-input"
                          value={formData.adjustThreshold}
                          onChange={(e) => updateFormData('adjustThreshold', Number(e.target.value))}
                        />
                        <span style={{ lineHeight: '40px' }}>V</span>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">
                        响应时间
                        <span className="tooltip-container">
                          <span className="tooltip-trigger" style={{ background: 'rgba(255,255,255,0.3)', color: 'white' }}>?</span>
                          <span className="tooltip-content">算法响应延迟时间</span>
                        </span>
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="number"
                          className="form-input"
                          step="0.1"
                          value={formData.responseTime}
                          onChange={(e) => updateFormData('responseTime', Number(e.target.value))}
                        />
                        <span style={{ lineHeight: '40px' }}>s</span>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">
                        PID比例系数 (Kp)
                        <span className="tooltip-container">
                          <span className="tooltip-trigger" style={{ background: 'rgba(255,255,255,0.3)', color: 'white' }}>?</span>
                          <span className="tooltip-content">控制算法响应灵敏度</span>
                        </span>
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        step="0.1"
                        value={formData.pidKp}
                        onChange={(e) => updateFormData('pidKp', Number(e.target.value))}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">
                        PID积分系数 (Ki)
                        <span className="tooltip-container">
                          <span className="tooltip-trigger" style={{ background: 'rgba(255,255,255,0.3)', color: 'white' }}>?</span>
                          <span className="tooltip-content">消除稳态误差</span>
                        </span>
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        step="0.01"
                        value={formData.pidKi}
                        onChange={(e) => updateFormData('pidKi', Number(e.target.value))}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">
                        PID微分系数 (Kd)
                        <span className="tooltip-container">
                          <span className="tooltip-trigger" style={{ background: 'rgba(255,255,255,0.3)', color: 'white' }}>?</span>
                          <span className="tooltip-content">抑制超调</span>
                        </span>
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        step="0.01"
                        value={formData.pidKd}
                        onChange={(e) => updateFormData('pidKd', Number(e.target.value))}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">
                        补偿系数
                        <span className="tooltip-container">
                          <span className="tooltip-trigger" style={{ background: 'rgba(255,255,255,0.3)', color: 'white' }}>?</span>
                          <span className="tooltip-content">电压补偿修正系数</span>
                        </span>
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        step="0.01"
                        value={formData.compensationFactor}
                        onChange={(e) => updateFormData('compensationFactor', Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="form-hint" style={{ marginTop: '16px' }}>
                💡 提示：所有参数已填充行业推荐默认值，您可以直接使用或根据实际需求微调
              </div>
            </div>
          )}

          {/* 步骤3: 协议&通道配置 */}
          {currentStep === 3 && (
            <div>
              <h3 style={{ marginBottom: '20px' }}>步骤 3/5：协议&通道配置</h3>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    通信协议 <span className="required">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.protocolType}
                    onChange={(e) => {
                      const protocol = protocolTypes.find(p => p.id === e.target.value);
                      updateFormData('protocolType', e.target.value);
                      updateFormData('channelType', protocol?.channelTypes[0] || 'serial');
                      updateFormData('protocolConfig', protocol?.defaultConfig || {});
                    }}
                  >
                    {protocolTypes.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {p.description}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    通道类型 <span className="required">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.channelType}
                    onChange={(e) => updateFormData('channelType', e.target.value)}
                  >
                    {channelTypes
                      .filter(c => {
                        const protocol = protocolTypes.find(p => p.id === formData.protocolType);
                        return !protocol || protocol.channelTypes.includes(c.id);
                      })
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* 通道参数配置 */}
              <div className="param-card">
                <div className="param-card-title">
                  <span>🔌</span> 通道参数配置
                </div>
                <div className="param-grid">
                  {channelTypes
                    .find(c => c.id === formData.channelType)
                    ?.config.map(cfg => (
                      <div key={cfg.key} className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{cfg.name}</label>
                        {cfg.type === 'select' ? (
                          <select
                            className="form-select"
                            value={formData.channelConfig[cfg.key] || cfg.options[0]}
                            onChange={(e) => updateFormData('channelConfig', {
                              ...formData.channelConfig,
                              [cfg.key]: e.target.value
                            })}
                          >
                            {cfg.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={cfg.type}
                            className="form-input"
                            placeholder={cfg.placeholder}
                            value={formData.channelConfig[cfg.key] || ''}
                            onChange={(e) => updateFormData('channelConfig', {
                              ...formData.channelConfig,
                              [cfg.key]: e.target.value
                            })}
                          />
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* 通信控制参数 */}
              <div className="param-card">
                <div className="param-card-title">
                  <span>⏱️</span> 通信控制参数
                </div>
                <div className="param-grid">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      超时时间
                      <span className="tooltip-container">
                        <span className="tooltip-trigger">?</span>
                        <span className="tooltip-content">通信响应超时时间</span>
                      </span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.timeout}
                        onChange={(e) => updateFormData('timeout', Number(e.target.value))}
                      />
                      <span style={{ lineHeight: '40px', color: 'var(--gray-500)' }}>ms</span>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      重发次数
                      <span className="tooltip-container">
                        <span className="tooltip-trigger">?</span>
                        <span className="tooltip-content">通信失败后重试次数</span>
                      </span>
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.retries}
                      onChange={(e) => updateFormData('retries', Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      断线重连间隔
                      <span className="tooltip-container">
                        <span className="tooltip-trigger">?</span>
                        <span className="tooltip-content">断开连接后重连等待时间</span>
                      </span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.reconnectInterval}
                        onChange={(e) => updateFormData('reconnectInterval', Number(e.target.value))}
                      />
                      <span style={{ lineHeight: '40px', color: 'var(--gray-500)' }}>ms</span>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      轮询间隔
                      <span className="tooltip-container">
                        <span className="tooltip-trigger">?</span>
                        <span className="tooltip-content">数据采集周期</span>
                      </span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.pollInterval}
                        onChange={(e) => updateFormData('pollInterval', Number(e.target.value))}
                      />
                      <span style={{ lineHeight: '40px', color: 'var(--gray-500)' }}>ms</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 点表选择 */}
              <div className="param-card">
                <div className="param-card-title">
                  <span>📋</span> 协议点表配置
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={handleOpenAddPoint}
                    >
                      ➕ 新增点位
                    </button>
                    <input
                      type="file"
                      ref={pointTableFileRef}
                      accept=".json"
                      style={{ display: 'none' }}
                      onChange={handlePointTableImport}
                    />
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => pointTableFileRef.current?.click()}
                    >
                      📥 导入点表
                    </button>
                    {formData.selectedPointTable && (
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          const data = getCurrentPointTableData();
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `pointtable_${formData.selectedPointTable}.json`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                      >
                        📤 导出点表
                      </button>
                    )}
                  </div>
                </div>
                <div className="form-hint" style={{ marginBottom: '12px' }}>
                  根据协议类型 <strong>{protocolTypes.find(p => p.id === formData.protocolType)?.name}</strong> 显示可用的点表模板。可选择预设模板或手动新增/编辑点位。
                </div>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">选择点表模板</label>
                  <select
                    className="form-select"
                    value={formData.selectedPointTable}
                    onChange={(e) => updateFormData('selectedPointTable', e.target.value)}
                  >
                    <option value="">请选择点表模板</option>
                    {getAvailablePointTables().map(table => (
                      <option key={table.id} value={table.id}>{table.name}</option>
                    ))}
                    {customPointTable.length > 0 && (
                      <option value="custom">自定义点表 ({customPointTable.length}个点位)</option>
                    )}
                  </select>
                </div>
                {formData.selectedPointTable && (
                  <div className="point-table-selector" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {getCurrentPointTableData().length === 0 ? (
                      <div style={{ 
                        padding: '30px', 
                        textAlign: 'center', 
                        color: 'var(--gray-400)',
                        border: '1px dashed var(--gray-300)',
                        borderRadius: '8px'
                      }}>
                        该点表暂无配置的点位，点击"新增点位"添加
                      </div>
                    ) : (
                      <table style={{ width: '100%', fontSize: '12px' }}>
                        <thead>
                          <tr>
                            <th style={{ width: '40px' }}>#</th>
                            {/* 根据协议类型显示不同的列 */}
                            {formData.protocolType.startsWith('modbus') && <th>地址</th>}
                            {formData.protocolType === 'iec61850' && <th>引用路径</th>}
                            {formData.protocolType === 'iec104' && <th>IOA</th>}
                            {formData.protocolType === 'can' && <th>CAN ID</th>}
                            {formData.protocolType.startsWith('dlt645') && <th>数据标识</th>}
                            {formData.protocolType === 'opc' && <th>节点ID</th>}
                            <th>名称</th>
                            <th>数据类型</th>
                            <th>读写</th>
                            <th>说明</th>
                            <th style={{ width: '100px' }}>操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getCurrentPointTableData().map((point, index) => (
                            <tr key={index}>
                              <td style={{ color: 'var(--gray-400)' }}>{index + 1}</td>
                              {/* 根据协议类型显示不同的地址/标识列 */}
                              {formData.protocolType.startsWith('modbus') && <td>{point.address}</td>}
                              {formData.protocolType === 'iec61850' && <td style={{ fontSize: '11px' }}>{point.reference}</td>}
                              {formData.protocolType === 'iec104' && <td>{point.ioa}</td>}
                              {formData.protocolType === 'can' && <td>{point.canId}</td>}
                              {formData.protocolType.startsWith('dlt645') && <td>{point.dataId}</td>}
                              {formData.protocolType === 'opc' && <td style={{ fontSize: '11px' }}>{point.nodeId}</td>}
                              <td>{point.name}</td>
                              <td>{point.type}</td>
                              <td>
                                <span className={`tag ${point.rw === 'R' ? 'tag-gray' : point.rw === 'W' ? 'tag-orange' : 'tag-blue'}`}>
                                  {point.rw || '-'}
                                </span>
                              </td>
                              <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{point.description}</td>
                              <td>
                                <button 
                                  className="btn btn-sm btn-secondary" 
                                  style={{ marginRight: '4px', padding: '2px 6px' }}
                                  onClick={() => handleOpenEditPoint(index)}
                                >
                                  ✏️
                                </button>
                                <button 
                                  className="btn btn-sm btn-danger" 
                                  style={{ padding: '2px 6px' }}
                                  onClick={() => handleDeletePoint(index)}
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
                {!formData.selectedPointTable && (
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    color: 'var(--gray-400)',
                    border: '1px dashed var(--gray-300)',
                    borderRadius: '8px'
                  }}>
                    请选择点表模板或点击"新增点位"开始配置
                  </div>
                )}
              </div>

              <div style={{ marginTop: '16px' }}>
                <button className="btn btn-secondary">
                  🔍 测试连接
                </button>
              </div>
            </div>
          )}

          {/* 步骤4: 告警规则配置 */}
          {currentStep === 4 && (
            <div>
              <h3 style={{ marginBottom: '20px' }}>步骤 4/5：告警规则配置</h3>
              
              <div className="notice-banner info">
                <span>💡</span>
                <span>配置告警规则：选择告警点（来自已配置的点表）→ 设置触发条件 → 设置告警级别</span>
              </div>

              {/* 支持的触发条件说明 */}
              <div className="param-card" style={{ marginBottom: '16px' }}>
                <div className="param-card-title">
                  <span>📊</span> 支持的触发条件类型
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '12px' }}>
                  {triggerConditionTypes.map(tc => (
                    <div key={tc.id} style={{ 
                      padding: '6px 10px', 
                      background: tc.category === 'compare' ? 'var(--blue-50)' : 
                                  tc.category === 'range' ? 'var(--green-50)' : 
                                  tc.category === 'state' ? 'var(--yellow-50)' : 'var(--purple-50)',
                      borderRadius: '4px',
                      border: `1px solid ${tc.category === 'compare' ? 'var(--blue-200)' : 
                              tc.category === 'range' ? 'var(--green-200)' : 
                              tc.category === 'state' ? 'var(--yellow-200)' : 'var(--purple-200)'}`
                    }}>
                      <strong>{tc.symbol}</strong> {tc.name}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <button className="btn btn-secondary" onClick={loadDefaultAlarms}>
                  📋 加载推荐告警规则
                </button>
                <button className="btn btn-primary" style={{ marginLeft: '12px' }} onClick={handleAddAlarmRule}>
                  ➕ 新增告警规则
                </button>
              </div>

              {formData.alarmRules.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🔔</div>
                  <div className="empty-state-title">暂无告警规则</div>
                  <div className="empty-state-desc">点击"加载推荐告警规则"或"新增告警规则"开始配置</div>
                </div>
              ) : (
                <div>
                  {formData.alarmRules.map((rule, index) => (
                    <div key={rule.id} className="collapse-panel">
                      <div className="collapse-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="checkbox"
                            checked={rule.enabled !== false}
                            onChange={(e) => handleUpdateAlarmRule(index, 'enabled', e.target.checked)}
                          />
                          <span style={{ fontWeight: '600' }}>{rule.name || '新告警规则'}</span>
                          <span className={`tag tag-${rule.level === 'critical' ? 'red' : rule.level === 'error' ? 'red' : rule.level === 'warning' ? 'yellow' : 'blue'}`}>
                            {alarmLevels.find(l => l.id === rule.level)?.name || rule.level}
                          </span>
                          {rule.sourcePoint && (
                            <span className="tag tag-gray" style={{ fontSize: '11px' }}>
                              📍 {rule.sourcePoint}
                            </span>
                          )}
                        </div>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteAlarmRule(index)}
                        >
                          删除
                        </button>
                      </div>
                      <div className="collapse-content">
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">告警名称</label>
                            <input
                              type="text"
                              className="form-input"
                              value={rule.name}
                              onChange={(e) => handleUpdateAlarmRule(index, 'name', e.target.value)}
                              placeholder="输入告警名称"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">告警级别</label>
                            <select
                              className="form-select"
                              value={rule.level}
                              onChange={(e) => handleUpdateAlarmRule(index, 'level', e.target.value)}
                            >
                              {alarmLevels.map(l => (
                                <option key={l.id} value={l.id}>{l.icon} {l.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        {/* 从点表选择告警点 */}
                        <div className="form-group">
                          <label className="form-label">选择告警点 (从已配置点表选择)</label>
                          <select
                            className="form-select"
                            value={rule.sourcePoint || ''}
                            onChange={(e) => handleUpdateAlarmRule(index, 'sourcePoint', e.target.value)}
                          >
                            <option value="">请选择告警点...</option>
                            {getCurrentPointTableData().length > 0 ? (
                              getCurrentPointTableData().map((point, pIndex) => (
                                <option key={pIndex} value={point.name}>
                                  {point.name} ({point.type}) - {point.description || '无描述'}
                                </option>
                              ))
                            ) : (
                              <option disabled>请先在协议&通道步骤中配置点表</option>
                            )}
                          </select>
                          {getCurrentPointTableData().length === 0 && (
                            <div className="form-hint" style={{ color: 'var(--orange-500)' }}>
                              ⚠️ 请先在"协议&通道"步骤中配置点表，才能选择告警点
                            </div>
                          )}
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">触发条件类型</label>
                            <select
                              className="form-select"
                              value={rule.conditionType || 'gt'}
                              onChange={(e) => handleUpdateAlarmRule(index, 'conditionType', e.target.value)}
                            >
                              <optgroup label="比较运算">
                                {triggerConditionTypes.filter(t => t.category === 'compare').map(tc => (
                                  <option key={tc.id} value={tc.id}>{tc.symbol} {tc.name}</option>
                                ))}
                              </optgroup>
                              <optgroup label="范围判断">
                                {triggerConditionTypes.filter(t => t.category === 'range').map(tc => (
                                  <option key={tc.id} value={tc.id}>{tc.symbol} {tc.name}</option>
                                ))}
                              </optgroup>
                              <optgroup label="状态变化">
                                {triggerConditionTypes.filter(t => t.category === 'state').map(tc => (
                                  <option key={tc.id} value={tc.id}>{tc.symbol} {tc.name}</option>
                                ))}
                              </optgroup>
                              <optgroup label="时间条件">
                                {triggerConditionTypes.filter(t => t.category === 'time').map(tc => (
                                  <option key={tc.id} value={tc.id}>{tc.symbol} {tc.name}</option>
                                ))}
                              </optgroup>
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label">
                              {rule.conditionType === 'between' || rule.conditionType === 'outside' ? '下限值' : '阈值'}
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type="number"
                                className="form-input"
                                value={rule.threshold}
                                onChange={(e) => handleUpdateAlarmRule(index, 'threshold', Number(e.target.value))}
                              />
                              <input
                                type="text"
                                className="form-input"
                                style={{ width: '80px' }}
                                value={rule.unit}
                                onChange={(e) => handleUpdateAlarmRule(index, 'unit', e.target.value)}
                                placeholder="单位"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* 范围类型的上限值 */}
                        {(rule.conditionType === 'between' || rule.conditionType === 'outside') && (
                          <div className="form-row">
                            <div className="form-group">
                              <label className="form-label">上限值</label>
                              <input
                                type="number"
                                className="form-input"
                                value={rule.thresholdHigh || 0}
                                onChange={(e) => handleUpdateAlarmRule(index, 'thresholdHigh', Number(e.target.value))}
                              />
                            </div>
                            <div className="form-group">
                              <div className="form-hint" style={{ marginTop: '28px' }}>
                                当值 {rule.conditionType === 'between' ? '在' : '超出'} {rule.threshold || 0} ~ {rule.thresholdHigh || 0} {rule.unit || ''} 范围{rule.conditionType === 'between' ? '内' : '外'}时触发
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* 持续时间条件 */}
                        {rule.conditionType === 'duration' && (
                          <div className="form-row">
                            <div className="form-group">
                              <label className="form-label">持续时间 (秒)</label>
                              <input
                                type="number"
                                className="form-input"
                                value={rule.duration || 10}
                                onChange={(e) => handleUpdateAlarmRule(index, 'duration', Number(e.target.value))}
                                min="1"
                              />
                            </div>
                            <div className="form-group">
                              <div className="form-hint" style={{ marginTop: '28px' }}>
                                当值超过阈值持续 {rule.duration || 10} 秒后触发告警
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">恢复条件</label>
                            <select
                              className="form-select"
                              value={rule.recoveryMode || 'auto'}
                              onChange={(e) => handleUpdateAlarmRule(index, 'recoveryMode', e.target.value)}
                            >
                              <option value="auto">自动恢复（值恢复正常后自动消除）</option>
                              <option value="manual">手动确认（需人工确认后消除）</option>
                              <option value="delay">延迟恢复（值恢复正常后延迟N秒消除）</option>
                            </select>
                          </div>
                          {rule.recoveryMode === 'delay' && (
                            <div className="form-group">
                              <label className="form-label">恢复延迟 (秒)</label>
                              <input
                                type="number"
                                className="form-input"
                                value={rule.recoveryDelay || 30}
                                onChange={(e) => handleUpdateAlarmRule(index, 'recoveryDelay', Number(e.target.value))}
                                min="1"
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">通知方式</label>
                          <div className="checkbox-group">
                            {notificationMethods.map(method => (
                              <label key={method.id} className="checkbox-item">
                                <input
                                  type="checkbox"
                                  checked={rule.notifications?.includes(method.id) || false}
                                  onChange={(e) => {
                                    const newNotifications = e.target.checked
                                      ? [...(rule.notifications || []), method.id]
                                      : (rule.notifications || []).filter(n => n !== method.id);
                                    handleUpdateAlarmRule(index, 'notifications', newNotifications);
                                  }}
                                />
                                <span>{method.icon} {method.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 步骤5: 拓扑元数据&虚拟点配置 */}
          {currentStep === 5 && (
            <div>
              <h3 style={{ marginBottom: '20px' }}>步骤 5/5：拓扑元数据&虚拟点配置</h3>

              {/* 拓扑元数据 */}
              <div className="param-card">
                <div className="param-card-title">
                  <span>🔗</span> 拓扑关联配置
                </div>
                <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '16px' }}>
                  定义该设备可以关联的上下游设备类型，用于现场拓扑配置时的合法性校验
                </p>
                
                <div className="form-group">
                  <label className="form-label">可关联的上游设备类型</label>
                  <div className="checkbox-group">
                    {deviceCategories.flatMap(cat => cat.devices).map(device => (
                      <label key={device.id} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={formData.upstreamDevices.includes(device.id)}
                          onChange={(e) => {
                            const newDevices = e.target.checked
                              ? [...formData.upstreamDevices, device.id]
                              : formData.upstreamDevices.filter(d => d !== device.id);
                            updateFormData('upstreamDevices', newDevices);
                          }}
                        />
                        <span>{device.icon} {device.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">可关联的下游设备类型</label>
                  <div className="checkbox-group">
                    {deviceCategories.flatMap(cat => cat.devices).map(device => (
                      <label key={device.id} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={formData.downstreamDevices.includes(device.id)}
                          onChange={(e) => {
                            const newDevices = e.target.checked
                              ? [...formData.downstreamDevices, device.id]
                              : formData.downstreamDevices.filter(d => d !== device.id);
                            updateFormData('downstreamDevices', newDevices);
                          }}
                        />
                        <span>{device.icon} {device.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* 虚拟点配置 */}
              <div className="param-card">
                <div className="param-card-title">
                  <span>🔮</span> 虚拟点配置
                </div>
                <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '16px' }}>
                  虚拟点通过计算公式从物理点派生，用于计算综合指标
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <button className="btn btn-primary btn-sm" onClick={handleAddVirtualPoint}>
                    ➕ 新增虚拟点
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ marginLeft: '8px' }}
                    onClick={() => {
                      updateFormData('virtualPoints', virtualPointRules.map((vp, i) => ({
                        ...vp,
                        id: Date.now() + i
                      })));
                    }}
                  >
                    📋 加载示例模板
                  </button>
                </div>

                {formData.virtualPoints.length === 0 ? (
                  <div style={{ 
                    padding: '24px', 
                    textAlign: 'center', 
                    color: 'var(--gray-400)',
                    border: '1px dashed var(--gray-300)',
                    borderRadius: '8px'
                  }}>
                    点击"新增虚拟点"或"加载示例模板"开始配置
                  </div>
                ) : (
                  <div>
                    {formData.virtualPoints.map((vp, index) => (
                      <div key={vp.id} style={{
                        border: '1px solid var(--gray-200)',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '12px',
                        background: 'white'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span style={{ fontWeight: '600' }}>虚拟点 {index + 1}</span>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => {
                              const newVPs = formData.virtualPoints.filter((_, i) => i !== index);
                              updateFormData('virtualPoints', newVPs);
                            }}
                          >
                            删除
                          </button>
                        </div>
                        <div className="form-row">
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">点名称</label>
                            <input
                              type="text"
                              className="form-input"
                              value={vp.name}
                              onChange={(e) => handleUpdateVirtualPoint(index, 'name', e.target.value)}
                              placeholder="如：系统总功率"
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">单位</label>
                            <input
                              type="text"
                              className="form-input"
                              value={vp.unit}
                              onChange={(e) => handleUpdateVirtualPoint(index, 'unit', e.target.value)}
                              placeholder="如：kW"
                            />
                          </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, marginTop: '12px' }}>
                          <label className="form-label">计算公式</label>
                          <input
                            type="text"
                            className="form-input"
                            value={vp.formula}
                            onChange={(e) => handleUpdateVirtualPoint(index, 'formula', e.target.value)}
                            placeholder="如：SUM(pcs_power) + SUM(inverter_power)"
                          />
                          <div className="form-hint">支持: SUM, AVG, MAX, MIN, +, -, *, / 等运算</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="notice-banner success">
                <span>✅</span>
                <span>完成后，系统将自动校验电压等级和设备类型的匹配性</span>
              </div>
            </div>
          )}
        </div>

        {/* 点表编辑模态框 */}
        {pointModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              width: '600px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <h3 style={{ marginBottom: '20px' }}>
                {editingPointIndex >= 0 ? '✏️ 编辑点位' : '➕ 新增点位'}
              </h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">点位名称 *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={pointForm.name}
                    onChange={(e) => setPointForm({...pointForm, name: e.target.value})}
                    placeholder="如：电池SOC"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {formData.protocolType.startsWith('modbus') ? '寄存器地址' :
                     formData.protocolType === 'iec104' ? 'IOA地址' :
                     formData.protocolType === 'iec61850' ? '引用路径' :
                     formData.protocolType === 'opc' ? '节点ID' :
                     formData.protocolType === 'can' ? 'CAN ID' :
                     formData.protocolType.startsWith('dlt645') ? '数据标识' : '地址'} *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={pointForm.address}
                    onChange={(e) => setPointForm({...pointForm, address: e.target.value})}
                    placeholder={formData.protocolType.startsWith('modbus') ? '如：40001' : '如：1001'}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">数据类型</label>
                  <select
                    className="form-select"
                    value={pointForm.type}
                    onChange={(e) => setPointForm({...pointForm, type: e.target.value})}
                  >
                    <option value="bool">布尔 (bool)</option>
                    <option value="int16">有符号16位 (int16)</option>
                    <option value="uint16">无符号16位 (uint16)</option>
                    <option value="int32">有符号32位 (int32)</option>
                    <option value="uint32">无符号32位 (uint32)</option>
                    <option value="float">单精度浮点 (float)</option>
                    <option value="double">双精度浮点 (double)</option>
                    <option value="string">字符串 (string)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">读写权限</label>
                  <select
                    className="form-select"
                    value={pointForm.rw}
                    onChange={(e) => setPointForm({...pointForm, rw: e.target.value})}
                  >
                    <option value="R">只读 (R)</option>
                    <option value="W">只写 (W)</option>
                    <option value="RW">读写 (RW)</option>
                  </select>
                </div>
              </div>

              {formData.protocolType.startsWith('modbus') && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">功能码</label>
                    <select
                      className="form-select"
                      value={pointForm.functionCode}
                      onChange={(e) => setPointForm({...pointForm, functionCode: e.target.value})}
                    >
                      <option value="01">01 - 读线圈</option>
                      <option value="02">02 - 读离散输入</option>
                      <option value="03">03 - 读保持寄存器</option>
                      <option value="04">04 - 读输入寄存器</option>
                      <option value="05">05 - 写单个线圈</option>
                      <option value="06">06 - 写单个寄存器</option>
                      <option value="15">15 - 写多个线圈</option>
                      <option value="16">16 - 写多个寄存器</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">字节序</label>
                    <select
                      className="form-select"
                      value={pointForm.byteOrder}
                      onChange={(e) => setPointForm({...pointForm, byteOrder: e.target.value})}
                    >
                      <option value="big">大端 (Big Endian)</option>
                      <option value="little">小端 (Little Endian)</option>
                      <option value="big_swap">大端交换 (Big Swap)</option>
                      <option value="little_swap">小端交换 (Little Swap)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">倍率 (Scale)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={pointForm.scale}
                    onChange={(e) => setPointForm({...pointForm, scale: parseFloat(e.target.value) || 1})}
                    step="0.001"
                  />
                  <div className="form-hint">实际值 = 原始值 × 倍率 + 偏移</div>
                </div>
                <div className="form-group">
                  <label className="form-label">偏移 (Offset)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={pointForm.offset}
                    onChange={(e) => setPointForm({...pointForm, offset: parseFloat(e.target.value) || 0})}
                    step="0.001"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">单位</label>
                  <input
                    type="text"
                    className="form-input"
                    value={pointForm.unit}
                    onChange={(e) => setPointForm({...pointForm, unit: e.target.value})}
                    placeholder="如：kW、V、A、%"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">描述说明</label>
                  <input
                    type="text"
                    className="form-input"
                    value={pointForm.description}
                    onChange={(e) => setPointForm({...pointForm, description: e.target.value})}
                    placeholder="点位功能描述"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="btn btn-secondary" onClick={() => setPointModalOpen(false)}>
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleSavePoint}>
                  {editingPointIndex >= 0 ? '保存修改' : '添加点位'}
                </button>
              </div>
            </div>
          </div>
        )}

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
            <button className="btn btn-secondary" onClick={handleSaveDraft}>
              💾 保存草稿
            </button>
            <button className="btn btn-primary" onClick={handleNext}>
              {currentStep === 5 ? '✓ 完成创建' : '下一步 →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeviceModelWizard;
