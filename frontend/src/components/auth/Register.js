import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Title } = Typography;

const Register = () => {
  const { register, error: authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    
    try {
      await register(values);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Col xs={22} sm={16} md={12} lg={8} xl={6}>
        <Card bordered={false} style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={2}>Surveillance System</Title>
            <Title level={4}>Create Account</Title>
          </div>
          
          {(error || authError) && (
            <Alert
              message="Error"
              description={error || authError}
              type="error"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}
          
          <Form
            name="register"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: 'Please input your username!' },
                { min: 3, message: 'Username must be at least 3 characters!' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Username" 
                autoComplete="username"
              />
            </Form.Item>
            
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder="Email" 
                autoComplete="email"
              />
            </Form.Item>
            
            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please input your password!' },
                { min: 6, message: 'Password must be at least 6 characters!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
                autoComplete="new-password"
              />
            </Form.Item>
            
            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm Password"
                autoComplete="new-password"
              />
            </Form.Item>
            
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Register
              </Button>
            </Form.Item>
            
            <div style={{ textAlign: 'center' }}>
              Already have an account? <Link to="/login">Login now</Link>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default Register; 