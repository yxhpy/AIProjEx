import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Input, Select, Row, Col, Tag, Spin, Empty, Pagination } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 8;

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
    fetchProjects();
  }, [searchText, statusFilter, currentPage]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        search: searchText || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      };

      const response = await axios.get('/api/projects', { params });
      setProjects(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      console.error('获取项目列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '未设置';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="project-list-container" style={{ padding: '20px' }}>
      <div className="project-list-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>项目列表</h1>
        <Link to="/projects/create">
          <Button type="primary" icon={<PlusOutlined />}>
            创建项目
          </Button>
        </Link>
      </div>

      <div className="project-list-filters" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <Input
          placeholder="搜索项目名称或描述"
          prefix={<SearchOutlined />}
          style={{ width: 250 }}
          onChange={(e) => handleSearch(e.target.value)}
          value={searchText}
          allowClear
        />
        <Select
          placeholder="项目状态"
          style={{ width: 150 }}
          onChange={handleStatusChange}
          value={statusFilter}
          suffixIcon={<FilterOutlined />}
        >
          <Option value="all">全部状态</Option>
          <Option value="not_started">未开始</Option>
          <Option value="in_progress">进行中</Option>
          <Option value="completed">已完成</Option>
          <Option value="on_hold">已暂停</Option>
          <Option value="cancelled">已取消</Option>
        </Select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : projects.length > 0 ? (
        <>
          <Row gutter={[16, 16]}>
            {projects.map((project) => (
              <Col xs={24} sm={12} md={8} lg={6} key={project.id}>
                <Link to={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
                  <Card
                    hoverable
                    title={project.name}
                    style={{ height: '100%' }}
                    extra={
                      <Tag color={statusColors[project.status]}>
                        {statusLabels[project.status]}
                      </Tag>
                    }
                  >
                    <p style={{ height: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {project.description || '暂无描述'}
                    </p>
                    <div style={{ marginTop: '10px' }}>
                      <p>
                        <strong>开始日期:</strong> {formatDate(project.start_date)}
                      </p>
                      <p>
                        <strong>结束日期:</strong> {formatDate(project.end_date)}
                      </p>
                    </div>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
          <div style={{ textAlign: 'right', marginTop: '20px' }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={total}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        </>
      ) : (
        <Empty description="暂无项目" />
      )}
    </div>
  );
};

export default ProjectList; 