import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Card, Button, Descriptions, Tag, Spin, Timeline, Tabs, 
  Modal, Select, message, Divider, Row, Col, Avatar, List 
} from 'antd';
import { 
  EditOutlined, DeleteOutlined, TeamOutlined, 
  ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined 
} from '@ant-design/icons';
import axios from 'axios';

const { TabPane } = Tabs;
const { Option } = Select;
const { confirm } = Modal;

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const statusColors = {
    'not_started': 'default',
    'in_progress': 'processing',
    'completed': 'success',
    'on_hold': 'warning',
    'cancelled': 'error'
  };

  const statusLabels = {
    'not_started': '未开始',
    'in_progress': '进行中',
    'completed': '已完成',
    'on_hold': '已暂停',
    'cancelled': '已取消'
  };

  useEffect(() => {
    fetchProjectDetails();
    fetchProjectMembers();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const response = await axios.get(`/api/projects/${id}`);
      setProject(response.data);
      setNewStatus(response.data.status);
    } catch (error) {
      console.error('获取项目详情失败:', error);
      message.error('获取项目详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectMembers = async () => {
    try {
      const response = await axios.get(`/api/projects/${id}/members`);
      setMembers(response.data);
    } catch (error) {
      console.error('获取项目成员失败:', error);
    }
  };

  const handleStatusChange = async () => {
    try {
      await axios.patch(`/api/projects/${id}`, { status: newStatus });
      setProject({ ...project, status: newStatus });
      setStatusModalVisible(false);
      message.success('项目状态更新成功');
    } catch (error) {
      console.error('更新项目状态失败:', error);
      message.error('更新项目状态失败');
    }
  };

  const handleDeleteProject = () => {
    confirm({
      title: '确定要删除这个项目吗?',
      icon: <ExclamationCircleOutlined />,
      content: '删除后将无法恢复，项目相关的所有数据都将被删除。',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await axios.delete(`/api/projects/${id}`);
          message.success('项目删除成功');
          navigate('/projects');
        } catch (error) {
          console.error('删除项目失败:', error);
          message.error('删除项目失败');
        }
      }
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '未设置';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!project) {
    return <div>项目不存在或已被删除</div>;
  }

  return (
    <div className="project-detail-container" style={{ padding: '20px' }}>
      <div className="project-detail-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{project.name}</h1>
        <div>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            style={{ marginRight: '10px' }}
            onClick={() => navigate(`/projects/${id}/edit`)}
          >
            编辑项目
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={handleDeleteProject}
          >
            删除项目
          </Button>
        </div>
      </div>

      <Card style={{ marginBottom: '20px' }}>
        <Descriptions title="项目信息" bordered>
          <Descriptions.Item label="项目名称" span={3}>{project.name}</Descriptions.Item>
          <Descriptions.Item label="项目描述" span={3}>{project.description || '暂无描述'}</Descriptions.Item>
          <Descriptions.Item label="项目状态">
            <Tag color={statusColors[project.status]}>
              {statusLabels[project.status]}
            </Tag>
            <Button 
              type="link" 
              size="small" 
              onClick={() => setStatusModalVisible(true)}
            >
              更改状态
            </Button>
          </Descriptions.Item>
          <Descriptions.Item label="开始日期">{formatDate(project.start_date)}</Descriptions.Item>
          <Descriptions.Item label="结束日期">{formatDate(project.end_date)}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDate(project.created_at)}</Descriptions.Item>
          <Descriptions.Item label="最后更新">{formatDate(project.updated_at)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Tabs defaultActiveKey="1">
        <TabPane tab={<span><TeamOutlined />项目成员</span>} key="1">
          <List
            itemLayout="horizontal"
            dataSource={members}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar>{item.user.name.charAt(0)}</Avatar>}
                  title={item.user.name}
                  description={`角色: ${item.role === 'owner' ? '所有者' : item.role === 'admin' ? '管理员' : '成员'}`}
                />
              </List.Item>
            )}
          />
        </TabPane>
        <TabPane tab={<span><ClockCircleOutlined />项目时间线</span>} key="2">
          <Timeline mode="left">
            <Timeline.Item color="green">项目创建 ({formatDate(project.created_at)})</Timeline.Item>
            {project.start_date && (
              <Timeline.Item color="blue">
                项目开始 ({formatDate(project.start_date)})
              </Timeline.Item>
            )}
            {project.status === 'in_progress' && (
              <Timeline.Item color="blue">
                项目进行中
              </Timeline.Item>
            )}
            {project.status === 'completed' && (
              <Timeline.Item color="green">
                <CheckCircleOutlined /> 项目完成
              </Timeline.Item>
            )}
            {project.status === 'on_hold' && (
              <Timeline.Item color="orange">
                项目暂停
              </Timeline.Item>
            )}
            {project.status === 'cancelled' && (
              <Timeline.Item color="red">
                项目取消
              </Timeline.Item>
            )}
            {project.end_date && project.status !== 'cancelled' && (
              <Timeline.Item color={project.status === 'completed' ? 'green' : 'gray'}>
                {project.status === 'completed' ? '项目已完成' : '计划完成日期'} ({formatDate(project.end_date)})
              </Timeline.Item>
            )}
          </Timeline>
        </TabPane>
      </Tabs>

      <Modal
        title="更改项目状态"
        visible={statusModalVisible}
        onOk={handleStatusChange}
        onCancel={() => setStatusModalVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        <Select
          style={{ width: '100%' }}
          value={newStatus}
          onChange={(value) => setNewStatus(value)}
        >
          <Option value="not_started">未开始</Option>
          <Option value="in_progress">进行中</Option>
          <Option value="completed">已完成</Option>
          <Option value="on_hold">已暂停</Option>
          <Option value="cancelled">已取消</Option>
        </Select>
      </Modal>
    </div>
  );
};

export default ProjectDetail; 