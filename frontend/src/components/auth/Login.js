import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Row, Col } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Title } = Typography;

const Login = () => {
  const { login, error: authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    
    try {
      await login(values);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
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
            <Title level={4}>Login</Title>
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
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Email" 
                autoComplete="email"
              />
            </Form.Item>
            
            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
                autoComplete="current-password"
              />
            </Form.Item>
            
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Log in
              </Button>
            </Form.Item>
            
            <div style={{ textAlign: 'center' }}>
              Don't have an account? <Link to="/register">Register now</Link>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default Login; 