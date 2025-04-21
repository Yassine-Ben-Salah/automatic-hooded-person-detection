import React, { useState, useEffect } from 'react';
import { Card, Row, Col, List, Typography, Tag, Spin, Alert, Empty, Badge, Button } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { modelAPI } from '../../services/api';
import { useDetection } from '../../contexts/DetectionContext';
import moment from 'moment';

const { Title, Text } = Typography;

const LiveMonitoring = () => {
  const { latestDetections, loading, error } = useDetection();
  const [streamError, setStreamError] = useState(false);
  const videoUrl = modelAPI.getVideoFeed();

  // Reset stream error when remounting
  useEffect(() => {
    setStreamError(false);
  }, []);

  // Handle video stream error
  const handleStreamError = () => {
    setStreamError(true);
  };

  // Handle video stream loaded
  const handleStreamLoaded = () => {
    setStreamError(false);
  };

  // Render detection severity based on label
  const getSeverityBadge = (label) => {
    let color = 'blue';
    let text = 'Info';
    
    if (['Assault', 'Weapons'].includes(label)) {
      color = 'red';
      text = 'Critical';
    } else if (['Balaclava', 'Intrusion'].includes(label)) {
      color = 'orange';
      text = 'High';
    } else if (['Suspect', 'Bags Theft'].includes(label)) {
      color = 'yellow';
      text = 'Medium';
    }
    
    return <Badge color={color} text={text} />;
  };

  return (
    <div>
      <Title level={2}>Live Monitoring</Title>
      
      <Row gutter={[16, 16]}>
        {/* Video Feed */}
        <Col xs={24} lg={16}>
          <Card 
            title="Camera Feed" 
            extra={
              <Button 
                type="primary" 
                icon={<InfoCircleOutlined />}
                onClick={() => window.location.reload()}
              >
                Refresh Feed
              </Button>
            }
          >
            {streamError ? (
              <Alert
                message="Stream Error"
                description="Unable to connect to the video stream. Please make sure the model server is running."
                type="error"
                showIcon
                action={
                  <Button size="small" danger onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                }
              />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={videoUrl} 
                  alt="Live Camera Feed" 
                  style={{ maxWidth: '100%', border: '1px solid #f0f0f0' }}
                  onError={handleStreamError}
                  onLoad={handleStreamLoaded}
                />
              </div>
            )}
          </Card>
        </Col>
        
        {/* Recent Detections */}
        <Col xs={24} lg={8}>
          <Card 
            title="Live Detections" 
            style={{ height: '100%' }}
            bodyStyle={{ height: 'calc(100% - 58px)', overflow: 'auto' }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Spin />
              </div>
            ) : error ? (
              <Alert message={error} type="error" showIcon />
            ) : latestDetections.length === 0 ? (
              <Empty description="No recent detections" />
            ) : (
              <List
                dataSource={latestDetections}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>
                            <WarningOutlined style={{ 
                              color: getDetectionColor(item.label),
                              marginRight: 8 
                            }} />
                            {item.label}
                          </span>
                          {getSeverityBadge(item.label)}
                        </div>
                      }
                      description={
                        <>
                          <div>
                            <Text strong>Confidence:</Text> {item.confidence}%
                          </div>
                          <div>
                            <Text strong>Time:</Text> {moment(item.timestamp).format('HH:mm:ss')}
                          </div>
                          <div>
                            <Text strong>Status:</Text>{' '}
                            <Tag color={getStatusColor(item.status)}>
                              {item.status.replace('_', ' ').toUpperCase()}
                            </Tag>
                          </div>
                        </>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
      
      {/* Detection Info */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Detection Information">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card type="inner" title="Critical Events" style={{ backgroundColor: '#fff1f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p><Tag color="red">Assault</Tag> - Physical confrontation</p>
                      <p><Tag color="red">Weapons</Tag> - Firearm or knife detection</p>
                    </div>
                    <Title level={3} style={{ margin: 0, color: '#cf1322' }}>
                      {countDetectionsByTypes(latestDetections, ['Assault', 'Weapons'])}
                    </Title>
                  </div>
                </Card>
              </Col>
              
              <Col xs={24} sm={8}>
                <Card type="inner" title="High Risk Events" style={{ backgroundColor: '#fff7e6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p><Tag color="orange">Balaclava</Tag> - Masked individual</p>
                      <p><Tag color="orange">Intrusion</Tag> - Unauthorized access</p>
                    </div>
                    <Title level={3} style={{ margin: 0, color: '#fa8c16' }}>
                      {countDetectionsByTypes(latestDetections, ['Balaclava', 'Intrusion'])}
                    </Title>
                  </div>
                </Card>
              </Col>
              
              <Col xs={24} sm={8}>
                <Card type="inner" title="Medium Risk Events" style={{ backgroundColor: '#fcffe6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p><Tag color="gold">Suspect</Tag> - Suspicious behavior</p>
                      <p><Tag color="gold">Bags Theft</Tag> - Potential theft</p>
                    </div>
                    <Title level={3} style={{ margin: 0, color: '#d4b106' }}>
                      {countDetectionsByTypes(latestDetections, ['Suspect', 'Bags Theft'])}
                    </Title>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// Helper functions
const getDetectionColor = (label) => {
  if (['Assault', 'Weapons'].includes(label)) return '#cf1322';
  if (['Balaclava', 'Intrusion'].includes(label)) return '#fa8c16';
  if (['Suspect', 'Bags Theft'].includes(label)) return '#d4b106';
  return '#1890ff';
};

const getStatusColor = (status) => {
  switch (status) {
    case 'confirmed': return 'green';
    case 'false_alarm': return 'red';
    case 'reviewed': return 'purple';
    default: return 'blue';
  }
};

const countDetectionsByTypes = (detections, types) => {
  return detections.filter(d => types.includes(d.label)).length;
};

export default LiveMonitoring; 