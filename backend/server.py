from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, date
from enum import Enum
import shutil


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Enums
class ProjectStage(str, Enum):
    INITIATION = "initiation"
    PLANNING = "planning"
    EXECUTION = "execution"
    MONITORING = "monitoring"
    CLOSING = "closing"
    CLOSED = "closed"

class ResourceType(str, Enum):
    TEAM_MEMBER = "team_member"
    VENDOR = "vendor"
    EQUIPMENT = "equipment"
    MATERIAL = "material"

class DocumentStatus(str, Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"

class ExpenseType(str, Enum):
    RESOURCE = "resource"
    VENDOR = "vendor"
    EQUIPMENT = "equipment"
    MATERIAL = "material"
    OTHER = "other"

# Helper functions
def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
            elif isinstance(value, date):
                data[key] = value.isoformat()
            elif isinstance(value, dict):
                data[key] = prepare_for_mongo(value)
            elif isinstance(value, list):
                data[key] = [prepare_for_mongo(item) if isinstance(item, dict) else item for item in value]
    return data

def parse_from_mongo(item):
    """Parse datetime strings back from MongoDB"""
    if isinstance(item, dict):
        for key, value in item.items():
            if key.endswith('_date') or key.endswith('_time') or key == 'timestamp':
                if isinstance(value, str):
                    try:
                        item[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                    except ValueError:
                        pass
    return item

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    role: str = "project_manager"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str
    email: str
    role: str = "project_manager"

class Resource(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: ResourceType
    cost_per_unit: Optional[float] = None
    availability: str
    project_id: str
    allocated_amount: float = 0.0
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ResourceCreate(BaseModel):
    name: str
    type: ResourceType
    cost_per_unit: Optional[float] = None
    availability: str
    project_id: str
    allocated_amount: float = 0.0
    description: Optional[str] = None

class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[ResourceType] = None
    cost_per_unit: Optional[float] = None
    availability: Optional[str] = None
    allocated_amount: Optional[float] = None
    description: Optional[str] = None

class Milestone(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    due_date: datetime
    project_id: str
    completed: bool = False
    completed_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MilestoneCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: datetime
    project_id: str

class Expense(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    description: str
    amount: float
    expense_type: ExpenseType
    project_id: str
    resource_id: Optional[str] = None
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExpenseCreate(BaseModel):
    description: str
    amount: float
    expense_type: ExpenseType
    project_id: str
    resource_id: Optional[str] = None
    date: Optional[datetime] = None

class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    expense_type: Optional[ExpenseType] = None
    resource_id: Optional[str] = None
    date: Optional[datetime] = None

class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    filename: str
    version: int = 1
    project_id: str
    folder_path: str = "/"
    file_path: str
    file_size: int
    status: DocumentStatus = DocumentStatus.DRAFT
    uploaded_by: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    stage: ProjectStage = ProjectStage.INITIATION
    start_date: datetime
    end_date: datetime
    budget: float
    manager_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    budget: float
    manager_id: str

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    stage: Optional[ProjectStage] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = None

# API Routes

# Users
@api_router.post("/users", response_model=User)
async def create_user(user: UserCreate):
    user_dict = user.dict()
    user_obj = User(**user_dict)
    user_data = prepare_for_mongo(user_obj.dict())
    await db.users.insert_one(user_data)
    return user_obj

@api_router.get("/users", response_model=List[User])
async def get_users():
    users = await db.users.find().to_list(1000)
    return [User(**parse_from_mongo(user)) for user in users]

# Projects
@api_router.post("/projects", response_model=Project)
async def create_project(project: ProjectCreate):
    project_dict = project.dict()
    project_obj = Project(**project_dict)
    project_data = prepare_for_mongo(project_obj.dict())
    await db.projects.insert_one(project_data)
    return project_obj

@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    projects = await db.projects.find().to_list(1000)
    return [Project(**parse_from_mongo(project)) for project in projects]

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return Project(**parse_from_mongo(project))

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project: ProjectUpdate):
    update_data = {k: v for k, v in project.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    prepared_data = prepare_for_mongo(update_data)
    result = await db.projects.update_one(
        {"id": project_id}, 
        {"$set": prepared_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    updated_project = await db.projects.find_one({"id": project_id})
    return Project(**parse_from_mongo(updated_project))

# Resources
@api_router.post("/resources", response_model=Resource)
async def create_resource(resource: ResourceCreate):
    resource_dict = resource.dict()
    resource_obj = Resource(**resource_dict)
    resource_data = prepare_for_mongo(resource_obj.dict())
    await db.resources.insert_one(resource_data)
    
    # Auto-create expense for Vendors, Equipment and Materials with costs
    if (resource_obj.type in [ResourceType.VENDOR, ResourceType.EQUIPMENT, ResourceType.MATERIAL] 
        and resource_obj.cost_per_unit is not None 
        and resource_obj.cost_per_unit > 0):
        
        # Map resource type to expense type
        expense_type_mapping = {
            ResourceType.VENDOR: ExpenseType.VENDOR,
            ResourceType.EQUIPMENT: ExpenseType.EQUIPMENT,
            ResourceType.MATERIAL: ExpenseType.MATERIAL
        }
        
        expense_type = expense_type_mapping[resource_obj.type]
        expense = Expense(
            description=f"{resource_obj.type.value.replace('_', ' ').title()}: {resource_obj.name}",
            amount=resource_obj.cost_per_unit * resource_obj.allocated_amount if resource_obj.allocated_amount > 0 else resource_obj.cost_per_unit,
            expense_type=expense_type,
            project_id=resource_obj.project_id,
            resource_id=resource_obj.id
        )
        expense_data = prepare_for_mongo(expense.dict())
        await db.expenses.insert_one(expense_data)
    
    return resource_obj

@api_router.get("/projects/{project_id}/resources", response_model=List[Resource])
async def get_project_resources(project_id: str):
    resources = await db.resources.find({"project_id": project_id}).to_list(1000)
    return [Resource(**parse_from_mongo(resource)) for resource in resources]

@api_router.get("/resources/{resource_id}", response_model=Resource)
async def get_resource(resource_id: str):
    resource = await db.resources.find_one({"id": resource_id})
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return Resource(**parse_from_mongo(resource))

@api_router.put("/resources/{resource_id}", response_model=Resource)
async def update_resource(resource_id: str, resource_update: ResourceUpdate):
    # Get existing resource
    existing_resource = await db.resources.find_one({"id": resource_id})
    if not existing_resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Prepare update data
    update_data = {k: v for k, v in resource_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    # Update resource
    prepared_data = prepare_for_mongo(update_data)
    result = await db.resources.update_one(
        {"id": resource_id}, 
        {"$set": prepared_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Get updated resource
    updated_resource = await db.resources.find_one({"id": resource_id})
    updated_resource_obj = Resource(**parse_from_mongo(updated_resource))
    
    # Handle expense updates for cost changes
    if ("cost_per_unit" in update_data and 
        updated_resource_obj.type in [ResourceType.VENDOR, ResourceType.EQUIPMENT, ResourceType.MATERIAL]):
        
        # Delete existing expense for this resource
        await db.expenses.delete_many({"resource_id": resource_id})
        
        # Create new expense if cost is provided
        if updated_resource_obj.cost_per_unit is not None and updated_resource_obj.cost_per_unit > 0:
            expense_type_mapping = {
                ResourceType.VENDOR: ExpenseType.VENDOR,
                ResourceType.EQUIPMENT: ExpenseType.EQUIPMENT,
                ResourceType.MATERIAL: ExpenseType.MATERIAL
            }
            
            expense_type = expense_type_mapping[updated_resource_obj.type]
            expense = Expense(
                description=f"{updated_resource_obj.type.value.replace('_', ' ').title()}: {updated_resource_obj.name}",
                amount=updated_resource_obj.cost_per_unit * updated_resource_obj.allocated_amount if updated_resource_obj.allocated_amount > 0 else updated_resource_obj.cost_per_unit,
                expense_type=expense_type,
                project_id=updated_resource_obj.project_id,
                resource_id=updated_resource_obj.id
            )
            expense_data = prepare_for_mongo(expense.dict())
            await db.expenses.insert_one(expense_data)
    
    return updated_resource_obj

@api_router.delete("/resources/{resource_id}")
async def delete_resource(resource_id: str):
    # Check if resource exists
    resource = await db.resources.find_one({"id": resource_id})
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Delete associated expenses
    await db.expenses.delete_many({"resource_id": resource_id})
    
    # Delete resource
    result = await db.resources.delete_one({"id": resource_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    return {"message": "Resource deleted successfully"}

# Milestones
@api_router.post("/milestones", response_model=Milestone)
async def create_milestone(milestone: MilestoneCreate):
    milestone_dict = milestone.dict()
    milestone_obj = Milestone(**milestone_dict)
    milestone_data = prepare_for_mongo(milestone_obj.dict())
    await db.milestones.insert_one(milestone_data)
    return milestone_obj

@api_router.get("/projects/{project_id}/milestones", response_model=List[Milestone])
async def get_project_milestones(project_id: str):
    milestones = await db.milestones.find({"project_id": project_id}).to_list(1000)
    return [Milestone(**parse_from_mongo(milestone)) for milestone in milestones]

@api_router.put("/milestones/{milestone_id}/complete")
async def complete_milestone(milestone_id: str):
    result = await db.milestones.update_one(
        {"id": milestone_id},
        {"$set": {"completed": True, "completed_date": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Milestone not found")
    return {"message": "Milestone completed"}

@api_router.delete("/milestones/{milestone_id}")
async def delete_milestone(milestone_id: str):
    result = await db.milestones.delete_one({"id": milestone_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Milestone not found")
    return {"message": "Milestone deleted successfully"}

# Expenses
class ExpenseWithResource(BaseModel):
    expense: ExpenseCreate
    resource: ResourceCreate

@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense: ExpenseCreate):
    expense_dict = expense.dict()
    if expense_dict.get('date') is None:
        expense_dict['date'] = datetime.now(timezone.utc)
    expense_obj = Expense(**expense_dict)
    expense_data = prepare_for_mongo(expense_obj.dict())
    await db.expenses.insert_one(expense_data)
    return expense_obj

@api_router.post("/expenses/with-resource")
async def create_expense_with_resource(data: ExpenseWithResource):
    """Create an expense and link it to a new resource"""
    
    # First create the resource
    resource_dict = data.resource.dict()
    resource_obj = Resource(**resource_dict)
    resource_data = prepare_for_mongo(resource_obj.dict())
    await db.resources.insert_one(resource_data)
    
    # Then create the expense linked to the resource
    expense_dict = data.expense.dict()
    if expense_dict.get('date') is None:
        expense_dict['date'] = datetime.now(timezone.utc)
    
    # Link the expense to the resource
    expense_dict['resource_id'] = resource_obj.id
    
    expense_obj = Expense(**expense_dict)
    expense_data = prepare_for_mongo(expense_obj.dict())
    await db.expenses.insert_one(expense_data)
    
    return {
        "expense": expense_obj,
        "resource": resource_obj,
        "message": "Expense and resource created successfully"
    }

@api_router.get("/projects/{project_id}/expenses", response_model=List[Expense])
async def get_project_expenses(project_id: str):
    expenses = await db.expenses.find({"project_id": project_id}).to_list(1000)
    return [Expense(**parse_from_mongo(expense)) for expense in expenses]

@api_router.get("/expenses/{expense_id}", response_model=Expense)
async def get_expense(expense_id: str):
    expense = await db.expenses.find_one({"id": expense_id})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return Expense(**parse_from_mongo(expense))

@api_router.put("/expenses/{expense_id}", response_model=Expense)
async def update_expense(expense_id: str, expense_update: ExpenseUpdate):
    # Get existing expense
    existing_expense = await db.expenses.find_one({"id": expense_id})
    if not existing_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Prepare update data
    update_data = {k: v for k, v in expense_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    # Update expense
    prepared_data = prepare_for_mongo(update_data)
    result = await db.expenses.update_one(
        {"id": expense_id}, 
        {"$set": prepared_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Get updated expense
    updated_expense = await db.expenses.find_one({"id": expense_id})
    updated_expense_obj = Expense(**parse_from_mongo(updated_expense))
    
    # If this expense is associated with a resource, sync all changes to the resource
    if updated_expense_obj.resource_id:
        resource = await db.resources.find_one({"id": updated_expense_obj.resource_id})
        if resource:
            resource_updates = {}
            
            # Update resource name if expense description changed
            if "description" in update_data:
                # Extract the resource name from expense description
                # Format is usually "Type: Name" so we extract the name part
                description = updated_expense_obj.description
                if ": " in description:
                    # Extract name after the colon and space
                    resource_name = description.split(": ", 1)[1]
                else:
                    # Use the entire description as the name
                    resource_name = description
                resource_updates["name"] = resource_name
            
            # Update resource type if expense type changed
            if "expense_type" in update_data:
                # Map expense type to resource type
                expense_to_resource_type = {
                    "vendor": "vendor",
                    "equipment": "equipment", 
                    "material": "material"
                }
                if updated_expense_obj.expense_type in expense_to_resource_type:
                    resource_updates["type"] = expense_to_resource_type[updated_expense_obj.expense_type]
            
            # Update resource cost if expense amount changed
            if "amount" in update_data:
                allocated_amount = resource.get("allocated_amount", 1.0)
                if allocated_amount > 0:
                    new_cost_per_unit = updated_expense_obj.amount / allocated_amount
                else:
                    new_cost_per_unit = updated_expense_obj.amount
                resource_updates["cost_per_unit"] = new_cost_per_unit
            
            # Apply updates to resource if any changes were made
            if resource_updates:
                resource_updates["updated_at"] = datetime.now(timezone.utc).isoformat()
                await db.resources.update_one(
                    {"id": updated_expense_obj.resource_id},
                    {"$set": resource_updates}
                )
    
    return updated_expense_obj

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    # Check if expense exists
    expense = await db.expenses.find_one({"id": expense_id})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # If associated with resource, delete the entire resource
    if expense.get("resource_id"):
        resource_result = await db.resources.delete_one({"id": expense["resource_id"]})
        if resource_result.deleted_count > 0:
            # Also delete any other expenses associated with this resource
            await db.expenses.delete_many({"resource_id": expense["resource_id"]})
        else:
            # If resource doesn't exist, still proceed with expense deletion
            pass
    
    # Delete the main expense (if not already deleted above)
    if not expense.get("resource_id"):
        result = await db.expenses.delete_one({"id": expense_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Expense not found")
    
    return {"message": "Expense and associated resource deleted successfully"}

@api_router.get("/projects/{project_id}/budget-summary")
async def get_budget_summary(project_id: str):
    # Get project budget
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get total expenses
    expenses = await db.expenses.find({"project_id": project_id}).to_list(1000)
    total_expenses = sum(expense.get('amount', 0) for expense in expenses)
    
    budget = project.get('budget', 0)
    remaining = budget - total_expenses
    
    return {
        "budget": budget,
        "total_expenses": total_expenses,
        "remaining": remaining,
        "percentage_used": (total_expenses / budget * 100) if budget > 0 else 0
    }

# Documents
@api_router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    project_id: str = None,
    folder_path: str = "/",
    uploaded_by: str = "user"
):
    if not project_id:
        raise HTTPException(status_code=400, detail="Project ID is required")
    
    # Create project folder if it doesn't exist
    project_folder = UPLOADS_DIR / project_id
    project_folder.mkdir(exist_ok=True)
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = project_folder / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Get file size
    file_size = os.path.getsize(file_path)
    
    # Check for existing document with same name to determine version
    existing_docs = await db.documents.find({
        "name": file.filename,
        "project_id": project_id,
        "folder_path": folder_path
    }).to_list(1000)
    
    version = len(existing_docs) + 1
    
    # Create document record
    document = Document(
        name=file.filename,
        filename=unique_filename,
        version=version,
        project_id=project_id,
        folder_path=folder_path,
        file_path=str(file_path),
        file_size=file_size,
        uploaded_by=uploaded_by
    )
    
    document_data = prepare_for_mongo(document.dict())
    await db.documents.insert_one(document_data)
    
    return {"message": "File uploaded successfully", "document": document}

@api_router.get("/projects/{project_id}/documents", response_model=List[Document])
async def get_project_documents(project_id: str, folder_path: str = "/"):
    documents = await db.documents.find({
        "project_id": project_id,
        "folder_path": folder_path
    }).to_list(1000)
    return [Document(**parse_from_mongo(doc)) for doc in documents]

@api_router.put("/documents/{document_id}/approve")
async def approve_document(document_id: str, approved_by: str):
    result = await db.documents.update_one(
        {"id": document_id},
        {"$set": {
            "status": DocumentStatus.APPROVED.value,
            "approved_by": approved_by,
            "approved_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document approved"}

@api_router.get("/documents/{document_id}/download")
async def download_document(document_id: str):
    document = await db.documents.find_one({"id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = document["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path, filename=document["name"])

# Dashboard Analytics
@api_router.put("/projects/{project_id}/stage")
async def update_project_stage(project_id: str, stage: str):
    """Update project stage - only for project managers"""
    # Validate stage
    valid_stages = [s.value for s in ProjectStage]
    if stage not in valid_stages:
        raise HTTPException(status_code=400, detail=f"Invalid stage. Must be one of: {valid_stages}")
    
    result = await db.projects.update_one(
        {"id": project_id},
        {"$set": {
            "stage": stage,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"message": "Project stage updated successfully", "new_stage": stage}

@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    total_projects = await db.projects.count_documents({})
    active_projects = await db.projects.count_documents({"stage": {"$nin": ["closing", "closed"]}})
    total_expenses = 0
    
    # Get all expenses
    all_expenses = await db.expenses.find().to_list(1000)
    total_expenses = sum(expense.get('amount', 0) for expense in all_expenses)
    
    # Get overdue milestones
    current_time = datetime.now(timezone.utc)
    overdue_milestones = await db.milestones.count_documents({
        "due_date": {"$lt": current_time.isoformat()},
        "completed": False
    })
    
    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "total_expenses": total_expenses,
        "overdue_milestones": overdue_milestones
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
