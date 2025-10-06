import requests
import sys
import json
from datetime import datetime, timezone
import uuid

class ProjectManagementAPITester:
    def __init__(self, base_url="https://pm-dashboard-5.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_resources = {
            'users': [],
            'projects': [],
            'resources': [],
            'milestones': [],
            'expenses': [],
            'documents': []
        }

    def log_test(self, name, success, details="", error=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {error}")
        
        self.test_results.append({
            'name': name,
            'success': success,
            'details': details,
            'error': error
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            if success:
                self.log_test(name, True, f"Status: {response.status_code}")
                return True, response_data
            else:
                self.log_test(name, False, "", f"Expected {expected_status}, got {response.status_code}. Response: {response.text[:200]}")
                return False, response_data

        except Exception as e:
            self.log_test(name, False, "", f"Request failed: {str(e)}")
            return False, {}

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        print("\n🔍 Testing Dashboard Stats...")
        success, data = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        
        if success:
            required_fields = ['total_projects', 'active_projects', 'total_expenses', 'overdue_milestones']
            for field in required_fields:
                if field not in data:
                    self.log_test(f"Dashboard Stats - {field} field", False, "", f"Missing field: {field}")
                else:
                    self.log_test(f"Dashboard Stats - {field} field", True, f"Value: {data[field]}")
        
        return success

    def test_user_operations(self):
        """Test user CRUD operations"""
        print("\n🔍 Testing User Operations...")
        
        # Create user
        user_data = {
            "name": f"Test Manager {datetime.now().strftime('%H%M%S')}",
            "email": f"test{datetime.now().strftime('%H%M%S')}@example.com",
            "role": "project_manager"
        }
        
        success, user = self.run_test(
            "Create User",
            "POST",
            "users",
            200,
            data=user_data
        )
        
        if success and 'id' in user:
            self.created_resources['users'].append(user['id'])
            
            # Get users
            success, users = self.run_test(
                "Get Users",
                "GET",
                "users",
                200
            )
            
            if success and isinstance(users, list):
                self.log_test("Get Users - Response Format", True, f"Found {len(users)} users")
            else:
                self.log_test("Get Users - Response Format", False, "", "Expected list of users")
        
        return len(self.created_resources['users']) > 0

    def test_project_operations(self):
        """Test project CRUD operations"""
        print("\n🔍 Testing Project Operations...")
        
        # Ensure we have a user for manager_id
        if not self.created_resources['users']:
            self.test_user_operations()
        
        manager_id = self.created_resources['users'][0] if self.created_resources['users'] else "default-manager"
        
        # Create project
        project_data = {
            "name": f"Test Project {datetime.now().strftime('%H%M%S')}",
            "description": "A test project for API validation",
            "start_date": "2024-01-01T00:00:00Z",
            "end_date": "2024-12-31T23:59:59Z",
            "budget": 50000.00,
            "manager_id": manager_id
        }
        
        success, project = self.run_test(
            "Create Project",
            "POST",
            "projects",
            200,
            data=project_data
        )
        
        if success and 'id' in project:
            project_id = project['id']
            self.created_resources['projects'].append(project_id)
            
            # Test required fields in response
            required_fields = ['id', 'name', 'description', 'stage', 'start_date', 'end_date', 'budget', 'manager_id']
            for field in required_fields:
                if field in project:
                    self.log_test(f"Create Project - {field} field", True, f"Value: {project[field]}")
                else:
                    self.log_test(f"Create Project - {field} field", False, "", f"Missing field: {field}")
            
            # Get all projects
            success, projects = self.run_test(
                "Get All Projects",
                "GET",
                "projects",
                200
            )
            
            if success and isinstance(projects, list):
                self.log_test("Get All Projects - Response Format", True, f"Found {len(projects)} projects")
            
            # Get specific project
            success, single_project = self.run_test(
                "Get Single Project",
                "GET",
                f"projects/{project_id}",
                200
            )
            
            if success:
                self.log_test("Get Single Project - Response", True, f"Project: {single_project.get('name', 'Unknown')}")
            
            # Test budget summary
            success, budget_summary = self.run_test(
                "Get Budget Summary",
                "GET",
                f"projects/{project_id}/budget-summary",
                200
            )
            
            if success:
                budget_fields = ['budget', 'total_expenses', 'remaining', 'percentage_used']
                for field in budget_fields:
                    if field in budget_summary:
                        self.log_test(f"Budget Summary - {field}", True, f"Value: {budget_summary[field]}")
                    else:
                        self.log_test(f"Budget Summary - {field}", False, "", f"Missing field: {field}")
        
        return len(self.created_resources['projects']) > 0

    def test_resource_operations(self):
        """Test resource operations"""
        print("\n🔍 Testing Resource Operations...")
        
        if not self.created_resources['projects']:
            self.test_project_operations()
        
        if self.created_resources['projects']:
            project_id = self.created_resources['projects'][0]
            
            # Create resource
            resource_data = {
                "name": "Senior Developer",
                "type": "team_member",
                "cost_per_unit": 100.0,
                "availability": "Full-time",
                "project_id": project_id,
                "allocated_amount": 40.0
            }
            
            success, resource = self.run_test(
                "Create Resource",
                "POST",
                "resources",
                200,
                data=resource_data
            )
            
            if success and 'id' in resource:
                self.created_resources['resources'].append(resource['id'])
                
                # Get project resources
                success, resources = self.run_test(
                    "Get Project Resources",
                    "GET",
                    f"projects/{project_id}/resources",
                    200
                )
                
                if success and isinstance(resources, list):
                    self.log_test("Get Project Resources", True, f"Found {len(resources)} resources")
        
        return len(self.created_resources['resources']) > 0

    def test_milestone_operations(self):
        """Test comprehensive milestone operations"""
        print("\n🔍 Testing Milestone Operations...")
        
        if not self.created_resources['projects']:
            self.test_project_operations()
        
        if not self.created_resources['resources']:
            self.test_resource_operations()
        
        if self.created_resources['projects']:
            project_id = self.created_resources['projects'][0]
            resource_id = self.created_resources['resources'][0] if self.created_resources['resources'] else None
            
            # Test 1: Create milestone with basic data
            milestone_data = {
                "title": "Project Kickoff",
                "description": "Initial project meeting and setup",
                "due_date": "2024-02-01T00:00:00Z",
                "project_id": project_id
            }
            
            success, milestone = self.run_test(
                "Create Milestone - Basic",
                "POST",
                "milestones",
                200,
                data=milestone_data
            )
            
            milestone_id = None
            if success and 'id' in milestone:
                milestone_id = milestone['id']
                self.created_resources['milestones'].append(milestone_id)
                
                # Verify milestone fields
                required_fields = ['id', 'title', 'description', 'due_date', 'project_id', 'completed']
                for field in required_fields:
                    if field in milestone:
                        self.log_test(f"Create Milestone - {field} field", True, f"Value: {milestone[field]}")
                    else:
                        self.log_test(f"Create Milestone - {field} field", False, "", f"Missing field: {field}")
            
            # Test 2: Create milestone with resource assignment
            if resource_id:
                milestone_with_resource_data = {
                    "title": "Development Phase",
                    "description": "Core development milestone",
                    "due_date": "2024-06-01T00:00:00Z",
                    "project_id": project_id,
                    "assigned_resource_id": resource_id
                }
                
                success, milestone_with_resource = self.run_test(
                    "Create Milestone - With Resource",
                    "POST",
                    "milestones",
                    200,
                    data=milestone_with_resource_data
                )
                
                if success and 'id' in milestone_with_resource:
                    milestone_with_resource_id = milestone_with_resource['id']
                    self.created_resources['milestones'].append(milestone_with_resource_id)
                    
                    # Verify resource assignment
                    if milestone_with_resource.get('assigned_resource_id') == resource_id:
                        self.log_test("Milestone Resource Assignment", True, f"Resource {resource_id} assigned")
                    else:
                        self.log_test("Milestone Resource Assignment", False, "", "Resource assignment failed")
            
            # Test 3: Get project milestones
            success, milestones = self.run_test(
                "Get Project Milestones",
                "GET",
                f"projects/{project_id}/milestones",
                200
            )
            
            if success and isinstance(milestones, list):
                self.log_test("Get Project Milestones", True, f"Found {len(milestones)} milestones")
                
                # Verify milestones contain expected data
                for milestone in milestones:
                    if milestone.get('project_id') == project_id:
                        self.log_test("Milestone Project ID Consistency", True, f"Milestone belongs to project {project_id}")
                    else:
                        self.log_test("Milestone Project ID Consistency", False, "", f"Milestone has wrong project_id: {milestone.get('project_id')}")
            
            # Test 4: Update milestone
            if milestone_id:
                update_data = {
                    "title": "Updated Project Kickoff",
                    "description": "Updated description for kickoff meeting",
                    "due_date": "2024-02-15T00:00:00Z"
                }
                
                if resource_id:
                    update_data["assigned_resource_id"] = resource_id
                
                success, updated_milestone = self.run_test(
                    "Update Milestone",
                    "PUT",
                    f"milestones/{milestone_id}",
                    200,
                    data=update_data
                )
                
                if success:
                    # Verify updates
                    if updated_milestone.get('title') == update_data['title']:
                        self.log_test("Milestone Update - Title", True, f"Title updated to: {updated_milestone['title']}")
                    else:
                        self.log_test("Milestone Update - Title", False, "", "Title update failed")
                    
                    if updated_milestone.get('description') == update_data['description']:
                        self.log_test("Milestone Update - Description", True, "Description updated successfully")
                    else:
                        self.log_test("Milestone Update - Description", False, "", "Description update failed")
                    
                    if resource_id and updated_milestone.get('assigned_resource_id') == resource_id:
                        self.log_test("Milestone Update - Resource Assignment", True, f"Resource {resource_id} assigned via update")
                    elif resource_id:
                        self.log_test("Milestone Update - Resource Assignment", False, "", "Resource assignment via update failed")
            
            # Test 5: Complete milestone
            if milestone_id:
                success, result = self.run_test(
                    "Complete Milestone",
                    "PUT",
                    f"milestones/{milestone_id}/complete",
                    200
                )
                
                if success:
                    self.log_test("Complete Milestone", True, "Milestone marked as completed")
            
            # Test 6: Test date validation - milestone outside project timeline
            invalid_milestone_data = {
                "title": "Invalid Date Milestone",
                "description": "This should fail due to invalid date",
                "due_date": "2025-12-31T00:00:00Z",  # Outside project end date
                "project_id": project_id
            }
            
            success, invalid_milestone = self.run_test(
                "Create Milestone - Invalid Date (Expected to Pass)",
                "POST",
                "milestones",
                200,  # Backend doesn't validate dates currently
                data=invalid_milestone_data
            )
            
            if success:
                self.log_test("Date Validation", False, "", "Backend should validate milestone dates against project timeline")
                if 'id' in invalid_milestone:
                    self.created_resources['milestones'].append(invalid_milestone['id'])
            
            # Test 7: Test with invalid project ID
            invalid_project_milestone = {
                "title": "Invalid Project Milestone",
                "description": "This should fail",
                "due_date": "2024-06-01T00:00:00Z",
                "project_id": "non-existent-project-id"
            }
            
            success, result = self.run_test(
                "Create Milestone - Invalid Project ID",
                "POST",
                "milestones",
                200,  # Backend doesn't validate project existence currently
                data=invalid_project_milestone
            )
            
            if success:
                self.log_test("Project ID Validation", False, "", "Backend should validate project existence")
                if 'id' in result:
                    self.created_resources['milestones'].append(result['id'])
            
            # Test 8: Update non-existent milestone
            success, result = self.run_test(
                "Update Non-existent Milestone",
                "PUT",
                f"milestones/non-existent-milestone-id",
                404,
                data={"title": "Should fail"}
            )
            
            if success:
                self.log_test("Update Non-existent Milestone", True, "Correctly returned 404 for non-existent milestone")
            
            # Test 9: Delete milestone
            if len(self.created_resources['milestones']) > 1:
                milestone_to_delete = self.created_resources['milestones'][-1]
                success, result = self.run_test(
                    "Delete Milestone",
                    "DELETE",
                    f"milestones/{milestone_to_delete}",
                    200
                )
                
                if success:
                    self.log_test("Delete Milestone", True, "Milestone deleted successfully")
                    self.created_resources['milestones'].remove(milestone_to_delete)
                    
                    # Verify deletion by trying to get the deleted milestone
                    success, result = self.run_test(
                        "Verify Milestone Deletion",
                        "GET",
                        f"projects/{project_id}/milestones",
                        200
                    )
                    
                    if success and isinstance(result, list):
                        deleted_milestone_found = any(m.get('id') == milestone_to_delete for m in result)
                        if not deleted_milestone_found:
                            self.log_test("Verify Milestone Deletion", True, "Deleted milestone not found in list")
                        else:
                            self.log_test("Verify Milestone Deletion", False, "", "Deleted milestone still appears in list")
            
            # Test 10: Delete non-existent milestone
            success, result = self.run_test(
                "Delete Non-existent Milestone",
                "DELETE",
                f"milestones/non-existent-milestone-id",
                404
            )
            
            if success:
                self.log_test("Delete Non-existent Milestone", True, "Correctly returned 404 for non-existent milestone")
        
        return len(self.created_resources['milestones']) > 0

    def test_expense_operations(self):
        """Test expense operations"""
        print("\n🔍 Testing Expense Operations...")
        
        if not self.created_resources['projects']:
            self.test_project_operations()
        
        if self.created_resources['projects']:
            project_id = self.created_resources['projects'][0]
            
            # Create expense
            expense_data = {
                "description": "Software licenses",
                "amount": 1500.00,
                "expense_type": "other",
                "project_id": project_id,
                "date": "2024-01-15T00:00:00Z"
            }
            
            success, expense = self.run_test(
                "Create Expense",
                "POST",
                "expenses",
                200,
                data=expense_data
            )
            
            if success and 'id' in expense:
                self.created_resources['expenses'].append(expense['id'])
                
                # Get project expenses
                success, expenses = self.run_test(
                    "Get Project Expenses",
                    "GET",
                    f"projects/{project_id}/expenses",
                    200
                )
                
                if success and isinstance(expenses, list):
                    self.log_test("Get Project Expenses", True, f"Found {len(expenses)} expenses")
        
        return len(self.created_resources['expenses']) > 0

    def test_document_operations(self):
        """Test document operations (basic endpoint test)"""
        print("\n🔍 Testing Document Operations...")
        
        if not self.created_resources['projects']:
            self.test_project_operations()
        
        if self.created_resources['projects']:
            project_id = self.created_resources['projects'][0]
            
            # Get project documents (should return empty list initially)
            success, documents = self.run_test(
                "Get Project Documents",
                "GET",
                f"projects/{project_id}/documents",
                200
            )
            
            if success and isinstance(documents, list):
                self.log_test("Get Project Documents", True, f"Found {len(documents)} documents")
        
        return True

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Project Management API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test basic connectivity
        try:
            response = requests.get(f"{self.base_url}/api/dashboard/stats", timeout=10)
            print(f"✅ API connectivity test passed (Status: {response.status_code})")
        except Exception as e:
            print(f"❌ API connectivity test failed: {str(e)}")
            return False
        
        # Run all test suites
        self.test_dashboard_stats()
        self.test_user_operations()
        self.test_project_operations()
        self.test_resource_operations()
        self.test_milestone_operations()
        self.test_expense_operations()
        self.test_document_operations()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  - {test['name']}: {test['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = ProjectManagementAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())