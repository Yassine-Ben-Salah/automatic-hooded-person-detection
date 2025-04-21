import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Modal, Form, Input, Select, Tag, message, Spin, Typography } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { userAPI } from '../../services/api';

const { Title } = Typography;
const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch all users from API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      message.error('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal for a user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      role: user.role
    });
    setEditModalVisible(true);
  };

  // Handle update user submission
  const handleUpdateUser = async () => {
    try {
      const values = await form.validateFields();
      await userAPI.updateUser(selectedUser._id, values);
      message.success('User updated successfully');
      setEditModalVisible(false);
      fetchUsers(); // Refresh users list
    } catch (error) {
      message.error('Failed to update user');
      console.error('Error updating user:', error);
    }
  };

  // Open create user modal
  const handleCreateUserClick = () => {
    createForm.resetFields();
    setCreateModalVisible(true);
  };

  // Handle create user submission
  const handleCreateUser = async () => {
    try {
      const values = await createForm.validateFields();
      const response = await userAPI.createUser(values);
      message.success('User created successfully');
      setCreateModalVisible(false);
      fetchUsers(); // Refresh users list
    } catch (error) {
      message.error('Failed to create user');
      console.error('Error creating user:', error);
    }
  };

  // Handle delete user
  const handleDeleteUser = (userId) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this user?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await userAPI.deleteUser(userId);
          message.success('User deleted successfully');
          fetchUsers(); // Refresh users list
        } catch (error) {
          message.error('Failed to delete user');
          console.error('Error deleting user:', error);
        }
      }
    });
  };

  // Table columns configuration
  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username)
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'User', value: 'user' }
      ],
      onFilter: (value, record) => record.role === value
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEditUser(record)}
          >
            Edit
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            size="small"
            onClick={() => handleDeleteUser(record._id)}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card
        title={<Title level={2}>User Management</Title>}
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreateUserClick}
          >
            Add User
          </Button>
        }
      >
        <Spin spinning={loading}>
          <Table 
            dataSource={users} 
            columns={columns} 
            rowKey="_id"
            pagination={{ pageSize: 10 }}
          />
        </Spin>
      </Card>

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleUpdateUser}
        okText="Update"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please enter username' }]}
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input prefix={<MailOutlined />} />
          </Form.Item>
          
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select>
              <Option value="user">User</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create User Modal */}
      <Modal
        title="Create New User"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={handleCreateUser}
        okText="Create"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: 'Please enter username' },
              { min: 3, message: 'Username must be at least 3 characters' }
            ]}
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input prefix={<MailOutlined />} />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please enter password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          
          <Form.Item
            name="role"
            label="Role"
            initialValue="user"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select>
              <Option value="user">User</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement; 