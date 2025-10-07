import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import '@/App.css';

// Import Shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

// Import icons
import { 
  CalendarIcon, 
  PlusIcon, 
  FolderIcon, 
  UsersIcon, 
  DollarSignIcon,
  TrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  FileTextIcon,
  BarChart3Icon,
  TargetIcon,
  EditIcon,
  TrashIcon,
  FilterIcon,
  SortAscIcon,
  SortDescIcon,
  GridIcon,
  TableIcon,
  SearchIcon,
  ArrowLeftIcon,
  RefreshCwIcon,
  UploadIcon,
  DownloadIcon,
  FolderPlusIcon,
  CopyIcon,
  MoveIcon,
  PaletteIcon
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://pm-dashboard-5.preview.emergentagent.com';
const API = `${BACKEND_URL}/api`;

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Helper function to format date as mm/dd/yy
const formatDateShort = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit'
  });
};

// Helper function to calculate timeline progress
const calculateTimelineProgress = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date();
  
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = current.getTime() - start.getTime();
  
  const progressPercentage = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
  const daysTotal = Math.ceil(totalDuration / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.ceil(elapsed / (1000 * 60 * 60 * 24));
  
  // Calculate days remaining (can be negative if overdue)
  const daysRemaining = daysTotal - daysElapsed;
  
  // Calculate overdue days (positive number if overdue)
  const daysOverdue = current > end ? Math.ceil((current.getTime() - end.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  // Check if within 10% of completion (danger zone)
  const timeRemaining = end.getTime() - current.getTime();
  const isDangerZone = timeRemaining <= (totalDuration * 0.1) && timeRemaining > 0;
  const isOverdue = current > end;
  
  return {
    progressPercentage: Math.round(progressPercentage),
    daysTotal,
    daysElapsed,
    daysRemaining: isOverdue ? 0 : daysRemaining, // Show 0 when overdue
    daysOverdue, // New field for overdue days
    isDangerZone,
    isOverdue,
    startDate: start,
    endDate: end,
    currentDate: current
  };
};

// Project stage colors
const getStageColor = (stage) => {
  const colors = {
    initiation: 'bg-blue-100 text-blue-800',
    planning: 'bg-yellow-100 text-yellow-800',
    execution: 'bg-green-100 text-green-800',
    monitoring: 'bg-purple-100 text-purple-800',
    closing: 'bg-orange-100 text-orange-800',
    closed: 'bg-gray-100 text-gray-800'
  };
  return colors[stage] || 'bg-gray-100 text-gray-800';
};

// Project stages for dropdown
const PROJECT_STAGES = [
  { value: 'initiation', label: 'Initiation' },
  { value: 'planning', label: 'Planning' },
  { value: 'execution', label: 'Execution' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'closing', label: 'Closing' },
  { value: 'closed', label: 'Closed' }
];

// Dashboard Component
const Dashboard = ({ projects, onProjectSelect, onViewProjects }) => {
  const [stats, setStats] = useState({
    total_projects: 0,
    active_projects: 0,
    total_expenses: 0,
    overdue_milestones: 0
  });

  // Calculate timeline-based stats
  const timelineStats = projects ? projects.reduce((acc, project) => {
    const timeline = calculateTimelineProgress(project.start_date, project.end_date);
    if (timeline.isOverdue) acc.overdue++;
    if (timeline.isDangerZone) acc.dangerZone++;
    return acc;
  }, { overdue: 0, dangerZone: 0 }) : { overdue: 0, dangerZone: 0 };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onViewProjects('all')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_projects}</div>
            <p className="text-xs text-muted-foreground mt-1">Click to view all projects</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onViewProjects('active')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_projects}</div>
            <p className="text-xs text-muted-foreground mt-1">Click to view active projects</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onViewProjects('expenses')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_expenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">Click to view by expenses</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onViewProjects('risk')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects at Risk</CardTitle>
            <AlertTriangleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-red-600">
                {timelineStats.overdue + timelineStats.dangerZone}
              </div>
              {(timelineStats.overdue > 0 || timelineStats.dangerZone > 0) && (
                <div className="text-xs text-gray-600">
                  {timelineStats.overdue > 0 && `${timelineStats.overdue} overdue`}
                  {timelineStats.overdue > 0 && timelineStats.dangerZone > 0 && ', '}
                  {timelineStats.dangerZone > 0 && `${timelineStats.dangerZone} near deadline`}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Click to view at-risk projects</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Overview of your current projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects && projects.length > 0 ? projects.slice(0, 5).map((project) => (
              <div 
                key={project.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onProjectSelect(project)}
                data-testid={`project-card-${project.id}`}
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{project.name}</h3>
                  <p className="text-sm text-gray-600">{project.description}</p>
                  {(() => {
                    const timeline = calculateTimelineProgress(project.start_date, project.end_date);
                    return (
                      <div className="mt-2 space-y-1">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${
                              timeline.isOverdue ? 'bg-red-500' :
                              timeline.isDangerZone ? 'bg-orange-500' :
                              timeline.progressPercentage >= 75 ? 'bg-green-500' :
                              timeline.progressPercentage >= 50 ? 'bg-blue-500' :
                              'bg-gray-400'
                            }`}
                            style={{ width: `${Math.min(timeline.progressPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">{timeline.progressPercentage}% complete</span>
                          <span className={timeline.isDangerZone || timeline.isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}>
                            {timeline.isOverdue ? 
                              `${timeline.daysOverdue}d overdue` :
                              `${timeline.daysRemaining}d left`
                            }
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex items-center space-x-4">
                  <Badge className={getStageColor(project.stage)}>
                    {project.stage.charAt(0).toUpperCase() + project.stage.slice(1)}
                  </Badge>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(project.budget)}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No projects found. Create your first project!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Project Form Component
const ProjectForm = ({ onProjectCreated, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    budget: '',
    manager_id: 'default-manager'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const projectData = {
        ...formData,
        budget: parseFloat(formData.budget),
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString()
      };
      
      const response = await axios.post(`${API}/projects`, projectData);
      toast.success('Project created successfully!');
      onProjectCreated(response.data);
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          data-testid="project-name-input"
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          data-testid="project-description-input"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
            data-testid="project-start-date-input"
          />
        </div>
        
        <div>
          <Label htmlFor="end_date">End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            required
            data-testid="project-end-date-input"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="budget">Budget ($)</Label>
        <Input
          id="budget"
          type="number"
          step="0.01"
          value={formData.budget}
          onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
          required
          data-testid="project-budget-input"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} data-testid="create-project-submit">
          {loading ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
};

// Milestone Detail/Edit Component
const MilestoneDetailEdit = ({ milestone, projectId, projectStartDate, projectEndDate, projectResources, onMilestoneUpdated, onClose, isEditing = false }) => {
  const [editMode, setEditMode] = useState(isEditing);
  const [formData, setFormData] = useState({
    title: milestone?.title || '',
    due_date: milestone?.due_date ? new Date(milestone.due_date).toISOString().split('T')[0] : '',
    description: milestone?.description || '',
    assigned_resource_id: milestone?.assigned_resource_id || 'none'
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Validate milestone date is within project timeline
      const milestoneDate = new Date(formData.due_date);
      const startDate = new Date(projectStartDate);
      const endDate = new Date(projectEndDate);
      
      if (milestoneDate < startDate || milestoneDate > endDate) {
        toast.error(`Milestone date must be between ${formatDate(projectStartDate)} and ${formatDate(projectEndDate)}`);
        setLoading(false);
        return;
      }
      
      const updateData = {
        title: formData.title,
        due_date: new Date(formData.due_date).toISOString(),
        description: formData.description,
        assigned_resource_id: formData.assigned_resource_id === 'none' || !formData.assigned_resource_id ? null : formData.assigned_resource_id
      };
      
      if (milestone) {
        // Update existing milestone
        await axios.put(`${API}/milestones/${milestone.id}`, updateData);
        toast.success('Milestone updated successfully!');
      } else {
        // Create new milestone
        const milestoneData = {
          ...updateData,
          project_id: projectId
        };
        await axios.post(`${API}/milestones`, milestoneData);
        toast.success('Milestone created successfully!');
      }
      
      onMilestoneUpdated();
      onClose();
    } catch (error) {
      console.error('Error saving milestone:', error);
      toast.error('Failed to save milestone');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this milestone?')) {
      return;
    }

    try {
      await axios.delete(`${API}/milestones/${milestone.id}`);
      toast.success('Milestone deleted successfully!');
      onMilestoneUpdated();
      onClose();
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast.error('Failed to delete milestone');
    }
  };

  const assignedResource = projectResources?.find(r => r.id === formData.assigned_resource_id && formData.assigned_resource_id !== 'none');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">
            {milestone ? (editMode ? 'Edit Milestone' : 'Milestone Details') : 'Create Milestone'}
          </h3>
          {milestone && !editMode && (
            <p className="text-sm text-gray-600 mt-1">
              Status: {milestone.completed ? (
                <span className="text-green-600 font-medium">✅ Completed {milestone.completed_date ? formatDate(milestone.completed_date) : ''}</span>
              ) : (
                <span className="text-orange-600 font-medium">⏳ In Progress</span>
              )}
            </p>
          )}
        </div>
        
        {milestone && !editMode && (
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
              Edit
            </Button>
            {!milestone.completed && (
              <Button 
                size="sm"
                onClick={async () => {
                  try {
                    await axios.put(`${API}/milestones/${milestone.id}/complete`);
                    toast.success('Milestone completed!');
                    onMilestoneUpdated();
                  } catch (error) {
                    toast.error('Failed to complete milestone');
                  }
                }}
              >
                Mark Complete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {editMode || !milestone ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="milestone-title">Milestone Title</Label>
            <Input
              id="milestone-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g., Design Phase Complete"
            />
          </div>
          
          <div>
            <Label htmlFor="milestone-due-date">Due Date</Label>
            <Input
              id="milestone-due-date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              min={projectStartDate ? new Date(projectStartDate).toISOString().split('T')[0] : ''}
              max={projectEndDate ? new Date(projectEndDate).toISOString().split('T')[0] : ''}
              required
            />
            <p className="text-xs text-gray-600 mt-1">
              Must be between {formatDate(projectStartDate)} and {formatDate(projectEndDate)}
            </p>
          </div>
          
          <div>
            <Label htmlFor="milestone-description">Description</Label>
            <Textarea
              id="milestone-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details about this milestone"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="assigned-resource">Assign Resource (Optional)</Label>
            <Select 
              value={formData.assigned_resource_id} 
              onValueChange={(value) => setFormData({ ...formData, assigned_resource_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a resource (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No resource assigned</SelectItem>
                {projectResources?.map((resource) => (
                  <SelectItem key={resource.id} value={resource.id}>
                    {resource.name} ({resource.type.replace('_', ' ')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assignedResource && (
              <p className="text-sm text-blue-600 mt-1">
                📎 Assigned to: {assignedResource.name} ({assignedResource.type.replace('_', ' ')})
              </p>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => editMode ? setEditMode(false) : onClose()}
            >
              Cancel
            </Button>
            {milestone && editMode && (
              <Button 
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </Button>
            )}
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : milestone ? 'Save Changes' : 'Create Milestone'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <p className="font-medium">{milestone.title}</p>
          </div>
          
          <div>
            <Label>Due Date</Label>
            <p>{formatDate(milestone.due_date)}</p>
          </div>
          
          {milestone.description && (
            <div>
              <Label>Description</Label>
              <p>{milestone.description}</p>
            </div>
          )}

          {assignedResource && (
            <div>
              <Label>Assigned Resource</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className="bg-blue-100 text-blue-800">
                  {assignedResource.name}
                </Badge>
                <span className="text-sm text-gray-600">
                  ({assignedResource.type.replace('_', ' ')})
                </span>
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Milestone Form Component (Simplified for quick add)
const MilestoneForm = ({ projectId, projectStartDate, projectEndDate, onMilestoneCreated, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    due_date: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate milestone date is within project timeline
      const milestoneDate = new Date(formData.due_date);
      const startDate = new Date(projectStartDate);
      const endDate = new Date(projectEndDate);
      
      if (milestoneDate < startDate || milestoneDate > endDate) {
        toast.error(`Milestone date must be between ${formatDate(projectStartDate)} and ${formatDate(projectEndDate)}`);
        setLoading(false);
        return;
      }
      
      const milestoneData = {
        ...formData,
        project_id: projectId,
        due_date: new Date(formData.due_date).toISOString()
      };
      
      const response = await axios.post(`${API}/milestones`, milestoneData);
      toast.success('Milestone added successfully!');
      onMilestoneCreated(response.data);
      onClose();
    } catch (error) {
      console.error('Error creating milestone:', error);
      toast.error('Failed to add milestone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="milestone-title">Milestone Title</Label>
        <Input
          id="milestone-title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          data-testid="milestone-title-input"
          placeholder="e.g., Design Phase Complete, Testing Begin"
        />
      </div>
      
      <div>
        <Label htmlFor="milestone-due-date">Due Date</Label>
        <Input
          id="milestone-due-date"
          type="date"
          value={formData.due_date}
          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          min={projectStartDate ? new Date(projectStartDate).toISOString().split('T')[0] : ''}
          max={projectEndDate ? new Date(projectEndDate).toISOString().split('T')[0] : ''}
          required
          data-testid="milestone-due-date-input"
        />
        <p className="text-xs text-gray-600 mt-1">
          Must be between {formatDate(projectStartDate)} and {formatDate(projectEndDate)}
        </p>
      </div>
      
      <div>
        <Label htmlFor="milestone-description">Description (Optional)</Label>
        <Textarea
          id="milestone-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Additional details about this milestone"
          rows={3}
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} data-testid="add-milestone-submit">
          {loading ? 'Adding...' : 'Add Milestone'}
        </Button>
      </div>
    </form>
  );
};

// Expense Form Component
const ExpenseForm = ({ projectId, onExpenseCreated, onClose, editingExpense = null }) => {
  const [formData, setFormData] = useState({
    description: editingExpense?.description || '',
    amount: editingExpense?.amount || '',
    expense_type: editingExpense?.expense_type || 'other',
    date: editingExpense?.date ? new Date(editingExpense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  });
  const [linkToResource, setLinkToResource] = useState(false);
  const [resourceData, setResourceData] = useState({
    availability: '',
    allocated_amount: '1',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const expenseTypes = [
    { value: 'resource', label: 'Resource' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'material', label: 'Material' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingExpense) {
        // Update existing expense
        const expenseData = {
          ...formData,
          amount: parseFloat(formData.amount),
          date: new Date(formData.date).toISOString()
        };
        
        const response = await axios.put(`${API}/expenses/${editingExpense.id}`, expenseData);
        toast.success('Expense updated successfully!');
        onExpenseCreated(response.data);
      } else {
        // Create new expense
        if (linkToResource && (formData.expense_type === 'vendor' || formData.expense_type === 'equipment' || formData.expense_type === 'material')) {
          // Create expense with linked resource
          const expenseWithResourceData = {
            expense: {
              ...formData,
              amount: parseFloat(formData.amount),
              date: new Date(formData.date).toISOString(),
              project_id: projectId
            },
            resource: {
              name: formData.description.includes(':') ? formData.description.split(': ')[1] : formData.description,
              type: formData.expense_type === 'vendor' ? 'vendor' : formData.expense_type,
              cost_per_unit: parseFloat(formData.amount) / parseFloat(resourceData.allocated_amount || 1),
              availability: resourceData.availability,
              allocated_amount: parseFloat(resourceData.allocated_amount || 1),
              description: resourceData.description,
              project_id: projectId
            }
          };
          
          const response = await axios.post(`${API}/expenses/with-resource`, expenseWithResourceData);
          toast.success('Expense and resource created successfully!');
          onExpenseCreated(response.data.expense);
        } else {
          // Create regular expense
          const expenseData = {
            ...formData,
            amount: parseFloat(formData.amount),
            date: new Date(formData.date).toISOString(),
            project_id: projectId
          };
          
          const response = await axios.post(`${API}/expenses`, expenseData);
          toast.success('Expense added successfully!');
          onExpenseCreated(response.data);
        }
      }
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error(editingExpense ? 'Failed to update expense' : 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {editingExpense && editingExpense.resource_id && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>🔗 Linked to Resource:</strong> Changes here will automatically update the associated resource in the Resources tab.
          </p>
        </div>
      )}
      
      <div>
        <Label htmlFor="expense-description">Description</Label>
        <Input
          id="expense-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          data-testid="expense-description-input"
          placeholder="e.g., Office supplies, consultant fee"
        />
        {editingExpense && editingExpense.resource_id && (
          <p className="text-xs text-gray-600 mt-1">
            The resource name will be updated to match this description
          </p>
        )}
      </div>
      
      <div>
        <Label htmlFor="expense-type">Expense Type</Label>
        <Select 
          value={formData.expense_type} 
          onValueChange={(value) => setFormData({ ...formData, expense_type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {expenseTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Link to Resource Option */}
      {!editingExpense && (formData.expense_type === 'vendor' || formData.expense_type === 'equipment' || formData.expense_type === 'material') && (
        <div className="border rounded-lg p-4 bg-blue-50">
          <div className="flex items-center space-x-2 mb-3">
            <Checkbox
              id="link-to-resource"
              checked={linkToResource}
              onCheckedChange={setLinkToResource}
            />
            <Label htmlFor="link-to-resource" className="font-medium text-blue-900">
              🔗 Link to Resources Tab?
            </Label>
          </div>
          <p className="text-sm text-blue-800 mb-3">
            Create a corresponding resource in the Resources tab that will stay synchronized with this expense.
          </p>
          
          {linkToResource && (
            <div className="space-y-3 border-t border-blue-200 pt-3">
              <div>
                <Label htmlFor="resource-availability">Resource Availability</Label>
                <Input
                  id="resource-availability"
                  value={resourceData.availability}
                  onChange={(e) => setResourceData({ ...resourceData, availability: e.target.value })}
                  placeholder="e.g., Full-time, Available, On-demand"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="resource-quantity">Quantity/Amount</Label>
                <Input
                  id="resource-quantity"
                  type="number"
                  step="0.01"
                  value={resourceData.allocated_amount}
                  onChange={(e) => setResourceData({ ...resourceData, allocated_amount: e.target.value })}
                  placeholder="1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="resource-description">Resource Description (Optional)</Label>
                <Textarea
                  id="resource-description"
                  value={resourceData.description}
                  onChange={(e) => setResourceData({ ...resourceData, description: e.target.value })}
                  placeholder="Additional details about this resource"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expense-amount">Amount ($)</Label>
          <Input
            id="expense-amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
            data-testid="expense-amount-input"
            placeholder="0.00"
          />
        </div>

        <div>
          <Label htmlFor="expense-date">Date</Label>
          <Input
            id="expense-date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
            data-testid="expense-date-input"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} data-testid="add-expense-submit">
          {loading ? (editingExpense ? 'Updating...' : 'Adding...') : (editingExpense ? 'Update Expense' : 'Add Expense')}
        </Button>
      </div>
    </form>
  );
};

// Resource Form Component
const ResourceForm = ({ projectId, onResourceCreated, onClose, editingResource = null }) => {
  const [formData, setFormData] = useState({
    name: editingResource?.name || '',
    type: editingResource?.type || 'team_member',
    cost_per_unit: editingResource?.cost_per_unit || '',
    availability: editingResource?.availability || '',
    allocated_amount: editingResource?.allocated_amount || '',
    description: editingResource?.description || ''
  });
  const [loading, setLoading] = useState(false);

  const resourceTypes = [
    { value: 'team_member', label: 'Team Member' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'material', label: 'Material' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const resourceData = {
        ...formData,
        cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit) : null,
        allocated_amount: formData.allocated_amount ? parseFloat(formData.allocated_amount) : 0.0
      };
      
      if (editingResource) {
        // Update existing resource
        if (!projectId) resourceData.project_id = projectId;
        const response = await axios.put(`${API}/resources/${editingResource.id}`, resourceData);
        toast.success('Resource updated successfully!');
        onResourceCreated(response.data);
      } else {
        // Create new resource
        resourceData.project_id = projectId;
        const response = await axios.post(`${API}/resources`, resourceData);
        toast.success('Resource added successfully!');
        onResourceCreated(response.data);
      }
      onClose();
    } catch (error) {
      console.error('Error saving resource:', error);
      toast.error(editingResource ? 'Failed to update resource' : 'Failed to add resource');
    } finally {
      setLoading(false);
    }
  };

  const showCostField = formData.type === 'vendor' || formData.type === 'equipment' || formData.type === 'material';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="resource-name">Resource Name</Label>
        <Input
          id="resource-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          data-testid="resource-name-input"
        />
      </div>
      
      <div>
        <Label htmlFor="resource-type">Resource Type</Label>
        <Select 
          value={formData.type} 
          onValueChange={(value) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {resourceTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="availability">Availability</Label>
        <Input
          id="availability"
          value={formData.availability}
          onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
          placeholder="e.g., Full-time, Part-time, 40 hours/week"
          required
        />
      </div>

      {showCostField && (
        <>
          <div>
            <Label htmlFor="cost">Cost (Optional)</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              value={formData.cost_per_unit}
              onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
              placeholder="Enter cost if applicable"
              data-testid="resource-cost-input"
            />
            <p className="text-sm text-gray-600 mt-1">
              If you enter a cost for vendors, equipment, or materials, it will be automatically added to project expenses
            </p>
          </div>

          <div>
            <Label htmlFor="allocated-amount">Quantity/Amount</Label>
            <Input
              id="allocated-amount"
              type="number"
              step="0.01"
              value={formData.allocated_amount}
              onChange={(e) => setFormData({ ...formData, allocated_amount: e.target.value })}
              placeholder="e.g., 1, 5, 10"
            />
          </div>
        </>
      )}

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Additional details about this resource"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} data-testid="add-resource-submit">
          {loading ? (editingResource ? 'Updating...' : 'Adding...') : (editingResource ? 'Update Resource' : 'Add Resource')}
        </Button>
      </div>
    </form>
  );
};

// Timeline Management Component
const TimelineManager = ({ project, onTimelineUpdated, onClose, milestones, onMilestoneUpdate, onMilestoneEdit }) => {
  const [projectDates, setProjectDates] = useState({
    start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
    end_date: project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : ''
  });
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    due_date: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const handleUpdateProjectDates = async () => {
    // Validate dates
    const startDate = new Date(projectDates.start_date);
    const endDate = new Date(projectDates.end_date);
    
    if (endDate <= startDate) {
      toast.error('End date must be after start date. Please fix the dates.');
      return;
    }
    
    setLoading(true);
    try {
      const updateData = {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      };
      
      const response = await axios.put(`${API}/projects/${project.id}`, updateData);
      
      // Update the local project object
      project.start_date = response.data.start_date;
      project.end_date = response.data.end_date;
      
      toast.success('Project timeline saved successfully!');
      onTimelineUpdated(); // This will refresh the parent component
    } catch (error) {
      console.error('Error updating project dates:', error);
      toast.error('Failed to save project timeline');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMilestone = async () => {
    if (!newMilestone.title || !newMilestone.due_date) {
      toast.error('Please fill in milestone title and date');
      return;
    }

    // Validate milestone date is within project timeline
    const milestoneDate = new Date(newMilestone.due_date);
    const startDate = new Date(projectDates.start_date);
    const endDate = new Date(projectDates.end_date);
    
    if (milestoneDate < startDate || milestoneDate > endDate) {
      toast.error(`Milestone date must be between ${formatDate(projectDates.start_date)} and ${formatDate(projectDates.end_date)}`);
      return;
    }

    try {
      const milestoneData = {
        ...newMilestone,
        project_id: project.id,
        due_date: milestoneDate.toISOString()
      };
      
      const response = await axios.post(`${API}/milestones`, milestoneData);
      setNewMilestone({ title: '', due_date: '', description: '' });
      toast.success('Timeline milestone added successfully!');
      
      // Update milestones in parent component
      if (onMilestoneUpdate) {
        onMilestoneUpdate();
      }
    } catch (error) {
      console.error('Error adding milestone:', error);
      toast.error('Failed to add milestone');
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm('Are you sure you want to delete this milestone?')) {
      return;
    }

    try {
      await axios.delete(`${API}/milestones/${milestoneId}`);
      toast.success('Milestone deleted successfully!');
      
      // Update milestones in parent component
      if (onMilestoneUpdate) {
        onMilestoneUpdate();
      }
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast.error('Failed to delete milestone');
    }
  };

  const timeline = calculateTimelineProgress(projectDates.start_date, projectDates.end_date);
  
  return (
    <div className="space-y-6">
      {/* Project Date Management */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Project Timeline Settings</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={projectDates.start_date}
              onChange={(e) => setProjectDates({ ...projectDates, start_date: e.target.value })}
              data-testid="timeline-start-date"
              className={
                projectDates.start_date !== (project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '') 
                  ? 'border-yellow-400 bg-yellow-50' : ''
              }
            />
          </div>
          <div>
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={projectDates.end_date}
              onChange={(e) => setProjectDates({ ...projectDates, end_date: e.target.value })}
              data-testid="timeline-end-date"
              className={
                projectDates.end_date !== (project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '') 
                  ? 'border-yellow-400 bg-yellow-50' : ''
              }
            />
          </div>
        </div>

        {/* Date validation error */}
        {projectDates.start_date && projectDates.end_date && new Date(projectDates.end_date) <= new Date(projectDates.start_date) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              ❌ Invalid dates: End date must be after start date. Please correct the dates before saving.
            </p>
          </div>
        )}

        {/* Unsaved changes indicator */}
        {(projectDates.start_date !== (project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '') ||
          projectDates.end_date !== (project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '')) && 
          !(projectDates.start_date && projectDates.end_date && new Date(projectDates.end_date) <= new Date(projectDates.start_date)) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ You have unsaved changes. Click "Save Project Timeline" to apply your changes.
            </p>
          </div>
        )}

        <div className="flex items-center space-x-3">
          <Button 
            onClick={handleUpdateProjectDates} 
            disabled={loading || (projectDates.start_date && projectDates.end_date && new Date(projectDates.end_date) <= new Date(projectDates.start_date))}
            data-testid="save-timeline-btn"
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
          >
            {loading ? 'Saving Timeline...' : '💾 Save Project Timeline'}
          </Button>
          
          {/* Reset button */}
          <Button 
            variant="outline"
            onClick={() => {
              setProjectDates({
                start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
                end_date: project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : ''
              });
            }}
            disabled={loading}
          >
            Reset to Original
          </Button>
        </div>

        {/* Current Timeline Status */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Current Timeline Status</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">{timeline.progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  timeline.isOverdue ? 'bg-red-500' :
                  timeline.isDangerZone ? 'bg-orange-500' :
                  timeline.progressPercentage >= 75 ? 'bg-green-500' :
                  timeline.progressPercentage >= 50 ? 'bg-blue-500' :
                  'bg-gray-400'
                }`}
                style={{ width: `${Math.min(timeline.progressPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Total: {timeline.daysTotal} days</span>
              <span className={timeline.isOverdue ? 'text-red-600 font-medium' : ''}>
                {timeline.isOverdue ? 
                  `${timeline.daysOverdue} days overdue` :
                  `${timeline.daysRemaining} days remaining`
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Milestones */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Timeline Milestones</h3>
        
        {/* Add New Milestone */}
        <div className="border rounded-lg p-4 bg-blue-50">
          <h4 className="font-medium mb-3">Add Timeline Milestone</h4>
          <div className="space-y-3">
            <div>
              <Label htmlFor="milestone-title">Milestone Title</Label>
              <Input
                id="milestone-title"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                placeholder="e.g., Design Phase Complete, Testing Phase Start"
                data-testid="milestone-title-input"
              />
            </div>
            
            <div>
              <Label htmlFor="milestone-date">Target Date</Label>
              <Input
                id="milestone-date"
                type="date"
                value={newMilestone.due_date}
                onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                min={projectDates.start_date}
                max={projectDates.end_date}
                data-testid="milestone-date-input"
              />
            </div>
            
            <div>
              <Label htmlFor="milestone-description">Description (Optional)</Label>
              <Textarea
                id="milestone-description"
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                placeholder="Additional details about this milestone"
                rows={2}
              />
            </div>
            
            <Button onClick={handleAddMilestone} data-testid="add-milestone-btn">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </div>
        </div>

        {/* Existing Milestones */}
        <div className="space-y-3">
          {milestones && milestones.length > 0 ? (
            milestones
              .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
              .map((milestone) => {
                const milestoneDate = new Date(milestone.due_date);
                const isOverdue = milestoneDate < new Date() && !milestone.completed;
                
                return (
                  <div 
                    key={milestone.id} 
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      milestone.completed ? 'bg-green-50 border-green-200' : 
                      isOverdue ? 'bg-red-50 border-red-200' : 'bg-white'
                    }`}
                  >
                    <div className="flex-1">
                      <h4 className={`font-medium ${milestone.completed ? 'line-through text-gray-600' : ''}`}>
                        {milestone.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Target: {formatDate(milestone.due_date)}
                        {isOverdue && !milestone.completed && (
                          <span className="text-red-600 font-medium ml-2">• Overdue</span>
                        )}
                        {milestone.completed && milestone.completed_date && (
                          <span className="text-green-600 ml-2">• Completed {formatDate(milestone.completed_date)}</span>
                        )}
                      </p>
                      {milestone.description && (
                        <p className="text-sm text-gray-500 mt-1">{milestone.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          // Open milestone edit dialog from timeline
                          if (onMilestoneEdit) {
                            onMilestoneEdit(milestone);
                          }
                        }}
                        data-testid={`edit-timeline-milestone-${milestone.id}`}
                      >
                        Edit
                      </Button>
                      
                      {!milestone.completed && (
                        <Button 
                          size="sm"
                          onClick={async () => {
                            try {
                              await axios.put(`${API}/milestones/${milestone.id}/complete`);
                              toast.success('Milestone completed!');
                              
                              // Update milestones in parent component
                              if (onMilestoneUpdate) {
                                onMilestoneUpdate();
                              }
                            } catch (error) {
                              toast.error('Failed to complete milestone');
                            }
                          }}
                          data-testid={`complete-timeline-milestone-${milestone.id}`}
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteMilestone(milestone.id)}
                        className="text-red-600 hover:text-red-800"
                        data-testid={`delete-timeline-milestone-${milestone.id}`}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="text-center py-6 text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No timeline milestones yet</p>
              <p className="text-sm">Add milestones to track progress along your project timeline</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Close Timeline Manager
        </Button>
      </div>
    </div>
  );
};

// Project Detail Component
const ProjectDetail = ({ project, onBack, onProjectUpdated }) => {
  const [resources, setResources] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budgetSummary, setBudgetSummary] = useState({});
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddResource, setShowAddResource] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showTimelineManager, setShowTimelineManager] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showMilestoneDetail, setShowMilestoneDetail] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [milestoneEditMode, setMilestoneEditMode] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [pendingStageChange, setPendingStageChange] = useState(null);
  
  // Document management state
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState("/");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [documentActionDialog, setDocumentActionDialog] = useState({ show: false, action: null, document: null });
  const [dragOverFolder, setDragOverFolder] = useState(null);

  useEffect(() => {
    if (project) {
      fetchProjectData();
    }
  }, [project]);

  // Fetch documents when current folder changes
  useEffect(() => {
    if (project && currentFolder !== '/') {
      const fetchFolderDocuments = async () => {
        try {
          const documentsRes = await axios.get(`${API}/projects/${project.id}/documents?folder_path=${currentFolder}`);
          setDocuments(documentsRes.data);
        } catch (error) {
          console.error('Error fetching folder documents:', error);
        }
      };
      fetchFolderDocuments();
    }
  }, [currentFolder, project]);

  const fetchProjectData = async () => {
    try {
      const [resourcesRes, milestonesRes, expensesRes, budgetRes, documentsRes, foldersRes] = await Promise.all([
        axios.get(`${API}/projects/${project.id}/resources`),
        axios.get(`${API}/projects/${project.id}/milestones`),
        axios.get(`${API}/projects/${project.id}/expenses`),
        axios.get(`${API}/projects/${project.id}/budget-summary`),
        axios.get(`${API}/projects/${project.id}/documents?folder_path=${currentFolder}`),
        axios.get(`${API}/projects/${project.id}/folders`)
      ]);
      
      setResources(resourcesRes.data);
      setMilestones(milestonesRes.data);
      setExpenses(expensesRes.data);
      setBudgetSummary(budgetRes.data);
      setDocuments(documentsRes.data);
      setFolders(foldersRes.data);
    } catch (error) {
      console.error('Error fetching project data:', error);
    }
  };

  const completeMilestone = async (milestoneId) => {
    try {
      await axios.put(`${API}/milestones/${milestoneId}/complete`);
      toast.success('Milestone completed!');
      
      // Update the milestones state immediately for better UX
      setMilestones(milestones.map(m => 
        m.id === milestoneId 
          ? { ...m, completed: true, completed_date: new Date().toISOString() }
          : m
      ));
      
      // Refresh all project data
      fetchProjectData();
    } catch (error) {
      console.error('Error completing milestone:', error);
      toast.error('Failed to complete milestone');
    }
  };

  const updateProjectStage = async (newStage) => {
    // If the new stage is "closed", show confirmation dialog
    if (newStage === 'closed') {
      setPendingStageChange(newStage);
      setShowCloseConfirmation(true);
      return;
    }
    
    // For non-closed stages, proceed normally
    await performStageUpdate(newStage);
  };

  const performStageUpdate = async (newStage) => {
    try {
      await axios.put(`${API}/projects/${project.id}/stage`, null, {
        params: { stage: newStage }
      });
      toast.success(`Project stage updated to ${newStage.charAt(0).toUpperCase() + newStage.slice(1)}!`);
      // Update the project stage locally
      project.stage = newStage;
      // Refresh project data
      fetchProjectData();
      // Call onProjectUpdated to refresh the parent's project list
      if (onProjectUpdated) {
        onProjectUpdated({ ...project, stage: newStage });
      }
    } catch (error) {
      console.error('Error updating project stage:', error);
      toast.error('Failed to update project stage');
    }
  };

  const handleCloseConfirmation = async () => {
    setShowCloseConfirmation(false);
    if (pendingStageChange) {
      await performStageUpdate(pendingStageChange);
      setPendingStageChange(null);
    }
  };

  const handleCancelClose = () => {
    setShowCloseConfirmation(false);
    setPendingStageChange(null);
    // Reset the select to the current stage
    // This is handled automatically by the Select component since we didn't update the project.stage
  };

  // Document Management Functions
  const handleFileUpload = async (files) => {
    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadParams = new URLSearchParams({
        project_id: project.id,
        folder_path: currentFolder,
        uploaded_by: 'user'
      });

      try {
        const response = await axios.post(`${API}/documents/upload?${uploadParams}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        toast.error(`Failed to upload ${file.name}`);
        throw error;
      }
    });

    try {
      await Promise.all(uploadPromises);
      toast.success(`${files.length} file(s) uploaded successfully!`);
      fetchProjectData(); // Refresh documents
      setShowUploadDialog(false);
    } catch (error) {
      // Individual errors are already handled above
    }
  };

  const handleCreateFolder = async (folderName, color) => {
    try {
      await axios.post(`${API}/projects/${project.id}/folders`, null, {
        params: {
          name: folderName,
          parent_path: currentFolder,
          color: color,
          created_by: 'user'
        }
      });
      toast.success('Folder created successfully!');
      fetchProjectData(); // Refresh folders
      setShowCreateFolder(false);
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    }
  };

  const handleDownloadDocument = async (documentId, fileName) => {
    try {
      const response = await axios.get(`${API}/documents/${documentId}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('File downloaded successfully!');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      await axios.delete(`${API}/documents/${documentId}`);
      toast.success('Document deleted successfully!');
      fetchProjectData(); // Refresh documents
      setDocumentActionDialog({ show: false, action: null, document: null });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleMoveDocument = async (documentId, newFolderPath) => {
    try {
      await axios.put(`${API}/documents/${documentId}/move`, null, {
        params: { new_folder_path: newFolderPath }
      });
      
      // Update the documents state immediately to remove the moved document from current view
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));
      
      toast.success('Document moved successfully!');
      
      // Also refresh the full project data to ensure consistency
      fetchProjectData(); 
    } catch (error) {
      console.error('Error moving document:', error);
      toast.error('Failed to move document');
    }
  };

  const handleCopyDocument = async (documentId, newFolderPath) => {
    try {
      const response = await axios.post(`${API}/documents/${documentId}/copy`, null, {
        params: { new_folder_path: newFolderPath }
      });
      
      // For copy operation, we don't remove the original file from current view
      // The original stays in the current folder, and a copy is created in the destination
      
      const folderName = newFolderPath === '/' ? 'Root Folder' : 
        folders.find(f => f.folder_path === newFolderPath)?.name || 'Selected Folder';
      
      toast.success(`Document copied to "${folderName}" successfully!`);
      
      // Refresh project data to ensure we have the latest state
      fetchProjectData();
    } catch (error) {
      console.error('Error copying document:', error);
      toast.error('Failed to copy document');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      await axios.delete(`${API}/folders/${folderId}`);
      toast.success('Folder deleted successfully!');
      fetchProjectData(); // Refresh folders and documents
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Failed to delete folder');
    }
  };

  const navigateToFolder = async (folderPath) => {
    setCurrentFolder(folderPath);
    
    // Fetch documents for the new folder
    try {
      const documentsRes = await axios.get(`${API}/projects/${project.id}/documents?folder_path=${folderPath}`);
      setDocuments(documentsRes.data);
    } catch (error) {
      console.error('Error fetching documents for folder:', error);
      toast.error('Failed to load folder contents');
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      case 'txt': return '📄';
      default: return '📎';
    }
  };

  const getBreadcrumbs = () => {
    if (currentFolder === '/') return ['Home'];
    const parts = currentFolder.split('/').filter(part => part !== '');
    return ['Home', ...parts];
  };

  const getCurrentFolderContents = () => {
    const currentFolders = folders.filter(folder => 
      folder.parent_path === currentFolder
    );
    
    const currentDocuments = documents.filter(doc => 
      doc.folder_path === currentFolder
    );
    
    return { folders: currentFolders, documents: currentDocuments };
  };

  const handleResourceCreated = (newResource) => {
    if (editingResource) {
      // Update existing resource in list
      setResources(resources.map(r => r.id === newResource.id ? newResource : r));
      setEditingResource(null);
    } else {
      // Add new resource to list
      setResources([...resources, newResource]);
    }
    setShowAddResource(false);
    // Refresh project data to update budget summary if expense was created
    fetchProjectData();
  };

  const handleEditResource = (resource) => {
    setEditingResource(resource);
    setShowAddResource(true);
  };

  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource? This will also remove any associated expenses.')) {
      return;
    }

    try {
      await axios.delete(`${API}/resources/${resourceId}`);
      toast.success('Resource deleted successfully!');
      setResources(resources.filter(r => r.id !== resourceId));
      // Refresh project data to update budget summary
      fetchProjectData();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    }
  };

  const handleCloseResourceForm = () => {
    setShowAddResource(false);
    setEditingResource(null);
  };

  const handleExpenseCreated = (newExpense) => {
    if (editingExpense) {
      // Update existing expense in list
      setExpenses(expenses.map(e => e.id === newExpense.id ? newExpense : e));
      setEditingExpense(null);
      
      // If this expense is linked to a resource, show specific message
      if (newExpense.resource_id) {
        toast.success('Expense updated successfully! Associated resource has been updated too.');
      }
    } else {
      // Add new expense to list
      setExpenses([...expenses, newExpense]);
    }
    setShowAddExpense(false);
    // Refresh project data to update budget summary and resources (especially important for linked expenses)
    fetchProjectData();
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setShowAddExpense(true);
  };

  const handleDeleteExpense = async (expenseId) => {
    const expense = expenses.find(e => e.id === expenseId);
    const isLinkedToResource = expense?.resource_id;
    
    const confirmMessage = isLinkedToResource 
      ? 'Are you sure you want to delete this expense? This will also delete the associated resource from the Resources tab.'
      : 'Are you sure you want to delete this expense?';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await axios.delete(`${API}/expenses/${expenseId}`);
      
      if (isLinkedToResource) {
        toast.success('Expense and associated resource deleted successfully!');
        // Remove the associated resource from the resources list
        setResources(resources.filter(r => r.id !== expense.resource_id));
        // Remove all expenses associated with this resource
        setExpenses(expenses.filter(e => e.resource_id !== expense.resource_id));
      } else {
        toast.success('Expense deleted successfully!');
        // Just remove this expense
        setExpenses(expenses.filter(e => e.id !== expenseId));
      }
      
      // Refresh project data to update budget summary
      fetchProjectData();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const handleCloseExpenseForm = () => {
    setShowAddExpense(false);
    setEditingExpense(null);
  };

  const handleTimelineUpdated = async () => {
    // Refresh project data to show updated timeline
    try {
      const response = await axios.get(`${API}/projects/${project.id}`);
      // Update the project object with the latest data
      Object.assign(project, response.data);
      // Refresh all project data
      fetchProjectData();
      // Notify parent component to update projects list
      if (onProjectUpdated) {
        onProjectUpdated(response.data);
      }
    } catch (error) {
      console.error('Error refreshing project data:', error);
    }
  };

  const handleMilestoneUpdate = async () => {
    // Refresh milestones data when updated from timeline manager
    try {
      const [milestonesRes] = await Promise.all([
        axios.get(`${API}/projects/${project.id}/milestones`)
      ]);
      setMilestones(milestonesRes.data);
      
      // Also refresh other data to update progress calculations
      fetchProjectData();
    } catch (error) {
      console.error('Error refreshing milestones:', error);
    }
  };

  const handleMilestoneCreated = (newMilestone) => {
    setMilestones([...milestones, newMilestone]);
    setShowAddMilestone(false);
    // Refresh project data to update progress calculations
    fetchProjectData();
  };

  const handleMilestoneClick = (milestone) => {
    setSelectedMilestone(milestone);
    setMilestoneEditMode(false);
    setShowMilestoneDetail(true);
  };

  const handleMilestoneEdit = (milestone) => {
    setSelectedMilestone(milestone);
    setMilestoneEditMode(true);
    setShowMilestoneDetail(true);
  };

  const handleMilestoneDetailUpdated = async () => {
    // Refresh milestones and close dialog
    await handleMilestoneUpdate();
    setShowMilestoneDetail(false);
    setSelectedMilestone(null);
    setMilestoneEditMode(false);
  };

  if (!project) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-2">
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-gray-600">{project.description}</p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <Label className="text-sm text-gray-600">Project Stage (Project Manager Only)</Label>
          <Select 
            value={project.stage} 
            onValueChange={updateProjectStage}
            data-testid="project-stage-selector"
          >
            <SelectTrigger className="w-48">
              <SelectValue>
                <Badge className={getStageColor(project.stage)}>
                  {project.stage.charAt(0).toUpperCase() + project.stage.slice(1)}
                </Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STAGES.map((stage) => (
                <SelectItem key={stage.value} value={stage.value} data-testid={`stage-${stage.value}`}>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStageColor(stage.value) + ' text-xs'}>
                      {stage.label}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSignIcon className="h-5 w-5" />
              <span>Budget Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Budget:</span>
                <span className="font-semibold">{formatCurrency(budgetSummary.budget || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Spent:</span>
                <span className="font-semibold">{formatCurrency(budgetSummary.total_expenses || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining:</span>
                <span className={`font-semibold ${(budgetSummary.remaining || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(budgetSummary.remaining || 0)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(budgetSummary.percentage_used || 0, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowTimelineManager(true)}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Project Timeline</span>
              </div>
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                Click to Manage
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const timeline = calculateTimelineProgress(project.start_date, project.end_date);
              return (
                <div className="space-y-4">
                  {/* Timeline Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{timeline.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          timeline.isOverdue ? 'bg-red-500' :
                          timeline.isDangerZone ? 'bg-orange-500' :
                          timeline.progressPercentage >= 75 ? 'bg-green-500' :
                          timeline.progressPercentage >= 50 ? 'bg-blue-500' :
                          'bg-gray-400'
                        }`}
                        style={{ width: `${Math.min(timeline.progressPercentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Start: {formatDate(project.start_date)}</span>
                      <span>End: {formatDate(project.end_date)}</span>
                    </div>
                  </div>

                  {/* Timeline Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Days Elapsed</div>
                      <div className="font-semibold text-lg">{timeline.daysElapsed}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Total Duration</div>
                      <div className="font-semibold text-lg">{timeline.daysTotal} days</div>
                    </div>
                  </div>

                  {/* Days Until Completion */}
                  <div className="border-t pt-3">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Days Until Project Completion</div>
                      <div className={`text-2xl font-bold ${
                        timeline.isOverdue ? 'text-red-600' :
                        timeline.isDangerZone ? 'text-red-600' :
                        timeline.daysRemaining <= 7 ? 'text-orange-600' :
                        'text-gray-900'
                      }`}>
                        {timeline.isOverdue ? 
                          `${timeline.daysOverdue} days overdue` :
                          `${timeline.daysRemaining} days`
                        }
                      </div>
                      {timeline.isDangerZone && !timeline.isOverdue && (
                        <div className="text-xs text-red-600 font-medium mt-1">
                          ⚠️ Final 10% - Deadline Approaching!
                        </div>
                      )}
                      {timeline.isOverdue && (
                        <div className="text-xs text-red-600 font-medium mt-1">
                          🚨 Project Overdue
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Current Date Indicator */}
                  <div className="text-center text-xs text-gray-500 border-t pt-2">
                    Current Date: {formatDate(new Date().toISOString())}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TargetIcon className="h-5 w-5" />
              <span>Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Milestones:</span>
                <span>{milestones.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed:</span>
                <span>{milestones.filter(m => m.completed).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Completion Rate:</span>
                <span>{milestones.length > 0 ? Math.round((milestones.filter(m => m.completed).length / milestones.length) * 100) : 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Milestones */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {milestones.filter(m => !m.completed).slice(0, 3).map((milestone) => (
                    <div key={milestone.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{milestone.title}</h4>
                        <p className="text-sm text-gray-600">Due: {formatDate(milestone.due_date)}</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => completeMilestone(milestone.id)}
                        data-testid={`complete-milestone-${milestone.id}`}
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    </div>
                  ))}
                  {milestones.filter(m => !m.completed).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No pending milestones</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Expenses */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expenses.slice(0, 3).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{expense.description}</h4>
                        <p className="text-sm text-gray-600">{expense.expense_type}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(expense.amount)}</div>
                        <div className="text-sm text-gray-600">{formatDate(expense.date)}</div>
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No expenses recorded</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="resources">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Project Resources</CardTitle>
                <CardDescription>Manage team members, vendors, equipment, and materials</CardDescription>
              </div>
              <Dialog open={showAddResource} onOpenChange={setShowAddResource}>
                <DialogTrigger asChild>
                  <Button data-testid="add-resource-button">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Resource
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>{editingResource ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
                    <DialogDescription>
                      {editingResource ? 'Update resource information and costs.' : 'Add team members, vendors, equipment, or materials to your project.'}
                    </DialogDescription>
                  </DialogHeader>
                  <ResourceForm 
                    projectId={project.id}
                    onResourceCreated={handleResourceCreated}
                    onClose={handleCloseResourceForm}
                    editingResource={editingResource}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resources && resources.length > 0 ? resources.map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h4 className="font-medium">{resource.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge 
                              className={
                                resource.type === 'team_member' ? 'bg-blue-100 text-blue-800' :
                                resource.type === 'vendor' ? 'bg-purple-100 text-purple-800' :
                                resource.type === 'equipment' ? 'bg-green-100 text-green-800' :
                                'bg-orange-100 text-orange-800'
                              }
                            >
                              {resource.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Availability: {resource.availability}</p>
                          {resource.description && (
                            <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        {resource.cost_per_unit && (
                          <div className="font-semibold">{formatCurrency(resource.cost_per_unit)}/unit</div>
                        )}
                        {resource.allocated_amount > 0 && (
                          <div className="text-sm text-gray-600">Quantity: {resource.allocated_amount}</div>
                        )}
                        {resource.cost_per_unit && resource.allocated_amount > 0 && (
                          <div className="text-sm font-medium text-green-600">
                            Total: {formatCurrency(resource.cost_per_unit * resource.allocated_amount)}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditResource(resource)}
                          data-testid={`edit-resource-${resource.id}`}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteResource(resource.id)}
                          className="text-red-600 hover:text-red-800 hover:border-red-300"
                          data-testid={`delete-resource-${resource.id}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No resources assigned to this project</p>
                    <Button 
                      onClick={() => setShowAddResource(true)}
                      data-testid="add-first-resource-button"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Your First Resource
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="milestones">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Project Milestones</CardTitle>
                <CardDescription>Track important project milestones and deadlines</CardDescription>
              </div>
              <Dialog open={showAddMilestone} onOpenChange={setShowAddMilestone}>
                <DialogTrigger asChild>
                  <Button data-testid="add-milestone-button">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Milestone
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New Milestone</DialogTitle>
                    <DialogDescription>
                      Create a milestone to track important project deadlines.
                    </DialogDescription>
                  </DialogHeader>
                  <MilestoneForm 
                    projectId={project.id}
                    projectStartDate={project.start_date}
                    projectEndDate={project.end_date}
                    onMilestoneCreated={handleMilestoneCreated}
                    onClose={() => setShowAddMilestone(false)}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestones && milestones.length > 0 ? milestones.map((milestone) => {
                  const assignedResource = resources?.find(r => r.id === milestone.assigned_resource_id);
                  
                  return (
                    <div 
                      key={milestone.id} 
                      className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                        milestone.completed ? 'bg-green-50 border-green-200' : 'bg-white'
                      }`}
                      onClick={() => handleMilestoneClick(milestone)}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        {milestone.completed ? (
                          <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        ) : (
                          <ClockIcon className="h-6 w-6 text-gray-400" />
                        )}
                        <div className="flex-1">
                          <h4 className={`font-medium ${
                            milestone.completed ? 'line-through text-gray-600' : ''
                          }`}>{milestone.title}</h4>
                          {milestone.description && (
                            <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="text-sm text-gray-600">Due: {formatDate(milestone.due_date)}</p>
                            {assignedResource && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                👤 {assignedResource.name}
                              </Badge>
                            )}
                          </div>
                          {milestone.completed && milestone.completed_date && (
                            <p className="text-sm text-green-600 mt-1">Completed: {formatDate(milestone.completed_date)}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMilestoneEdit(milestone);
                          }}
                          data-testid={`edit-milestone-${milestone.id}`}
                        >
                          Edit
                        </Button>
                        {!milestone.completed && (
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              completeMilestone(milestone.id);
                            }}
                            data-testid={`complete-milestone-${milestone.id}`}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-8">
                    <TargetIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No milestones defined for this project</p>
                    <Button 
                      onClick={() => setShowAddMilestone(true)}
                      data-testid="add-first-milestone-button"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Your First Milestone
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="expenses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Project Expenses</CardTitle>
                <CardDescription>Track and manage all project-related expenses</CardDescription>
              </div>
              <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
                <DialogTrigger asChild>
                  <Button data-testid="add-expense-button">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
                    <DialogDescription>
                      {editingExpense ? 'Update expense information and amount.' : 'Record a new expense for this project.'}
                    </DialogDescription>
                  </DialogHeader>
                  <ExpenseForm 
                    projectId={project.id}
                    onExpenseCreated={handleExpenseCreated}
                    onClose={handleCloseExpenseForm}
                    editingExpense={editingExpense}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenses && expenses.length > 0 ? expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h4 className="font-medium">{expense.description}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge 
                              className={
                                expense.expense_type === 'vendor' ? 'bg-purple-100 text-purple-800' :
                                expense.expense_type === 'equipment' ? 'bg-green-100 text-green-800' :
                                expense.expense_type === 'material' ? 'bg-orange-100 text-orange-800' :
                                expense.expense_type === 'resource' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {expense.expense_type.replace('_', ' ')}
                            </Badge>
                            {expense.resource_id && (
                              <Badge className="bg-blue-50 text-blue-700 text-xs">
                                🔗 Linked to Resource
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Date: {formatDate(expense.date)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold text-lg">{formatCurrency(expense.amount)}</div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditExpense(expense)}
                          data-testid={`edit-expense-${expense.id}`}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-600 hover:text-red-800 hover:border-red-300"
                          data-testid={`delete-expense-${expense.id}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <DollarSignIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No expenses recorded for this project</p>
                    <Button 
                      onClick={() => setShowAddExpense(true)}
                      data-testid="add-first-expense-button"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Your First Expense
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="documents">
          <div className="space-y-4">
            {/* Header and Actions */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Project Documents</h3>
                <p className="text-sm text-gray-600">Organize and manage your project files</p>
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => setShowCreateFolder(true)} variant="outline" size="sm">
                  <FolderPlusIcon className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
                <Button onClick={() => setShowUploadDialog(true)} size="sm">
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Add Documents
                </Button>
              </div>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 text-sm">
              {getBreadcrumbs().map((crumb, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                  <button
                    onClick={() => {
                      if (index === 0) {
                        navigateToFolder('/');
                      } else {
                        const path = '/' + getBreadcrumbs().slice(1, index + 1).join('/');
                        navigateToFolder(path);
                      }
                    }}
                    className={`hover:text-blue-600 px-2 py-1 rounded transition-colors ${
                      index === getBreadcrumbs().length - 1 ? 'font-medium text-gray-900' : 'text-gray-600'
                    } ${dragOverFolder === `breadcrumb-${index}` ? 'bg-blue-100 text-blue-600' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      setDragOverFolder(`breadcrumb-${index}`);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setDragOverFolder(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverFolder(null);
                      
                      try {
                        const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                        if (dragData.type === 'document') {
                          const targetPath = index === 0 ? '/' : '/' + getBreadcrumbs().slice(1, index + 1).join('/');
                          handleMoveDocument(dragData.id, targetPath);
                          toast.success(`"${dragData.name}" moved to "${crumb}" folder`);
                        }
                      } catch (error) {
                        console.error('Error parsing drag data:', error);
                        toast.error('Failed to move document');
                      }
                    }}
                  >
                    {crumb}
                  </button>
                </div>
              ))}
              {dragOverFolder && dragOverFolder.startsWith('breadcrumb') && (
                <div className="text-xs text-blue-600 ml-2">
                  Drop here to move file
                </div>
              )}
            </div>

            {/* File Manager */}
            <Card>
              <CardContent 
                className={`p-6 transition-colors ${
                  dragOverFolder === 'root' ? 'bg-blue-50' : ''
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (currentFolder !== '/') {
                    setDragOverFolder('root');
                  }
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragOverFolder(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverFolder(null);
                  
                  if (currentFolder === '/') return; // Already in root
                  
                  try {
                    const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                    if (dragData.type === 'document') {
                      // Move the document to root folder
                      handleMoveDocument(dragData.id, '/');
                      toast.success(`"${dragData.name}" moved to root folder`);
                    }
                  } catch (error) {
                    console.error('Error parsing drag data:', error);
                    toast.error('Failed to move document');
                  }
                }}
              >
                {(() => {
                  const { folders: currentFolders, documents: currentDocuments } = getCurrentFolderContents();
                  
                  if (currentFolders.length === 0 && currentDocuments.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Empty folder</h3>
                        <p className="text-gray-600 mb-4">Upload documents or create folders to organize your files</p>
                        <div className="flex justify-center space-x-2">
                          <Button onClick={() => setShowUploadDialog(true)} variant="outline" size="sm">
                            <UploadIcon className="h-4 w-4 mr-2" />
                            Upload Files
                          </Button>
                          <Button onClick={() => setShowCreateFolder(true)} variant="outline" size="sm">
                            <FolderPlusIcon className="h-4 w-4 mr-2" />
                            Create Folder
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {/* Folders */}
                      {currentFolders.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Folders</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {currentFolders.map((folder) => (
                              <div
                                key={folder.id}
                                className={`flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer group transition-colors ${
                                  dragOverFolder === folder.id ? 'border-blue-500 bg-blue-50' : ''
                                }`}
                                onClick={() => navigateToFolder(folder.folder_path)}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = 'move';
                                  setDragOverFolder(folder.id);
                                }}
                                onDragLeave={(e) => {
                                  e.preventDefault();
                                  setDragOverFolder(null);
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDragOverFolder(null);
                                  
                                  try {
                                    const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                                    if (dragData.type === 'document') {
                                      // Move the document to this folder
                                      handleMoveDocument(dragData.id, folder.folder_path);
                                      toast.success(`"${dragData.name}" moved to "${folder.name}" folder`);
                                    }
                                  } catch (error) {
                                    console.error('Error parsing drag data:', error);
                                    toast.error('Failed to move document');
                                  }
                                }}
                              >
                                <div 
                                  className="w-8 h-8 rounded flex items-center justify-center mr-3"
                                  style={{ backgroundColor: folder.color + '20', color: folder.color }}
                                >
                                  <FolderIcon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{folder.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {dragOverFolder === folder.id ? 'Drop file here' : `Created ${formatDate(folder.created_at)}`}
                                  </p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDocumentActionDialog({
                                        show: true,
                                        action: 'edit-folder',
                                        document: folder
                                      });
                                    }}
                                  >
                                    <EditIcon className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm('Are you sure you want to delete this folder and all its contents?')) {
                                        handleDeleteFolder(folder.id);
                                      }
                                    }}
                                  >
                                    <TrashIcon className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Documents */}
                      {currentDocuments.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Files</h4>
                          <div className="space-y-2">
                            {currentDocuments.map((document) => (
                              <div 
                                key={document.id} 
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 group cursor-move"
                                draggable="true"
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', JSON.stringify({
                                    type: 'document',
                                    id: document.id,
                                    name: document.name
                                  }));
                                  e.dataTransfer.effectAllowed = 'move';
                                  // Add visual feedback
                                  e.currentTarget.style.opacity = '0.5';
                                }}
                                onDragEnd={(e) => {
                                  // Reset visual feedback
                                  e.currentTarget.style.opacity = '1';
                                }}
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="text-2xl">{getFileIcon(document.name)}</span>
                                  <div>
                                    <h4 className="font-medium text-gray-900">{document.name}</h4>
                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                      <span>Version {document.version}</span>
                                      <span>•</span>
                                      <span>{(document.file_size / 1024).toFixed(1)} KB</span>
                                      <span>•</span>
                                      <span>Uploaded: {formatDate(document.uploaded_at)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    className={document.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                             document.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                             'bg-yellow-100 text-yellow-800'}
                                  >
                                    {document.status.replace('_', ' ')}
                                  </Badge>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleDownloadDocument(document.id, document.name)}
                                  >
                                    <DownloadIcon className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setDocumentActionDialog({
                                      show: true,
                                      action: 'document-actions',
                                      document: document
                                    })}
                                  >
                                    <EditIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Upload Dialog */}
            {showUploadDialog && (
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Documents</DialogTitle>
                    <DialogDescription>
                      Upload files to the current folder. Supported formats: Word, PDF, Excel, JPG, PNG, TXT
                    </DialogDescription>
                  </DialogHeader>
                  <FileUploadComponent onFilesSelected={handleFileUpload} />
                </DialogContent>
              </Dialog>
            )}

            {/* Create Folder Dialog */}
            {showCreateFolder && (
              <CreateFolderDialog
                isOpen={showCreateFolder}
                onClose={() => setShowCreateFolder(false)}
                onCreate={handleCreateFolder}
              />
            )}

            {/* Document Actions Dialog */}
            {documentActionDialog.show && (
              <DocumentActionsDialog
                isOpen={documentActionDialog.show}
                onClose={() => setDocumentActionDialog({ show: false, action: null, document: null })}
                action={documentActionDialog.action}
                document={documentActionDialog.document}
                folders={folders}
                currentFolder={currentFolder}
                onMove={handleMoveDocument}
                onCopy={handleCopyDocument}
                onDelete={handleDeleteDocument}
                onUpdateFolder={handleCreateFolder}
                onActionChange={(newAction) => setDocumentActionDialog({
                  ...documentActionDialog,
                  action: newAction
                })}
                getFileIcon={getFileIcon}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Timeline Manager Dialog */}
      <Dialog open={showTimelineManager} onOpenChange={setShowTimelineManager}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Timeline Management - {project.name}</DialogTitle>
            <DialogDescription>
              Manage project timeline, dates, and add milestone tracking points.
            </DialogDescription>
          </DialogHeader>
          <TimelineManager 
            project={project}
            onTimelineUpdated={handleTimelineUpdated}
            onClose={() => setShowTimelineManager(false)}
            milestones={milestones}
            onMilestoneUpdate={handleMilestoneUpdate}
            onMilestoneEdit={handleMilestoneEdit}
          />
        </DialogContent>
      </Dialog>

      {/* Milestone Detail/Edit Dialog */}
      <Dialog open={showMilestoneDetail} onOpenChange={setShowMilestoneDetail}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedMilestone ? (milestoneEditMode ? 'Edit Milestone' : 'Milestone Details') : 'Create Milestone'}
            </DialogTitle>
            <DialogDescription>
              {selectedMilestone ? (milestoneEditMode ? 'Update milestone information and assignments.' : 'View milestone details and manage assignments.') : 'Create a new milestone for this project.'}
            </DialogDescription>
          </DialogHeader>
          {selectedMilestone && (
            <MilestoneDetailEdit
              milestone={selectedMilestone}
              projectId={project.id}
              projectStartDate={project.start_date}
              projectEndDate={project.end_date}
              projectResources={resources}
              onMilestoneUpdated={handleMilestoneDetailUpdated}
              onClose={() => {
                setShowMilestoneDetail(false);
                setSelectedMilestone(null);
                setMilestoneEditMode(false);
              }}
              isEditing={milestoneEditMode}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Close Project Confirmation Dialog */}
      <AlertDialog open={showCloseConfirmation} onOpenChange={setShowCloseConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close this project? Once closed, the project will be moved to the closed projects list and marked as completed. This action can be reversed by changing the project stage back to an active status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseConfirmation}>
              Yes, Close Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// File Upload Component
const FileUploadComponent = ({ onFilesSelected }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const acceptedTypes = ".doc,.docx,.pdf,.xls,.xlsx,.jpg,.jpeg,.png,.txt";

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          Drop files here or click to browse
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Supports: Word, PDF, Excel, JPG, PNG, TXT files
        </p>
        <Button variant="outline">
          Choose Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Selected Files:</h4>
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">{file.name}</span>
              <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          ))}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setSelectedFiles([])}>
              Cancel
            </Button>
            <Button onClick={() => onFilesSelected(selectedFiles)}>
              Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Create Folder Dialog Component
const CreateFolderDialog = ({ isOpen, onClose, onCreate }) => {
  const [folderName, setFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');

  const predefinedColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (folderName.trim()) {
      onCreate(folderName.trim(), selectedColor);
      setFolderName('');
      setSelectedColor('#3B82F6');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              required
            />
          </div>
          <div>
            <Label>Folder Color</Label>
            <div className="flex space-x-2 mt-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedColor === color ? 'border-gray-400' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Folder
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Document Actions Dialog Component
const DocumentActionsDialog = ({ 
  isOpen, 
  onClose, 
  action, 
  document, 
  folders, 
  currentFolder, 
  onMove, 
  onCopy, 
  onDelete,
  onUpdateFolder,
  onActionChange,
  getFileIcon 
}) => {
  const [selectedFolder, setSelectedFolder] = useState('/');
  const [folderName, setFolderName] = useState(document?.name || '');
  const [folderColor, setFolderColor] = useState(document?.color || '#3B82F6');

  const predefinedColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
  ];

  const handleAction = () => {
    if (action === 'move') {
      onMove(document.id, selectedFolder);
    } else if (action === 'copy') {
      onCopy(document.id, selectedFolder);
    } else if (action === 'delete') {
      onDelete(document.id);
    } else if (action === 'edit-folder') {
      onUpdateFolder(folderName, folderColor);
    }
    onClose();
  };

  const getFolderOptions = () => {
    const options = [{ path: '/', name: 'Root Folder' }];
    folders.forEach(folder => {
      options.push({ path: folder.folder_path, name: folder.folder_path });
    });
    return options;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === 'move' && 'Move Document'}
            {action === 'copy' && 'Copy Document'}
            {action === 'delete' && 'Delete Document'}
            {action === 'edit-folder' && 'Edit Folder'}
            {action === 'document-actions' && 'Document Actions'}
          </DialogTitle>
        </DialogHeader>

        {action === 'document-actions' && (
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                // Switch to move selection mode
                onActionChange('move');
              }}
            >
              <MoveIcon className="h-4 w-4 mr-2" />
              Move to Folder
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                // Switch to copy selection mode
                onActionChange('copy');
              }}
            >
              <CopyIcon className="h-4 w-4 mr-2" />
              Copy to Folder
            </Button>
            <Button 
              variant="destructive" 
              className="w-full justify-start"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this document?')) {
                  onDelete(document.id);
                  onClose();
                }
              }}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete Document
            </Button>
          </div>
        )}

        {(action === 'move' || action === 'copy') && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{action === 'move' ? '📁' : '📋'}</span>
                <div>
                  <h4 className="font-medium text-blue-900">
                    {action === 'move' ? 'Move Document' : 'Copy Document'}
                  </h4>
                  <p className="text-sm text-blue-700">
                    {action === 'move' 
                      ? 'The document will be moved from the current folder to the selected destination.'
                      : 'A copy of the document will be created in the selected destination folder.'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600 mb-2">Current Document:</p>
              <div className="flex items-center space-x-2">
                <span>{getFileIcon(document.name)}</span>
                <span className="font-medium">{document.name}</span>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Select Destination Folder</Label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a folder..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="/" className="font-medium">
                    <div className="flex items-center space-x-2">
                      <FolderIcon className="h-4 w-4" />
                      <span>📁 Root Folder</span>
                    </div>
                  </SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.folder_path}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded" 
                          style={{ backgroundColor: folder.color }}
                        />
                        <span>📁 {folder.name}</span>
                        <span className="text-xs text-gray-500">({folder.folder_path})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedFolder && selectedFolder !== currentFolder && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm text-green-700">
                    {action === 'move' ? 'Ready to move' : 'Ready to copy'} to: 
                    <span className="font-medium ml-1">
                      {selectedFolder === '/' ? 'Root Folder' : folders.find(f => f.folder_path === selectedFolder)?.name}
                    </span>
                  </span>
                </div>
              </div>
            )}
            
            {selectedFolder === currentFolder && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-600">⚠</span>
                  <span className="text-sm text-yellow-700">
                    This document is already in the selected folder. Please choose a different destination.
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleAction}
                disabled={!selectedFolder || selectedFolder === currentFolder}
                className={action === 'move' ? '' : 'bg-blue-600 hover:bg-blue-700'}
              >
                {action === 'move' ? (
                  <>
                    <MoveIcon className="h-4 w-4 mr-2" />
                    Move Document
                  </>
                ) : (
                  <>
                    <CopyIcon className="h-4 w-4 mr-2" />
                    Copy Document
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {action === 'edit-folder' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-folder-name">Folder Name</Label>
              <Input
                id="edit-folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
              />
            </div>
            <div>
              <Label>Folder Color</Label>
              <div className="flex space-x-2 mt-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFolderColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      folderColor === color ? 'border-gray-400' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleAction}>
                Update Folder
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Expense List Component
const ExpenseList = ({ projects, onBack }) => {
  const [allExpenses, setAllExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    projectFilter: 'all',
    resourceFilter: 'all'
  });
  const [projectMap, setProjectMap] = useState({});
  const [resourceMap, setResourceMap] = useState({});

  // Fetch all expenses from all projects
  useEffect(() => {
    const fetchAllExpenses = async () => {
      setLoading(true);
      try {
        const expensePromises = projects.map(async (project) => {
          try {
            const [expensesRes, resourcesRes] = await Promise.all([
              axios.get(`${API}/projects/${project.id}/expenses`),
              axios.get(`${API}/projects/${project.id}/resources`)
            ]);
            
            return {
              projectId: project.id,
              projectName: project.name,
              expenses: expensesRes.data || [],
              resources: resourcesRes.data || []
            };
          } catch (error) {
            console.error(`Error fetching data for project ${project.id}:`, error);
            return {
              projectId: project.id,
              projectName: project.name,
              expenses: [],
              resources: []
            };
          }
        });

        const results = await Promise.all(expensePromises);
        
        // Build project and resource maps
        const newProjectMap = {};
        const newResourceMap = {};
        
        results.forEach(({ projectId, projectName, resources }) => {
          newProjectMap[projectId] = projectName;
          resources.forEach(resource => {
            newResourceMap[resource.id] = {
              name: resource.name,
              type: resource.type,
              projectName: projectName
            };
          });
        });

        setProjectMap(newProjectMap);
        setResourceMap(newResourceMap);

        // Flatten all expenses and add project information
        const flatExpenses = results.flatMap(({ projectId, projectName, expenses }) =>
          expenses.map(expense => ({
            ...expense,
            projectId,
            projectName,
            resourceName: expense.resource_id ? (newResourceMap[expense.resource_id]?.name || 'Unknown Resource') : 'No Resource Linked',
            resourceType: expense.resource_id ? (newResourceMap[expense.resource_id]?.type || 'Unknown') : 'N/A'
          }))
        );

        // Sort by date (newest first)
        flatExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        setAllExpenses(flatExpenses);
        setFilteredExpenses(flatExpenses);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        toast.error('Failed to load expenses');
      } finally {
        setLoading(false);
      }
    };

    if (projects.length > 0) {
      fetchAllExpenses();
    }
  }, [projects]);

  // Apply filters
  useEffect(() => {
    let filtered = [...allExpenses];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(expense => 
        expense.description.toLowerCase().includes(searchLower) ||
        expense.projectName.toLowerCase().includes(searchLower) ||
        expense.resourceName.toLowerCase().includes(searchLower)
      );
    }

    // Project filter
    if (filters.projectFilter !== 'all') {
      filtered = filtered.filter(expense => expense.projectId === filters.projectFilter);
    }

    // Resource filter
    if (filters.resourceFilter !== 'all') {
      if (filters.resourceFilter === 'no-resource') {
        filtered = filtered.filter(expense => !expense.resource_id);
      } else {
        filtered = filtered.filter(expense => expense.resource_id === filters.resourceFilter);
      }
    }

    setFilteredExpenses(filtered);
  }, [allExpenses, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getUniqueResources = () => {
    const resourcesWithExpenses = Object.entries(resourceMap)
      .filter(([resourceId]) => allExpenses.some(expense => expense.resource_id === resourceId))
      .map(([resourceId, resource]) => ({
        id: resourceId,
        name: resource.name,
        type: resource.type,
        projectName: resource.projectName
      }));
    
    return resourcesWithExpenses.sort((a, b) => a.name.localeCompare(b.name));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">All Expenses</h1>
          <Badge variant="outline" className="text-sm">
            {filteredExpenses.length} expenses • Total: {formatCurrency(filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0))}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <FilterIcon className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <Label htmlFor="expense-search">Search Expenses</Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="expense-search"
                  placeholder="Search by description, project, or resource"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Project Filter */}
            <div>
              <Label htmlFor="project-filter">Filter by Project</Label>
              <Select value={filters.projectFilter} onValueChange={(value) => handleFilterChange('projectFilter', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Resource Filter */}
            <div>
              <Label htmlFor="resource-filter">Filter by Resource</Label>
              <Select value={filters.resourceFilter} onValueChange={(value) => handleFilterChange('resourceFilter', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="no-resource">No Resource Linked</SelectItem>
                  {getUniqueResources().map((resource) => (
                    <SelectItem key={resource.id} value={resource.id}>
                      {resource.name} ({resource.type}) - {resource.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Linked Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <tr key={`${expense.projectId}-${expense.id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        {formatCurrency(expense.amount || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{expense.projectName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {expense.resourceName}
                        {expense.resourceType !== 'N/A' && (
                          <span className="text-gray-500 ml-1">({expense.resourceType})</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="text-xs">
                        {expense.expense_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(expense.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredExpenses.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSignIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more expenses.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Project List Component with Filtering
const ProjectList = ({ projects, initialFilter = 'all', onBack, onProjectSelect }) => {
  const [filteredProjects, setFilteredProjects] = useState(projects);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [filters, setFilters] = useState({
    search: '',
    status: initialFilter, // 'all', 'active', 'risk', 'closed', 'expenses'
    budgetSort: 'desc', // 'desc' (high to low), 'asc' (low to high)
    dateFilter: 'all', // 'all', 'recent', 'range'
    recentDays: 30,
    dateRange: { start: '', end: '' },
    resourceType: 'all', // 'all', 'team_member', 'vendor', 'equipment', 'material'
    resourceId: 'all'
  });
  
  const [allResources, setAllResources] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all resources for filtering
  useEffect(() => {
    const fetchAllResources = async () => {
      try {
        const resourcePromises = projects.map(project => 
          axios.get(`${API}/projects/${project.id}/resources`)
        );
        const resourceResponses = await Promise.all(resourcePromises);
        
        const allResourcesFlat = resourceResponses.flatMap(response => 
          response.data.map(resource => ({
            ...resource,
            projectId: response.config.url.split('/')[5] // Extract project ID from URL
          }))
        );
        
        // Remove duplicates based on name and type
        const uniqueResources = allResourcesFlat.filter((resource, index, self) => 
          index === self.findIndex(r => r.name === resource.name && r.type === resource.type)
        );
        
        setAllResources(uniqueResources);
      } catch (error) {
        console.error('Error fetching resources:', error);
      }
    };

    if (projects.length > 0) {
      fetchAllResources();
    }
  }, [projects]);

  // Apply filters
  useEffect(() => {
    let filtered = [...projects];

    // Status filter
    if (filters.status === 'active') {
      filtered = filtered.filter(p => p.stage !== 'closed');
    } else if (filters.status === 'risk') {
      filtered = filtered.filter(p => {
        const timeline = calculateTimelineProgress(p.start_date, p.end_date);
        return timeline.isOverdue || timeline.isDangerZone;
      });
    } else if (filters.status === 'closed') {
      filtered = filtered.filter(p => p.stage === 'closed');
    } else if (filters.status === 'expenses') {
      // For expenses view, default to budget sorting high to low
      setFilters(prev => ({ ...prev, budgetSort: 'desc' }));
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    // Date filter
    if (filters.dateFilter === 'newest') {
      // Sort by newest first (this will be handled by the sorting logic below)
      // No filtering needed here, just sorting
    } else if (filters.dateFilter === 'range' && filters.dateRange.start && filters.dateRange.end) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      filtered = filtered.filter(p => {
        const projectEndDate = new Date(p.end_date);
        return projectEndDate >= startDate && projectEndDate <= endDate;
      });
    }

    // Resource filter
    if (filters.resourceId && filters.resourceId !== 'all') {
      // This would need to be implemented with resource data per project
      // For now, we'll implement a basic version
      filtered = filtered.filter(p => {
        // This is a placeholder - in a real implementation, you'd fetch resources for each project
        return true; // Keep all projects for now
      });
    }

    // Budget sort
    if (filters.budgetSort === 'desc') {
      filtered.sort((a, b) => (b.budget || 0) - (a.budget || 0));
    } else if (filters.budgetSort === 'asc') {
      filtered.sort((a, b) => (a.budget || 0) - (b.budget || 0));
    }

    // Date sort - newest first
    if (filters.dateFilter === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date));
    }

    // Default sort by newest first if no specific sorting
    if (filters.budgetSort !== 'desc' && filters.budgetSort !== 'asc' && filters.dateFilter !== 'newest') {
      filtered.sort((a, b) => new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date));
    }

    setFilteredProjects(filtered);
  }, [projects, filters]);

  const getFilterTitle = () => {
    switch (filters.status) {
      case 'active': return 'Active Projects';
      case 'risk': return 'Projects at Risk';
      case 'closed': return 'Closed Projects';
      default: return 'All Projects';
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const renderProjectCard = (project) => {
    const timeline = calculateTimelineProgress(project.start_date, project.end_date);
    
    return (
      <Card 
        key={project.id}
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onProjectSelect(project)}
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
              <CardDescription className="mt-1 text-sm text-gray-600">
                {project.description}
              </CardDescription>
            </div>
            <Badge className={getStageColor(project.stage)}>
              {project.stage.charAt(0).toUpperCase() + project.stage.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Budget:</span>
              <span className="font-medium">{formatCurrency(project.budget || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Timeline:</span>
              <span className="text-gray-900">
                {formatDateShort(project.start_date)} - {formatDateShort(project.end_date)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className={timeline.isOverdue || timeline.isDangerZone ? 'text-red-600 font-medium' : 'text-gray-900'}>
                {timeline.isOverdue ? `${timeline.daysOverdue} days overdue` : `${timeline.daysRemaining} days left`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress:</span>
              <span className="text-gray-900">{timeline.progressPercentage}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderProjectTable = (project) => {
    const timeline = calculateTimelineProgress(project.start_date, project.end_date);
    
    return (
      <tr 
        key={project.id}
        className="cursor-pointer hover:bg-gray-50 border-b"
        onClick={() => onProjectSelect(project)}
      >
        <td className="px-6 py-4">
          <div>
            <div className="font-medium text-gray-900">{project.name}</div>
            <div className="text-sm text-gray-600 truncate max-w-xs">{project.description}</div>
          </div>
        </td>
        <td className="px-6 py-4">
          <Badge className={getStageColor(project.stage)}>
            {project.stage.charAt(0).toUpperCase() + project.stage.slice(1)}
          </Badge>
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">
          {formatCurrency(project.budget || 0)}
        </td>
        <td className="px-6 py-4 text-sm">
          <span className={timeline.isOverdue || timeline.isDangerZone ? 'text-red-600 font-medium' : 'text-gray-900'}>
            {timeline.isOverdue ? `${timeline.daysOverdue} days overdue` : `${timeline.daysRemaining} days left`}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">
          {timeline.progressPercentage}%
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">
          {formatDate(project.start_date)} - {formatDate(project.end_date)}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{getFilterTitle()}</h1>
          <Badge variant="outline" className="text-sm">
            {filteredProjects.length} projects
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            <GridIcon className="h-4 w-4 mr-2" />
            Cards
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <TableIcon className="h-4 w-4 mr-2" />
            Table
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <FilterIcon className="h-5 w-5 mr-2" />
            Filters & Sorting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <Label htmlFor="search">Search Projects</Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or description"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="active">Active Projects</SelectItem>
                  <SelectItem value="risk">Projects at Risk</SelectItem>
                  <SelectItem value="closed">Closed Projects</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Budget Sort */}
            <div>
              <Label htmlFor="budget-sort">Budget Sorting</Label>
              <Select value={filters.budgetSort} onValueChange={(value) => handleFilterChange('budgetSort', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Highest to Lowest</SelectItem>
                  <SelectItem value="asc">Lowest to Highest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div>
              <Label htmlFor="date-filter">Date Filter</Label>
              <Select value={filters.dateFilter} onValueChange={(value) => handleFilterChange('dateFilter', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="range">Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recent days input removed per user request */}

            {/* Date Range */}
            {filters.dateFilter === 'range' && (
              <>
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Resource filtering removed per user request */}
          </div>
        </CardContent>
      </Card>

      {/* Project List */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(renderProjectCard)}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timeline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjects.map(renderProjectTable)}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredProjects.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more projects.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Main App Component
function App() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [projectListFilter, setProjectListFilter] = useState('all');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      console.error('API URL:', API);
      setProjects([]); // Set to empty array on error
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = (newProject) => {
    setProjects([...projects, newProject]);
    setShowCreateProject(false);
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setCurrentView('project-detail');
  };

  const handleBackToDashboard = () => {
    setSelectedProject(null);
    setCurrentView('dashboard');
  };

  const handleViewProjects = (filter = 'all') => {
    if (filter === 'expenses') {
      setCurrentView('expenses-list');
    } else {
      setProjectListFilter(filter);
      setCurrentView('projects-list');
    }
  };

  const handleProjectUpdated = (updatedProject) => {
    // Update the project in the projects list
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    // Update the selected project
    setSelectedProject(updatedProject);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <BarChart3Icon className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">JS Projility</h1>
            </div>
            
            {currentView !== 'project-detail' && (
              <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
                <DialogTrigger asChild>
                  <Button data-testid="create-project-button">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                      Set up a new project with timeline, budget, and resources.
                    </DialogDescription>
                  </DialogHeader>
                  <ProjectForm 
                    onProjectCreated={handleProjectCreated}
                    onClose={() => setShowCreateProject(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && (
          <Dashboard 
            projects={projects} 
            onProjectSelect={handleProjectSelect}
            onViewProjects={handleViewProjects}
          />
        )}
        
        {currentView === 'projects-list' && (
          <ProjectList
            projects={projects}
            initialFilter={projectListFilter}
            onBack={handleBackToDashboard}
            onProjectSelect={handleProjectSelect}
          />
        )}

        {currentView === 'expenses-list' && (
          <ExpenseList
            projects={projects}
            onBack={handleBackToDashboard}
          />
        )}
        
        {currentView === 'project-detail' && selectedProject && (
          <ProjectDetail 
            project={selectedProject} 
            onBack={() => setCurrentView(projectListFilter !== 'all' ? 'projects-list' : 'dashboard')}
            onProjectUpdated={handleProjectUpdated}
          />
        )}
      </main>
      
      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

export default App;
