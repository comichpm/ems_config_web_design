import React, { useRef, useState } from 'react';

function Header({ title, onNavigate }) {
  const fileInputRef = useRef(null);
  const [showImportSuccess, setShowImportSuccess] = useState(false);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const config = JSON.parse(event.target.result);
          // 保存导入的配置到localStorage
          const existingConfigs = JSON.parse(localStorage.getItem('ems_imported_configs') || '[]');
          existingConfigs.push({
            ...config,
            importedAt: new Date().toISOString(),
            id: Date.now()
          });
          localStorage.setItem('ems_imported_configs', JSON.stringify(existingConfigs));
          setShowImportSuccess(true);
          setTimeout(() => setShowImportSuccess(false), 3000);
        } catch (err) {
          alert('配置文件格式错误，请检查JSON格式是否正确');
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  return (
    <header className="main-header">
      <h1 className="page-title">{title}</h1>
      <div className="header-actions">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden-input"
          accept=".json"
          onChange={handleFileChange}
        />
        <button className="btn btn-secondary" onClick={handleImportClick}>
          📥 导入配置
        </button>
        <button 
          className="btn btn-primary"
          onClick={() => onNavigate('project-config-wizard', '现场配置')}
        >
          ➕ 新建项目
        </button>
        {showImportSuccess && (
          <div style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            background: '#10b981',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            animation: 'fadeIn 0.3s'
          }}>
            ✅ 配置导入成功！
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
