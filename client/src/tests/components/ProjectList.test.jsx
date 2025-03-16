import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import axios from 'axios';
import ProjectList from '../../components/project/ProjectList';

// 模拟axios
vi.mock('axios');

describe('ProjectList组件', () => {
  const mockProjects = [
    {
      id: '1',
      name: '测试项目1',
      description: '这是测试项目1的描述',
      status: 'in_progress',
      start_date: '2023-01-01',
      end_date: '2023-12-31'
    },
    {
      id: '2',
      name: '测试项目2',
      description: '这是测试项目2的描述',
      status: 'completed',
      start_date: '2023-02-01',
      end_date: '2023-11-30'
    }
  ];

  beforeEach(() => {
    // 模拟axios.get返回项目数据
    axios.get.mockResolvedValue({
      data: {
        data: mockProjects,
        total: 2
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('应该渲染项目列表', async () => {
    render(
      <BrowserRouter>
        <ProjectList />
      </BrowserRouter>
    );

    // 验证加载状态
    expect(screen.getByText(/加载中/i)).toBeInTheDocument();

    // 等待项目加载完成
    await waitFor(() => {
      expect(screen.getByText('测试项目1')).toBeInTheDocument();
    });

    // 验证项目信息显示
    expect(screen.getByText('测试项目1')).toBeInTheDocument();
    expect(screen.getByText('测试项目2')).toBeInTheDocument();
    expect(screen.getByText('这是测试项目1的描述')).toBeInTheDocument();
    expect(screen.getByText('这是测试项目2的描述')).toBeInTheDocument();
  });

  test('应该能够搜索项目', async () => {
    render(
      <BrowserRouter>
        <ProjectList />
      </BrowserRouter>
    );

    // 等待项目加载完成
    await waitFor(() => {
      expect(screen.getByText('测试项目1')).toBeInTheDocument();
    });

    // 模拟搜索结果
    axios.get.mockResolvedValueOnce({
      data: {
        data: [mockProjects[0]],
        total: 1
      }
    });

    // 输入搜索文本
    const searchInput = screen.getByPlaceholderText('搜索项目名称或描述');
    fireEvent.change(searchInput, { target: { value: '测试项目1' } });

    // 验证axios.get被调用，且包含搜索参数
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/projects', {
        params: expect.objectContaining({
          search: '测试项目1'
        })
      });
    });
  });

  test('应该能够按状态筛选项目', async () => {
    render(
      <BrowserRouter>
        <ProjectList />
      </BrowserRouter>
    );

    // 等待项目加载完成
    await waitFor(() => {
      expect(screen.getByText('测试项目1')).toBeInTheDocument();
    });

    // 模拟筛选结果
    axios.get.mockResolvedValueOnce({
      data: {
        data: [mockProjects[1]],
        total: 1
      }
    });

    // 选择状态筛选
    const statusSelect = screen.getByPlaceholderText('项目状态');
    fireEvent.mouseDown(statusSelect);
    
    // 等待下拉选项出现并选择
    await waitFor(() => {
      const completedOption = screen.getByText('已完成');
      fireEvent.click(completedOption);
    });

    // 验证axios.get被调用，且包含状态参数
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/projects', {
        params: expect.objectContaining({
          status: 'completed'
        })
      });
    });
  });

  test('应该显示空状态当没有项目时', async () => {
    // 模拟空项目列表
    axios.get.mockResolvedValueOnce({
      data: {
        data: [],
        total: 0
      }
    });

    render(
      <BrowserRouter>
        <ProjectList />
      </BrowserRouter>
    );

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('暂无项目')).toBeInTheDocument();
    });
  });
}); 