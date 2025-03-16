import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProjectMembers from '../../components/projects/ProjectMembers';
import { ProjectContext } from '../../contexts/ProjectContext';
import { AuthContext } from '../../contexts/AuthContext';

vi.mock('../../services/api', () => ({
  getProjectMembers: vi.fn(),
  addProjectMember: vi.fn(),
  removeProjectMember: vi.fn(),
  searchUsers: vi.fn()
}));

describe('ProjectMembers Component', () => {
  const mockProject = {
    id: '123',
    name: 'Test Project',
    created_by: 'user1'
  };
  
  const mockMembers = [
    { id: 'user1', username: 'owner', role: 'owner' },
    { id: 'user2', username: 'admin', role: 'admin' },
    { id: 'user3', username: 'member', role: 'member' }
  ];
  
  const mockSearchResults = [
    { id: 'user4', username: 'newuser', email: 'new@example.com' },
    { id: 'user5', username: 'anotheruser', email: 'another@example.com' }
  ];
  
  const mockUser = {
    id: 'user1',
    username: 'owner'
  };
  
  const mockAuthContextValue = {
    currentUser: mockUser,
    isAuthenticated: true
  };
  
  const mockProjectContextValue = {
    currentProject: mockProject,
    projectMembers: mockMembers,
    loading: false,
    error: null,
    loadProjectMembers: vi.fn(),
    addProjectMember: vi.fn().mockResolvedValue({}),
    removeProjectMember: vi.fn().mockResolvedValue({})
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(require('../../services/api').searchUsers).mockResolvedValue(mockSearchResults);
  });
  
  const renderComponent = (isOwner = true) => {
    const authValue = {
      ...mockAuthContextValue,
      currentUser: isOwner ? mockUser : { id: 'user3', username: 'member' }
    };
    
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={authValue}>
          <ProjectContext.Provider value={mockProjectContextValue}>
            <ProjectMembers />
          </ProjectContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };
  
  it('renders members list correctly', () => {
    renderComponent();
    
    mockMembers.forEach(member => {
      expect(screen.getByText(member.username)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(member.role, 'i'))).toBeInTheDocument();
    });
  });
  
  it('loads project members on mount', () => {
    renderComponent();
    
    expect(mockProjectContextValue.loadProjectMembers).toHaveBeenCalledWith(mockProject.id);
  });
  
  it('shows member actions for project owner', () => {
    renderComponent();
    
    // 应该显示添加成员按钮
    expect(screen.getByText(/添加成员/i)).toBeInTheDocument();
    
    // 应该显示移除成员按钮（对非所有者成员）
    const removeButtons = screen.getAllByText(/移除/i);
    expect(removeButtons.length).toBe(2); // 不包括自己的按钮
  });
  
  it('hides member actions for non-owner', () => {
    renderComponent(false);
    
    // 不应显示添加成员按钮
    expect(screen.queryByText(/添加成员/i)).not.toBeInTheDocument();
    
    // 不应显示移除成员按钮
    expect(screen.queryByText(/移除/i)).not.toBeInTheDocument();
  });
  
  it('opens add member modal when add button is clicked', async () => {
    renderComponent();
    
    // 点击添加成员按钮
    fireEvent.click(screen.getByText(/添加成员/i));
    
    // 模态框应该打开
    await waitFor(() => {
      expect(screen.getByText(/添加项目成员/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/搜索用户/i)).toBeInTheDocument();
    });
  });
  
  it('searches users when typing in search input', async () => {
    renderComponent();
    
    // 打开模态框
    fireEvent.click(screen.getByText(/添加成员/i));
    
    // 输入搜索关键词
    const searchInput = screen.getByPlaceholderText(/搜索用户/i);
    fireEvent.change(searchInput, { target: { value: 'new' } });
    
    // 等待搜索结果
    await waitFor(() => {
      expect(require('../../services/api').searchUsers).toHaveBeenCalledWith('new');
      expect(screen.getByText('newuser')).toBeInTheDocument();
      expect(screen.getByText('anotheruser')).toBeInTheDocument();
    });
  });
  
  it('adds a member when selecting from search results', async () => {
    renderComponent();
    
    // 打开模态框
    fireEvent.click(screen.getByText(/添加成员/i));
    
    // 输入搜索关键词
    const searchInput = screen.getByPlaceholderText(/搜索用户/i);
    fireEvent.change(searchInput, { target: { value: 'new' } });
    
    // 等待搜索结果并选择角色
    await waitFor(() => {
      const roleSelect = screen.getAllByLabelText(/角色/i)[0];
      fireEvent.change(roleSelect, { target: { value: 'member' } });
    });
    
    // 点击添加按钮
    const addButtons = screen.getAllByText(/添加/i);
    fireEvent.click(addButtons[1]); // 第一个搜索结果的添加按钮
    
    // 验证添加成员方法被调用
    await waitFor(() => {
      expect(mockProjectContextValue.addProjectMember).toHaveBeenCalledWith(
        mockProject.id,
        mockSearchResults[0].id,
        'member'
      );
    });
  });
  
  it('removes a member when remove button is clicked', async () => {
    renderComponent();
    
    // 获取移除按钮并点击
    const removeButtons = screen.getAllByText(/移除/i);
    fireEvent.click(removeButtons[0]);
    
    // 确认对话框应打开
    expect(screen.getByText(/确认移除成员/i)).toBeInTheDocument();
    
    // 点击确认按钮
    fireEvent.click(screen.getByText(/确认/i));
    
    // 验证移除成员方法被调用
    await waitFor(() => {
      expect(mockProjectContextValue.removeProjectMember).toHaveBeenCalled();
    });
  });
  
  it('shows loading state when loading members', () => {
    const loadingContextValue = {
      ...mockProjectContextValue,
      loading: true,
      projectMembers: []
    };
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue}>
          <ProjectContext.Provider value={loadingContextValue}>
            <ProjectMembers />
          </ProjectContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/加载中/i)).toBeInTheDocument();
  });
  
  it('shows empty state when no members', () => {
    const emptyContextValue = {
      ...mockProjectContextValue,
      projectMembers: []
    };
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue}>
          <ProjectContext.Provider value={emptyContextValue}>
            <ProjectMembers />
          </ProjectContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/暂无项目成员/i)).toBeInTheDocument();
  });
}); 