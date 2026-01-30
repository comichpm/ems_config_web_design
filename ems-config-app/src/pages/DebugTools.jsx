import React, { useState, useEffect, useRef } from 'react';

function DebugTools() {
  const [activeTab, setActiveTab] = useState('protocol');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // 协议调试
  const [protocolLogs, setProtocolLogs] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [protocolFilter, setProtocolFilter] = useState('all');
  
  // 消息订阅
  const [subscriptions, setSubscriptions] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [messages, setMessages] = useState([]);
  const [topicFilter, setTopicFilter] = useState('');
  const [publishTopic, setPublishTopic] = useState('');
  const [publishMessage, setPublishMessage] = useState('');
  
  // 设备控制
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [controlCommands, setControlCommands] = useState([]);

  const logEndRef = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ems_projects') || '[]');
      setProjects(Array.isArray(saved) ? saved : []);
    } catch (e) {
      setProjects([]);
    }
  }, []);

  // 模拟协议报文抓取
  useEffect(() => {
    let interval;
    if (isCapturing) {
      interval = setInterval(() => {
        const directions = ['TX', 'RX'];
        const protocols = ['Modbus RTU', 'Modbus TCP', 'MQTT', 'IEC104'];
        const newLog = {
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          direction: directions[Math.floor(Math.random() * 2)],
          protocol: protocols[Math.floor(Math.random() * 4)],
          device: `设备${Math.floor(Math.random() * 5) + 1}`,
          data: Array.from({ length: Math.floor(Math.random() * 10) + 5 }, () =>
            Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
          ).join(' '),
          status: Math.random() > 0.1 ? 'success' : 'error',
          latency: Math.floor(Math.random() * 100) + 5
        };
        setProtocolLogs(prev => [...prev.slice(-99), newLog]);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isCapturing]);

  // 模拟消息接收
  useEffect(() => {
    let interval;
    if (subscriptions.length > 0) {
      interval = setInterval(() => {
        const sub = subscriptions[Math.floor(Math.random() * subscriptions.length)];
        const newMsg = {
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          topic: sub.topic,
          payload: JSON.stringify({
            deviceId: `dev_${Math.floor(Math.random() * 100)}`,
            power: (Math.random() * 100).toFixed(2),
            voltage: (380 + Math.random() * 20).toFixed(1),
            timestamp: Date.now()
          }, null, 2),
          qos: Math.floor(Math.random() * 3)
        };
        setMessages(prev => [...prev.slice(-49), newMsg]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [subscriptions]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [protocolLogs, messages]);

  const handleAddSubscription = () => {
    if (newTopic.trim()) {
      setSubscriptions(prev => [...prev, { id: Date.now(), topic: newTopic.trim() }]);
      setNewTopic('');
    }
  };

  const handleRemoveSubscription = (id) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  const handlePublish = () => {
    if (publishTopic.trim() && publishMessage.trim()) {
      const newMsg = {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        topic: publishTopic,
        payload: publishMessage,
        qos: 1,
        isPublished: true
      };
      setMessages(prev => [...prev.slice(-49), newMsg]);
      alert('消息发布成功!');
    }
  };

  const getDevices = () => {
    if (!selectedProject) return [];
    return selectedProject.devices || [];
  };

  const getFilteredLogs = () => {
    if (protocolFilter === 'all') return protocolLogs;
    return protocolLogs.filter(log => log.protocol.toLowerCase().includes(protocolFilter.toLowerCase()));
  };

  const getFilteredMessages = () => {
    if (!topicFilter) return messages;
    return messages.filter(msg => msg.topic.includes(topicFilter));
  };

  // 计算通信统计
  const stats = {
    total: protocolLogs.length,
    success: protocolLogs.filter(l => l.status === 'success').length,
    error: protocolLogs.filter(l => l.status === 'error').length,
    avgLatency: protocolLogs.length > 0 
      ? (protocolLogs.reduce((sum, l) => sum + l.latency, 0) / protocolLogs.length).toFixed(1)
      : 0
  };

  return (
    <div>
      <div className="notice-banner info" style={{ marginBottom: '20px' }}>
        <span>🔬</span>
        <span>调试工具用于南北向通讯调试、报文抓取、消息订阅发布和设备手动控制</span>
      </div>

      {/* 标签页 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--gray-200)', paddingBottom: '8px' }}>
        {[
          { id: 'protocol', name: '协议调试', icon: '📡' },
          { id: 'message', name: '消息订阅/发布', icon: '📨' },
          { id: 'control', name: '设备控制', icon: '🎮' }
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

      {/* 协议调试 */}
      {activeTab === 'protocol' && (
        <div>
          {/* 统计信息 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--primary-color)' }}>{stats.total}</div>
                <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>总报文数</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: '600', color: '#10b981' }}>{stats.success}</div>
                <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>成功</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: '600', color: '#ef4444' }}>{stats.error}</div>
                <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>错误/误码</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: '600', color: '#f59e0b' }}>{stats.avgLatency}ms</div>
                <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>平均延迟</div>
              </div>
            </div>
          </div>

          {/* 控制栏 */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-body" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <select
                className="form-select"
                style={{ width: '150px' }}
                value={protocolFilter}
                onChange={(e) => setProtocolFilter(e.target.value)}
              >
                <option value="all">全部协议</option>
                <option value="modbus">Modbus</option>
                <option value="mqtt">MQTT</option>
                <option value="iec104">IEC104</option>
              </select>
              <button
                className={`btn ${isCapturing ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => setIsCapturing(!isCapturing)}
              >
                {isCapturing ? '⏹ 停止抓取' : '▶ 开始抓取'}
              </button>
              <button className="btn btn-secondary" onClick={() => setProtocolLogs([])}>
                🗑️ 清空日志
              </button>
              <button className="btn btn-secondary" onClick={() => {
                const content = protocolLogs.map(l => 
                  `${l.time} [${l.direction}] ${l.protocol} ${l.device}: ${l.data}`
                ).join('\n');
                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `protocol_log_${new Date().toISOString().slice(0, 10)}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}>
                📥 导出日志
              </button>
            </div>
          </div>

          {/* 报文列表 */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">报文抓取 ({getFilteredLogs().length})</h4>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div style={{ maxHeight: '400px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--gray-100)' }}>
                    <tr>
                      <th style={{ padding: '8px', textAlign: 'left', width: '80px' }}>时间</th>
                      <th style={{ padding: '8px', textAlign: 'center', width: '40px' }}>方向</th>
                      <th style={{ padding: '8px', textAlign: 'left', width: '100px' }}>协议</th>
                      <th style={{ padding: '8px', textAlign: 'left', width: '80px' }}>设备</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>数据</th>
                      <th style={{ padding: '8px', textAlign: 'center', width: '60px' }}>延迟</th>
                      <th style={{ padding: '8px', textAlign: 'center', width: '50px' }}>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredLogs().map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                        <td style={{ padding: '6px 8px', color: 'var(--gray-500)' }}>{log.time}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <span className={`tag ${log.direction === 'TX' ? 'tag-blue' : 'tag-green'}`}>
                            {log.direction}
                          </span>
                        </td>
                        <td style={{ padding: '6px 8px' }}>{log.protocol}</td>
                        <td style={{ padding: '6px 8px' }}>{log.device}</td>
                        <td style={{ padding: '6px 8px', color: 'var(--gray-700)' }}>{log.data}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{log.latency}ms</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <span className={`tag ${log.status === 'success' ? 'tag-green' : 'tag-red'}`}>
                            {log.status === 'success' ? '✓' : '✗'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div ref={logEndRef} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 消息订阅/发布 */}
      {activeTab === 'message' && (
        <div style={{ display: 'flex', gap: '24px' }}>
          {/* 左侧：订阅管理 */}
          <div style={{ width: '300px' }}>
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">主题订阅</h4>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="输入主题，如 ems/#"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSubscription()}
                  />
                  <button className="btn btn-primary" onClick={handleAddSubscription}>订阅</button>
                </div>
                {subscriptions.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-400)', fontSize: '13px' }}>
                    暂无订阅主题
                  </div>
                ) : (
                  subscriptions.map(sub => (
                    <div
                      key={sub.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px',
                        background: 'var(--gray-50)',
                        borderRadius: '6px',
                        marginBottom: '6px'
                      }}
                    >
                      <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{sub.topic}</span>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRemoveSubscription(sub.id)}
                      >
                        取消
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card" style={{ marginTop: '16px' }}>
              <div className="card-header">
                <h4 className="card-title">发布消息</h4>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">主题</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ems/command/device1"
                    value={publishTopic}
                    onChange={(e) => setPublishTopic(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">消息内容</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    placeholder='{"command": "start"}'
                    value={publishMessage}
                    onChange={(e) => setPublishMessage(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handlePublish}>
                  📤 发布消息
                </button>
              </div>
            </div>
          </div>

          {/* 右侧：消息列表 */}
          <div style={{ flex: 1 }}>
            <div className="card">
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h4 className="card-title" style={{ margin: 0 }}>实时消息</h4>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '200px', marginLeft: 'auto' }}
                  placeholder="按主题过滤..."
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                />
                <button className="btn btn-secondary btn-sm" onClick={() => setMessages([])}>
                  清空
                </button>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {getFilteredMessages().length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-400)' }}>
                      暂无消息，请先订阅主题
                    </div>
                  ) : (
                    getFilteredMessages().map(msg => (
                      <div
                        key={msg.id}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--gray-100)',
                          background: msg.isPublished ? '#f0fdf4' : 'white'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <span className={`tag ${msg.isPublished ? 'tag-blue' : 'tag-green'}`}>
                            {msg.isPublished ? 'PUB' : 'SUB'}
                          </span>
                          <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--primary-color)' }}>
                            {msg.topic}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--gray-400)', marginLeft: 'auto' }}>
                            QoS {msg.qos} | {msg.time}
                          </span>
                        </div>
                        <pre style={{
                          margin: 0,
                          padding: '8px',
                          background: 'var(--gray-50)',
                          borderRadius: '4px',
                          fontSize: '12px',
                          overflow: 'auto',
                          maxHeight: '100px'
                        }}>
                          {msg.payload}
                        </pre>
                      </div>
                    ))
                  )}
                  <div ref={logEndRef} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 设备控制 */}
      {activeTab === 'control' && (
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ width: '280px' }}>
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">选择项目</h4>
              </div>
              <div className="card-body" style={{ padding: '8px' }}>
                {projects.map(project => (
                  <div
                    key={project.id}
                    className={`nav-item ${selectedProject?.id === project.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedProject(project);
                      setSelectedDevice(null);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    📁 {project.name}
                  </div>
                ))}
              </div>
            </div>

            {selectedProject && (
              <div className="card" style={{ marginTop: '16px' }}>
                <div className="card-header">
                  <h4 className="card-title">设备列表</h4>
                </div>
                <div className="card-body" style={{ padding: '8px' }}>
                  {getDevices().map(device => (
                    <div
                      key={device.instanceId}
                      className={`nav-item ${selectedDevice?.instanceId === device.instanceId ? 'active' : ''}`}
                      onClick={() => setSelectedDevice(device)}
                      style={{ cursor: 'pointer' }}
                    >
                      🔌 {device.instanceName}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            {!selectedDevice ? (
              <div className="empty-state" style={{ height: '400px' }}>
                <div className="empty-state-icon">🎮</div>
                <div className="empty-state-title">选择设备进行控制</div>
                <div className="empty-state-desc">从左侧选择项目和设备</div>
              </div>
            ) : (
              <div>
                <div className="card" style={{ marginBottom: '16px' }}>
                  <div className="card-header">
                    <h4 className="card-title">{selectedDevice.instanceName} - 手动控制</h4>
                  </div>
                  <div className="card-body">
                    <div className="notice-banner warning" style={{ marginBottom: '16px' }}>
                      <span>⚠️</span>
                      <span>手动控制将直接操作设备，请谨慎操作！</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <button
                        className="btn btn-lg"
                        style={{ padding: '20px', background: '#10b981', color: 'white' }}
                        onClick={() => {
                          setControlCommands(prev => [...prev, { time: new Date().toLocaleTimeString(), cmd: '启动', status: '已发送' }]);
                          alert('启动命令已发送');
                        }}
                      >
                        ▶ 启动
                      </button>
                      <button
                        className="btn btn-lg"
                        style={{ padding: '20px', background: '#ef4444', color: 'white' }}
                        onClick={() => {
                          setControlCommands(prev => [...prev, { time: new Date().toLocaleTimeString(), cmd: '停止', status: '已发送' }]);
                          alert('停止命令已发送');
                        }}
                      >
                        ⏹ 停止
                      </button>
                      <button
                        className="btn btn-lg"
                        style={{ padding: '20px', background: '#f59e0b', color: 'white' }}
                        onClick={() => {
                          setControlCommands(prev => [...prev, { time: new Date().toLocaleTimeString(), cmd: '复位', status: '已发送' }]);
                          alert('复位命令已发送');
                        }}
                      >
                        🔄 复位
                      </button>
                    </div>

                    <div style={{ marginTop: '24px' }}>
                      <h5>功率设定</h5>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
                        <input type="range" min="0" max="100" defaultValue="50" style={{ flex: 1 }} />
                        <input type="number" className="form-input" style={{ width: '100px' }} defaultValue="50" />
                        <span>kW</span>
                        <button className="btn btn-primary" onClick={() => {
                          setControlCommands(prev => [...prev, { time: new Date().toLocaleTimeString(), cmd: '功率设定: 50kW', status: '已发送' }]);
                          alert('功率设定命令已发送');
                        }}>
                          下发
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title">控制记录</h4>
                  </div>
                  <div className="card-body" style={{ padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: 'var(--gray-100)' }}>
                          <th style={{ padding: '8px', textAlign: 'left' }}>时间</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>命令</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {controlCommands.map((cmd, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                            <td style={{ padding: '8px' }}>{cmd.time}</td>
                            <td style={{ padding: '8px' }}>{cmd.cmd}</td>
                            <td style={{ padding: '8px' }}>
                              <span className="tag tag-green">{cmd.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DebugTools;
