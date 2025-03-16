import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Card, Table, Button, Modal, Select, Form, 
  message, Tag, Popconfirm, Avatar, Input, Spin 
} from 'antd';
import { 
  UserAddOutlined, DeleteOutlined, 
  ExclamationCircleOutlined, SearchOutlined 
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const ProjectMembers = () => {
  const { id } = useParams();
  const [form] = Form.useForm();
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [addMemberLoading, setAddMemberLoading] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [id]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/projects/${id}/members`);
      setMembers(response.data);
    } catch (error) {
      console.error('获取项目成员失败:', error);
      message.error('获取项目成员失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      // 过滤掉已经是项目成员的用户
      const memberUserIds = members.map(member => member.user_id);
      const availableUsers = response.data.filter(user => !memberUserIds.includes(user.id));
      setUsers(availableUsers);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    }
  };

  const showAddMemberModal = () => {
    fetchUsers();
    setModalVisible(true);
  };

  const handleAddMember = async () => {
    try {
      const values = await form.validateFields();
      setAddMemberLoading(true);
      
      await axios.post(`/api/projects/${id}/members`, {
        user_id: values.user_id,
        role: values.role
      });
      
      message.success('成员添加成功');
      setModalVisible(false);
      form.resetFields();
      fetchMembers();
    } catch (error) {
      console.error('添加成员失败:', error);
      message.error('添加成员失败');
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await axios.delete(`/api/projects/${id}/members/${memberId}`);
      message.success('成员移除成功');
      fetchMembers();
    } catch (error) {
      console.error('移除成员失败:', error);
      message.error('移除成员失败');
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await axios.put(`/api/projects/${id}/members/${memberId}`, {
        role: newRole
      });
      message.success('成员角色更新成功');
      fetchMembers();
    } catch (error) {
      console.error('更新成员角色失败:', error);
      message.error('更新成员角色失败');
    }
  };

  const filteredMembers = members.filter(member => 
    member.user.name.toLowerCase().includes(searchText.toLowerCase()) ||
    member.user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
      render: (user) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar style={{ marginRight: '10px' }}>{user.name.charAt(0)}</Avatar>
          <div>
            <div>{user.name}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role, record) => (
        <Select
          value={role}
          style={{ width: 120 }}
          onChange={(value) => handleRoleChange(record.id, value)}
          disabled={record.role === 'owner'}
        >
          <Option value="member">成员</Option>
          <Option value="admin">管理员</Option>
          <Option value="owner">所有者</Option>
        </Select>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.role === 'owner' ? 'gold' : record.role === 'admin' ? 'blue' : 'green'}>
          {record.role === 'owner' ? '所有者' : record.role === 'admin' ? '管理员' : '成员'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        record.role !== 'owner' ? (
          <Popconfirm
            title="确定要移除该成员吗?"
            onConfirm={() => handleRemoveMember(record.id)}
            okText="确定"
            cancelText="取消"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
            >
              移除
            </Button>
          </Popconfirm>
        ) : null
      ),
    },
  ];

  return (
    <div className="project-members-container" style={{ padding: '20px' }}>
      <Card
        title="项目成员"
        extra={
          <Button 
            type="primary" 
            icon={<UserAddOutlined />} 
            onClick={showAddMemberModal}
          >
            添加成员
          </Button>
        }
      >
        <div style={{ marginBottom: '16px' }}>
          <Input
            placeholder="搜索成员"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table 
            columns={columns} 
            dataSource={filteredMembers} 
            rowKey="id"
            pagination={false}
          />
        )}
      </Card>

      <Modal
        title="添加项目成员"
        visible={modalVisible}
        onOk={handleAddMember}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={addMemberLoading}
        okText="添加"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="user_id"
            label="选择用户"
            rules={[{ required: true, message: '请选择用户' }]}
          >
            <Select
              placeholder="请选择用户"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {users.map(user => (
                <Option key={user.id} value={user.id}>{user.name} ({user.email})</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            initialValue="member"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="member">成员</Option>
              <Option value="admin">管理员</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectMembers; 