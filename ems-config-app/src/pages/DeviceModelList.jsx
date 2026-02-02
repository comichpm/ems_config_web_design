import React, { useState, useEffect, useRef } from 'react';
import { deviceCategories, deviceBasicAttributes } from '../data/deviceTypes';

function DeviceModelList({ onNavigate }) {
  const [deviceModels, setDeviceModels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const fileInputRef = useRef(null);
  
  // 编辑功能状态
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [editTab, setEditTab] = useState('basic'); // 编辑模态框Tab: basic, attributes, protocol, points, alarms, virtual

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = () => {
    try {
      const savedModels = JSON.parse(localStorage.getItem('ems_device_models') || '[]');
      setDeviceModels(Array.isArray(savedModels) ? savedModels : []);
    } catch (e) {
      console.error('Failed to load device models from localStorage:', e);
      setDeviceModels([]);
    }
  };

  const handleDeleteModel = (modelId) => {
    if (window.confirm('确定要删除该物模型吗？此操作不可恢复。')) {
      const updatedModels = deviceModels.filter(m => m.id !== modelId);
      localStorage.setItem('ems_device_models', JSON.stringify(updatedModels));
      setDeviceModels(updatedModels);
    }
  };

  // 编辑物模型
  const handleEditModel = (model) => {
    setEditingModel({ ...model });
    setShowEditModal(true);
  };

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editingModel || !editingModel.modelName) {
      alert('物模型名称不能为空');
      return;
    }
    const updatedModels = deviceModels.map(m => 
      m.id === editingModel.id ? { ...editingModel, updatedAt: new Date().toISOString() } : m
    );
    localStorage.setItem('ems_device_models', JSON.stringify(updatedModels));
    setDeviceModels(updatedModels);
    setShowEditModal(false);
    setEditingModel(null);
    alert('物模型更新成功！');
  };

  const handleExportModel = (model) => {
    const blob = new Blob([JSON.stringify(model, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ems_model_${model.modelName || 'export'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    const blob = new Blob([JSON.stringify(deviceModels, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ems_all_models_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportModel = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          let newModels = [];
          if (Array.isArray(data)) {
            newModels = data.map(m => ({
              ...m,
              id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              importedAt: new Date().toISOString()
            }));
          } else {
            newModels = [{
              ...data,
              id: `model_${Date.now()}`,
              importedAt: new Date().toISOString()
            }];
          }
          const updatedModels = [...deviceModels, ...newModels];
          localStorage.setItem('ems_device_models', JSON.stringify(updatedModels));
          setDeviceModels(updatedModels);
          alert(`成功导入 ${newModels.length} 个物模型！`);
        } catch (err) {
          alert('物模型文件格式错误');
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const filteredModels = deviceModels.filter(m => {
    const matchesSearch = m.modelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || m.deviceCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden-input"
        accept=".json"
        onChange={handleFileChange}
      />

      {/* 头部操作栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="search-input" style={{ width: '250px' }}>
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              className="form-input"
              placeholder="搜索物模型..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ width: '150px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">全部分类</option>
            {deviceCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleImportModel}>
            📤 导入物模型
          </button>
          {deviceModels.length > 0 && (
            <button className="btn btn-secondary" onClick={handleExportAll}>
              📥 导出全部
            </button>
          )}
          <button 
            className="btn btn-primary"
            onClick={() => onNavigate('device-model-wizard', '创建物模型')}
          >
            ➕ 创建物模型
          </button>
        </div>
      </div>

      {/* 物模型列表 */}
      {filteredModels.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-title">暂无物模型</div>
          <div className="empty-state-desc">
            {searchTerm || selectedCategory !== 'all' 
              ? '没有找到匹配的物模型' 
              : '点击"创建物模型"开始定义您的第一个设备模型'}
          </div>
          {!searchTerm && selectedCategory === 'all' && (
            <button 
              className="btn btn-primary"
              onClick={() => onNavigate('device-model-wizard', '创建物模型')}
            >
              ➕ 创建物模型
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>物模型名称</th>
                <th>设备分类</th>
                <th>设备类型</th>
                <th>厂商</th>
                <th>协议</th>
                <th>电压等级</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredModels.map(model => {
                const category = deviceCategories.find(c => c.id === model.deviceCategory);
                const device = category?.devices.find(d => d.id === model.deviceType);
                return (
                  <tr key={model.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{device?.icon || '📦'}</span>
                        <span style={{ fontWeight: '500' }}>{model.modelName}</span>
                      </div>
                    </td>
                    <td>
                      <span className="tag tag-blue">{category?.name || '-'}</span>
                    </td>
                    <td>{device?.name || '-'}</td>
                    <td>{model.manufacturer || '-'}</td>
                    <td>
                      <span className="tag tag-gray">{model.protocolType?.toUpperCase() || '-'}</span>
                    </td>
                    <td>{model.voltageLevel?.toUpperCase() || '-'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                      {model.createdAt ? new Date(model.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-sm btn-warning"
                          style={{ backgroundColor: '#f59e0b', color: 'white' }}
                          onClick={() => handleEditModel(model)}
                        >
                          ✏️ 编辑
                        </button>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleExportModel(model)}
                        >
                          📥 导出
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteModel(model.id)}
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 编辑物模型模态框 - 完整多Tab编辑器 */}
      {showEditModal && editingModel && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white', padding: '24px', borderRadius: '12px',
            width: '900px', maxHeight: '85vh', overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '20px' }}>✏️ 编辑物模型: {editingModel.modelName}</h3>
            
            {/* Tab 导航 */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb', paddingBottom: '0' }}>
              {[
                { id: 'basic', label: '📋 基本信息' },
                { id: 'attributes', label: '⚙️ 设备属性' },
                { id: 'protocol', label: '🔌 协议通道' },
                { id: 'points', label: '📊 点表配置' },
                { id: 'alarms', label: '⚠️ 告警规则' },
                { id: 'virtual', label: '🔢 虚拟点' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setEditTab(tab.id)}
                  style={{
                    padding: '10px 16px',
                    border: 'none',
                    borderBottom: editTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
                    backgroundColor: editTab === tab.id ? '#eff6ff' : 'transparent',
                    color: editTab === tab.id ? '#3b82f6' : '#6b7280',
                    cursor: 'pointer',
                    fontWeight: editTab === tab.id ? '600' : '400',
                    marginBottom: '-2px'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 内容 */}
            <div style={{ minHeight: '400px' }}>
              {/* 基本信息 Tab */}
              {editTab === 'basic' && (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label className="form-label">物模型名称 <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingModel.modelName || ''}
                      onChange={(e) => setEditingModel({ ...editingModel, modelName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">描述</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={editingModel.modelDescription || ''}
                      onChange={(e) => setEditingModel({ ...editingModel, modelDescription: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label">设备分类</label>
                      <select
                        className="form-select"
                        value={editingModel.deviceCategory || ''}
                        onChange={(e) => setEditingModel({ ...editingModel, deviceCategory: e.target.value, deviceType: '' })}
                      >
                        <option value="">-- 选择分类 --</option>
                        {deviceCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">设备类型</label>
                      <select
                        className="form-select"
                        value={editingModel.deviceType || ''}
                        onChange={(e) => setEditingModel({ ...editingModel, deviceType: e.target.value })}
                      >
                        <option value="">-- 选择类型 --</option>
                        {deviceCategories.find(c => c.id === editingModel.deviceCategory)?.devices.map(dev => (
                          <option key={dev.id} value={dev.id}>{dev.icon} {dev.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label">制造商</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editingModel.manufacturer || ''}
                        onChange={(e) => setEditingModel({ ...editingModel, manufacturer: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">型号规格</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editingModel.modelSpec || ''}
                        onChange={(e) => setEditingModel({ ...editingModel, modelSpec: e.target.value })}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label">电压等级</label>
                      <select
                        className="form-select"
                        value={editingModel.voltageLevel || ''}
                        onChange={(e) => setEditingModel({ ...editingModel, voltageLevel: e.target.value })}
                      >
                        <option value="">-- 选择 --</option>
                        <option value="lv">低压 (LV)</option>
                        <option value="mv">中压 (MV)</option>
                        <option value="hv">高压 (HV)</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">通信协议</label>
                      <select
                        className="form-select"
                        value={editingModel.protocolType || ''}
                        onChange={(e) => setEditingModel({ ...editingModel, protocolType: e.target.value })}
                      >
                        <option value="">-- 选择 --</option>
                        <option value="modbus_rtu">Modbus RTU</option>
                        <option value="modbus_tcp">Modbus TCP</option>
                        <option value="iec104">IEC 104</option>
                        <option value="mqtt">MQTT</option>
                        <option value="virtual">虚拟设备</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 设备属性 Tab */}
              {editTab === 'attributes' && (
                <div>
                  <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                    根据设备类型 "{editingModel.deviceType || '未选择'}" 配置设备属性
                  </p>
                  {editingModel.deviceType && deviceBasicAttributes[editingModel.deviceType] ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {deviceBasicAttributes[editingModel.deviceType].map(attr => (
                        <div key={attr.id}>
                          <label className="form-label">{attr.name} {attr.unit && `(${attr.unit})`}</label>
                          {attr.type === 'select' ? (
                            <select
                              className="form-select"
                              value={editingModel.attributes?.[attr.id] || attr.default || ''}
                              onChange={(e) => setEditingModel({
                                ...editingModel,
                                attributes: { ...editingModel.attributes, [attr.id]: e.target.value }
                              })}
                            >
                              {attr.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={attr.type === 'number' ? 'number' : 'text'}
                              className="form-input"
                              value={editingModel.attributes?.[attr.id] || attr.default || ''}
                              min={attr.min}
                              max={attr.max}
                              onChange={(e) => setEditingModel({
                                ...editingModel,
                                attributes: { ...editingModel.attributes, [attr.id]: e.target.value }
                              })}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                      请先在"基本信息"中选择设备类型
                    </div>
                  )}
                </div>
              )}

              {/* 协议通道 Tab */}
              {editTab === 'protocol' && (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label">通道类型</label>
                      <select
                        className="form-select"
                        value={editingModel.channelType || ''}
                        onChange={(e) => setEditingModel({ ...editingModel, channelType: e.target.value })}
                      >
                        <option value="">-- 选择 --</option>
                        <option value="serial">串口</option>
                        <option value="ethernet">以太网</option>
                        <option value="virtual">虚拟通道</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">通信协议</label>
                      <select
                        className="form-select"
                        value={editingModel.protocolType || ''}
                        onChange={(e) => setEditingModel({ ...editingModel, protocolType: e.target.value })}
                      >
                        <option value="">-- 选择 --</option>
                        <option value="modbus_rtu">Modbus RTU</option>
                        <option value="modbus_tcp">Modbus TCP</option>
                        <option value="iec104">IEC 104</option>
                        <option value="mqtt">MQTT</option>
                        <option value="virtual">虚拟设备</option>
                      </select>
                    </div>
                  </div>
                  
                  {editingModel.channelType === 'serial' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                      <div>
                        <label className="form-label">波特率</label>
                        <select className="form-select" value={editingModel.baudRate || '9600'}
                          onChange={(e) => setEditingModel({ ...editingModel, baudRate: e.target.value })}>
                          <option value="9600">9600</option>
                          <option value="19200">19200</option>
                          <option value="38400">38400</option>
                          <option value="115200">115200</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label">数据位</label>
                        <select className="form-select" value={editingModel.dataBits || '8'}
                          onChange={(e) => setEditingModel({ ...editingModel, dataBits: e.target.value })}>
                          <option value="7">7</option>
                          <option value="8">8</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label">校验位</label>
                        <select className="form-select" value={editingModel.parity || 'none'}
                          onChange={(e) => setEditingModel({ ...editingModel, parity: e.target.value })}>
                          <option value="none">无</option>
                          <option value="odd">奇校验</option>
                          <option value="even">偶校验</option>
                        </select>
                      </div>
                    </div>
                  )}
                  
                  {editingModel.channelType === 'ethernet' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                      <div>
                        <label className="form-label">IP地址</label>
                        <input type="text" className="form-input" placeholder="192.168.1.100"
                          value={editingModel.ipAddress || ''}
                          onChange={(e) => setEditingModel({ ...editingModel, ipAddress: e.target.value })} />
                      </div>
                      <div>
                        <label className="form-label">端口</label>
                        <input type="number" className="form-input" placeholder="502"
                          value={editingModel.port || ''}
                          onChange={(e) => setEditingModel({ ...editingModel, port: e.target.value })} />
                      </div>
                    </div>
                  )}
                  
                  {editingModel.channelType === 'virtual' && (
                    <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #86efac' }}>
                      <h4 style={{ color: '#166534', marginBottom: '12px' }}>🔮 虚拟通道配置</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label className="form-label">计算周期 (ms)</label>
                          <input type="number" className="form-input" value={editingModel.calcInterval || 1000}
                            onChange={(e) => setEditingModel({ ...editingModel, calcInterval: e.target.value })} />
                        </div>
                        <div>
                          <label className="form-label">缓存策略</label>
                          <select className="form-select" value={editingModel.cacheStrategy || 'realtime'}
                            onChange={(e) => setEditingModel({ ...editingModel, cacheStrategy: e.target.value })}>
                            <option value="realtime">实时</option>
                            <option value="cache_1m">缓存1分钟</option>
                            <option value="cache_5m">缓存5分钟</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 点表配置 Tab */}
              {editTab === 'points' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ color: '#6b7280' }}>已配置 {editingModel.pointTable?.length || 0} 个点位</span>
                    <button className="btn btn-sm btn-primary" onClick={() => {
                      const newPoint = { id: `pt_${Date.now()}`, name: '', address: '', dataType: 'int16', rw: 'r' };
                      setEditingModel({ ...editingModel, pointTable: [...(editingModel.pointTable || []), newPoint] });
                    }}>+ 添加点位</button>
                  </div>
                  <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb' }}>
                          <th style={{ padding: '8px', textAlign: 'left' }}>点位名称</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>地址</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>数据类型</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>读写</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(editingModel.pointTable || []).map((pt, idx) => (
                          <tr key={pt.id || idx}>
                            <td style={{ padding: '4px' }}>
                              <input type="text" className="form-input" style={{ padding: '4px 8px' }}
                                value={pt.name || ''} onChange={(e) => {
                                  const newPts = [...editingModel.pointTable];
                                  newPts[idx] = { ...pt, name: e.target.value };
                                  setEditingModel({ ...editingModel, pointTable: newPts });
                                }} />
                            </td>
                            <td style={{ padding: '4px' }}>
                              <input type="text" className="form-input" style={{ padding: '4px 8px' }}
                                value={pt.address || ''} onChange={(e) => {
                                  const newPts = [...editingModel.pointTable];
                                  newPts[idx] = { ...pt, address: e.target.value };
                                  setEditingModel({ ...editingModel, pointTable: newPts });
                                }} />
                            </td>
                            <td style={{ padding: '4px' }}>
                              <select className="form-select" style={{ padding: '4px 8px' }}
                                value={pt.dataType || 'int16'} onChange={(e) => {
                                  const newPts = [...editingModel.pointTable];
                                  newPts[idx] = { ...pt, dataType: e.target.value };
                                  setEditingModel({ ...editingModel, pointTable: newPts });
                                }}>
                                <option value="int16">INT16</option>
                                <option value="uint16">UINT16</option>
                                <option value="int32">INT32</option>
                                <option value="float">FLOAT</option>
                                <option value="bool">BOOL</option>
                              </select>
                            </td>
                            <td style={{ padding: '4px' }}>
                              <select className="form-select" style={{ padding: '4px 8px' }}
                                value={pt.rw || 'r'} onChange={(e) => {
                                  const newPts = [...editingModel.pointTable];
                                  newPts[idx] = { ...pt, rw: e.target.value };
                                  setEditingModel({ ...editingModel, pointTable: newPts });
                                }}>
                                <option value="r">只读</option>
                                <option value="w">只写</option>
                                <option value="rw">读写</option>
                              </select>
                            </td>
                            <td style={{ padding: '4px', textAlign: 'center' }}>
                              <button className="btn btn-sm btn-danger" onClick={() => {
                                const newPts = editingModel.pointTable.filter((_, i) => i !== idx);
                                setEditingModel({ ...editingModel, pointTable: newPts });
                              }}>删除</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(!editingModel.pointTable || editingModel.pointTable.length === 0) && (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>暂无点位，点击"添加点位"开始配置</div>
                    )}
                  </div>
                </div>
              )}

              {/* 告警规则 Tab */}
              {editTab === 'alarms' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ color: '#6b7280' }}>已配置 {editingModel.alarmRules?.length || 0} 条告警规则</span>
                    <button className="btn btn-sm btn-primary" onClick={() => {
                      const newAlarm = { id: `alarm_${Date.now()}`, name: '', point: '', condition: '>', threshold: '', level: 'warning' };
                      setEditingModel({ ...editingModel, alarmRules: [...(editingModel.alarmRules || []), newAlarm] });
                    }}>+ 添加告警</button>
                  </div>
                  <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                    {(editingModel.alarmRules || []).map((alarm, idx) => (
                      <div key={alarm.id || idx} style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '8px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                          <input type="text" className="form-input" placeholder="告警名称" value={alarm.name || ''}
                            onChange={(e) => {
                              const newAlarms = [...editingModel.alarmRules];
                              newAlarms[idx] = { ...alarm, name: e.target.value };
                              setEditingModel({ ...editingModel, alarmRules: newAlarms });
                            }} />
                          <select className="form-select" value={alarm.point || ''}
                            onChange={(e) => {
                              const newAlarms = [...editingModel.alarmRules];
                              newAlarms[idx] = { ...alarm, point: e.target.value };
                              setEditingModel({ ...editingModel, alarmRules: newAlarms });
                            }}>
                            <option value="">选择点位</option>
                            {(editingModel.pointTable || []).map(pt => (
                              <option key={pt.id} value={pt.id}>{pt.name}</option>
                            ))}
                          </select>
                          <select className="form-select" value={alarm.condition || '>'}
                            onChange={(e) => {
                              const newAlarms = [...editingModel.alarmRules];
                              newAlarms[idx] = { ...alarm, condition: e.target.value };
                              setEditingModel({ ...editingModel, alarmRules: newAlarms });
                            }}>
                            <option value=">">&gt;</option>
                            <option value="<">&lt;</option>
                            <option value="==">==</option>
                            <option value="!=">!=</option>
                          </select>
                          <input type="text" className="form-input" placeholder="阈值" value={alarm.threshold || ''}
                            onChange={(e) => {
                              const newAlarms = [...editingModel.alarmRules];
                              newAlarms[idx] = { ...alarm, threshold: e.target.value };
                              setEditingModel({ ...editingModel, alarmRules: newAlarms });
                            }} />
                          <select className="form-select" value={alarm.level || 'warning'}
                            onChange={(e) => {
                              const newAlarms = [...editingModel.alarmRules];
                              newAlarms[idx] = { ...alarm, level: e.target.value };
                              setEditingModel({ ...editingModel, alarmRules: newAlarms });
                            }}>
                            <option value="info">信息</option>
                            <option value="warning">警告</option>
                            <option value="error">严重</option>
                          </select>
                          <button className="btn btn-sm btn-danger" onClick={() => {
                            const newAlarms = editingModel.alarmRules.filter((_, i) => i !== idx);
                            setEditingModel({ ...editingModel, alarmRules: newAlarms });
                          }}>删除</button>
                        </div>
                      </div>
                    ))}
                    {(!editingModel.alarmRules || editingModel.alarmRules.length === 0) && (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>暂无告警规则，点击"添加告警"开始配置</div>
                    )}
                  </div>
                </div>
              )}

              {/* 虚拟点 Tab */}
              {editTab === 'virtual' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ color: '#6b7280' }}>已配置 {editingModel.virtualPoints?.length || 0} 个虚拟点</span>
                    <button className="btn btn-sm btn-primary" onClick={() => {
                      const newVP = { id: `vp_${Date.now()}`, name: '', formula: '', dataType: 'float', unit: '' };
                      setEditingModel({ ...editingModel, virtualPoints: [...(editingModel.virtualPoints || []), newVP] });
                    }}>+ 添加虚拟点</button>
                  </div>
                  <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                    {(editingModel.virtualPoints || []).map((vp, idx) => (
                      <div key={vp.id || idx} style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '8px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                          <input type="text" className="form-input" placeholder="虚拟点名称" value={vp.name || ''}
                            onChange={(e) => {
                              const newVPs = [...editingModel.virtualPoints];
                              newVPs[idx] = { ...vp, name: e.target.value };
                              setEditingModel({ ...editingModel, virtualPoints: newVPs });
                            }} />
                          <input type="text" className="form-input" placeholder="计算公式 如: {点1} + {点2}" value={vp.formula || ''}
                            onChange={(e) => {
                              const newVPs = [...editingModel.virtualPoints];
                              newVPs[idx] = { ...vp, formula: e.target.value };
                              setEditingModel({ ...editingModel, virtualPoints: newVPs });
                            }} />
                          <select className="form-select" value={vp.dataType || 'float'}
                            onChange={(e) => {
                              const newVPs = [...editingModel.virtualPoints];
                              newVPs[idx] = { ...vp, dataType: e.target.value };
                              setEditingModel({ ...editingModel, virtualPoints: newVPs });
                            }}>
                            <option value="float">FLOAT</option>
                            <option value="int">INT</option>
                            <option value="bool">BOOL</option>
                          </select>
                          <input type="text" className="form-input" placeholder="单位" value={vp.unit || ''}
                            onChange={(e) => {
                              const newVPs = [...editingModel.virtualPoints];
                              newVPs[idx] = { ...vp, unit: e.target.value };
                              setEditingModel({ ...editingModel, virtualPoints: newVPs });
                            }} />
                          <button className="btn btn-sm btn-danger" onClick={() => {
                            const newVPs = editingModel.virtualPoints.filter((_, i) => i !== idx);
                            setEditingModel({ ...editingModel, virtualPoints: newVPs });
                          }}>删除</button>
                        </div>
                      </div>
                    ))}
                    {(!editingModel.virtualPoints || editingModel.virtualPoints.length === 0) && (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>暂无虚拟点，点击"添加虚拟点"开始配置</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => { setShowEditModal(false); setEditingModel(null); setEditTab('basic'); }}
              >
                取消
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSaveEdit}
              >
                💾 保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeviceModelList;
