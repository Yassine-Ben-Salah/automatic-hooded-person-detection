import React, { useState, useEffect } from 'react';
import { Table, Card, Row, Col, DatePicker, Select, Input, Button, Tag, Modal, Form, Spin, Typography, Space } from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  EyeOutlined, 
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useDetection } from '../../contexts/DetectionContext';
import { useAuth } from '../../contexts/AuthContext';
import moment from 'moment';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const DetectionHistory = () => {
  const { fetchDetections, updateDetection, deleteDetection, loading, error } = useDetection();
  const { isAdmin } = useAuth();
  const [detections, setDetections] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});
  const [selectedDetection, setSelectedDetection] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [form] = Form.useForm();
  
  // Fetch detections on mount and when filters change
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const result = await fetchDetections(page, pageSize, filters);
        setDetections(result.detections);
        setTotal(result.total);
      } catch (error) {
        console.error('Failed to fetch detections:', error);
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchData();
  }, [fetchDetections, page, pageSize, filters]);
  
  // Handle pagination change
  const handleTableChange = (pagination) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
  };
  
  // Handle filter changes
  const handleFilterChange = (key, value) => {
    if (value === undefined || value === null || value === '') {
      const newFilters = { ...filters };
      delete newFilters[key];
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, [key]: value });
    }
    setPage(1); // Reset to first page when filters change
  };
  
  // Handle date range filter
  const handleDateRangeChange = (dates) => {
    if (!dates || dates.length === 0) {
      const newFilters = { ...filters };
      delete newFilters.startDate;
      delete newFilters.endDate;
      setFilters(newFilters);
    } else {
      setFilters({
        ...filters,
        startDate: dates[0].startOf('day').toISOString(),
        endDate: dates[1].endOf('day').toISOString()
      });
    }
    setPage(1);
  };
  
  // Open modal to review a detection
  const openReviewModal = (detection) => {
    setSelectedDetection(detection);
    form.setFieldsValue({
      status: detection.status,
      notes: detection.notes
    });
    setIsModalVisible(true);
  };
  
  // Submit review
  const handleReviewSubmit = async () => {
    try {
      const values = await form.validateFields();
      await updateDetection(selectedDetection._id, values);
      setIsModalVisible(false);
      
      // Refresh the data
      const result = await fetchDetections(page, pageSize, filters);
      setDetections(result.detections);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to update detection:', err);
    }
  };
  
  // Handle detection deletion
  const handleDeleteDetection = async (id) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this detection?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteDetection(id);
          // Refresh the data
          const result = await fetchDetections(page, pageSize, filters);
          setDetections(result.detections);
          setTotal(result.total);
        } catch (err) {
          console.error('Failed to delete detection:', err);
        }
      }
    });
  };
  
  // Export detections as CSV
  const exportToCSV = () => {
    // Create CSV header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Label,Confidence,Date,Time,Status,Notes\n";
    
    // Add each detection to CSV
    detections.forEach(item => {
      const timestamp = moment(item.timestamp);
      const row = [
        item._id,
        item.label,
        `${item.confidence}%`,
        timestamp.format('YYYY-MM-DD'),
        timestamp.format('HH:mm:ss'),
        item.status,
        item.notes ? `"${item.notes.replace(/"/g, '""')}"` : ""
      ];
      csvContent += row.join(',') + '\n';
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `detections_${moment().format('YYYY-MM-DD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: '_id',
      ellipsis: true,
      width: 80,
      render: id => <span style={{ fontFamily: 'monospace' }}>{id.substr(id.length - 6)}</span>
    },
    {
      title: 'Type',
      dataIndex: 'label',
      key: 'label',
      filters: [
        { text: 'Assault', value: 'Assault' },
        { text: 'Balaclava', value: 'Balaclava' },
        { text: 'Intrusion', value: 'Intrusion' },
        { text: 'Suspect', value: 'Suspect' },
        { text: 'Weapons', value: 'Weapons' },
        { text: 'Bags Theft', value: 'Bags Theft' },
        { text: 'Undefined', value: 'Undefined' }
      ],
      render: label => {
        let color = '';
        if (['Assault', 'Weapons'].includes(label)) color = 'red';
        if (['Balaclava', 'Intrusion'].includes(label)) color = 'orange';
        if (['Suspect', 'Bags Theft'].includes(label)) color = 'gold';
        
        return <Tag color={color}>{label}</Tag>;
      }
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      render: confidence => `${confidence}%`,
      sorter: (a, b) => a.confidence - b.confidence
    },
    {
      title: 'Date/Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: timestamp => moment(timestamp).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Reviewed', value: 'reviewed' },
        { text: 'Confirmed', value: 'confirmed' },
        { text: 'False Alarm', value: 'false_alarm' }
      ],
      render: status => {
        let icon = <ClockCircleOutlined />;
        let color = 'blue';
        
        if (status === 'confirmed') {
          icon = <CheckCircleOutlined />;
          color = 'green';
        } else if (status === 'false_alarm') {
          icon = <CloseCircleOutlined />;
          color = 'red';
        } else if (status === 'reviewed') {
          icon = <EyeOutlined />;
          color = 'purple';
        }
        
        return (
          <Tag icon={icon} color={color}>
            {status.replace('_', ' ').toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: notes => notes || '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => openReviewModal(record)}
          >
            Review
          </Button>
          {isAdmin() && (
            <Button 
              danger 
              size="small"
              icon={<DeleteOutlined />} 
              onClick={() => handleDeleteDetection(record._id)}
            >
              Delete
            </Button>
          )}
        </Space>
      )
    }
  ];
  
  return (
    <div>
      <Row gutter={[16, 16]} align="middle">
        <Col flex="auto">
          <Title level={2}>Detection History</Title>
        </Col>
        <Col>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => {
                setFilters({});
                fetchDetections(1, pageSize, {});
                setPage(1);
              }}
            >
              Reset Filters
            </Button>
            <Button 
              type="primary" 
              icon={<ExportOutlined />} 
              onClick={exportToCSV}
              disabled={detections.length === 0}
            >
              Export to CSV
            </Button>
          </Space>
        </Col>
      </Row>
      
      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8} lg={6}>
            <Title level={5}>Date Range</Title>
            <RangePicker 
              style={{ width: '100%' }}
              onChange={handleDateRangeChange} 
              value={
                filters.startDate && filters.endDate 
                  ? [moment(filters.startDate), moment(filters.endDate)]
                  : null
              }
            />
          </Col>
          
          <Col xs={24} md={8} lg={6}>
            <Title level={5}>Detection Type</Title>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Select type"
              onChange={value => handleFilterChange('label', value)}
              value={filters.label}
            >
              <Option value="Assault">Assault</Option>
              <Option value="Balaclava">Balaclava</Option>
              <Option value="Intrusion">Intrusion</Option>
              <Option value="Suspect">Suspect</Option>
              <Option value="Weapons">Weapons</Option>
              <Option value="Bags Theft">Bags Theft</Option>
              <Option value="Undefined">Undefined</Option>
            </Select>
          </Col>
          
          <Col xs={24} md={8} lg={6}>
            <Title level={5}>Status</Title>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Select status"
              onChange={value => handleFilterChange('status', value)}
              value={filters.status}
            >
              <Option value="pending">Pending</Option>
              <Option value="reviewed">Reviewed</Option>
              <Option value="confirmed">Confirmed</Option>
              <Option value="false_alarm">False Alarm</Option>
            </Select>
          </Col>
          
          <Col xs={24} md={8} lg={6}>
            <Title level={5}>Search</Title>
            <Input
              placeholder="Search notes"
              prefix={<SearchOutlined />}
              onChange={e => handleFilterChange('search', e.target.value)}
              value={filters.search}
              allowClear
            />
          </Col>
        </Row>
      </Card>
      
      {/* Detections Table */}
      <Spin spinning={loadingData}>
        <Table
          columns={columns}
          dataSource={detections}
          rowKey="_id"
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: total => `Total ${total} detections`
          }}
          onChange={handleTableChange}
          scroll={{ x: true }}
        />
      </Spin>
      
      {/* Review Modal */}
      <Modal
        title="Update Detection Status"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleReviewSubmit}
      >
        {selectedDetection && (
          <Form form={form} layout="vertical">
            <Form.Item label="Detection Type">
              <Input value={selectedDetection.label} disabled />
            </Form.Item>
            
            <Form.Item label="Confidence">
              <Input value={`${selectedDetection.confidence}%`} disabled />
            </Form.Item>
            
            <Form.Item label="Timestamp">
              <Input value={moment(selectedDetection.timestamp).format('YYYY-MM-DD HH:mm:ss')} disabled />
            </Form.Item>
            
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select a status' }]}
            >
              <Select placeholder="Select status">
                <Option value="pending">Pending</Option>
                <Option value="reviewed">Reviewed</Option>
                <Option value="confirmed">Confirmed</Option>
                <Option value="false_alarm">False Alarm</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="notes"
              label="Notes"
            >
              <TextArea rows={4} placeholder="Add notes about this detection" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default DetectionHistory; 