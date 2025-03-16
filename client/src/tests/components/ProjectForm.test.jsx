import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProjectForm from '../../components/projects/ProjectForm';
import { ProjectContext } from '../../contexts/ProjectContext';
import { AuthContext } from '../../contexts/AuthContext';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useParams: vi.fn().mockReturnValue({})
  };
});

vi.mock('../../services/api', () => ({
  createProject: vi.fn(),
  updateProject: vi.fn()
}));

describe('ProjectForm Component', () => {
  const mockUser = {
    id: 'user1',
    username: 'testuser'
  };
  
  const mockAuthContextValue = {
    currentUser: mockUser,
    isAuthenticated: true
  };
  
  const mockProjectContextValue = {
    createProject: vi.fn().mockResolvedValue({ id: 'new-project' }),
    updateProjectDetails: vi.fn().mockResolvedValue({}),
    currentProject: null,
    loading: false,
    error: null
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  const renderComponent = (isEdit = false, project = null) => {
    const contextValue = {
      ...mockProjectContextValue,
      currentProject: project
    };
    
    if (isEdit) {
      vi.mocked(require('react-router-dom').useParams).mockReturnValue({ id: project.id });
    }
    
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue}>
          <ProjectContext.Provider value={contextValue}>
            <ProjectForm isEdit={isEdit} />
          </ProjectContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };
  
  it('renders create project form correctly', () => {
    renderComponent();
    
    expect(screen.getByText(/创建项目/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/项目名称/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/项目描述/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/项目状态/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/开始日期/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/结束日期/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /保存/i })).toBeInTheDocument();
  });
  
  it('renders edit project form with project data', () => {
    const mockProject = {
      id: '123',
      name: 'Test Project',
      description: 'Test Description',
      status: 'in_progress',
      start_date: '2025-01-01',
      end_date: '2025-12-31'
    };
    
    renderComponent(true, mockProject);
    
    expect(screen.getByText(/编辑项目/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/项目名称/i)).toHaveValue(mockProject.name);
    expect(screen.getByLabelText(/项目描述/i)).toHaveValue(mockProject.description);
    expect(screen.getByLabelText(/项目状态/i)).toHaveValue(mockProject.status);
    expect(screen.getByLabelText(/开始日期/i)).toHaveValue(mockProject.start_date);
    expect(screen.getByLabelText(/结束日期/i)).toHaveValue(mockProject.end_date);
  });
  
  it('calls createProject when form is submitted in create mode', async () => {
    const navigate = vi.fn();
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(navigate);
    
    renderComponent();
    
    // 填写表单字段
    fireEvent.change(screen.getByLabelText(/项目名称/i), {
      target: { value: 'New Project' }
    });
    
    fireEvent.change(screen.getByLabelText(/项目描述/i), {
      target: { value: 'New Description' }
    });
    
    fireEvent.change(screen.getByLabelText(/项目状态/i), {
      target: { value: 'planning' }
    });
    
    fireEvent.change(screen.getByLabelText(/开始日期/i), {
      target: { value: '2025-02-01' }
    });
    
    fireEvent.change(screen.getByLabelText(/结束日期/i), {
      target: { value: '2025-12-31' }
    });
    
    // 提交表单
    fireEvent.click(screen.getByRole('button', { name: /保存/i }));
    
    await waitFor(() => {
      expect(mockProjectContextValue.createProject).toHaveBeenCalledWith({
        name: 'New Project',
        description: 'New Description',
        status: 'planning',
        start_date: '2025-02-01',
        end_date: '2025-12-31'
      });
      expect(navigate).toHaveBeenCalledWith('/projects/new-project');
    });
  });
  
  it('calls updateProjectDetails when form is submitted in edit mode', async () => {
    const mockProject = {
      id: '123',
      name: 'Test Project',
      description: 'Test Description',
      status: 'planning',
      start_date: '2025-01-01',
      end_date: '2025-12-31'
    };
    
    const navigate = vi.fn();
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(navigate);
    
    renderComponent(true, mockProject);
    
    // 修改表单字段
    fireEvent.change(screen.getByLabelText(/项目名称/i), {
      target: { value: 'Updated Project' }
    });
    
    fireEvent.change(screen.getByLabelText(/项目状态/i), {
      target: { value: 'in_progress' }
    });
    
    // 提交表单
    fireEvent.click(screen.getByRole('button', { name: /保存/i }));
    
    await waitFor(() => {
      expect(mockProjectContextValue.updateProjectDetails).toHaveBeenCalledWith('123', {
        name: 'Updated Project',
        description: 'Test Description',
        status: 'in_progress',
        start_date: '2025-01-01',
        end_date: '2025-12-31'
      });
      expect(navigate).toHaveBeenCalledWith('/projects/123');
    });
  });
  
  it('shows validation errors for required fields', async () => {
    renderComponent();
    
    // 不填写必填字段，直接提交表单
    fireEvent.click(screen.getByRole('button', { name: /保存/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/项目名称不能为空/i)).toBeInTheDocument();
      expect(mockProjectContextValue.createProject).not.toHaveBeenCalled();
    });
  });
  
  it('shows error message when API call fails', async () => {
    mockProjectContextValue.createProject.mockRejectedValueOnce(new Error('API错误'));
    
    renderComponent();
    
    // 填写表单字段
    fireEvent.change(screen.getByLabelText(/项目名称/i), {
      target: { value: 'New Project' }
    });
    
    // 提交表单
    fireEvent.click(screen.getByRole('button', { name: /保存/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/保存项目时出错/i)).toBeInTheDocument();
    });
  });
}); 