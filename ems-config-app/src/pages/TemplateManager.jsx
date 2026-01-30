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
    try {
      return JSON.parse(localStorage.getItem('ems_custom_templates') || '[]');
    } catch (e) {
      console.error('Failed to load custom templates:', e);
      return [];
    }
  });
  const [activeTab, setActiveTab] = useState('preset');
  const fileInputRef = useRef(null);
  
  // 新增/编辑模板的状态
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: '自定义',
    devices: []
  });

  // 可用设备类型列表
  const availableDevices = deviceCategories.flatMap(cat => 
    cat.devices.map(d => ({
      ...d,
      category: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon
    }))
  );

  // 打开创建模板弹窗
  const handleOpenCreateModal = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: '',
      description: '',
      category: '自定义',
      devices: []
    });
    setShowTemplateModal(true);
  };

  // 打开编辑模板弹窗
  const handleOpenEditModal = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description,
      category: template.category,
      devices: template.devices || []
    });
    setShowTemplateModal(true);
  };

  // 保存模板
  const handleSaveTemplate = () => {
    if (!templateForm.name) {
      alert('请输入模板名称');
      return;
    }
    
    if (editingTemplate) {
      // 编辑已有模板
      const updatedTemplate = {
        ...editingTemplate,
        ...templateForm,
        updatedAt: new Date().toISOString()
      };
      const updatedTemplates = customTemplates.map(t => 
        t.id === editingTemplate.id ? updatedTemplate : t
      );
      localStorage.setItem('ems_custom_templates', JSON.stringify(updatedTemplates));
      setCustomTemplates(updatedTemplates);
      alert('模板更新成功！');
    } else {
      // 创建新模板
      const newTemplate = {
        id: `custom_template_${Date.now()}`,
        ...templateForm,
        algorithmConfig: algorithmDefaults,
        createdAt: new Date().toISOString()
      };
      const updatedTemplates = [...customTemplates, newTemplate];
      localStorage.setItem('ems_custom_templates', JSON.stringify(updatedTemplates));
      setCustomTemplates(updatedTemplates);
      setActiveTab('custom');
      alert('模板创建成功！');
    }
    
    setShowTemplateModal(false);
  };

  // 添加设备到模板
  const handleAddDeviceToTemplate = (device) => {
    setTemplateForm(prev => ({
      ...prev,
      devices: [...prev.devices, {
        deviceCategory: device.category,
        deviceType: device.id,
        modelName: device.name,
        manufacturer: '默认厂商'
      }]
    }));
  };

  // 从模板移除设备
  const handleRemoveDeviceFromTemplate = (index) => {
    setTemplateForm(prev => ({
      ...prev,
      devices: prev.devices.filter((_, i) => i !== index)
    }));
  };

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
    if (window.confirm('确定要删除该模板吗？')) {
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            ➕ 创建模板
          </button>
          <button className="btn btn-secondary" onClick={handleImportTemplate}>
            📤 导入模板
          </button>
        </div>
      </div>

      {/* 模板列表 */}
      {displayTemplates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">暂无{activeTab === 'preset' ? '预设' : '自定义'}模板</div>
          <div className="empty-state-desc">
            {activeTab === 'custom' && '创建新模板或导入已有模板'}
          </div>
          {activeTab === 'custom' && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={handleOpenCreateModal}>
                ➕ 创建模板
              </button>
              <button className="btn btn-secondary" onClick={handleImportTemplate}>
                📤 导入模板
              </button>
            </div>
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
                           template.category === '微电网' ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' :
                           'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
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
                  {activeTab === 'custom' && (
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleOpenEditModal(template)}
                    >
                      ✏️ 编辑
                    </button>
                  )}
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

      {/* 创建/编辑模板弹窗 */}
      {showTemplateModal && (
        <div 
          style={{
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
          }}
          onClick={() => setShowTemplateModal(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              width: '700px',
              maxWidth: '90vw',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '20px' }}>
              {editingTemplate ? '编辑模板' : '创建新模板'}
            </h3>
            
            <div className="form-group">
              <label className="form-label">模板名称 <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="如：工厂储能系统模板"
                value={templateForm.name}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">模板描述</label>
              <textarea
                className="form-textarea"
                placeholder="描述此模板的适用场景和包含的设备"
                value={templateForm.description}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">模板分类</label>
              <select
                className="form-select"
                value={templateForm.category}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="储能系统">储能系统</option>
                <option value="光储系统">光储系统</option>
                <option value="充电系统">充电系统</option>
                <option value="微电网">微电网</option>
                <option value="自定义">自定义</option>
              </select>
            </div>

            {/* 设备配置 */}
            <div className="form-group">
              <label className="form-label">包含设备</label>
              
              {/* 已添加的设备 */}
              {templateForm.devices.length > 0 && (
                <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {templateForm.devices.map((device, index) => {
                    const category = deviceCategories.find(c => c.id === device.deviceCategory);
                    const deviceType = category?.devices.find(d => d.id === device.deviceType);
                    return (
                      <div 
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          background: 'var(--gray-100)',
                          borderRadius: '6px',
                          fontSize: '13px'
                        }}
                      >
                        <span>{deviceType?.icon || '📦'}</span>
                        <span>{device.modelName}</span>
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            padding: '0 4px'
                          }}
                          onClick={() => handleRemoveDeviceFromTemplate(index)}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 可选设备列表 */}
              <div style={{ 
                border: '1px solid var(--gray-200)', 
                borderRadius: '8px', 
                padding: '12px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '8px' }}>
                  点击添加设备到模板：
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {availableDevices.map((device, index) => (
                    <button
                      key={index}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '11px' }}
                      onClick={() => handleAddDeviceToTemplate(device)}
                    >
                      {device.icon} {device.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowTemplateModal(false)}
              >
                取消
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSaveTemplate}
                disabled={!templateForm.name}
              >
                {editingTemplate ? '保存修改' : '创建模板'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 说明卡片 */}
      <div className="card" style={{ marginTop: '24px', background: 'var(--gray-50)' }}>
        <div className="card-body">
          <h4 style={{ marginBottom: '12px' }}>💡 关于配置模板</h4>
          <ul style={{ fontSize: '13px', color: 'var(--gray-600)', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li><strong>预设模板</strong>：系统内置的典型场景配置，可直接使用</li>
            <li><strong>自定义模板</strong>：可创建、编辑、删除，满足个性化需求</li>
            <li><strong>场景模板</strong>：项目配置中的场景模板是预设模板的快捷入口</li>
            <li>使用模板会将设备配置添加到物模型库，然后进入现场配置流程</li>
            <li>模板可以导出为JSON文件，方便在不同系统间迁移和复用</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default TemplateManager;
