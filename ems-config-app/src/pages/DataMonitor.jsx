import React, { useState, useEffect } from 'react';

function DataMonitor() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitorData, setMonitorData] = useState({});
  const [refreshInterval, setRefreshInterval] = useState(1000);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ems_projects') || '[]');
      setProjects(Array.isArray(saved) ? saved : []);
    } catch (e) {
      console.error('Failed to load projects:', e);
      setProjects([]);
    }
  }, []);

  // 模拟实时数据
  useEffect(() => {
    let interval;
    if (isMonitoring && selectedDevice) {
      interval = setInterval(() => {
        // 生成模拟数据
        const mockData = {
          timestamp: new Date().toISOString(),
          status: Math.random() > 0.9 ? '故障' : '运行',
          voltage: (380 + Math.random() * 20 - 10).toFixed(1),
          current: (100 + Math.random() * 10 - 5).toFixed(1),
          power: (38 + Math.random() * 5 - 2.5).toFixed(2),
          temperature: (35 + Math.random() * 10).toFixed(1),
          soc: selectedDevice.deviceType?.includes('bms') ? (50 + Math.random() * 40).toFixed(1) : null,
          frequency: (50 + Math.random() * 0.1 - 0.05).toFixed(2),
          commStatus: Math.random() > 0.05 ? '正常' : '中断',
          lastUpdate: new Date().toLocaleTimeString()
        };
        setMonitorData(prev => ({
          ...prev,
          [selectedDevice.instanceId]: mockData
        }));
      }, refreshInterval);
    }
    return () => clearInterval(interval);
  }, [isMonitoring, selectedDevice, refreshInterval]);

  const getDevices = () => {
    if (!selectedProject) return [];
    return selectedProject.devices || [];
  };

  return (
    <div>
      <div className="notice-banner info" style={{ marginBottom: '20px' }}>
        <span>📈</span>
        <span>数据监控用于实时查看设备数据，确认通讯配置是否正常</span>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* 左侧：项目和设备选择 */}
        <div style={{ width: '280px' }}>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">选择项目</h4>
            </div>
            <div className="card-body" style={{ padding: '8px' }}>
              {projects.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-400)' }}>
                  暂无项目
                </div>
              ) : (
                projects.map(project => (
                  <div
                    key={project.id}
                    className={`nav-item ${selectedProject?.id === project.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedProject(project);
                      setSelectedDevice(null);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <span>📁</span>
                    <span>{project.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedProject && (
            <div className="card" style={{ marginTop: '16px' }}>
              <div className="card-header">
                <h4 className="card-title">设备列表</h4>
              </div>
              <div className="card-body" style={{ padding: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {getDevices().length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-400)' }}>
                    该项目暂无设备
                  </div>
                ) : (
                  getDevices().map(device => (
                    <div
                      key={device.instanceId}
                      className={`nav-item ${selectedDevice?.instanceId === device.instanceId ? 'active' : ''}`}
                      onClick={() => setSelectedDevice(device)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: monitorData[device.instanceId]?.commStatus === '正常' ? '#10b981' : 
                                    monitorData[device.instanceId]?.commStatus === '中断' ? '#ef4444' : '#9ca3af'
                      }} />
                      <span style={{ flex: 1 }}>{device.instanceName}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 右侧：数据监控区域 */}
        <div style={{ flex: 1 }}>
          {!selectedDevice ? (
            <div className="empty-state" style={{ height: '400px' }}>
              <div className="empty-state-icon">📈</div>
              <div className="empty-state-title">选择设备开始监控</div>
              <div className="empty-state-desc">从左侧选择项目和设备，查看实时数据</div>
            </div>
          ) : (
            <div>
              {/* 控制栏 */}
              <div className="card" style={{ marginBottom: '16px' }}>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div>
                    <strong>{selectedDevice.instanceName}</strong>
                    <span style={{ marginLeft: '12px', color: 'var(--gray-500)', fontSize: '13px' }}>
                      {selectedDevice.modelName}
                    </span>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>刷新间隔:</span>
                    <select
                      className="form-select"
                      style={{ width: '100px' }}
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    >
                      <option value={500}>0.5秒</option>
                      <option value={1000}>1秒</option>
                      <option value={2000}>2秒</option>
                      <option value={5000}>5秒</option>
                    </select>
                    <button
                      className={`btn ${isMonitoring ? 'btn-danger' : 'btn-primary'}`}
                      onClick={() => setIsMonitoring(!isMonitoring)}
                    >
                      {isMonitoring ? '⏹ 停止监控' : '▶ 开始监控'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 通讯状态 */}
              <div className="card" style={{ marginBottom: '16px' }}>
                <div className="card-header">
                  <h4 className="card-title">通讯状态</h4>
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '32px', 
                        fontWeight: '600', 
                        color: monitorData[selectedDevice.instanceId]?.commStatus === '正常' ? '#10b981' : '#ef4444' 
                      }}>
                        {monitorData[selectedDevice.instanceId]?.commStatus || '--'}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>通讯状态</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '32px', 
                        fontWeight: '600', 
                        color: monitorData[selectedDevice.instanceId]?.status === '运行' ? '#10b981' : '#ef4444' 
                      }}>
                        {monitorData[selectedDevice.instanceId]?.status || '--'}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>设备状态</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', fontWeight: '600', color: 'var(--primary-color)' }}>
                        {monitorData[selectedDevice.instanceId]?.lastUpdate || '--'}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>最后更新</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', fontWeight: '600', color: 'var(--gray-700)' }}>
                        {refreshInterval}ms
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>采集周期</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 实时数据 */}
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">实时数据</h4>
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div className="param-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white' }}>
                      <div style={{ fontSize: '14px', opacity: 0.9 }}>电压</div>
                      <div style={{ fontSize: '28px', fontWeight: '600' }}>
                        {monitorData[selectedDevice.instanceId]?.voltage || '--'} V
                      </div>
                    </div>
                    <div className="param-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
                      <div style={{ fontSize: '14px', opacity: 0.9 }}>电流</div>
                      <div style={{ fontSize: '28px', fontWeight: '600' }}>
                        {monitorData[selectedDevice.instanceId]?.current || '--'} A
                      </div>
                    </div>
                    <div className="param-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
                      <div style={{ fontSize: '14px', opacity: 0.9 }}>功率</div>
                      <div style={{ fontSize: '28px', fontWeight: '600' }}>
                        {monitorData[selectedDevice.instanceId]?.power || '--'} kW
                      </div>
                    </div>
                    <div className="param-card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white' }}>
                      <div style={{ fontSize: '14px', opacity: 0.9 }}>温度</div>
                      <div style={{ fontSize: '28px', fontWeight: '600' }}>
                        {monitorData[selectedDevice.instanceId]?.temperature || '--'} °C
                      </div>
                    </div>
                    <div className="param-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white' }}>
                      <div style={{ fontSize: '14px', opacity: 0.9 }}>频率</div>
                      <div style={{ fontSize: '28px', fontWeight: '600' }}>
                        {monitorData[selectedDevice.instanceId]?.frequency || '--'} Hz
                      </div>
                    </div>
                    {monitorData[selectedDevice.instanceId]?.soc && (
                      <div className="param-card" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', color: 'white' }}>
                        <div style={{ fontSize: '14px', opacity: 0.9 }}>SOC</div>
                        <div style={{ fontSize: '28px', fontWeight: '600' }}>
                          {monitorData[selectedDevice.instanceId]?.soc || '--'} %
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataMonitor;
