import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, DatePicker, Select, Card, message, Spin } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;

const ProjectForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      fetchProjectDetails();
    }
  }, [id]);

  const fetchProjectDetails = async () => {
    setInitialLoading(true);
    try {
      const response = await axios.get(`/api/projects/${id}`);
      const project = response.data;
      
      form.setFieldsValue({
        name: project.name,
        description: project.description,
        status: project.status,
        start_date: project.start_date ? moment(project.start_date) : null,
        end_date: project.end_date ? moment(project.end_date) : null,
      });
    } catch (error) {
      console.error('获取项目详情失败:', error);
      message.error('获取项目详情失败');
    } finally {
      setInitialLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formData = {
        ...values,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
      };

      if (isEditing) {
        await axios.put(`/api/projects/${id}`, formData);
        message.success('项目更新成功');
      } else {
        await axios.post('/api/projects', formData);
        message.success('项目创建成功');
      }
      
      navigate('/projects');
    } catch (error) {
      console.error('保存项目失败:', error);
      message.error('保存项目失败');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="project-form-container" style={{ padding: '20px' }}>
      <div className="project-form-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{isEditing ? '编辑项目' : '创建项目'}</h1>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/projects')}
        >
          返回项目列表
        </Button>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            status: 'not_started',
          }}
        >
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" maxLength={100} />
          </Form.Item>

          <Form.Item
            name="description"
            label="项目描述"
          >
            <TextArea 
              placeholder="请输入项目描述" 
              autoSize={{ minRows: 3, maxRows: 6 }}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="项目状态"
            rules={[{ required: true, message: '请选择项目状态' }]}
          >
            <Select placeholder="请选择项目状态">
              <Option value="not_started">未开始</Option>
              <Option value="in_progress">进行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="on_hold">已暂停</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="start_date"
            label="开始日期"
          >
            <DatePicker 
              style={{ width: '100%' }} 
              placeholder="请选择开始日期"
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item
            name="end_date"
            label="结束日期"
          >
            <DatePicker 
              style={{ width: '100%' }} 
              placeholder="请选择结束日期"
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SaveOutlined />}
              style={{ width: '100%' }}
            >
              {isEditing ? '保存修改' : '创建项目'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ProjectForm; 