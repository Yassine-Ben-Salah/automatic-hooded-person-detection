import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Spin, Empty, Alert, Typography, Button, message } from 'antd';
import {
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useDetection } from '../../contexts/DetectionContext';
import { getDashboardStats, getRecentDetections } from '../../services/dashboardService';
import moment from 'moment';

// Colors for charts
const COLORS = ['#FF6B3B', '#626681', '#FFC100', '#9FB40F', '#76523B', '#DAD5B5', '#0C8918', '#E48400', '#76D7EA'];

const Dashboard = () => {
  const { loading: contextLoading, error: contextError, fetchDetectionLabels } = useDetection();
  const [stats, setStats] = useState(null);
  const [recentDetections, setRecentDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Initialize detection labels
      await fetchDetectionLabels();
      
      // Get dashboard statistics
      const stats = await getDashboardStats();
      
      // Update state with statistics
      setStats(stats);
      
      // Get recent detections
      const recentDetections = await getRecentDetections();
      setRecentDetections(recentDetections);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [fetchDetectionLabels]);

  // Handle refresh button click
  const handleRefresh = async () => {
    setRefreshing(true);
    message.info('Refreshing dashboard data...');
    await loadDashboardData();
    message.success('Dashboard data refreshed!');
  };

  // Format data for label distribution pie chart
  const getLabelData = () => {
    if (!stats || !stats.byLabel) return [];
    
    try {
      // Handle if byLabel is an array or an object
      if (Array.isArray(stats.byLabel)) {
        return stats.byLabel.map(item => ({
          name: item._id || 'Unknown',
          value: item.count || 0
        }));
      } else {
        // If it's an object with labels as keys
        return Object.entries(stats.byLabel).map(([label, count]) => ({
          name: label || 'Unknown',
          value: count || 0
        }));
      }
    } catch (error) {
      console.error("Error formatting label data:", error);
      return []; // Return empty array on error
    }
  };

  // Format data for daily counts bar chart
  const getDailyData = () => {
    if (!stats) return [];
    
    try {
      // If dailyCounts is missing or invalid, create mock data
      if (!stats.dailyCounts || !Array.isArray(stats.dailyCounts) || stats.dailyCounts.length === 0) {
        const mockData = [];
        for (let i = 6; i >= 0; i--) {
          mockData.push({
            name: moment().subtract(i, 'days').format('MM/DD'),
            count: 0
          });
        }
        return mockData;
      }
      
      return stats.dailyCounts.map(item => ({
        name: moment(item.date).format('MM/DD'),
        count: item.count || 0
      }));
    } catch (error) {
      console.error("Error formatting daily data:", error);
      return []; // Return empty array on error
    }
  };

  // Format status data for pie chart
  const getStatusData = () => {
    if (!stats || !stats.byStatus) return [];
    
    try {
      // Handle if byStatus is an array or an object
      if (Array.isArray(stats.byStatus)) {
        return stats.byStatus.map(item => ({
          name: item._id || 'Unknown',
          value: item.count || 0
        }));
      } else {
        // If it's an object with status as keys
        return Object.entries(stats.byStatus).map(([status, count]) => ({
          name: status || 'Unknown',
          value: count || 0
        }));
      }
    } catch (error) {
      console.error("Error formatting status data:", error);
      return []; // Return empty array on error
    }
  };

  // Get count for a specific status
  const getStatusCount = (statusName) => {
    try {
      if (!stats || !stats.byStatus) return 0;
      
      if (Array.isArray(stats.byStatus)) {
        const statusItem = stats.byStatus.find(s => s._id === statusName);
        return statusItem ? statusItem.count || 0 : 0;
      } else {
        return stats.byStatus[statusName] || 0;
      }
    } catch (error) {
      console.error(`Error getting status count for ${statusName}:`, error);
      return 0;
    }
  };

  // Table columns for recent detections
  const columns = [
    {
      title: 'Type',
      dataIndex: 'label',
      key: 'label',
      render: text => <strong>{text}</strong>,
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      render: value => `${value}%`,
      sorter: (a, b) => a.confidence - b.confidence,
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: text => moment(text).format('MMM DD, YYYY HH:mm:ss'),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        let color = 'blue';
        let icon = <ClockCircleOutlined />;
        
        if (status === 'confirmed') {
          color = 'green';
          icon = <CheckCircleOutlined />;
        } else if (status === 'false_alarm') {
          color = 'red';
          icon = <CloseCircleOutlined />;
        } else if (status === 'reviewed') {
          color = 'purple';
          icon = <EyeOutlined />;
        }
        
        return (
          <Tag color={color} icon={icon}>
            {status.replace('_', ' ').toUpperCase()}
          </Tag>
        );
      },
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Confirmed', value: 'confirmed' },
        { text: 'False Alarm', value: 'false_alarm' },
        { text: 'Reviewed', value: 'reviewed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
  ];

  if (loading && !refreshing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  if (!stats) {
    return <Empty description="No data available" />;
  }

  return (
    <div className="dashboard-container" style={{ padding: '0 16px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Title level={2} style={{ margin: '16px 0' }}>
          <AlertOutlined style={{ marginRight: 12 }} />
          Dashboard Overview
        </Typography.Title>
        
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
          loading={refreshing}
        >
          Refresh Data
        </Button>
      </div>
      
      {error && (
        <Alert
          message="Error Loading Data"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
          closable
        />
      )}
      
      <Spin spinning={refreshing} tip="Refreshing dashboard data...">
        <div className="dashboard-content">
          {/* Overview Cards */}
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable style={{ height: '100%' }}>
                <Statistic
                  title={<span style={{ fontSize: 16 }}>Total Detections</span>}
                  value={stats.total || 0}
                  prefix={<AlertOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff', fontSize: 24 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable style={{ height: '100%' }}>
                <Statistic
                  title={<span style={{ fontSize: 16 }}>Today</span>}
                  value={stats.today || 0}
                  prefix={<ClockCircleOutlined style={{ color: '#3f8600' }} />}
                  valueStyle={{ color: '#3f8600', fontSize: 24 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable style={{ height: '100%' }}>
                <Statistic
                  title={<span style={{ fontSize: 16 }}>This Week</span>}
                  value={stats.weekly || 0}
                  prefix={<WarningOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ color: '#faad14', fontSize: 24 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable style={{ height: '100%' }}>
                <Statistic
                  title={<span style={{ fontSize: 16 }}>Confirmed Incidents</span>}
                  value={getStatusCount('confirmed')}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a', fontSize: 24 }}
                />
              </Card>
            </Col>
          </Row>

          {/* Charts */}
          <Row gutter={[24, 24]} style={{ marginTop: 8 }}>
            {/* Daily Detections Bar Chart */}
            <Col xs={24} lg={16}>
              <Card 
                title={<span style={{ fontSize: 16 }}>Daily Detections</span>} 
                bordered={true} 
                hoverable
                style={{ height: '100%' }}
              >
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart data={getDailyData()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="Detections" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            
            {/* Detection Type Distribution */}
            <Col xs={24} md={12} lg={8}>
              <Card 
                title={<span style={{ fontSize: 16 }}>Detection Types</span>} 
                bordered={true} 
                hoverable
                style={{ height: '100%' }}
              >
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={getLabelData()}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                      >
                        {getLabelData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} detections`, 'Count']} />
                      <Legend layout="vertical" align="right" verticalAlign="middle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Status Distribution & Recent Detections */}
          <Row gutter={[24, 24]} style={{ marginTop: 8, marginBottom: 24 }}>
            {/* Status Distribution */}
            <Col xs={24} md={12}>
              <Card 
                title={<span style={{ fontSize: 16 }}>Detection Status</span>} 
                bordered={true} 
                hoverable
                style={{ height: '100%' }}
              >
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={getStatusData()}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => percent > 0.05 ? `${name.replace('_', ' ')}: ${(percent * 100).toFixed(0)}%` : ''}
                      >
                        {getStatusData().map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.name === 'confirmed' ? '#52c41a' :
                              entry.name === 'pending' ? '#1890ff' :
                              entry.name === 'false_alarm' ? '#f5222d' : 
                              '#722ed1'
                            } 
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} detections`, 'Count']} />
                      <Legend layout="vertical" align="right" verticalAlign="middle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            
            {/* Recent Detections */}
            <Col xs={24} md={12}>
              <Card 
                title={<span style={{ fontSize: 16 }}>Recent Detections</span>} 
                bordered={true} 
                hoverable
                style={{ height: '100%', maxHeight: 440, overflow: 'auto' }}
              >
                {recentDetections.length === 0 ? (
                  <Empty description="No detections available" style={{ marginTop: 60 }} />
                ) : (
                  <Table 
                    dataSource={recentDetections} 
                    columns={columns} 
                    rowKey="_id"
                    size="small"
                    pagination={false}
                    scroll={{ y: 240 }}
                    style={{ maxHeight: 340 }}
                  />
                )}
              </Card>
            </Col>
          </Row>
        </div>
      </Spin>
    </div>
  );
};

export default Dashboard; 