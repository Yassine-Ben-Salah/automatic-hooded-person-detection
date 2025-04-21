import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Tag, Button, Space, Modal, Form, Input, Select, DatePicker, Row, Col, Tooltip, Typography, Image, Spin, message, Alert, Switch, Badge, Pagination, Drawer, Descriptions } from 'antd';
import {
  EyeOutlined, EditOutlined, SearchOutlined, FilterOutlined, DownloadOutlined, 
  CheckCircleOutlined, CloseCircleOutlined, AlertOutlined, ReloadOutlined, 
  WarningOutlined, SyncOutlined, DeleteOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import { useDetection } from '../../contexts/DetectionContext';
import { useLocation, useNavigate } from 'react-router-dom';
import moment from 'moment';
import queryString from 'query-string';
import styled from 'styled-components';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const DetectionHistory = () => {
  const { 
    detections: contextDetections, 
    totalDetections,
    loading: contextLoading, 
    error: contextError,
    backendAvailable,
    fetchDetections,
    getDetection,
    updateDetection,
    fetchDetectionLabels,
    availableLabels = [],
    cameras = []
  } = useDetection();

  // State variables
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [selectedDetection, setSelectedDetection] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [updateVisible, setUpdateVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    label: '',
    status: '',
    dateRange: null,
    camera: ''
  });
  const [initialUpdateValues, setInitialUpdateValues] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Form instances
  const [filterForm] = Form.useForm();
  const [updateForm] = Form.useForm();

  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = queryString.parse(location.search);

  // Load detections based on current filters and search term
  const loadDetections = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Loading detections with filters:", filters);
      console.log("Search text:", searchText);
      
      // Prepare query parameters for the API call
      const params = {
        page: currentPage,
        limit: pageSize,
        ...(filters.label && { label: filters.label }),
        ...(filters.status && { status: filters.status }),
        ...(filters.camera && { camera: filters.camera }),
        ...(searchText && { search: searchText })
      };
      
      // Add date range if it exists
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }
      
      console.log("Fetching with params:", params);
      
      // Fetch detections directly from context
      const result = await fetchDetections(currentPage, pageSize, params);
      
      if (result && result.detections) {
        setDataSource(result.detections.map(detection => ({
          ...detection,
          key: detection._id,
          // Format date for display
          timestamp: moment(detection.timestamp).format('YYYY-MM-DD HH:mm:ss')
        })));
        setTotalItems(result.total || 0);
      } else {
        setDataSource([]);
        setTotalItems(0);
      }
    } catch (err) {
      console.error("Error loading detections:", err);
      setError("Failed to load detections. Please try again.");
      message.error("Failed to load detections. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters, searchText, fetchDetections]);

  // Load available labels for filter dropdown
  const loadLabels = useCallback(async () => {
    try {
      await fetchDetectionLabels();
    } catch (err) {
      console.error('Failed to load labels:', err);
    }
  }, [fetchDetectionLabels]);
  
  // Handle view details
  const handleViewDetails = useCallback(async (id) => {
    try {
      if (!id) {
        console.error('No detection ID provided');
        message.error('Cannot view details: Detection ID is missing');
        return;
      }
      
      const response = await getDetection(id);
      if (response && response.detection) {
        setSelectedDetection(response.detection);
        setDetailsVisible(true);
      } else {
        message.error('Detection details not found');
      }
    } catch (error) {
      console.error('Failed to load detection details:', error);
      message.error('Failed to load detection details');
    }
  }, [getDetection]);
  
  // Auto-refresh data every 30 seconds if enabled
  useEffect(() => {
    let refreshInterval;
    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        loadDetections();
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [autoRefresh, loadDetections]);
  
  // Load detections immediately when component mounts
  useEffect(() => {
    loadDetections();
  }, [loadDetections]);
  
  // Load detections when filters change
  useEffect(() => {
    loadDetections();
    loadLabels();
  }, [currentPage, pageSize, filters, searchText, forceRefresh, loadDetections, loadLabels]);
  
  // Update URL when filters change
  useEffect(() => {
    const newParams = {
      page: currentPage,
      limit: pageSize,
      ...(filters.label && { label: filters.label }),
      ...(filters.status && { status: filters.status }),
      ...(filters.dateRange && { 
        startDate: filters.dateRange[0].format('YYYY-MM-DD'),
        endDate: filters.dateRange[1].format('YYYY-MM-DD')
      }),
      ...(filters.camera && { camera: filters.camera }),
      ...(searchText && { search: searchText })
    };
    
    navigate({ search: queryString.stringify(newParams) });
  }, [currentPage, pageSize, filters, searchText, navigate]);
  
  // Load individual detection if ID is in URL
  useEffect(() => {
    if (queryParams.id) {
      handleViewDetails(queryParams.id);
    }
  }, [queryParams.id, handleViewDetails]);
  
  // Initialize from URL parameters when component mounts
  useEffect(() => {
    const urlFilters = {};
    if (queryParams.label) urlFilters.label = queryParams.label;
    if (queryParams.status) urlFilters.status = queryParams.status;
    if (queryParams.camera) urlFilters.camera = queryParams.camera;
    if (queryParams.startDate && queryParams.endDate) {
      urlFilters.dateRange = [
        moment(queryParams.startDate),
        moment(queryParams.endDate)
      ];
    }
    
    if (Object.keys(urlFilters).length > 0) {
      setFilters(prevFilters => ({
        ...prevFilters,
        ...urlFilters
      }));
    }
    
    if (queryParams.search) {
      setSearchText(queryParams.search);
    }
    
    if (queryParams.page) {
      setCurrentPage(parseInt(queryParams.page, 10));
    }
    
    if (queryParams.limit) {
      setPageSize(parseInt(queryParams.limit, 10));
    }
  }, []);
  
  // Update active filters count
  useEffect(() => {
    let count = 0;
    if (filters.label) count++;
    if (filters.status) count++;
    if (filters.dateRange) count++;
    if (filters.camera) count++;
    if (searchText) count++;
    setActiveFiltersCount(count);
  }, [filters, searchText]);

  // Initialize filterForm with current filter values
  useEffect(() => {
    filterForm.setFieldsValue({
      label: filters.label,
      status: filters.status,
      dateRange: filters.dateRange,
      camera: filters.camera
    });
  }, [filters, filterForm]);

  // Handle filter application from modal
  const handleApplyFilters = (formValues) => {
    console.log("Applying filters:", formValues);
    
    // Apply the form values to the filters state
    setFilters({
      label: formValues.label || '',
      status: formValues.status || '',
      dateRange: formValues.dateRange || null,
      camera: formValues.camera || '',
    });
    
    setCurrentPage(1); // Reset to first page when filters change
    setFilterVisible(false);
  };
  
  // Handle search
  const handleSearch = () => {
    console.log("Searching for:", searchText);
    // Update the filters state to trigger the loadDetections effect
    setFilters(prevFilters => ({
      ...prevFilters
    }));
    setCurrentPage(1);
  };
  
  // Clear search
  const handleClearSearch = () => {
    setSearchText('');
    // Trigger a reload after clearing search
    setTimeout(() => {
      handleSearch();
    }, 0);
  };
  
  // Handle status update
  const handleStatusUpdate = useCallback((id) => {
    const detection = dataSource.find(d => d._id === id);
    if (detection) {
      console.log('Opening update modal for detection:', detection);
      setSelectedDetection(detection);
      setInitialUpdateValues({
        status: detection.status || 'pending',
        notes: detection.notes || ''
      });
      updateForm.setFieldsValue({
        status: detection.status || 'pending',
        notes: detection.notes || ''
      });
      setUpdateVisible(true);
    }
  }, [dataSource, updateForm]);

  // Handle update submit
  const handleUpdateSubmit = useCallback(async () => {
    try {
      setUpdateLoading(true);
      const values = await updateForm.validateFields();
      console.log('Updating detection', selectedDetection?._id, 'with values:', values);
      
      if (!selectedDetection?._id) {
        message.error('No detection selected for update');
        setUpdateLoading(false);
        return;
      }
      
      // Call API to update detection
      await updateDetection(selectedDetection._id, values);
      
      // Close modal and show success message
      setUpdateVisible(false);
      message.success(`Detection status updated to ${values.status}`);
      
      // Trigger a data reload after a short delay
      setTimeout(() => {
        console.log('Reloading data after status update');
        setForceRefresh(prev => prev + 1);
      }, 500);
    } catch (err) {
      console.error('Error updating detection:', err);
      message.error('Failed to update detection: ' + (err.message || 'Unknown error'));
    } finally {
      setUpdateLoading(false);
    }
  }, [selectedDetection, updateForm, updateDetection]);

  // Helper function to get color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'orange';
      case 'confirmed':
        return 'green';
      case 'rejected':
        return 'red';
      case 'reviewing':
        return 'blue';
      default:
        return 'default'; // Default case for unexpected status values
    }
  };
  
  // Helper function to get icon based on status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockCircleOutlined />;
      case 'confirmed':
        return <CheckCircleOutlined />;
      case 'rejected':
        return <CloseCircleOutlined />;
      case 'reviewing':
        return <WarningOutlined />;
      default:
        return null;
    }
  };
  
  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: 'id',
      width: 80,
      render: (id) => {
        const displayId = id ? id.toString() : '';
        return <Typography.Text copyable>{displayId.substring(0, 8)}</Typography.Text>;
      }
    },
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'image',
      width: 120,
      render: (imageUrl, record) => (
        <Image
          src={imageUrl || 'https://via.placeholder.com/300/FF0000/FFFFFF?text=No+Image'}
          alt={`Detection ${record._id}`}
          style={{ width: 100, height: 60, objectFit: 'cover' }}
          fallback="https://via.placeholder.com/300/FF0000/FFFFFF?text=Error+Loading+Image"
          preview={{
            maskClassName: 'customize-mask',
            mask: <EyeOutlined style={{ fontSize: '16px' }} />
          }}
        />
      )
    },
    {
      title: 'Label',
      dataIndex: 'label',
      key: 'label',
      width: 120,
      render: (label) => <Tag color="blue">{label || 'Unknown'}</Tag>
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 100,
      sorter: (a, b) => {
        const aVal = typeof a.confidence === 'number' ? a.confidence : 
                    parseFloat(a.confidence?.toString().replace('%', '') || '0');
        const bVal = typeof b.confidence === 'number' ? b.confidence : 
                    parseFloat(b.confidence?.toString().replace('%', '') || '0');
        return aVal - bVal;
      },
      render: (confidence) => {
        if (confidence === undefined || confidence === null) return 'Unknown';
        
        // If it's already a string with % sign, use it directly
        if (typeof confidence === 'string' && confidence.includes('%')) {
          return confidence;
        }
        
        // If it's a number, convert to percentage string
        if (typeof confidence === 'number') {
          // Check if it's a decimal (less than 1) or whole number (confidence value)
          if (confidence <= 1) {
            return `${(confidence * 100).toFixed(2)}%`;
          } else {
            return `${confidence.toFixed(2)}%`;
          }
        }
        
        // Return as is with % sign if needed
        return confidence.toString().includes('%') ? confidence : `${confidence}%`;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Confirmed', value: 'confirmed' },
        { text: 'False Alarm', value: 'false_alarm' },
        { text: 'Under Review', value: 'under_review' }
      ],
      render: (status) => {
        let color = 'default';
        let icon = null;
        let text = 'Unknown';

        switch(status) {
          case 'pending':
            color = 'default';
            icon = <ClockCircleOutlined />;
            text = 'Pending';
            break;
          case 'confirmed':
            color = 'success';
            icon = <CheckCircleOutlined />;
            text = 'Confirmed';
            break;
          case 'false_alarm':
            color = 'error';
            icon = <CloseCircleOutlined />;
            text = 'False Alarm';
            break;
          case 'under_review':
            color = 'warning';
            icon = <WarningOutlined />;
            text = 'Under Review';
            break;
          default:
            break;
        }

        return (
          <Tag icon={icon} color={color}>
            {text}
          </Tag>
        );
      }
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      sorter: (a, b) => moment(a.timestamp).unix() - moment(b.timestamp).unix(),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Camera',
      dataIndex: 'camera',
      key: 'camera',
      width: 120,
      render: (cameraId) => {
        const camera = cameras.find(c => c.id?.toString() === cameraId?.toString());
        return camera ? camera.name : 'Unknown Camera';
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => handleViewDetails(record._id)}
            title="View Details"
          />
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleStatusUpdate(record._id)}
            title="Update Status"
          />
        </Space>
      )
    }
  ];
  
  // Render filter badge
  const renderFilterButton = () => {
    return (
      <Badge count={activeFiltersCount} size="small">
        <Button 
          icon={<FilterOutlined />} 
          onClick={() => setFilterVisible(true)}
          type={activeFiltersCount > 0 ? "primary" : "default"}
        >
          Filters
        </Button>
      </Badge>
    );
  };
  
  // Handle reset filters
  const handleResetFilters = () => {
    console.log("Resetting all filters");
    filterForm.resetFields();
    setFilters({
      label: '',
      status: '',
      dateRange: null,
      camera: ''
    });
    setSearchText('');
    setCurrentPage(1);
    setFilterVisible(false);
    // Force a refresh with cleared filters
    setForceRefresh(prev => prev + 1);
  };

  return (
    <div>
      <Title level={2}>
        <AlertOutlined style={{ marginRight: 12 }} />
        Detection History
      </Title>
      
      {!backendAvailable && (
        <Alert
          message="Working in Offline Mode"
          description="The backend server is currently unavailable. You are working with locally stored data. Changes will be saved locally and synchronized when the backend becomes available."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      {/* Search and Filter Bar */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Search by ID or notes"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              suffix={<SearchOutlined onClick={handleSearch} style={{ cursor: 'pointer' }} />}
            />
          </Col>
          <Col xs={24} sm={12} md={16} lg={18}>
            <Space>
              {renderFilterButton()}
              <Button 
                icon={<ReloadOutlined />}
                onClick={() => setForceRefresh(prev => prev + 1)}
                loading={loading}
              >
                Refresh
              </Button>
              <Switch
                checkedChildren="Auto Refresh On"
                unCheckedChildren="Auto Refresh Off"
                checked={autoRefresh}
                onChange={setAutoRefresh}
              />
            </Space>
          </Col>
        </Row>
      </Card>
      
      {/* Table */}
      <Card>
        <Spin spinning={loading || contextLoading} tip="Loading detections...">
          {(error || contextError) && <Alert message={error || contextError} type="error" showIcon style={{ marginBottom: 16 }} />}
          
          <Table
            dataSource={dataSource}
            columns={columns}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalItems,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Total ${total} items`
            }}
            scroll={{ x: 1000 }}
            size="middle"
            rowKey="_id"
          />
        </Spin>
      </Card>

      {/* Filter Modal */}
      <Modal
        title="Filter Detections"
        open={filterVisible}
        onCancel={() => setFilterVisible(false)}
        footer={[
          <Button key="clear" onClick={handleResetFilters}>
            Clear Filters
          </Button>,
          <Button key="apply" type="primary" onClick={() => {
            filterForm.validateFields().then(values => {
              handleApplyFilters(values);
            });
          }}>
            Apply
          </Button>
        ]}
      >
        <Form
          form={filterForm}
          layout="vertical"
          initialValues={{
            label: filters.label,
            status: filters.status,
            dateRange: filters.dateRange,
            camera: filters.camera
          }}
        >
          <Form.Item name="label" label="Label">
            <Select
              allowClear
              placeholder="Filter by label"
              options={availableLabels.map(label => ({ value: label, label: label }))}
            />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select
              allowClear
              placeholder="Filter by status"
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'false_alarm', label: 'False Alarm' },
                { value: 'under_review', label: 'Under Review' }
              ]}
            />
          </Form.Item>
          <Form.Item name="camera" label="Camera">
            <Select
              allowClear
              placeholder="Filter by camera"
              options={cameras.map(camera => ({ value: camera.id.toString(), label: camera.name }))}
            />
          </Form.Item>
          <Form.Item name="dateRange" label="Date Range">
            <DatePicker.RangePicker 
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Details Modal */}
      <Modal
        title={`Detection Details - ${selectedDetection?.label}`}
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Close
          </Button>,
          <Button 
            key="update" 
            type="primary" 
            onClick={() => {
              setDetailsVisible(false);
              handleStatusUpdate(selectedDetection?._id);
            }}
          >
            Update Status
          </Button>
        ]}
        width={800}
      >
        {selectedDetection && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Image
                  src={selectedDetection.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
                  alt="Detection"
                  style={{ width: '100%', maxHeight: '300px', objectFit: 'contain' }}
                  fallback="https://via.placeholder.com/400x300?text=Error"
                />
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>ID:</Text> {selectedDetection._id}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Type:</Text>{' '}
                  <Tag color="blue">{selectedDetection.label}</Tag>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Camera:</Text>{' '}
                  {selectedDetection.cameraName || selectedDetection.camera || 'Unknown'}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Date & Time:</Text>{' '}
                  {moment(selectedDetection.timestamp).format('MMMM Do YYYY, h:mm:ss a')}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Confidence:</Text> {typeof selectedDetection.confidence === 'number' 
                    ? `${selectedDetection.confidence.toFixed(2)}%` 
                    : selectedDetection.confidence}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Status:</Text>{' '}
                  {(() => {
                    switch (selectedDetection.status) {
                      case 'confirmed':
                        return <Tag color="success">Confirmed</Tag>;
                      case 'false_alarm':
                        return <Tag color="error">False Alarm</Tag>;
                      case 'reviewed':
                        return <Tag color="warning">Reviewed</Tag>;
                      default:
                        return <Tag color="processing">Pending</Tag>;
                    }
                  })()}
                </div>
                {selectedDetection.notes && (
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Notes:</Text><br />
                    {selectedDetection.notes}
                  </div>
                )}
              </Col>
            </Row>
          </div>
        )}
      </Modal>
      
      {/* Update Modal */}
      <Modal
        title="Update Detection Status"
        open={updateVisible}
        onCancel={() => setUpdateVisible(false)}
        footer={null}
        maskClosable={false}
        destroyOnClose={true}
      >
        {selectedDetection && (
          <Form
            form={updateForm}
            layout="vertical"
            onFinish={handleUpdateSubmit}
            initialValues={{
              status: selectedDetection.status || 'pending',
              notes: selectedDetection.notes || ''
            }}
          >
            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: 'Please select a status' }]}
            >
              <Select>
                <Option value="pending">
                  <Space><Tag color="processing">Pending</Tag></Space>
                </Option>
                <Option value="confirmed">
                  <Space><Tag color="success">Confirmed</Tag> <CheckCircleOutlined /></Space>
                </Option>
                <Option value="false_alarm">
                  <Space><Tag color="error">False Alarm</Tag> <CloseCircleOutlined /></Space>
                </Option>
                <Option value="reviewed">
                  <Space><Tag color="warning">Reviewed</Tag></Space>
                </Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              label="Notes"
              name="notes"
            >
              <Input.TextArea rows={4} placeholder="Add notes about this detection" />
            </Form.Item>
            
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={updateLoading}>
                  Update Status
                </Button>
                <Button onClick={() => setUpdateVisible(false)} disabled={updateLoading}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default DetectionHistory; 