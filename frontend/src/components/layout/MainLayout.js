import React, { useState } from 'react';
import { Layout, Menu, Badge, Avatar, Typography, Dropdown, message } from 'antd';
import {
  DashboardOutlined,
  VideoCameraOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  AlertOutlined
} from '@ant-design/icons';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDetection } from '../../contexts/DetectionContext';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { detections = [] } = useDetection();
  const location = useLocation();
  const navigate = useNavigate();

  // Use the 5 most recent detections for alerts
  const latestDetections = detections.slice(0, 5);

  // Get current path for menu selection
  const selectedKey = location.pathname.split('/')[1] || 'dashboard';

  // Check if user is admin
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    message.success('Logged out successfully');
    navigate('/login');
  };

  // User dropdown menu
  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        <Link to="/profile">Profile</Link>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  // Alerts dropdown menu
  const alertsMenu = (
    <Menu style={{ width: 300, maxHeight: 400, overflow: 'auto' }}>
      <Menu.Item key="header" disabled style={{ fontWeight: 'bold' }}>
        Recent Detections
      </Menu.Item>
      <Menu.Divider />
      {latestDetections && latestDetections.length > 0 ? (
        latestDetections.map((detection, index) => (
          <Menu.Item key={index}>
            <Link to={`/history/${detection._id}`}>
              <strong>{detection.label}</strong> - {detection.confidence}%
              <div style={{ fontSize: '12px', color: '#999' }}>
                {new Date(detection.timestamp).toLocaleString()}
              </div>
            </Link>
          </Menu.Item>
        ))
      ) : (
        <Menu.Item key="no-alerts" disabled>
          No recent detections
        </Menu.Item>
      )}
      <Menu.Divider />
      <Menu.Item key="view-all">
        <Link to="/history">View all detections</Link>
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="dark"
        width={250}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '16px 0' }}>
          <Title 
            level={4} 
            style={{ 
              color: 'white', 
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {collapsed ? 'SS' : 'Surveillance System'}
          </Title>
        </div>
        
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]}>
          <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
            <Link to="/dashboard">Dashboard</Link>
          </Menu.Item>
          <Menu.Item key="live" icon={<VideoCameraOutlined />}>
            <Link to="/live">Live Monitoring</Link>
          </Menu.Item>
          <Menu.Item key="history" icon={<HistoryOutlined />}>
            <Link to="/history">Detection History</Link>
          </Menu.Item>
          <Menu.Item key="alerts" icon={<AlertOutlined />}>
            <Link to="/alerts">Alerts</Link>
          </Menu.Item>
          
          {isAdmin() && (
            <>
              <Menu.Divider />
              <Menu.ItemGroup title="Admin">
                <Menu.Item key="users" icon={<UserOutlined />}>
                  <Link to="/users">User Management</Link>
                </Menu.Item>
                <Menu.Item key="model" icon={<SettingOutlined />}>
                  <Link to="/model">Model Management</Link>
                </Menu.Item>
              </Menu.ItemGroup>
            </>
          )}
        </Menu>
      </Sider>
      
      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'all 0.2s' }}>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff', 
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          position: 'sticky',
          top: 0,
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Left side - Toggle button */}
          <div>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger',
              onClick: () => setCollapsed(!collapsed),
              style: { fontSize: '18px', cursor: 'pointer' }
            })}
          </div>
          
          {/* Right side - User dropdown and notifications */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div className="notification-area">
              <Dropdown overlay={alertsMenu} trigger={['click']} placement="bottomRight">
                <Badge count={latestDetections ? latestDetections.length : 0}>
                  <BellOutlined style={{ fontSize: '18px', cursor: 'pointer' }} />
                </Badge>
              </Dropdown>
            </div>
            
            <div className="profile-area">
              <Dropdown overlay={userMenu} trigger={['click']}>
                <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
                  <span style={{ marginLeft: 8, display: collapsed ? 'none' : 'inline' }}>
                    {user?.username || 'User'}
                  </span>
                </div>
              </Dropdown>
            </div>
          </div>
        </Header>
        
        <Content style={{ margin: '24px 16px', overflow: 'initial' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 