import React, { useState, useRef } from 'react';
import { deviceCategories, algorithmDefaults } from '../data/deviceTypes';

// 预设模板数据
const presetTemplates = [
  {
    id: 'template_industrial_park',
    name: '工业园区储能模板',
    description: '适用于工业园区的储能系统配置，包含PCS、BMS、电表等设备',
    category: '储能系统',
    devices: [
      { deviceCategory: 'storage', deviceType: 'pcs', modelName: '储能PCS-500kW', manufacturer: '阳光电源' },
      { deviceCategory: 'storage', deviceType: 'bms', modelName: 'BMS管理系统', manufacturer: '宁德时代' },
      { deviceCategory: 'storage', deviceType: 'battery_cluster', modelName: '电池簇-1MWh', manufacturer: '宁德时代' },
      { deviceCategory: 'other', deviceType: 'meter', modelName: '智能电表', manufacturer: '正泰电器' }
    ],
    algorithmConfig: algorithmDefaults
  },
  {
    id: 'template_solar_storage',
    name: '光储一体化模板',
    description: '光伏发电+储能系统的典型配置',
    category: '光储系统',
    devices: [
      { deviceCategory: 'solar', deviceType: 'pv_inverter', modelName: '光伏逆变器-100kW', manufacturer: '华为' },
      { deviceCategory: 'solar', deviceType: 'pv_combiner', modelName: '汇流箱', manufacturer: '华为' },
      { deviceCategory: 'storage', deviceType: 'pcs', modelName: '储能PCS-100kW', manufacturer: '阳光电源' },
      { deviceCategory: 'storage', deviceType: 'bms', modelName: 'BMS系统', manufacturer: '比亚迪' }
    ],
    algorithmConfig: algorithmDefaults
  },
  {
    id: 'template_charging_station',
    name: '充电站模板',
    description: '适用于充电站的储充一体化配置',
    category: '充电系统',
    devices: [
      { deviceCategory: 'charger', deviceType: 'dc_charger', modelName: '直流快充桩-120kW', manufacturer: '特来电' },
      { deviceCategory: 'charger', deviceType: 'ac_charger', modelName: '交流慢充桩-7kW', manufacturer: '星星充电' },
      { deviceCategory: 'storage', deviceType: 'pcs', modelName: '储能PCS-200kW', manufacturer: '科华数据' },
      { deviceCategory: 'other', deviceType: 'transformer', modelName: '变压器-630kVA', manufacturer: '特变电工' }
    ],
    algorithmConfig: algorithmDefaults
  },
  {
    id: 'template_microgrid',
    name: '微电网模板',
    description: '风光柴储完整微电网配置',
    category: '微电网',
    devices: [
      { deviceCategory: 'wind', deviceType: 'wind_turbine', modelName: '风力发电机-50kW', manufacturer: '金风科技' },
      { deviceCategory: 'solar', deviceType: 'pv_inverter', modelName: '光伏逆变器-100kW', manufacturer: '固德威' },
      { deviceCategory: 'diesel', deviceType: 'diesel_generator', modelName: '柴油发电机-200kW', manufacturer: '康明斯' },
      { deviceCategory: 'storage', deviceType: 'pcs', modelName: '储能PCS-500kW', manufacturer: '阳光电源' },
      { deviceCategory: 'storage', deviceType: 'bms', modelName: 'BMS系统', manufacturer: '宁德时代' },
      { deviceCategory: 'other', deviceType: 'ems_controller', modelName: 'EMS主控', manufacturer: '国电南瑞' }
    ],
    algorithmConfig: algorithmDefaults
  }
];

function TemplateManager({ onNavigate }) {
  const [templates, setTemplates] = useState(presetTemplates);
  const [customTemplates, setCustomTemplates] = useState(() => {
    return JSON.parse(localStorage.getItem('ems_custom_templates') || '[]');
  });
  const [activeTab, setActiveTab] = useState('preset');
  const fileInputRef = useRef(null);

  const handleUseTemplate = (template) => {
    // 将模板设备保存为物模型
    const existingModels = JSON.parse(localStorage.getItem('ems_device_models') || '[]');
    const newModels = template.devices.map((device, index) => ({
      ...device,
      id: `model_${Date.now()}_${index}`,
      createdAt: new Date().toISOString(),
      protocolType: 'modbus_rtu',
      channelType: 'serial',
      voltageLevel: '380v',
      ratedVoltage: 380,
      ratedCurrent: 100,
      ratedPower: 50,
      alarmRules: [],
      upstreamDevices: [],
      downstreamDevices: [],
      virtualPoints: []
    }));
    
    // 过滤掉已存在的模型（根据名称判断）
    const existingNames = existingModels.map(m => m.modelName);
    const uniqueModels = newModels.filter(m => !existingNames.includes(m.modelName));
    
    if (uniqueModels.length > 0) {
      localStorage.setItem('ems_device_models', JSON.stringify([...existingModels, ...uniqueModels]));
    }
    
    alert(`已将模板 "${template.name}" 的 ${uniqueModels.length} 个设备添加到物模型库！`);
    onNavigate('project-config-wizard', '现场配置');
  };

  const handleExportTemplate = (template) => {
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ems_template_${template.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportTemplate = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const template = JSON.parse(event.target.result);
          const newTemplate = {
            ...template,
            id: `custom_template_${Date.now()}`,
            importedAt: new Date().toISOString()
          };
          const updatedTemplates = [...customTemplates, newTemplate];
          localStorage.setItem('ems_custom_templates', JSON.stringify(updatedTemplates));
          setCustomTemplates(updatedTemplates);
          setActiveTab('custom');
          alert('模板导入成功！');
        } catch (err) {
          alert('模板文件格式错误');
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleDeleteCustomTemplate = (templateId) => {
    if (confirm('确定要删除该模板吗？')) {
      const updatedTemplates = customTemplates.filter(t => t.id !== templateId);
      localStorage.setItem('ems_custom_templates', JSON.stringify(updatedTemplates));
      setCustomTemplates(updatedTemplates);
    }
  };

  const displayTemplates = activeTab === 'preset' ? templates : customTemplates;

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden-input"
        accept=".json"
        onChange={handleFileChange}
      />

      {/* 头部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div className="tabs" style={{ marginBottom: 0, border: 'none' }}>
          <div 
            className={`tab-item ${activeTab === 'preset' ? 'active' : ''}`}
            onClick={() => setActiveTab('preset')}
          >
            📋 预设模板 ({templates.length})
          </div>
          <div 
            className={`tab-item ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => setActiveTab('custom')}
          >
            📁 自定义模板 ({customTemplates.length})
          </div>
        </div>
        <button className="btn btn-secondary" onClick={handleImportTemplate}>
          📤 导入模板
        </button>
      </div>

      {/* 模板列表 */}
      {displayTemplates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">暂无{activeTab === 'preset' ? '预设' : '自定义'}模板</div>
          <div className="empty-state-desc">
            {activeTab === 'custom' && '导入或从项目保存模板'}
          </div>
          {activeTab === 'custom' && (
            <button className="btn btn-primary" onClick={handleImportTemplate}>
              📤 导入模板
            </button>
          )}
        </div>
      ) : (
        <div className="project-cards">
          {displayTemplates.map(template => (
            <div key={template.id} className="card" style={{ overflow: 'hidden' }}>
              <div style={{
                padding: '16px 20px',
                background: template.category === '储能系统' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                           template.category === '光储系统' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                           template.category === '充电系统' ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' :
                           'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white'
              }}>
                <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{template.name}</h3>
                <span style={{ 
                  fontSize: '12px', 
                  background: 'rgba(255,255,255,0.2)', 
                  padding: '2px 8px', 
                  borderRadius: '4px' 
                }}>
                  {template.category}
                </span>
              </div>
              <div className="card-body">
                <p style={{ fontSize: '13px', color: 'var(--gray-600)', marginBottom: '16px' }}>
                  {template.description}
                </p>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-500)', marginBottom: '8px' }}>
                    包含设备：
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {template.devices?.map((device, index) => {
                      const category = deviceCategories.find(c => c.id === device.deviceCategory);
                      const deviceType = category?.devices.find(d => d.id === device.deviceType);
                      return (
                        <span key={index} className="tag tag-gray" style={{ fontSize: '11px' }}>
                          {deviceType?.icon || '📦'} {device.modelName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => handleUseTemplate(template)}
                >
                  🚀 使用此模板
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleExportTemplate(template)}
                  >
                    📥 导出
                  </button>
                  {activeTab === 'custom' && (
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteCustomTemplate(template.id)}
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 说明卡片 */}
      <div className="card" style={{ marginTop: '24px', background: 'var(--gray-50)' }}>
        <div className="card-body">
          <h4 style={{ marginBottom: '12px' }}>💡 关于配置模板</h4>
          <ul style={{ fontSize: '13px', color: 'var(--gray-600)', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li><strong>预设模板</strong>：系统内置的典型场景配置，可直接使用</li>
            <li><strong>自定义模板</strong>：从已完成的项目导出，或导入其他项目的配置</li>
            <li>使用模板会将设备配置添加到物模型库，然后进入现场配置流程</li>
            <li>模板可以导出为JSON文件，方便在不同系统间迁移和复用</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default TemplateManager;
