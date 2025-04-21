import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Avatar, Row, Col, Typography, Divider, Alert, Space, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const Profile = () => {
  const { user, updateProfile, updatePassword, loading } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [profileEditing, setProfileEditing] = useState(false);
  const [passwordEditing, setPasswordEditing] = useState(false);
  const [error, setError] = useState(null);
  
  // Set initial form values when user data loads
  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        username: user.username,
        email: user.email
      });
    }
  }, [user, profileForm]);
  
  // Handle profile update
  const handleProfileUpdate = async (values) => {
    setError(null);
    
    try {
      await updateProfile(values);
      message.success('Profile updated successfully');
      setProfileEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    }
  };
  
  // Handle password update
  const handlePasswordUpdate = async (values) => {
    setError(null);
    
    try {
      if (values.newPassword !== values.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      await updatePassword(values.currentPassword, values.newPassword);
      message.success('Password updated successfully');
      setPasswordEditing(false);
      passwordForm.resetFields();
    } catch (err) {
      setError(err.message || 'Failed to update password');
    }
  };
  
  return (
    <div>
      <Title level={2}>
        <UserOutlined style={{ marginRight: 12 }} />
        My Profile
      </Title>
      
      {error && (
        <Alert 
          message="Error" 
          description={error} 
          type="error" 
          showIcon 
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setError(null)}
        />
      )}
      
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card 
            title="Profile Information"
            extra={
              !profileEditing ? (
                <Button 
                  type="link" 
                  icon={<EditOutlined />}
                  onClick={() => setProfileEditing(true)}
                >
                  Edit
                </Button>
              ) : null
            }
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar 
                size={96} 
                icon={<UserOutlined />} 
                src={user?.avatarUrl}
                style={{ backgroundColor: '#1890ff' }}
              />
            </div>
            
            {!profileEditing ? (
              <div>
                <Row style={{ marginBottom: 16 }}>
                  <Col span={8}><Text strong>Username:</Text></Col>
                  <Col span={16}>{user?.username}</Col>
                </Row>
                
                <Row style={{ marginBottom: 16 }}>
                  <Col span={8}><Text strong>Email:</Text></Col>
                  <Col span={16}>{user?.email}</Col>
                </Row>
                
                <Row style={{ marginBottom: 16 }}>
                  <Col span={8}><Text strong>Role:</Text></Col>
                  <Col span={16}>{user?.role}</Col>
                </Row>
                
                <Row>
                  <Col span={8}><Text strong>Joined:</Text></Col>
                  <Col span={16}>
                    {user?.createdAt && new Date(user.createdAt).toLocaleDateString()}
                  </Col>
                </Row>
              </div>
            ) : (
              <Form
                form={profileForm}
                layout="vertical"
                onFinish={handleProfileUpdate}
              >
                <Form.Item
                  name="username"
                  label="Username"
                  rules={[
                    { required: true, message: 'Please enter your username' },
                    { min: 3, message: 'Username must be at least 3 characters' }
                  ]}
                >
                  <Input prefix={<UserOutlined />} />
                </Form.Item>
                
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Please enter a valid email' }
                  ]}
                >
                  <Input prefix={<MailOutlined />} />
                </Form.Item>
                
                <Form.Item>
                  <Space>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<SaveOutlined />}
                      loading={loading}
                    >
                      Save
                    </Button>
                    <Button onClick={() => setProfileEditing(false)}>
                      Cancel
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            )}
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card 
            title="Security Settings"
            extra={
              !passwordEditing ? (
                <Button 
                  type="link" 
                  icon={<EditOutlined />}
                  onClick={() => setPasswordEditing(true)}
                >
                  Change Password
                </Button>
              ) : null
            }
          >
            {!passwordEditing ? (
              <div style={{ padding: '20px 0' }}>
                <Text>Your password was last changed on:</Text>
                <div style={{ marginTop: 8 }}>
                  <Text strong>
                    {user?.passwordUpdatedAt 
                      ? new Date(user.passwordUpdatedAt).toLocaleDateString() 
                      : 'Never'}
                  </Text>
                </div>
                
                <Divider />
                
                <Text type="secondary">
                  For security reasons, we recommend changing your password regularly.
                </Text>
              </div>
            ) : (
              <Form
                form={passwordForm}
                layout="vertical"
                onFinish={handlePasswordUpdate}
              >
                <Form.Item
                  name="currentPassword"
                  label="Current Password"
                  rules={[
                    { required: true, message: 'Please enter your current password' }
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
                
                <Form.Item
                  name="newPassword"
                  label="New Password"
                  rules={[
                    { required: true, message: 'Please enter a new password' },
                    { min: 6, message: 'Password must be at least 6 characters' }
                  ]}
                  hasFeedback
                >
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
                
                <Form.Item
                  name="confirmPassword"
                  label="Confirm New Password"
                  dependencies={['newPassword']}
                  hasFeedback
                  rules={[
                    { required: true, message: 'Please confirm your new password' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('The two passwords do not match'));
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
                
                <Form.Item>
                  <Space>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<SaveOutlined />}
                      loading={loading}
                    >
                      Update Password
                    </Button>
                    <Button onClick={() => setPasswordEditing(false)}>
                      Cancel
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            )}
          </Card>
          
          <Card title="Account Activity" style={{ marginTop: 16 }}>
            <Text type="secondary">
              Last login: {user?.lastLogin
                ? new Date(user.lastLogin).toLocaleString()
                : 'Never'
              }
            </Text>
            
            <Divider />
            
            <Text type="secondary">
              Total logins: {user?.loginCount || 0}
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile; 