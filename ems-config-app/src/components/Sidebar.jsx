import React from 'react';

function Sidebar({ currentPage, onNavigate }) {
  const navItems = [
    {
      section: '快速入门',
      items: [
        { id: 'dashboard', name: '系统概览', icon: '📊' },
        { id: 'device-model-wizard', name: '创建物模型', icon: '🔧' },
        { id: 'project-config-wizard', name: '现场配置', icon: '⚡' }
      ]
    },
    {
      section: '配置管理',
      items: [
        { id: 'project-list', name: '项目管理', icon: '📁' },
        { id: 'device-model-list', name: '物模型库', icon: '📦' },
        { id: 'template-manager', name: '模板管理', icon: '📋' }
      ]
    }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#2563eb"/>
            <path d="M8 16h16M12 10l-4 6 4 6M20 10l4 6-4 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>EMS配置中心</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section} className="nav-section">
            <div className="nav-section-title">{section.section}</div>
            {section.items.map((item) => (
              <div
                key={item.id}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id, item.name)}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        ))}
      </nav>
      <div style={{ padding: '16px', borderTop: '1px solid var(--gray-200)' }}>
        <div style={{ fontSize: '12px', color: 'var(--gray-400)', textAlign: 'center' }}>
          EMS智能配置系统 v1.0
          <br />
          风光柴储充一体化
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
