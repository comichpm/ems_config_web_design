import React, { useState } from 'react';
import {
  deviceCategories,
  protocolTypes,
  channelTypes,
  manufacturers,
  voltageLevels,
  alarmLevels,
  notificationMethods,
  defaultAlarmRules,
  samplePointTables,
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
  const [formData, setFormData] = useState({
    // 基础信息
    deviceCategory: '',
    deviceType: '',
    modelName: '',
    manufacturer: '',
    modelNumber: '',
    description: '',
    // 设备属性
    ratedVoltage: 380,
    ratedCurrent: 100,
    ratedPower: 50,
    voltageLevel: '380v',
    // 算法参数（PCS/储能相关）
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

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
                <span>选择设备类型后，系统将自动加载对应的属性配置项和默认值</span>
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
                            updateFormData('modelName', `${device.name}-${manufacturers[0]}`);
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
                    {manufacturers.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
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
                    {voltageLevels.map(v => (
                      <option key={v.id} value={v.id}>{v.name} - {v.description}</option>
                    ))}
                  </select>
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

              <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '20px' }}>
                物模型ID将自动生成：EMS_M{Date.now().toString().slice(-6)}
              </div>
            </div>
          )}

          {/* 步骤2: 设备属性 */}
          {currentStep === 2 && (
            <div>
              <h3 style={{ marginBottom: '20px' }}>步骤 2/5：设备属性配置</h3>
              
              {/* 基础属性 */}
              <div className="param-card">
                <div className="param-card-title">
                  <span>📊</span> 基础属性
                </div>
                <div className="param-grid">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      额定电压
                      <span className="tooltip-container">
                        <span className="tooltip-trigger">?</span>
                        <span className="tooltip-content">设备额定工作电压</span>
                      </span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.ratedVoltage}
                        onChange={(e) => updateFormData('ratedVoltage', Number(e.target.value))}
                      />
                      <span style={{ lineHeight: '40px', color: 'var(--gray-500)' }}>V</span>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      额定电流
                      <span className="tooltip-container">
                        <span className="tooltip-trigger">?</span>
                        <span className="tooltip-content">设备额定工作电流</span>
                      </span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.ratedCurrent}
                        onChange={(e) => updateFormData('ratedCurrent', Number(e.target.value))}
                      />
                      <span style={{ lineHeight: '40px', color: 'var(--gray-500)' }}>A</span>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      额定功率
                      <span className="tooltip-container">
                        <span className="tooltip-trigger">?</span>
                        <span className="tooltip-content">设备额定功率</span>
                      </span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.ratedPower}
                        onChange={(e) => updateFormData('ratedPower', Number(e.target.value))}
                      />
                      <span style={{ lineHeight: '40px', color: 'var(--gray-500)' }}>kW</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 算法参数（仅对PCS/储能类设备显示） */}
              {(formData.deviceCategory === 'storage' || formData.deviceType === 'pcs') && (
                <div className="algorithm-params">
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
                </div>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">选择点表模板</label>
                  <select
                    className="form-select"
                    value={formData.selectedPointTable}
                    onChange={(e) => updateFormData('selectedPointTable', e.target.value)}
                  >
                    <option value="">请选择点表模板</option>
                    <option value="modbus_pcs">Modbus PCS点表</option>
                    <option value="modbus_bms">Modbus BMS点表</option>
                    <option value="modbus_meter">Modbus 电表点表</option>
                    <option value="modbus_inverter">Modbus 逆变器点表</option>
                  </select>
                </div>
                {formData.selectedPointTable && (
                  <div className="point-table-selector">
                    <table style={{ width: '100%', fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>地址</th>
                          <th>名称</th>
                          <th>数据类型</th>
                          <th>读写</th>
                          <th>说明</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(samplePointTables[formData.selectedPointTable] || []).map((point, index) => (
                          <tr key={index}>
                            <td>{point.address}</td>
                            <td>{point.name}</td>
                            <td>{point.type}</td>
                            <td><span className={`tag ${point.rw === 'R' ? 'tag-gray' : 'tag-blue'}`}>{point.rw}</span></td>
                            <td>{point.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                <span>勾选需要的告警类型，默认阈值已填充，可直接复用或微调</span>
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
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">触发阈值</label>
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
                          <div className="form-group">
                            <label className="form-label">触发条件</label>
                            <input
                              type="text"
                              className="form-input"
                              value={rule.condition}
                              onChange={(e) => handleUpdateAlarmRule(index, 'condition', e.target.value)}
                              placeholder="如：voltage > threshold"
                            />
                          </div>
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
