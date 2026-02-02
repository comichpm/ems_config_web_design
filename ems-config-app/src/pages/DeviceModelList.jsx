import React, { useState, useEffect, useRef } from 'react';
import { deviceCategories } from '../data/deviceTypes';

function DeviceModelList({ onNavigate }) {
  const [deviceModels, setDeviceModels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const fileInputRef = useRef(null);
  
  // 编辑功能状态
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingModel, setEditingModel] = useState(null);

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

      {/* 编辑物模型模态框 */}
      {showEditModal && editingModel && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white', padding: '24px', borderRadius: '12px',
            width: '600px', maxHeight: '80vh', overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '20px' }}>✏️ 编辑物模型</h3>
            
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
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => { setShowEditModal(false); setEditingModel(null); }}
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
