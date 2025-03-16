import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProjectDetail from '../../components/projects/ProjectDetail';
import { ProjectContext } from '../../contexts/ProjectContext';
import { AuthContext } from '../../contexts/AuthContext';

// 模拟API服务
vi.mock('../../services/api', () => ({
  getProjectById: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  getProjectMembers: vi.fn()
}));

// 模拟react-router-dom的useParams和useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn().mockReturnValue({ id: '123' }),
    useNavigate: vi.fn()
  };
});

describe('ProjectDetail Component', () => {
  const mockProject = {
    id: '123',
    name: 'Test Project',
    description: 'This is a test project',
    status: 'in_progress',
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    created_by: 'user1',
    creator: {
      username: 'testuser'
    }
  };
  
  const mockUser = {
    id: 'user1',
    username: 'testuser',
    email: 'test@example.com',
    role: 'user'
  };
  
  const mockMembers = [
    { id: 'user1', username: 'testuser', role: 'owner' },
    { id: 'user2', username: 'member1', role: 'member' }
  ];
  
  const mockProjectContextValue = {
    currentProject: mockProject,
    setCurrentProject: vi.fn(),
    projectMembers: mockMembers,
    loading: false,
    error: null,
    loadProject: vi.fn(),
    loadProjectMembers: vi.fn(),
    updateProjectDetails: vi.fn(),
    deleteCurrentProject: vi.fn(),
    addProjectMember: vi.fn(),
    removeProjectMember: vi.fn()
  };
  
  const mockAuthContextValue = {
    currentUser: mockUser,
    isAuthenticated: true
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue}>
          <ProjectContext.Provider value={mockProjectContextValue}>
            <ProjectDetail />
          </ProjectContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };
  
  it('renders project details correctly', async () => {
    renderComponent();
    
    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText(mockProject.name)).toBeInTheDocument();
      expect(screen.getByText(mockProject.description)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(mockProject.status, 'i'))).toBeInTheDocument();
    });
  });
  
  it('calls loadProject and loadProjectMembers on mount', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(mockProjectContextValue.loadProject).toHaveBeenCalledWith('123');
      expect(mockProjectContextValue.loadProjectMembers).toHaveBeenCalledWith('123');
    });
  });
  
  it('shows loading state when data is loading', async () => {
    const loadingContextValue = {
      ...mockProjectContextValue,
      loading: true
    };
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue}>
          <ProjectContext.Provider value={loadingContextValue}>
            <ProjectDetail />
          </ProjectContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/加载中/i)).toBeInTheDocument();
  });
  
  it('shows error message when there is an error', async () => {
    const errorContextValue = {
      ...mockProjectContextValue,
      error: '项目不存在或您没有权限访问'
    };
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue}>
          <ProjectContext.Provider value={errorContextValue}>
            <ProjectDetail />
          </ProjectContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/项目不存在或您没有权限访问/i)).toBeInTheDocument();
  });
  
  it('renders project members list', async () => {
    renderComponent();
    
    await waitFor(() => {
      mockMembers.forEach(member => {
        expect(screen.getByText(member.username)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(member.role, 'i'))).toBeInTheDocument();
      });
    });
  });
  
  it('shows edit buttons for project owner', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/编辑项目/i)).toBeInTheDocument();
      expect(screen.getByText(/删除项目/i)).toBeInTheDocument();
    });
  });
}); 