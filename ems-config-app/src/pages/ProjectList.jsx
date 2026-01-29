import React, { useState, useEffect, useRef } from 'react';

function ProjectList({ onNavigate }) {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const savedProjects = JSON.parse(localStorage.getItem('ems_projects') || '[]');
    setProjects(savedProjects);
  };

  const handleDeleteProject = (projectId) => {
    if (confirm('确定要删除该项目吗？此操作不可恢复。')) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      localStorage.setItem('ems_projects', JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
    }
  };

  const handleExportProject = (project) => {
    const config = {
      ...project,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ems_project_${project.name || 'export'}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportProject = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const project = JSON.parse(event.target.result);
          const newProject = {
            ...project,
            id: `project_${Date.now()}`,
            importedAt: new Date().toISOString()
          };
          const updatedProjects = [...projects, newProject];
          localStorage.setItem('ems_projects', JSON.stringify(updatedProjects));
          setProjects(updatedProjects);
          alert('项目导入成功！');
        } catch (err) {
          alert('项目文件格式错误');
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const filteredProjects = projects.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="search-input" style={{ width: '300px' }}>
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            className="form-input"
            placeholder="搜索项目名称或位置..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleImportProject}>
            📤 导入项目
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => onNavigate('project-config-wizard', '现场配置')}
          >
            ➕ 新建项目
          </button>
        </div>
      </div>

      {/* 项目列表 */}
      {filteredProjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <div className="empty-state-title">暂无项目</div>
          <div className="empty-state-desc">
            {searchTerm ? '没有找到匹配的项目' : '点击"新建项目"开始配置您的第一个EMS项目'}
          </div>
          {!searchTerm && (
            <button 
              className="btn btn-primary"
              onClick={() => onNavigate('project-config-wizard', '现场配置')}
            >
              ➕ 新建项目
            </button>
          )}
        </div>
      ) : (
        <div className="project-cards">
          {filteredProjects.map(project => (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <div className="project-card-title">{project.name || '未命名项目'}</div>
                <div className="project-card-location">📍 {project.location || '未设置位置'}</div>
              </div>
              <div className="project-card-body">
                <div className="project-card-stats">
                  <div className="project-stat">
                    <div className="project-stat-value">{project.devices?.length || 0}</div>
                    <div className="project-stat-label">设备数量</div>
                  </div>
                  <div className="project-stat">
                    <div className="project-stat-value">{project.topology?.nodes?.length || 0}</div>
                    <div className="project-stat-label">拓扑节点</div>
                  </div>
                  <div className="project-stat">
                    <div className="project-stat-value">{project.topology?.edges?.length || 0}</div>
                    <div className="project-stat-label">连接关系</div>
                  </div>
                </div>
                {project.manager && (
                  <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--gray-500)' }}>
                    👤 负责人: {project.manager}
                  </div>
                )}
              </div>
              <div className="project-card-footer">
                <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleExportProject(project)}
                  >
                    📥 导出
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectList;
