import React, { useState, useEffect, useRef } from 'react';
import { deviceCategories } from '../data/deviceTypes';

function DeviceModelList({ onNavigate }) {
  const [deviceModels, setDeviceModels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const fileInputRef = useRef(null);

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
    </div>
  );
}

export default DeviceModelList;
