import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Input, Select, Switch, Slider, Space, Table, Tag, Typography, Row, Col, Statistic, Spin, Modal, Alert, Upload, Progress, Tabs } from 'antd';
import { CloudUploadOutlined, RocketOutlined, SettingOutlined, CheckCircleOutlined, SyncOutlined, ExclamationCircleOutlined, UploadOutlined, CodeOutlined, BarChartOutlined, CloudServerOutlined } from '@ant-design/icons';
import { modelAPI } from '../../services/api';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const ModelManagement = () => {
  // State variables
  const [loading, setLoading] = useState(false);
  const [modelData, setModelData] = useState(null);
  const [modelParams, setModelParams] = useState({});
  const [activeTab, setActiveTab] = useState("1");
  const [deploymentHistory, setDeploymentHistory] = useState([]);
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [trainingStatus, setTrainingStatus] = useState('idle');
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [deployModalVisible, setDeployModalVisible] = useState(false);
  const [trainModalVisible, setTrainModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Forms
  const [configForm] = Form.useForm();
  const [deployForm] = Form.useForm();
  const [trainForm] = Form.useForm();
  
  // Load initial data
  useEffect(() => {
    fetchModelData();
    fetchDeploymentHistory();
    fetchModelMetrics();
  }, []);
  
  // Check training status periodically
  useEffect(() => {
    let interval;
    if (trainingStatus === 'training') {
      interval = setInterval(() => {
        checkTrainingStatus();
      }, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [trainingStatus]);
  
  // Fetch current model data
  const fetchModelData = async () => {
    setLoading(true);
    try {
      const response = await modelAPI.getModel();
      setModelData(response.data);
      
      // Initialize form with current values
      if (response.data.parameters) {
        setModelParams(response.data.parameters);
        configForm.setFieldsValue(response.data.parameters);
      }
    } catch (error) {
      console.error('Failed to fetch model data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch deployment history
  const fetchDeploymentHistory = async () => {
    try {
      const response = await modelAPI.getDeploymentHistory();
      setDeploymentHistory(response.data.deployments);
    } catch (error) {
      console.error('Failed to fetch deployment history:', error);
    }
  };
  
  // Fetch model metrics
  const fetchModelMetrics = async () => {
    try {
      const response = await modelAPI.getModelMetrics();
      setModelMetrics(response.data);
    } catch (error) {
      console.error('Failed to fetch model metrics:', error);
    }
  };
  
  // Check training status
  const checkTrainingStatus = async () => {
    try {
      const response = await modelAPI.getTrainingStatus();
      setTrainingStatus(response.data.status);
      setTrainingProgress(response.data.progress);
      
      // If training is complete, fetch logs and update metrics
      if (response.data.status === 'completed') {
        fetchTrainingLogs();
        fetchModelMetrics();
      }
    } catch (error) {
      console.error('Failed to check training status:', error);
    }
  };
  
  // Fetch training logs
  const fetchTrainingLogs = async () => {
    try {
      const response = await modelAPI.getTrainingLogs();
      setTrainingLogs(response.data.logs);
    } catch (error) {
      console.error('Failed to fetch training logs:', error);
    }
  };
  
  // Handle model configuration update
  const handleConfigUpdate = async (values) => {
    setLoading(true);
    try {
      await modelAPI.updateModelConfig(values);
      setModelParams(values);
      setConfigModalVisible(false);
      fetchModelData(); // Refresh data
    } catch (error) {
      console.error('Failed to update model configuration:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle model deployment
  const handleDeploy = async (values) => {
    setLoading(true);
    try {
      await modelAPI.deployModel(values);
      setDeployModalVisible(false);
      fetchDeploymentHistory(); // Refresh deployment history
      fetchModelData(); // Refresh model data
    } catch (error) {
      console.error('Failed to deploy model:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle model training
  const handleTrain = async (values) => {
    setLoading(true);
    try {
      await modelAPI.trainModel(values);
      setTrainModalVisible(false);
      setTrainingStatus('training');
      setTrainingProgress(0);
    } catch (error) {
      console.error('Failed to start model training:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle model upload
  const handleUpload = async ({ file, onProgress }) => {
    const formData = new FormData();
    formData.append('model', file);
    
    try {
      await modelAPI.uploadModel(formData, {
        onUploadProgress: ({ total, loaded }) => {
          const percentage = Math.round((loaded / total) * 100);
          setUploadProgress(percentage);
          onProgress({ percent: percentage });
        }
      });
      
      setUploadModalVisible(false);
      fetchModelData(); // Refresh model data
    } catch (error) {
      console.error('Failed to upload model:', error);
    }
  };
  
  // Get status tag color
  const getStatusColor = (status) => {
    const colorMap = {
      active: 'green',
      inactive: 'orange',
      failed: 'red',
      pending: 'blue',
      training: 'purple',
      completed: 'green',
      idle: 'default'
    };
    
    return colorMap[status] || 'default';
  };
  
  // Format model version
  const formatVersion = (version) => {
    return `v${version}`;
  };
  
  // Deployment history table columns
  const deploymentColumns = [
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      render: version => formatVersion(version)
    },
    {
      title: 'Deployed At',
      dataIndex: 'deployedAt',
      key: 'deployedAt',
      render: date => moment(date).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
    },
    {
      title: 'Deployed By',
      dataIndex: 'deployedBy',
      key: 'deployedBy'
    },
    {
      title: 'Environment',
      dataIndex: 'environment',
      key: 'environment',
      render: env => <Tag>{env}</Tag>
    }
  ];
  
  return (
    <div>
      <Title level={2}>
        <CloudServerOutlined style={{ marginRight: 12 }} />
        AI Model Management
      </Title>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={<span><SettingOutlined /> Model Overview</span>} key="1">
          <Spin spinning={loading}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={16}>
                <Card title="Current Model Configuration">
                  {modelData ? (
                    <>
                      <Row gutter={[16, 16]}>
                        <Col span={8}>
                          <Statistic 
                            title="Model Version" 
                            value={formatVersion(modelData.version)}
                            valueStyle={{ color: '#1890ff' }}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic 
                            title="Status" 
                            value={modelData.status || 'Unknown'} 
                            valueStyle={{ color: modelData.status === 'active' ? '#52c41a' : '#faad14' }}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic 
                            title="Last Updated" 
                            value={moment(modelData.updatedAt).fromNow()} 
                          />
                        </Col>
                      </Row>
                      
                      <Paragraph style={{ marginTop: 20 }}>
                        <Text strong>Description: </Text>
                        {modelData.description || 'No description available.'}
                      </Paragraph>
                      
                      <Paragraph>
                        <Text strong>Framework: </Text>
                        {modelData.framework || 'Unknown'}
                      </Paragraph>
                      
                      <Title level={4} style={{ marginTop: 20 }}>Model Parameters</Title>
                      {Object.entries(modelParams).length > 0 ? (
                        <Row gutter={[16, 8]}>
                          {Object.entries(modelParams).map(([key, value]) => (
                            <Col span={12} key={key}>
                              <Text strong>{key}: </Text> 
                              {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                            </Col>
                          ))}
                        </Row>
                      ) : (
                        <Text>No parameters available</Text>
                      )}
                    </>
                  ) : (
                    <Text>No model data available</Text>
                  )}
                </Card>
              </Col>
              
              <Col xs={24} md={8}>
                <Card title="Actions">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button 
                      type="primary" 
                      icon={<SettingOutlined />} 
                      block
                      onClick={() => setConfigModalVisible(true)}
                    >
                      Configure Model
                    </Button>
                    
                    <Button 
                      type="primary" 
                      icon={<RocketOutlined />} 
                      block
                      onClick={() => setDeployModalVisible(true)}
                      danger
                    >
                      Deploy Model
                    </Button>
                    
                    <Button 
                      icon={<SyncOutlined />} 
                      block
                      onClick={() => setTrainModalVisible(true)}
                    >
                      Train Model
                    </Button>
                    
                    <Button 
                      icon={<UploadOutlined />} 
                      block
                      onClick={() => setUploadModalVisible(true)}
                    >
                      Upload Model
                    </Button>
                  </Space>
                </Card>
                
                {modelMetrics && (
                  <Card title="Model Metrics" style={{ marginTop: 16 }}>
                    <Statistic 
                      title="Accuracy" 
                      value={modelMetrics.accuracy} 
                      suffix="%" 
                      precision={2}
                      valueStyle={{ color: '#1890ff' }}
                    />
                    <Statistic 
                      title="Precision" 
                      value={modelMetrics.precision} 
                      suffix="%" 
                      precision={2}
                      style={{ marginTop: 16 }}
                    />
                    <Statistic 
                      title="Recall" 
                      value={modelMetrics.recall} 
                      suffix="%" 
                      precision={2}
                      style={{ marginTop: 16 }}
                    />
                    <Statistic 
                      title="Processing Rate" 
                      value={modelMetrics.fps} 
                      suffix="FPS" 
                      precision={1}
                      style={{ marginTop: 16 }}
                    />
                  </Card>
                )}
              </Col>
            </Row>
          </Spin>
        </TabPane>
        
        <TabPane tab={<span><BarChartOutlined /> Performance</span>} key="2">
          <Card title="Model Performance Metrics">
            {modelMetrics ? (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card type="inner" title="Detection Accuracy">
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Statistic 
                          title="Overall Accuracy" 
                          value={modelMetrics.accuracy} 
                          suffix="%" 
                          precision={2}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic 
                          title="F1 Score" 
                          value={modelMetrics.f1Score} 
                          precision={2}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic 
                          title="Precision" 
                          value={modelMetrics.precision} 
                          suffix="%" 
                          precision={2}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic 
                          title="Recall" 
                          value={modelMetrics.recall} 
                          suffix="%" 
                          precision={2}
                        />
                      </Col>
                    </Row>
                  </Card>
                </Col>
                
                <Col xs={24} md={12}>
                  <Card type="inner" title="Performance Metrics">
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Statistic 
                          title="Inference Time" 
                          value={modelMetrics.inferenceTime} 
                          suffix="ms" 
                          precision={1}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic 
                          title="Processing Rate" 
                          value={modelMetrics.fps} 
                          suffix="FPS" 
                          precision={1}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic 
                          title="Memory Usage" 
                          value={modelMetrics.memoryUsage / 1024} 
                          suffix="MB" 
                          precision={0}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic 
                          title="GPU Utilization" 
                          value={modelMetrics.gpuUtilization} 
                          suffix="%" 
                          precision={0}
                        />
                      </Col>
                    </Row>
                  </Card>
                </Col>
                
                <Col span={24}>
                  <Card type="inner" title="Per-Class Performance">
                    <Table 
                      dataSource={modelMetrics.classMetrics} 
                      rowKey="className"
                      pagination={false}
                      size="small"
                      columns={[
                        {
                          title: 'Class',
                          dataIndex: 'className',
                          key: 'className'
                        },
                        {
                          title: 'Precision',
                          dataIndex: 'precision',
                          key: 'precision',
                          render: value => `${(value * 100).toFixed(2)}%`
                        },
                        {
                          title: 'Recall',
                          dataIndex: 'recall',
                          key: 'recall',
                          render: value => `${(value * 100).toFixed(2)}%`
                        },
                        {
                          title: 'F1 Score',
                          dataIndex: 'f1Score',
                          key: 'f1Score',
                          render: value => value.toFixed(2)
                        },
                        {
                          title: 'True Positives',
                          dataIndex: 'truePositives',
                          key: 'truePositives'
                        },
                        {
                          title: 'False Positives',
                          dataIndex: 'falsePositives',
                          key: 'falsePositives'
                        }
                      ]}
                    />
                  </Card>
                </Col>
              </Row>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text>No performance data available</Text>
              </div>
            )}
          </Card>
        </TabPane>
        
        <TabPane tab={<span><RocketOutlined /> Deployment History</span>} key="3">
          <Card>
            <Table 
              dataSource={deploymentHistory} 
              columns={deploymentColumns} 
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>
        
        <TabPane tab={<span><CodeOutlined /> Training Logs</span>} key="4">
          <Card title="Training Status">
            {trainingStatus === 'training' && (
              <div style={{ marginBottom: 16 }}>
                <Progress percent={trainingProgress} status="active" />
              </div>
            )}
            
            <div style={{ marginBottom: 16 }}>
              <Tag color={getStatusColor(trainingStatus)}>
                {trainingStatus.toUpperCase()}
              </Tag>
            </div>
            
            <Card
              type="inner"
              title="Training Logs"
              style={{ height: 400, overflow: 'auto' }}
            >
              {trainingLogs.length > 0 ? (
                <pre style={{ whiteSpace: 'pre-wrap' }}>
                  {trainingLogs.join('\n')}
                </pre>
              ) : (
                <Text>No training logs available</Text>
              )}
            </Card>
          </Card>
        </TabPane>
      </Tabs>
      
      {/* Configure Model Modal */}
      <Modal
        title="Configure Model"
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={configForm}
          layout="vertical"
          onFinish={handleConfigUpdate}
          initialValues={modelParams}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="confidenceThreshold"
                label="Confidence Threshold (%)"
                rules={[{ required: true, message: 'Please set the confidence threshold' }]}
              >
                <Slider min={0} max={100} step={1} tipFormatter={value => `${value}%`} />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="maxDetections"
                label="Maximum Detections per Frame"
                rules={[{ required: true, message: 'Please set maximum detections' }]}
              >
                <Slider min={1} max={100} step={1} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="batchSize"
                label="Batch Size"
                rules={[{ required: true, message: 'Please enter the batch size' }]}
              >
                <Select>
                  <Option value={1}>1</Option>
                  <Option value={2}>2</Option>
                  <Option value={4}>4</Option>
                  <Option value={8}>8</Option>
                  <Option value={16}>16</Option>
                  <Option value={32}>32</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="device"
                label="Processing Device"
                rules={[{ required: true, message: 'Please select a device' }]}
              >
                <Select>
                  <Option value="cpu">CPU</Option>
                  <Option value="cuda">GPU (CUDA)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="enabledClasses"
            label="Enabled Detection Classes"
            rules={[{ required: true, message: 'Please select at least one class' }]}
          >
            <Select mode="multiple" placeholder="Select detection classes">
              <Option value="person">Person</Option>
              <Option value="weapon">Weapon</Option>
              <Option value="balaclava">Balaclava</Option>
              <Option value="assault">Assault</Option>
              <Option value="suspect">Suspect</Option>
              <Option value="intrusion">Intrusion</Option>
              <Option value="theft">Theft</Option>
            </Select>
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="enableTracking" valuePropName="checked">
                <Switch checkedChildren="Tracking Enabled" unCheckedChildren="Tracking Disabled" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item name="enabledAugmentation" valuePropName="checked">
                <Switch checkedChildren="Data Augmentation On" unCheckedChildren="Data Augmentation Off" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Save Configuration
              </Button>
              <Button onClick={() => setConfigModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Deploy Model Modal */}
      <Modal
        title="Deploy Model"
        open={deployModalVisible}
        onCancel={() => setDeployModalVisible(false)}
        footer={null}
      >
        <Alert
          message="Warning"
          description="Deploying a new model will restart the detection service. This may cause a brief interruption in the detection pipeline."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form
          form={deployForm}
          layout="vertical"
          onFinish={handleDeploy}
        >
          <Form.Item
            name="environment"
            label="Deployment Environment"
            rules={[{ required: true, message: 'Please select an environment' }]}
            initialValue="production"
          >
            <Select>
              <Option value="production">Production</Option>
              <Option value="staging">Staging</Option>
              <Option value="development">Development</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="version"
            label="Model Version"
            rules={[{ required: true, message: 'Please select a version' }]}
            initialValue={modelData?.version}
          >
            <Select>
              <Option value={modelData?.version}>{formatVersion(modelData?.version)}</Option>
              {/* Could include previous versions here */}
            </Select>
          </Form.Item>
          
          <Form.Item name="rollbackEnabled" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Auto-Rollback Enabled" unCheckedChildren="Auto-Rollback Disabled" />
          </Form.Item>
          
          <Form.Item
            name="notes"
            label="Deployment Notes"
          >
            <Input.TextArea rows={4} placeholder="Enter optional deployment notes" />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" danger htmlType="submit" loading={loading}>
                Deploy Model
              </Button>
              <Button onClick={() => setDeployModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Train Model Modal */}
      <Modal
        title="Train Model"
        open={trainModalVisible}
        onCancel={() => setTrainModalVisible(false)}
        footer={null}
      >
        <Form
          form={trainForm}
          layout="vertical"
          onFinish={handleTrain}
        >
          <Form.Item
            name="dataset"
            label="Training Dataset"
            rules={[{ required: true, message: 'Please select a dataset' }]}
          >
            <Select>
              <Option value="default">Default Dataset</Option>
              <Option value="extended">Extended Dataset</Option>
              <Option value="custom">Custom Dataset</Option>
            </Select>
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="epochs"
                label="Number of Epochs"
                rules={[{ required: true, message: 'Please enter number of epochs' }]}
                initialValue={50}
              >
                <Input type="number" min={1} max={1000} />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="learningRate"
                label="Learning Rate"
                rules={[{ required: true, message: 'Please enter learning rate' }]}
                initialValue={0.001}
              >
                <Input type="number" step={0.0001} min={0.0001} max={0.1} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="enableAugmentation" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Data Augmentation Enabled" unCheckedChildren="Data Augmentation Disabled" />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Start Training
              </Button>
              <Button onClick={() => setTrainModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Upload Model Modal */}
      <Modal
        title="Upload Model"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
      >
        <Upload.Dragger
          name="model"
          customRequest={handleUpload}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <CloudUploadOutlined />
          </p>
          <p className="ant-upload-text">Click or drag model file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for .pt, .pth, .onnx model files. Maximum size: 500MB.
          </p>
        </Upload.Dragger>
        
        {uploadProgress > 0 && (
          <Progress percent={uploadProgress} style={{ marginTop: 16 }} />
        )}
        
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button onClick={() => setUploadModalVisible(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ModelManagement; 