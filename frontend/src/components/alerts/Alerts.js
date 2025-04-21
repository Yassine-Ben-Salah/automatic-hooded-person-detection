import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Button, Row, Col, Typography, Timeline, Empty, Spin, Alert, Select } from 'antd';
import { WarningOutlined, CheckCircleOutlined, AlertOutlined, BellOutlined, FilterOutlined } from '@ant-design/icons';
import { useDetection } from '../../contexts/DetectionContext';
import moment from 'moment';
import { Link } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const Alerts = () => {
  const { fetchDetections, loading, error } = useDetection();
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertType, setAlertType] = useState('all');

  // Critical alert types
  const criticalTypes = ['Assault', 'Weapons'];
  const highRiskTypes = ['Balaclava', 'Intrusion'];

  // Fetch alerts on component mount and when alert type changes
  useEffect(() => {
    fetchAlerts();
  }, [alertType]);

  // Fetch alerts with filters
  const fetchAlerts = async () => {
    setAlertsLoading(true);

    try {
      const filters = {};
      if (alertType === 'critical') {
        filters.label = criticalTypes.join(',');
      } else if (alertType === 'high') {
        filters.label = highRiskTypes.join(',');
      }

      // Sort by most recent first and limit to 50
      const result = await fetchDetections(1, 50, filters);
      setAlerts(result.detections);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setAlertsLoading(false);
    }
  };

  // Get severity of alert based on label
  const getAlertSeverity = (label) => {
    if (criticalTypes.includes(label)) return 'critical';
    if (highRiskTypes.includes(label)) return 'high';
    return 'medium';
  };

  // Get color for an alert based on severity
  const getAlertColor = (label) => {
    const severity = getAlertSeverity(label);
    if (severity === 'critical') return '#f5222d';
    if (severity === 'high') return '#fa8c16';
    return '#faad14';
  };

  // Get icon for an alert based on severity
  const getAlertIcon = (label) => {
    const severity = getAlertSeverity(label);
    if (severity === 'critical') return <AlertOutlined style={{ color: '#f5222d' }} />;
    if (severity === 'high') return <WarningOutlined style={{ color: '#fa8c16' }} />;
    return <BellOutlined style={{ color: '#faad14' }} />;
  };

  // Get tag for alert status
  const getStatusTag = (status) => {
    switch (status) {
      case 'confirmed':
        return <Tag color="green">CONFIRMED</Tag>;
      case 'false_alarm':
        return <Tag color="red">FALSE ALARM</Tag>;
      case 'reviewed':
        return <Tag color="purple">REVIEWED</Tag>;
      default:
        return <Tag color="blue">PENDING</Tag>;
    }
  };

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

  return (
    <div>
      <Title level={2}>
        <AlertOutlined style={{ marginRight: 12 }} />
        Security Alerts
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          {/* Alert Timeline */}
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Alert Timeline</span>
                <Select 
                  value={alertType} 
                  onChange={setAlertType}
                  style={{ width: 150 }}
                  placeholder="Filter by severity"
                >
                  <Option value="all">All Alerts</Option>
                  <Option value="critical">Critical Only</Option>
                  <Option value="high">High Risk Only</Option>
                </Select>
              </div>
            }
          >
            <Spin spinning={alertsLoading || loading}>
              {alerts.length === 0 ? (
                <Empty description="No alerts found" />
              ) : (
                <Timeline mode="left">
                  {alerts.map((alert) => (
                    <Timeline.Item 
                      key={alert._id}
                      color={getAlertColor(alert.label)}
                      dot={getAlertIcon(alert.label)}
                    >
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>{alert.label}</Text> detected with {alert.confidence}% confidence
                        {getStatusTag(alert.status)}
                      </div>
                      <div>
                        <Text type="secondary">
                          {moment(alert.timestamp).format('MMMM Do YYYY, h:mm:ss a')}
                        </Text>
                      </div>
                      {alert.notes && (
                        <Paragraph style={{ marginTop: 8 }}>
                          <Text italic>Note: {alert.notes}</Text>
                        </Paragraph>
                      )}
                      <div style={{ marginTop: 8 }}>
                        <Link to={`/history?id=${alert._id}`}>
                          <Button size="small" type="link">View Details</Button>
                        </Link>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              )}
            </Spin>
          </Card>
        </Col>
        
        {/* Alert Summary */}
        <Col xs={24} lg={8}>
          <Card title="Alert Summary">
            <List>
              <List.Item>
                <List.Item.Meta
                  avatar={<AlertOutlined style={{ fontSize: 24, color: '#f5222d' }} />}
                  title="Critical Alerts"
                  description={`${alerts.filter(a => criticalTypes.includes(a.label)).length} detected`}
                />
                <Link to="/history?label=Assault,Weapons">
                  <Button size="small">View All</Button>
                </Link>
              </List.Item>
              
              <List.Item>
                <List.Item.Meta
                  avatar={<WarningOutlined style={{ fontSize: 24, color: '#fa8c16' }} />}
                  title="High Risk Alerts"
                  description={`${alerts.filter(a => highRiskTypes.includes(a.label)).length} detected`}
                />
                <Link to="/history?label=Balaclava,Intrusion">
                  <Button size="small">View All</Button>
                </Link>
              </List.Item>
              
              <List.Item>
                <List.Item.Meta
                  avatar={<BellOutlined style={{ fontSize: 24, color: '#faad14' }} />}
                  title="Medium Risk Alerts"
                  description={`${alerts.filter(a => !criticalTypes.includes(a.label) && !highRiskTypes.includes(a.label)).length} detected`}
                />
                <Link to="/history?label=Suspect,Bags%20Theft">
                  <Button size="small">View All</Button>
                </Link>
              </List.Item>
            </List>
          </Card>
          
          {/* Alert Reference */}
          <Card title="Alert Reference Guide" style={{ marginTop: 16 }}>
            <List size="small">
              <List.Item>
                <Tag color="red">Assault</Tag> - Physical confrontation detected
              </List.Item>
              <List.Item>
                <Tag color="red">Weapons</Tag> - Potential firearm or knife detected
              </List.Item>
              <List.Item>
                <Tag color="orange">Balaclava</Tag> - Masked individual detected
              </List.Item>
              <List.Item>
                <Tag color="orange">Intrusion</Tag> - Unauthorized access detected
              </List.Item>
              <List.Item>
                <Tag color="gold">Suspect</Tag> - Suspicious behavior detected
              </List.Item>
              <List.Item>
                <Tag color="gold">Bags Theft</Tag> - Potential theft detected
              </List.Item>
            </List>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Alerts; 