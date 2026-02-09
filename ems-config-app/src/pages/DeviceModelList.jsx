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
  
  // Phase 2: 版本管理、导入导出、验证、比较
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionHistory, setVersionHistory] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareModels, setCompareModels] = useState([null, null]);
  const [validationResults, setValidationResults] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  
  // Phase 3: 批量操作、搜索增强
  const [selectedModels, setSelectedModels] = useState([]);
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  
  // Phase 4: 多语言、主题
  const [language, setLanguage] = useState('zh');
  const [theme, setTheme] = useState('light');

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
    // Phase 2: 保存版本历史
    const oldModel = deviceModels.find(m => m.id === editingModel.id);
    if (oldModel) {
      const history = JSON.parse(localStorage.getItem(`ems_model_history_${editingModel.id}`) || '[]');
      history.push({ ...oldModel, savedAt: new Date().toISOString(), version: history.length + 1 });
      localStorage.setItem(`ems_model_history_${editingModel.id}`, JSON.stringify(history.slice(-10))); // 保留最近10个版本
    }
    
    const newVersion = (editingModel.version || 0) + 1;
    const updatedModels = deviceModels.map(m => 
      m.id === editingModel.id ? { ...editingModel, version: newVersion, updatedAt: new Date().toISOString() } : m
    );
    localStorage.setItem('ems_device_models', JSON.stringify(updatedModels));
    setDeviceModels(updatedModels);
    setShowEditModal(false);
    setEditingModel(null);
    alert('物模型更新成功！');
  };

  // ========== Phase 2: 版本管理 ==========
  const handleViewVersionHistory = (model) => {
    const history = JSON.parse(localStorage.getItem(`ems_model_history_${model.id}`) || '[]');
    setVersionHistory(history);
    setEditingModel(model);
    setShowVersionModal(true);
  };

  const handleRestoreVersion = (version) => {
    if (window.confirm(`确定要恢复到版本 ${version.version} 吗？`)) {
      const restored = { ...version, id: editingModel.id, restoredAt: new Date().toISOString() };
      delete restored.savedAt;
      delete restored.version;
      const updatedModels = deviceModels.map(m => m.id === editingModel.id ? restored : m);
      localStorage.setItem('ems_device_models', JSON.stringify(updatedModels));
      setDeviceModels(updatedModels);
      setShowVersionModal(false);
      alert('版本恢复成功！');
    }
  };

  // ========== Phase 2: 配置验证器 ==========
  const validateModel = (model) => {
    const errors = [];
    const warnings = [];
    
    // 必填项检查
    if (!model.modelName) errors.push('物模型名称不能为空');
    if (!model.deviceCategory) errors.push('设备分类不能为空');
    if (!model.deviceType) errors.push('设备类型不能为空');
    
    // 点表检查
    if (!model.pointTable || model.pointTable.length === 0) {
      warnings.push('点表配置为空，建议添加点位');
    } else {
      const pointNames = model.pointTable.map(p => p.name);
      const duplicates = pointNames.filter((name, index) => pointNames.indexOf(name) !== index);
      if (duplicates.length > 0) errors.push(`点表存在重复点位名称: ${[...new Set(duplicates)].join(', ')}`);
    }
    
    // 告警规则检查
    if (model.alarmRules) {
      model.alarmRules.forEach((rule, i) => {
        if (!rule.name) warnings.push(`告警规则 ${i + 1} 缺少名称`);
        if (!rule.threshold && rule.threshold !== 0) warnings.push(`告警规则 ${rule.name || i + 1} 缺少阈值`);
      });
    }
    
    return { errors, warnings, isValid: errors.length === 0 };
  };

  const handleValidateModel = (model) => {
    const results = validateModel(model);
    setValidationResults({ model, ...results });
    setShowValidationModal(true);
  };

  // ========== Phase 2: 配置比较工具 ==========
  const handleCompareModels = () => {
    if (selectedModels.length !== 2) {
      alert('请选择两个物模型进行比较');
      return;
    }
    const models = selectedModels.map(id => deviceModels.find(m => m.id === id));
    setCompareModels(models);
    setShowCompareModal(true);
  };

  const getModelDiff = (model1, model2) => {
    const diff = [];
    const keys = ['modelName', 'description', 'manufacturer', 'modelSpec', 'deviceCategory', 'deviceType', 'protocol', 'channelType'];
    keys.forEach(key => {
      if (model1[key] !== model2[key]) {
        diff.push({ field: key, value1: model1[key], value2: model2[key] });
      }
    });
    // 点表数量比较
    const pt1 = model1.pointTable?.length || 0;
    const pt2 = model2.pointTable?.length || 0;
    if (pt1 !== pt2) diff.push({ field: '点表数量', value1: pt1, value2: pt2 });
    // 告警数量比较
    const ar1 = model1.alarmRules?.length || 0;
    const ar2 = model2.alarmRules?.length || 0;
    if (ar1 !== ar2) diff.push({ field: '告警规则数量', value1: ar1, value2: ar2 });
    return diff;
  };

  // ========== Phase 3: 批量操作 ==========
  const handleSelectAll = () => {
    if (selectedModels.length === filteredModels.length) {
      setSelectedModels([]);
    } else {
      setSelectedModels(filteredModels.map(m => m.id));
    }
  };

  const handleSelectModel = (modelId) => {
    setSelectedModels(prev => 
      prev.includes(modelId) ? prev.filter(id => id !== modelId) : [...prev, modelId]
    );
  };

  const handleBatchDelete = () => {
    if (selectedModels.length === 0) return;
    if (window.confirm(`确定要删除选中的 ${selectedModels.length} 个物模型吗？`)) {
      const updatedModels = deviceModels.filter(m => !selectedModels.includes(m.id));
      localStorage.setItem('ems_device_models', JSON.stringify(updatedModels));
      setDeviceModels(updatedModels);
      setSelectedModels([]);
    }
  };

  const handleBatchExport = () => {
    if (selectedModels.length === 0) return;
    const models = deviceModels.filter(m => selectedModels.includes(m.id));
    const blob = new Blob([JSON.stringify(models, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ems_models_batch_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ========== Phase 3: 排序 ==========
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // ========== Phase 3: 新手教程 ==========
  const tutorialSteps = [
    { title: '欢迎使用物模型管理', content: '这是物模型库，您可以在这里管理所有设备物模型。' },
    { title: '创建物模型', content: '点击"创建物模型"按钮开始创建新的物模型。' },
    { title: '编辑物模型', content: '点击物模型行的"编辑"按钮可以修改物模型的所有配置。' },
    { title: '版本管理', content: '点击"版本"按钮可以查看物模型的历史版本并恢复。' },
    { title: '导入导出', content: '支持导入/导出单个或批量物模型配置。' },
    { title: '批量操作', content: '勾选多个物模型后可以进行批量删除或导出。' },
  ];

  // ========== Phase 4: 多语言 ==========
  const i18n = {
    zh: {
      title: '物模型库',
      create: '创建物模型',
      search: '搜索物模型...',
      allCategories: '全部分类',
      edit: '编辑',
      delete: '删除',
      export: '导出',
      import: '导入',
      version: '版本',
      validate: '验证',
      compare: '比较',
      batchDelete: '批量删除',
      batchExport: '批量导出',
      tutorial: '使用教程',
      noModels: '暂无物模型，点击"创建物模型"开始创建',
    },
    en: {
      title: 'Device Model Library',
      create: 'Create Model',
      search: 'Search models...',
      allCategories: 'All Categories',
      edit: 'Edit',
      delete: 'Delete',
      export: 'Export',
      import: 'Import',
      version: 'Version',
      validate: 'Validate',
      compare: 'Compare',
      batchDelete: 'Batch Delete',
      batchExport: 'Batch Export',
      tutorial: 'Tutorial',
      noModels: 'No models yet. Click "Create Model" to start.',
    }
  };
  const t = i18n[language];

  // ========== Phase 4: 主题 ==========
  const themes = {
    light: { bg: '#f5f5f5', card: '#fff', text: '#333', primary: '#1890ff', border: '#e8e8e8' },
    dark: { bg: '#1a1a2e', card: '#16213e', text: '#eee', primary: '#0f4c75', border: '#0f4c75' },
    blue: { bg: '#e3f2fd', card: '#fff', text: '#1565c0', primary: '#1976d2', border: '#90caf9' },
  };
  const currentTheme = themes[theme];

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
  }).sort((a, b) => {
    // Phase 3: 排序功能
    let aVal = a[sortBy] || '';
    let bVal = b[sortBy] || '';
    if (sortBy === 'updatedAt' || sortBy === 'createdAt') {
      aVal = new Date(aVal).getTime() || 0;
      bVal = new Date(bVal).getTime() || 0;
    }
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  return (
    <div style={{ background: currentTheme.bg, minHeight: '100vh', padding: '20px', color: currentTheme.text }}>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden-input"
        accept=".json"
        onChange={handleFileChange}
      />

      {/* Phase 4: 语言和主题切换 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '12px' }}>
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: '4px', border: `1px solid ${currentTheme.border}`, background: currentTheme.card, color: currentTheme.text }}
        >
          <option value="zh">🇨🇳 中文</option>
          <option value="en">🇺🇸 English</option>
        </select>
        <select 
          value={theme} 
          onChange={(e) => setTheme(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: '4px', border: `1px solid ${currentTheme.border}`, background: currentTheme.card, color: currentTheme.text }}
        >
          <option value="light">☀️ 浅色</option>
          <option value="dark">🌙 深色</option>
          <option value="blue">💙 蓝色</option>
        </select>
        <button 
          onClick={() => setShowTutorial(true)}
          style={{ padding: '4px 12px', borderRadius: '4px', background: currentTheme.primary, color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          ❓ {t.tutorial}
        </button>
      </div>

      {/* 头部操作栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-input" style={{ width: '250px' }}>
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              className="form-input"
              placeholder={t.search}
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
            <option value="all">{t.allCategories}</option>
            {deviceCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
          {/* Phase 3: 排序 */}
          <select
            className="form-select"
            style={{ width: '130px' }}
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
          >
            <option value="updatedAt-desc">最近更新</option>
            <option value="updatedAt-asc">最早更新</option>
            <option value="modelName-asc">名称 A-Z</option>
            <option value="modelName-desc">名称 Z-A</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Phase 3: 批量操作 */}
          {selectedModels.length > 0 && (
            <>
              <button className="btn btn-danger" onClick={handleBatchDelete}>
                🗑️ {t.batchDelete} ({selectedModels.length})
              </button>
              <button className="btn btn-secondary" onClick={handleBatchExport}>
                📥 {t.batchExport} ({selectedModels.length})
              </button>
            </>
          )}
          {/* Phase 2: 比较 */}
          {selectedModels.length === 2 && (
            <button className="btn btn-info" onClick={handleCompareModels}>
              🔍 {t.compare}
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleImportModel}>
            📤 {t.import}
          </button>
          {deviceModels.length > 0 && (
            <button className="btn btn-secondary" onClick={handleExportAll}>
              📥 {t.export}
            </button>
          )}
          <button 
            className="btn btn-primary"
            onClick={() => onNavigate('device-model-wizard', '创建物模型')}
          >
            ➕ {t.create}
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
        <div className="table-container" style={{ background: currentTheme.card, borderRadius: '8px' }}>
          <table>
            <thead>
              <tr>
                {/* Phase 3: 批量选择 */}
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedModels.length === filteredModels.length && filteredModels.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>物模型名称</th>
                <th>设备分类</th>
                <th>设备类型</th>
                <th>厂商</th>
                <th>协议</th>
                <th>版本</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredModels.map(model => {
                const category = deviceCategories.find(c => c.id === model.deviceCategory);
                const device = category?.devices.find(d => d.id === model.deviceType);
                return (
                  <tr key={model.id} style={{ background: selectedModels.includes(model.id) ? `${currentTheme.primary}20` : 'transparent' }}>
                    {/* Phase 3: 复选框 */}
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedModels.includes(model.id)}
                        onChange={() => handleSelectModel(model.id)}
                      />
                    </td>
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
                    <td>
                      <span className="tag tag-green">v{model.version || 1}</span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                      {model.updatedAt ? new Date(model.updatedAt).toLocaleDateString() : (model.createdAt ? new Date(model.createdAt).toLocaleDateString() : '-')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <button 
                          className="btn btn-sm btn-warning"
                          style={{ backgroundColor: '#f59e0b', color: 'white' }}
                          onClick={() => handleEditModel(model)}
                          title={t.edit}
                        >
                          ✏️
                        </button>
                        {/* Phase 2: 版本历史 */}
                        <button 
                          className="btn btn-sm btn-info"
                          style={{ backgroundColor: '#06b6d4', color: 'white' }}
                          onClick={() => handleViewVersionHistory(model)}
                          title={t.version}
                        >
                          📋
                        </button>
                        {/* Phase 2: 验证 */}
                        <button 
                          className="btn btn-sm btn-success"
                          style={{ backgroundColor: '#10b981', color: 'white' }}
                          onClick={() => handleValidateModel(model)}
                          title={t.validate}
                        >
                          ✅
                        </button>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleExportModel(model)}
                          title={t.export}
                        >
                          📥
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteModel(model.id)}
                          title={t.delete}
                        >
                          🗑️
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

      {/* Phase 3: 新手教程模态框 */}
      {showTutorial && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: currentTheme.card, borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ marginBottom: '16px' }}>📚 {tutorialSteps[tutorialStep].title}</h3>
            <p style={{ marginBottom: '24px', lineHeight: '1.6' }}>{tutorialSteps[tutorialStep].content}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#888' }}>{tutorialStep + 1} / {tutorialSteps.length}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {tutorialStep > 0 && (
                  <button className="btn btn-secondary" onClick={() => setTutorialStep(prev => prev - 1)}>上一步</button>
                )}
                {tutorialStep < tutorialSteps.length - 1 ? (
                  <button className="btn btn-primary" onClick={() => setTutorialStep(prev => prev + 1)}>下一步</button>
                ) : (
                  <button className="btn btn-primary" onClick={() => { setShowTutorial(false); setTutorialStep(0); }}>完成</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase 2: 版本历史模态框 */}
      {showVersionModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: currentTheme.card, borderRadius: '12px', padding: '24px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <h3 style={{ marginBottom: '16px' }}>📋 版本历史 - {editingModel?.modelName}</h3>
            {versionHistory.length === 0 ? (
              <p style={{ color: '#888' }}>暂无历史版本</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {versionHistory.map((v, i) => (
                  <div key={i} style={{ padding: '12px', border: `1px solid ${currentTheme.border}`, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>版本 {v.version}</strong>
                      <p style={{ fontSize: '12px', color: '#888', margin: '4px 0 0' }}>
                        保存于 {new Date(v.savedAt).toLocaleString()}
                      </p>
                    </div>
                    <button className="btn btn-sm btn-primary" onClick={() => handleRestoreVersion(v)}>恢复此版本</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setShowVersionModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 2: 验证结果模态框 */}
      {showValidationModal && validationResults && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: currentTheme.card, borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ marginBottom: '16px' }}>
              {validationResults.isValid ? '✅ 验证通过' : '❌ 验证失败'} - {validationResults.model?.modelName}
            </h3>
            {validationResults.errors.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ color: '#ef4444', marginBottom: '8px' }}>错误：</h4>
                <ul style={{ paddingLeft: '20px' }}>
                  {validationResults.errors.map((e, i) => <li key={i} style={{ color: '#ef4444' }}>{e}</li>)}
                </ul>
              </div>
            )}
            {validationResults.warnings.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ color: '#f59e0b', marginBottom: '8px' }}>警告：</h4>
                <ul style={{ paddingLeft: '20px' }}>
                  {validationResults.warnings.map((w, i) => <li key={i} style={{ color: '#f59e0b' }}>{w}</li>)}
                </ul>
              </div>
            )}
            {validationResults.isValid && validationResults.warnings.length === 0 && (
              <p style={{ color: '#10b981' }}>物模型配置完整，无错误和警告。</p>
            )}
            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setShowValidationModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 2: 比较模态框 */}
      {showCompareModal && compareModels[0] && compareModels[1] && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: currentTheme.card, borderRadius: '12px', padding: '24px', maxWidth: '800px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <h3 style={{ marginBottom: '16px' }}>🔍 物模型比较</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: currentTheme.bg, borderRadius: '8px', textAlign: 'center' }}>
                <strong>{compareModels[0].modelName}</strong>
              </div>
              <div style={{ padding: '12px', background: currentTheme.bg, borderRadius: '8px', textAlign: 'center' }}>
                <strong>{compareModels[1].modelName}</strong>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px', borderBottom: `1px solid ${currentTheme.border}` }}>字段</th>
                  <th style={{ padding: '8px', borderBottom: `1px solid ${currentTheme.border}` }}>{compareModels[0].modelName}</th>
                  <th style={{ padding: '8px', borderBottom: `1px solid ${currentTheme.border}` }}>{compareModels[1].modelName}</th>
                </tr>
              </thead>
              <tbody>
                {getModelDiff(compareModels[0], compareModels[1]).map((d, i) => (
                  <tr key={i} style={{ background: '#fef3c7' }}>
                    <td style={{ padding: '8px', borderBottom: `1px solid ${currentTheme.border}` }}>{d.field}</td>
                    <td style={{ padding: '8px', borderBottom: `1px solid ${currentTheme.border}` }}>{String(d.value1 || '-')}</td>
                    <td style={{ padding: '8px', borderBottom: `1px solid ${currentTheme.border}` }}>{String(d.value2 || '-')}</td>
                  </tr>
                ))}
                {getModelDiff(compareModels[0], compareModels[1]).length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: '16px', textAlign: 'center', color: '#888' }}>两个物模型配置相同</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => { setShowCompareModal(false); setSelectedModels([]); }}>关闭</button>
            </div>
          </div>
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
