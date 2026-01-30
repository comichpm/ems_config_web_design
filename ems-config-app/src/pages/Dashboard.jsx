import React, { useState, useEffect } from 'react';

function Dashboard({ onNavigate }) {
  const [projects, setProjects] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);

  useEffect(() => {
    // 从localStorage加载数据
    try {
      const savedProjects = JSON.parse(localStorage.getItem('ems_projects') || '[]');
      const savedModels = JSON.parse(localStorage.getItem('ems_device_models') || '[]');
      setProjects(Array.isArray(savedProjects) ? savedProjects : []);
      setDeviceModels(Array.isArray(savedModels) ? savedModels : []);
    } catch (e) {
      console.error('Failed to load data from localStorage:', e);
      setProjects([]);
      setDeviceModels([]);
    }
  }, []);

  return (
    <div>
      {/* 欢迎横幅 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '32px',
        color: 'white',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>欢迎使用 EMS智能配置系统</h2>
        <p style={{ opacity: 0.9, marginBottom: '20px' }}>
          引导式配置，让复杂的EMS现场工程配置变得简单易用
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-lg"
            style={{ background: 'white', color: '#667eea' }}
            onClick={() => onNavigate('device-model-wizard', '创建物模型')}
          >
            🔧 创建物模型
          </button>
          <button 
            className="btn btn-lg"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
            onClick={() => onNavigate('project-config-wizard', '现场配置')}
          >
            ⚡ 开始现场配置
          </button>
        </div>
      </div>

      {/* 快速入口 */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--gray-700)' }}>
          快速入口
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { icon: '🔧', title: '创建物模型', desc: '定义设备属性和协议', page: 'device-model-wizard' },
            { icon: '⚡', title: '现场配置', desc: '引导式项目配置', page: 'project-config-wizard' },
            { icon: '📁', title: '项目管理', desc: '查看和管理项目', page: 'project-list' },
            { icon: '📦', title: '物模型库', desc: '管理设备模型库', page: 'device-model-list' }
          ].map((item) => (
            <div
              key={item.title}
              className="card"
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => onNavigate(item.page, item.title)}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div className="card-body" style={{ textAlign: 'center', padding: '24px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{item.icon}</div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>{item.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 统计信息 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              📁
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--primary-color)' }}>
                {projects.length}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--gray-500)' }}>已配置项目</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#d1fae5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              📦
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#10b981' }}>
                {deviceModels.length}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--gray-500)' }}>物模型数量</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              🔌
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#f59e0b' }}>
                {projects.reduce((sum, p) => sum + (p.devices?.length || 0), 0)}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--gray-500)' }}>已配置设备</div>
            </div>
          </div>
        </div>
      </div>

      {/* 支持的设备类型 */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">支持的设备类型 - 风光柴储充应用场景</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { icon: '🌬️', name: '风力发电', items: ['风机', '风机控制器', '变流器'] },
              { icon: '☀️', name: '光伏发电', items: ['光伏组串', '逆变器', '汇流箱'] },
              { icon: '⛽', name: '柴油发电', items: ['柴油机组', 'ATS开关'] },
              { icon: '🔋', name: '储能系统', items: ['电池簇', 'BMS', 'PCS'] },
              { icon: '🔌', name: '充电桩', items: ['交流桩', '直流桩', '充电模块'] },
              { icon: '🌡️', name: '动环监控', items: ['温湿度传感器', '空调', 'UPS'] },
              { icon: '🧯', name: '消防系统', items: ['消防主机', '气体灭火', '探测器'] },
              { icon: '⚙️', name: '其他设备', items: ['电表', '配电柜', '变压器'] }
            ].map((category) => (
              <div key={category.name} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{category.icon}</div>
                <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '14px' }}>{category.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                  {category.items.join('、')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 配置引导步骤 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">配置引导流程</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {[
              { step: 1, title: '创建物模型', desc: '定义设备类型、属性、协议' },
              { step: 2, title: '选择物模型', desc: '从物模型库选择设备' },
              { step: 3, title: '参数微调', desc: '调整现场差异化参数' },
              { step: 4, title: '拓扑配置', desc: '拖拽连线配置电气关系' },
              { step: 5, title: '校验生效', desc: '验证并导出配置文件' }
            ].map((item, index) => (
              <React.Fragment key={item.step}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--primary-color)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: '0 auto 12px'
                  }}>
                    {item.step}
                  </div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{item.desc}</div>
                </div>
                {index < 4 && (
                  <div style={{
                    width: '60px',
                    height: '2px',
                    background: 'var(--gray-200)'
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
