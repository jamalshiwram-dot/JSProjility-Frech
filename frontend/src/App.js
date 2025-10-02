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
  TargetIcon
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
            <CardTitle className="text-sm font-medium">Overdue Milestones</CardTitle>
            <AlertTriangleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue_milestones}</div>
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

// Resource Form Component
const ResourceForm = ({ projectId, onResourceCreated, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'team_member',
    cost_per_unit: '',
    availability: '',
    allocated_amount: '',
    description: ''
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
        project_id: projectId,
        cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit) : null,
        allocated_amount: formData.allocated_amount ? parseFloat(formData.allocated_amount) : 0.0
      };
      
      const response = await axios.post(`${API}/resources`, resourceData);
      toast.success('Resource added successfully!');
      onResourceCreated(response.data);
      onClose();
    } catch (error) {
      console.error('Error creating resource:', error);
      toast.error('Failed to add resource');
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
              If you enter a cost, it will be automatically added to project expenses
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
          {loading ? 'Adding...' : 'Add Resource'}
        </Button>
      </div>
    </form>
  );
};

// Project Detail Component
const ProjectDetail = ({ project, onBack }) => {
  const [resources, setResources] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budgetSummary, setBudgetSummary] = useState({});
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddResource, setShowAddResource] = useState(false);

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
    setResources([...resources, newResource]);
    setShowAddResource(false);
    // Refresh project data to update budget summary if expense was created
    fetchProjectData();
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
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Timeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Start Date:</span>
                <span>{formatDate(project.start_date)}</span>
              </div>
              <div className="flex justify-between">
                <span>End Date:</span>
                <span>{formatDate(project.end_date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span>{Math.ceil((new Date(project.end_date) - new Date(project.start_date)) / (1000 * 60 * 60 * 24))} days</span>
              </div>
            </div>
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
                    <DialogTitle>Add New Resource</DialogTitle>
                    <DialogDescription>
                      Add team members, vendors, equipment, or materials to your project.
                    </DialogDescription>
                  </DialogHeader>
                  <ResourceForm 
                    projectId={project.id}
                    onResourceCreated={handleResourceCreated}
                    onClose={() => setShowAddResource(false)}
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
            <CardHeader>
              <CardTitle>Project Milestones</CardTitle>
              <CardDescription>Track important project milestones and deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestones.map((milestone) => (
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
            <CardHeader>
              <CardTitle>Project Expenses</CardTitle>
              <CardDescription>Track all project-related expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{expense.description}</h4>
                      <p className="text-sm text-gray-600">Type: {expense.expense_type.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-600">Date: {formatDate(expense.date)}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">{formatCurrency(expense.amount)}</div>
                    </div>
                  </div>
                ))}
                {expenses.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No expenses recorded for this project</p>
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
          />
        )}
      </main>
      
      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

export default App;
