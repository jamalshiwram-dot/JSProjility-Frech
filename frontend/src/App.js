import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import '@/App.css';

// Import Shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  TrashIcon
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://pmcentral-1.preview.emergentagent.com';
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
const Dashboard = ({ projects, onProjectSelect }) => {
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_projects}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_projects}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_expenses)}</div>
          </CardContent>
        </Card>
        
        <Card>
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
const TimelineManager = ({ project, onTimelineUpdated, onClose, milestones, onMilestoneUpdate }) => {
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
    setLoading(true);
    try {
      const updateData = {
        start_date: new Date(projectDates.start_date).toISOString(),
        end_date: new Date(projectDates.end_date).toISOString()
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

    try {
      const milestoneData = {
        ...newMilestone,
        project_id: project.id,
        due_date: new Date(newMilestone.due_date).toISOString()
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

        {/* Unsaved changes indicator */}
        {(projectDates.start_date !== (project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '') ||
          projectDates.end_date !== (project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '')) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ You have unsaved changes. Click "Save Project Timeline" to apply your changes.
            </p>
          </div>
        )}

        <div className="flex items-center space-x-3">
          <Button 
            onClick={handleUpdateProjectDates} 
            disabled={loading}
            data-testid="save-timeline-btn"
            className="bg-blue-600 hover:bg-blue-700 text-white"
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

  useEffect(() => {
    if (project) {
      fetchProjectData();
    }
  }, [project]);

  const fetchProjectData = async () => {
    try {
      const [resourcesRes, milestonesRes, expensesRes, budgetRes, documentsRes] = await Promise.all([
        axios.get(`${API}/projects/${project.id}/resources`),
        axios.get(`${API}/projects/${project.id}/milestones`),
        axios.get(`${API}/projects/${project.id}/expenses`),
        axios.get(`${API}/projects/${project.id}/budget-summary`),
        axios.get(`${API}/projects/${project.id}/documents`)
      ]);
      
      setResources(resourcesRes.data);
      setMilestones(milestonesRes.data);
      setExpenses(expensesRes.data);
      setBudgetSummary(budgetRes.data);
      setDocuments(documentsRes.data);
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
    try {
      await axios.put(`${API}/projects/${project.id}/stage`, null, {
        params: { stage: newStage }
      });
      toast.success(`Project stage updated to ${newStage.charAt(0).toUpperCase() + newStage.slice(1)}!`);
      // Update the project stage locally
      project.stage = newStage;
      // Refresh project data
      fetchProjectData();
    } catch (error) {
      console.error('Error updating project stage:', error);
      toast.error('Failed to update project stage');
    }
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
                {milestones && milestones.length > 0 ? milestones.map((milestone) => (
                  <div key={milestone.id} className={`flex items-center justify-between p-4 border rounded-lg ${
                    milestone.completed ? 'bg-green-50 border-green-200' : 'bg-white'
                  }`}>
                    <div className="flex items-center space-x-3">
                      {milestone.completed ? (
                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
                      ) : (
                        <ClockIcon className="h-6 w-6 text-gray-400" />
                      )}
                      <div>
                        <h4 className={`font-medium ${
                          milestone.completed ? 'line-through text-gray-600' : ''
                        }`}>{milestone.title}</h4>
                        <p className="text-sm text-gray-600">{milestone.description}</p>
                        <p className="text-sm text-gray-600">Due: {formatDate(milestone.due_date)}</p>
                        {milestone.completed && milestone.completed_date && (
                          <p className="text-sm text-green-600">Completed: {formatDate(milestone.completed_date)}</p>
                        )}
                      </div>
                    </div>
                    {!milestone.completed && (
                      <Button 
                        size="sm" 
                        onClick={() => completeMilestone(milestone.id)}
                        data-testid={`complete-milestone-${milestone.id}`}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                ))}
                {milestones.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No milestones defined for this project</p>
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
          <Card>
            <CardHeader>
              <CardTitle>Project Documents</CardTitle>
              <CardDescription>Manage project documentation with version control</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.map((document) => (
                  <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileTextIcon className="h-6 w-6 text-gray-400" />
                      <div>
                        <h4 className="font-medium">{document.name}</h4>
                        <p className="text-sm text-gray-600">Version {document.version} • {document.status}</p>
                        <p className="text-sm text-gray-600">Uploaded: {formatDate(document.uploaded_at)}</p>
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
                      <Button size="sm" variant="outline">
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No documents uploaded for this project</p>
                )}
              </div>
            </CardContent>
          </Card>
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
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Main App Component
function App() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
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
            
            {currentView === 'dashboard' && (
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
          />
        )}
        
        {currentView === 'project-detail' && selectedProject && (
          <ProjectDetail 
            project={selectedProject} 
            onBack={handleBackToDashboard}
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
