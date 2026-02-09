import React, { useState, useEffect, useRef } from 'react';

function SystemMaintenance() {
  const [activeTab, setActiveTab] = useState('health');
  const [systemHealth, setSystemHealth] = useState({
    cpu: 0,
    memory: 0,
    storage: 0,
    network: 0
  });
  const [logs, setLogs] = useState([]);
  const [logFilter, setLogFilter] = useState('all');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const fileInputRef = useRef(null);

  // 模拟系统健康数据
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAutoRefresh) {
        setSystemHealth({
          cpu: Math.floor(Math.random() * 40) + 20,
          memory: Math.floor(Math.random() * 30) + 40,
          storage: Math.floor(Math.random() * 10) + 50,
          network: Math.floor(Math.random() * 50) + 10
        });
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  // 模拟日志
  useEffect(() => {
    const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
    const modules = ['通信模块', '算法模块', '数据采集', '北向接口', '系统核心'];
    const messages = [
      '设备连接成功',
      '数据采集完成',
      '配置已更新',
      '通信超时，正在重试',
      '存储空间充足',
      '算法计算完成',
      '发送数据到上级平台',
      '心跳包发送成功'
    ];

    const generateLog = () => ({
      id: Date.now() + Math.random(),
      time: new Date().toLocaleString(),
      level: levels[Math.floor(Math.random() * 4)],
      module: modules[Math.floor(Math.random() * 5)],
      message: messages[Math.floor(Math.random() * 8)]
    });

    // 初始加载一些日志
    setLogs(Array.from({ length: 20 }, generateLog));

    const interval = setInterval(() => {
      if (isAutoRefresh) {
        setLogs(prev => [...prev.slice(-49), generateLog()]);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const handleBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      projects: JSON.parse(localStorage.getItem('ems_projects') || '[]'),
      deviceModels: JSON.parse(localStorage.getItem('ems_device_models') || '[]'),
      templates: JSON.parse(localStorage.getItem('ems_templates') || '[]'),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ems_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('备份成功！');
  };

  const handleRestore = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const backup = JSON.parse(event.target.result);
          if (backup.projects) {
            localStorage.setItem('ems_projects', JSON.stringify(backup.projects));
          }
          if (backup.deviceModels) {
            localStorage.setItem('ems_device_models', JSON.stringify(backup.deviceModels));
          }
          if (backup.templates) {
            localStorage.setItem('ems_templates', JSON.stringify(backup.templates));
          }
          alert('配置恢复成功！请刷新页面以应用更改。');
        } catch (err) {
          alert('备份文件格式错误');
        }
      };
      reader.readAsText(file);
    }
  };

  const getFilteredLogs = () => {
    if (logFilter === 'all') return logs;
    return logs.filter(log => log.level === logFilter);
  };

  const getHealthColor = (value) => {
    if (value < 50) return '#10b981';
    if (value < 80) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div>
      <div className="notice-banner info" style={{ marginBottom: '20px' }}>
        <span>🛠️</span>
        <span>系统维护功能包括远程升级、配置备份恢复、健康诊断和日志查看</span>
      </div>

      {/* 标签页 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--gray-200)', paddingBottom: '8px' }}>
        {[
          { id: 'health', name: '系统健康', icon: '💓' },
          { id: 'backup', name: '备份恢复', icon: '💾' },
          { id: 'upgrade', name: '远程升级', icon: '⬆️' },
          { id: 'logs', name: '系统日志', icon: '📜' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.name}
          </button>
        ))}
      </div>

      {/* 系统健康 */}
      {activeTab === 'health' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isAutoRefresh}
                onChange={(e) => setIsAutoRefresh(e.target.checked)}
              />
              自动刷新
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
            {[
              { name: 'CPU使用率', value: systemHealth.cpu, icon: '💻' },
              { name: '内存使用率', value: systemHealth.memory, icon: '🧠' },
              { name: '存储使用率', value: systemHealth.storage, icon: '💾' },
              { name: '网络负载', value: systemHealth.network, icon: '🌐' }
            ].map(item => (
              <div key={item.name} className="card">
                <div className="card-body" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{item.icon}</div>
                  <div style={{ fontSize: '36px', fontWeight: '600', color: getHealthColor(item.value) }}>
                    {item.value}%
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--gray-500)', marginTop: '8px' }}>{item.name}</div>
                  <div style={{ 
                    width: '100%', 
                    height: '8px', 
                    background: 'var(--gray-200)', 
                    borderRadius: '4px', 
                    marginTop: '12px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${item.value}%`,
                      height: '100%',
                      background: getHealthColor(item.value),
                      transition: 'all 0.3s'
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 系统信息 */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">系统信息</h4>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--gray-500)' }}>系统版本</span>
                  <span style={{ fontWeight: '500' }}>EMS v1.0.0</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--gray-500)' }}>运行时间</span>
                  <span style={{ fontWeight: '500' }}>15天 8小时 32分钟</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--gray-500)' }}>设备连接数</span>
                  <span style={{ fontWeight: '500' }}>12 / 50</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--gray-500)' }}>数据采集频率</span>
                  <span style={{ fontWeight: '500' }}>1000ms</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--gray-500)' }}>北向连接状态</span>
                  <span className="tag tag-green">已连接</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--gray-500)' }}>最后同步时间</span>
                  <span style={{ fontWeight: '500' }}>{new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 备份恢复 */}
      {activeTab === 'backup' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">💾 配置备份</h4>
              </div>
              <div className="card-body">
                <p style={{ color: 'var(--gray-600)', marginBottom: '20px' }}>
                  备份当前系统的所有配置数据，包括项目配置、物模型和模板等。
                </p>
                <div style={{ 
                  padding: '20px', 
                  background: 'var(--gray-50)', 
                  borderRadius: '8px', 
                  marginBottom: '20px' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>项目数量</span>
                    <span style={{ fontWeight: '500' }}>
                      {JSON.parse(localStorage.getItem('ems_projects') || '[]').length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>物模型数量</span>
                    <span style={{ fontWeight: '500' }}>
                      {JSON.parse(localStorage.getItem('ems_device_models') || '[]').length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>模板数量</span>
                    <span style={{ fontWeight: '500' }}>
                      {JSON.parse(localStorage.getItem('ems_templates') || '[]').length}
                    </span>
                  </div>
                </div>
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleBackup}>
                  📥 立即备份
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h4 className="card-title">📤 配置恢复</h4>
              </div>
              <div className="card-body">
                <p style={{ color: 'var(--gray-600)', marginBottom: '20px' }}>
                  从备份文件恢复系统配置。注意：这将覆盖当前的所有配置数据。
                </p>
                <div className="notice-banner warning" style={{ marginBottom: '20px' }}>
                  <span>⚠️</span>
                  <span>恢复配置会覆盖现有数据，建议先进行备份</span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleRestore}
                />
                <button
                  className="btn btn-secondary btn-lg"
                  style={{ width: '100%' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  📤 选择备份文件恢复
                </button>
              </div>
            </div>
          </div>

          {/* 备份历史 */}
          <div className="card" style={{ marginTop: '24px' }}>
            <div className="card-header">
              <h4 className="card-title">备份历史记录</h4>
            </div>
            <div className="card-body">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'var(--gray-100)' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>备份时间</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>类型</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>大小</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '12px' }}>{new Date().toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>手动备份</td>
                    <td style={{ padding: '12px' }}>15.2 KB</td>
                    <td style={{ padding: '12px' }}><span className="tag tag-green">成功</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 远程升级 */}
      {activeTab === 'upgrade' && (
        <div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">当前版本</h4>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '16px', 
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '32px'
                }}>
                  ⚡
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '600' }}>EMS智能配置系统</div>
                  <div style={{ color: 'var(--gray-500)', marginTop: '4px' }}>版本: v1.0.0 | 构建: 2024.01.15</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <button className="btn btn-secondary" onClick={() => alert('正在检查更新...')}>
                    🔍 检查更新
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: '20px' }}>
            <div className="card-header">
              <h4 className="card-title">固件升级</h4>
            </div>
            <div className="card-body">
              <div className="notice-banner info" style={{ marginBottom: '20px' }}>
                <span>ℹ️</span>
                <span>升级前请确保已备份配置，升级过程中请勿断电或关闭页面</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                <div style={{ padding: '20px', border: '2px dashed var(--gray-300)', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
                  <div style={{ fontWeight: '500', marginBottom: '8px' }}>本地升级</div>
                  <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '16px' }}>
                    上传固件包进行本地升级
                  </div>
                  <button className="btn btn-secondary">选择固件包</button>
                </div>
                
                <div style={{ padding: '20px', border: '2px dashed var(--gray-300)', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>☁️</div>
                  <div style={{ fontWeight: '500', marginBottom: '8px' }}>在线升级</div>
                  <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '16px' }}>
                    从服务器下载最新固件升级
                  </div>
                  <button className="btn btn-primary">检查新版本</button>
                </div>
              </div>
            </div>
          </div>

          {/* 更新日志 */}
          <div className="card" style={{ marginTop: '20px' }}>
            <div className="card-header">
              <h4 className="card-title">更新日志</h4>
            </div>
            <div className="card-body">
              <div style={{ padding: '16px', background: 'var(--gray-50)', borderRadius: '8px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600' }}>v1.0.0</span>
                  <span style={{ color: 'var(--gray-500)', fontSize: '13px' }}>2024-01-15</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--gray-600)', fontSize: '14px' }}>
                  <li>首个正式版本发布</li>
                  <li>支持风光柴储充设备配置</li>
                  <li>完整的向导式配置流程</li>
                  <li>电气拓扑可视化编辑</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 系统日志 */}
      {activeTab === 'logs' && (
        <div>
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-body" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <select
                className="form-select"
                style={{ width: '120px' }}
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
              >
                <option value="all">全部级别</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
                <option value="DEBUG">DEBUG</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isAutoRefresh}
                  onChange={(e) => setIsAutoRefresh(e.target.checked)}
                />
                实时刷新
              </label>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={() => setLogs([])}>
                  🗑️ 清空日志
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    const content = logs.map(l =>
                      `[${l.time}] [${l.level}] [${l.module}] ${l.message}`
                    ).join('\n');
                    const blob = new Blob([content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ems_log_${new Date().toISOString().slice(0, 10)}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  📥 导出日志
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              <div style={{ maxHeight: '500px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--gray-100)' }}>
                    <tr>
                      <th style={{ padding: '10px', textAlign: 'left', width: '160px' }}>时间</th>
                      <th style={{ padding: '10px', textAlign: 'center', width: '80px' }}>级别</th>
                      <th style={{ padding: '10px', textAlign: 'left', width: '100px' }}>模块</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>消息</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredLogs().map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                        <td style={{ padding: '8px 10px', color: 'var(--gray-500)' }}>{log.time}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <span className={`tag ${
                            log.level === 'ERROR' ? 'tag-red' :
                            log.level === 'WARN' ? 'tag-yellow' :
                            log.level === 'INFO' ? 'tag-green' : 'tag-gray'
                          }`}>
                            {log.level}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>{log.module}</td>
                        <td style={{ padding: '8px 10px' }}>{log.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SystemMaintenance;
