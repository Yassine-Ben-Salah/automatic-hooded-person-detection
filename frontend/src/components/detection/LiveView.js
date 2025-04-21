import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Typography, Select, Button, List, Tag, Space, Switch, Slider, InputNumber, Tooltip, Alert, Spin } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, SettingOutlined, FullscreenOutlined, AlertOutlined, VideoCameraOutlined, EyeOutlined, RobotOutlined } from '@ant-design/icons';
import { modelAPI } from '../../services/api';
import { useDetection } from '../../contexts/DetectionContext';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;

const LiveView = () => {
  // State variables
  const [loading, setLoading] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(50);
  const [liveDetections, setLiveDetections] = useState([]);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  
  // Fetch available cameras on component mount
  useEffect(() => {
    fetchCameras();
  }, []);
  
  // Set up detection polling when streaming is active
  useEffect(() => {
    let interval;
    
    if (isStreaming) {
      // Start polling for detections
      interval = setInterval(() => {
        fetchLiveDetections();
      }, 1000); // Poll every second
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, selectedCamera]);
  
  // Fetch available cameras
  const fetchCameras = async () => {
    setLoading(true);
    try {
      // This would be implemented to fetch cameras from the API
      // For now, we'll use mock data
      const mockCameras = [
        { id: 'cam1', name: 'Front Entrance', location: 'Main Building', status: 'active' },
        { id: 'cam2', name: 'Parking Lot', location: 'External', status: 'active' },
        { id: 'cam3', name: 'Back Door', location: 'Warehouse', status: 'active' },
        { id: 'cam4', name: 'Hallway', location: 'Main Building', status: 'inactive' }
      ];
      
      setCameras(mockCameras);
      setSelectedCamera(mockCameras[0].id);
    } catch (error) {
      setError('Failed to fetch cameras');
      console.error('Error fetching cameras:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch live detections
  const fetchLiveDetections = async () => {
    try {
      const response = await modelAPI.getDetections();
      
      // Filter detections by confidence threshold
      const filteredDetections = response.data.detections.filter(
        detection => detection.confidence >= confidenceThreshold
      );
      
      setLiveDetections(filteredDetections);
    } catch (error) {
      console.error('Error fetching live detections:', error);
      // Don't set error state to avoid disrupting the stream
    }
  };
  
  // Handle stream start/stop
  const toggleStream = () => {
    if (!isStreaming) {
      startStream();
    } else {
      stopStream();
    }
  };
  
  // Start video stream
  const startStream = () => {
    setError(null);
    
    try {
      if (videoRef.current) {
        // For MJPEG streams, we need to set the src directly
        // Add query parameters for detection settings
        const baseUrl = modelAPI.getVideoFeed();
        const params = new URLSearchParams();
        params.append('show_boxes', showBoundingBoxes);
        params.append('show_labels', showLabels);
        params.append('confidence', confidenceThreshold);
        
        // Apply settings to video feed URL
        videoRef.current.src = `${baseUrl}?${params.toString()}`;
        setIsStreaming(true);
        
        // Start fetching detections right away
        fetchLiveDetections();
      }
    } catch (error) {
      setError('Failed to start video stream');
      console.error('Error starting stream:', error);
    }
  };
  
  // Stop video stream
  const stopStream = () => {
    if (videoRef.current) {
      // For img elements, we just need to clear the src
      videoRef.current.src = '';
      setIsStreaming(false);
      setLiveDetections([]);
    }
  };
  
  // Handle camera change
  const handleCameraChange = (cameraId) => {
    // Stop current stream before changing camera
    if (isStreaming) {
      stopStream();
    }
    
    setSelectedCamera(cameraId);
    
    // Restart stream with new camera
    // In a real implementation, you would pass the camera ID to the backend
    if (isStreaming) {
      startStream();
    }
  };
  
  // Handle fullscreen
  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.msRequestFullscreen) {
        videoRef.current.msRequestFullscreen();
      }
    }
  };
  
  // Get tag color for detection
  const getDetectionColor = (label) => {
    if (['Assault', 'Weapons'].includes(label)) return 'red';
    if (['Balaclava', 'Intrusion'].includes(label)) return 'orange';
    return 'blue';
  };
  
  // Update when settings change
  useEffect(() => {
    // If streaming is active, update the stream with new settings
    if (isStreaming && videoRef.current) {
      const baseUrl = modelAPI.getVideoFeed();
      const params = new URLSearchParams();
      params.append('show_boxes', showBoundingBoxes);
      params.append('show_labels', showLabels);
      params.append('confidence', confidenceThreshold);
      
      // Apply updated settings to video feed URL
      videoRef.current.src = `${baseUrl}?${params.toString()}`;
    }
  }, [showBoundingBoxes, showLabels, confidenceThreshold, isStreaming]);

  return (
    <div className="live-view-container" style={{ padding: '0 16px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Title level={2} style={{ margin: '16px 0' }}>
          <VideoCameraOutlined style={{ marginRight: 12 }} />
          Live Detection
        </Typography.Title>
      </div>
      
      {error && (
        <Alert 
          message="Error" 
          description={error} 
          type="error" 
          showIcon 
          style={{ marginBottom: 16 }}
          closable
        />
      )}
      
      <Row gutter={[24, 24]}>
        {/* Left column: Video and Controls */}
        <Col xs={24} lg={16}>
          {/* Video Feed Card */}
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 16 }}>
                  <VideoCameraOutlined style={{ marginRight: 8 }} /> Live Video Feed
                </span>
                <Select
                  style={{ width: 220 }}
                  value={selectedCamera}
                  onChange={handleCameraChange}
                  disabled={loading}
                  placeholder="Select camera"
                >
                  {cameras.map(camera => (
                    <Option key={camera.id} value={camera.id}>
                      {camera.name} ({camera.location})
                    </Option>
                  ))}
                </Select>
              </div>
            }
            bordered={true}
            style={{ marginBottom: 24 }}
            extra={
              <Space>
                <Tooltip title="Fullscreen">
                  <Button 
                    icon={<FullscreenOutlined />} 
                    onClick={toggleFullscreen}
                    disabled={!isStreaming}
                  />
                </Tooltip>
                <Tooltip title={isStreaming ? "Stop Stream" : "Start Stream"}>
                  <Button 
                    type="primary" 
                    icon={isStreaming ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                    onClick={toggleStream}
                    loading={loading}
                  >
                    {isStreaming ? "Stop" : "Start"}
                  </Button>
                </Tooltip>
              </Space>
            }
          >
            <div 
              style={{ 
                position: 'relative', 
                backgroundColor: '#000', 
                borderRadius: '4px',
                height: '470px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden'
              }}
            >
              <Spin spinning={loading && !isStreaming} tip="Loading camera...">
                <img 
                  ref={videoRef}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    display: 'block'
                  }}
                  alt="Live video feed"
                />
              </Spin>
              
              {!isStreaming && !loading && (
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    flexDirection: 'column'
                  }}
                >
                  <PlayCircleOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                  <Text style={{ color: 'white' }}>Click the Start button to begin streaming</Text>
                </div>
              )}
            </div>
          </Card>
          
          {/* Detection Settings Card */}
          <Card 
            title={<span style={{ fontSize: 16 }}><SettingOutlined style={{ marginRight: 8 }} /> Detection Settings</span>} 
            bordered={true}
          >
            <Row gutter={[24, 16]} align="middle">
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>Show Bounding Boxes</Text>
                  <Switch
                    checked={showBoundingBoxes}
                    onChange={setShowBoundingBoxes}
                  />
                </div>
              </Col>
              
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>Show Labels</Text>
                  <Switch
                    checked={showLabels}
                    onChange={setShowLabels}
                  />
                </div>
              </Col>
              
              <Col span={24}>
                <Text strong>Confidence Threshold</Text>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                  <div style={{ flex: 1, marginRight: 16 }}>
                    <Slider
                      min={0}
                      max={100}
                      value={confidenceThreshold}
                      onChange={setConfidenceThreshold}
                    />
                  </div>
                  <InputNumber
                    min={0}
                    max={100}
                    value={confidenceThreshold}
                    onChange={setConfidenceThreshold}
                    formatter={value => `${value}%`}
                    parser={value => value.replace('%', '')}
                    style={{ width: 80 }}
                  />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
        
        {/* Right column: Live Detections */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <AlertOutlined style={{ color: '#ff4d4f' }} />
                <span style={{ fontSize: 16 }}>Live Detections</span>
                <Tag color="blue">{liveDetections.length}</Tag>
              </Space>
            }
            bordered={true}
            style={{ height: '716px', overflow: 'hidden' }}
            bodyStyle={{ height: 'calc(100% - 57px)', overflow: 'auto', padding: '12px 24px' }}
          >
            {liveDetections.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '120px 0', 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center' 
              }}>
                <RobotOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 24 }} />
                <Typography.Title level={4} style={{ color: '#8c8c8c', margin: 0, marginBottom: 8 }}>No Detections</Typography.Title>
                <Text type="secondary">
                  No detections above the confidence threshold.
                  <br />Adjust the threshold or wait for new detections.
                </Text>
              </div>
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={liveDetections}
                renderItem={detection => (
                  <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        icon={<EyeOutlined />} 
                        onClick={() => {}}
                      >
                        Details
                      </Button>
                    ]}
                    style={{ padding: '12px 0' }}
                  >
                    <List.Item.Meta
                      title={
                        <Space style={{ fontSize: 14 }}>
                          <Tag color={getDetectionColor(detection.label)}>
                            {detection.label}
                          </Tag>
                          <Text strong>{Math.round(detection.confidence)}% confidence</Text>
                        </Space>
                      }
                      description={
                        <div style={{ marginTop: 4 }}>
                          <Space direction="vertical" size={0}>
                            <Text type="secondary">
                              {moment(detection.timestamp).format('HH:mm:ss')}
                            </Text>
                            {detection.cameraName && (
                              <Text type="secondary">
                                Camera: {detection.cameraName}
                              </Text>
                            )}
                          </Space>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LiveView; 