#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timezone

class ExpenseResourceTester:
    def __init__(self, base_url="https://pmcentral-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None
        self.created_resources = []
        self.created_expenses = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        if details:
            print(f"   Details: {details}")

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request and return response"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            return success, response.json() if success else response.text, response.status_code
            
        except Exception as e:
            return False, str(e), 0

    def setup_test_project(self):
        """Create a test project for expense testing"""
        print("\n🔧 Setting up test project...")
        
        project_data = {
            "name": f"Expense Test Project {datetime.now().strftime('%H%M%S')}",
            "description": "Test project for expense-resource management testing",
            "start_date": "2024-01-01T00:00:00Z",
            "end_date": "2024-12-31T23:59:59Z",
            "budget": 100000.0,
            "manager_id": "test-manager"
        }
        
        success, response, status = self.make_request('POST', 'projects', project_data, 200)
        if success:
            self.project_id = response['id']
            self.log_test("Project Setup", True, f"Created project {self.project_id}")
            return True
        else:
            self.log_test("Project Setup", False, f"Status {status}: {response}")
            return False

    def test_basic_expense_crud(self):
        """Test basic expense CRUD operations"""
        print("\n📝 Testing Basic Expense CRUD Operations...")
        
        # Test 1: Create basic expense
        expense_data = {
            "description": "Test Office Supplies",
            "amount": 150.50,
            "expense_type": "other",
            "project_id": self.project_id,
            "date": datetime.now(timezone.utc).isoformat()
        }
        
        success, response, status = self.make_request('POST', 'expenses', expense_data, 200)
        if success:
            expense_id = response['id']
            self.created_expenses.append(expense_id)
            self.log_test("Create Basic Expense", True, f"Created expense {expense_id}")
        else:
            self.log_test("Create Basic Expense", False, f"Status {status}: {response}")
            return False
        
        # Test 2: Get expense
        success, response, status = self.make_request('GET', f'expenses/{expense_id}')
        if success:
            self.log_test("Get Expense", True, f"Retrieved expense: {response['description']}")
        else:
            self.log_test("Get Expense", False, f"Status {status}: {response}")
        
        # Test 3: Update expense
        update_data = {
            "description": "Updated Office Supplies",
            "amount": 175.75
        }
        
        success, response, status = self.make_request('PUT', f'expenses/{expense_id}', update_data)
        if success:
            self.log_test("Update Expense", True, f"Updated expense amount to ${response['amount']}")
        else:
            self.log_test("Update Expense", False, f"Status {status}: {response}")
        
        # Test 4: Get project expenses
        success, response, status = self.make_request('GET', f'projects/{self.project_id}/expenses')
        if success:
            self.log_test("Get Project Expenses", True, f"Found {len(response)} expenses")
        else:
            self.log_test("Get Project Expenses", False, f"Status {status}: {response}")
        
        return True

    def test_expense_with_resource_creation(self):
        """Test creating expense with linked resource"""
        print("\n🔗 Testing Expense with Resource Creation...")
        
        # Test creating expense with linked resource
        expense_with_resource_data = {
            "expense": {
                "description": "Vendor: Marketing Consultant",
                "amount": 5000.0,
                "expense_type": "vendor",
                "project_id": self.project_id,
                "date": datetime.now(timezone.utc).isoformat()
            },
            "resource": {
                "name": "Marketing Consultant",
                "type": "vendor",
                "cost_per_unit": 5000.0,
                "availability": "On-demand",
                "allocated_amount": 1.0,
                "description": "External marketing consultant for campaign strategy",
                "project_id": self.project_id
            }
        }
        
        success, response, status = self.make_request('POST', 'expenses/with-resource', expense_with_resource_data, 200)
        if success:
            expense_id = response['expense']['id']
            resource_id = response['resource']['id']
            self.created_expenses.append(expense_id)
            self.created_resources.append(resource_id)
            
            # Verify the expense is linked to the resource
            if response['expense']['resource_id'] == resource_id:
                self.log_test("Create Expense with Resource", True, f"Created linked expense {expense_id} and resource {resource_id}")
            else:
                self.log_test("Create Expense with Resource", False, "Expense not properly linked to resource")
                return False
        else:
            self.log_test("Create Expense with Resource", False, f"Status {status}: {response}")
            return False
        
        # Test creating equipment expense with resource
        equipment_data = {
            "expense": {
                "description": "Equipment: Laptop Computer",
                "amount": 2500.0,
                "expense_type": "equipment",
                "project_id": self.project_id,
                "date": datetime.now(timezone.utc).isoformat()
            },
            "resource": {
                "name": "Laptop Computer",
                "type": "equipment",
                "cost_per_unit": 2500.0,
                "availability": "Available",
                "allocated_amount": 1.0,
                "description": "High-performance laptop for development work",
                "project_id": self.project_id
            }
        }
        
        success, response, status = self.make_request('POST', 'expenses/with-resource', equipment_data, 200)
        if success:
            expense_id = response['expense']['id']
            resource_id = response['resource']['id']
            self.created_expenses.append(expense_id)
            self.created_resources.append(resource_id)
            self.log_test("Create Equipment Expense with Resource", True, f"Created equipment expense {expense_id} and resource {resource_id}")
        else:
            self.log_test("Create Equipment Expense with Resource", False, f"Status {status}: {response}")
        
        return True

    def test_expense_resource_synchronization(self):
        """Test bidirectional synchronization between expenses and resources"""
        print("\n🔄 Testing Expense-Resource Synchronization...")
        
        # First create a linked expense-resource pair
        expense_with_resource_data = {
            "expense": {
                "description": "Material: Construction Steel",
                "amount": 3000.0,
                "expense_type": "material",
                "project_id": self.project_id,
                "date": datetime.now(timezone.utc).isoformat()
            },
            "resource": {
                "name": "Construction Steel",
                "type": "material",
                "cost_per_unit": 1000.0,
                "availability": "Available",
                "allocated_amount": 3.0,
                "description": "High-grade steel for construction",
                "project_id": self.project_id
            }
        }
        
        success, response, status = self.make_request('POST', 'expenses/with-resource', expense_with_resource_data, 200)
        if not success:
            self.log_test("Setup Sync Test", False, f"Failed to create test data: {response}")
            return False
        
        expense_id = response['expense']['id']
        resource_id = response['resource']['id']
        self.created_expenses.append(expense_id)
        self.created_resources.append(resource_id)
        
        # Test 1: Update expense and verify resource is updated
        expense_update = {
            "description": "Material: Premium Construction Steel",
            "amount": 4500.0,
            "expense_type": "material"
        }
        
        success, response, status = self.make_request('PUT', f'expenses/{expense_id}', expense_update)
        if success:
            # Check if resource was updated
            success_res, resource_response, status_res = self.make_request('GET', f'resources/{resource_id}')
            if success_res:
                # Verify resource name was updated
                if "Premium Construction Steel" in resource_response['name']:
                    self.log_test("Expense Update Syncs Resource Name", True, f"Resource name updated to: {resource_response['name']}")
                else:
                    self.log_test("Expense Update Syncs Resource Name", False, f"Resource name not updated: {resource_response['name']}")
                
                # Verify resource cost was updated (4500 / 3 = 1500)
                expected_cost = 4500.0 / 3.0
                if abs(resource_response['cost_per_unit'] - expected_cost) < 0.01:
                    self.log_test("Expense Update Syncs Resource Cost", True, f"Resource cost updated to: ${resource_response['cost_per_unit']}")
                else:
                    self.log_test("Expense Update Syncs Resource Cost", False, f"Expected ${expected_cost}, got ${resource_response['cost_per_unit']}")
            else:
                self.log_test("Resource Sync Verification", False, f"Could not retrieve resource: {resource_response}")
        else:
            self.log_test("Expense Update for Sync Test", False, f"Status {status}: {response}")
        
        return True

    def test_expense_deletion_removes_resource(self):
        """Test that deleting an expense removes the linked resource"""
        print("\n🗑️ Testing Expense Deletion Removes Linked Resource...")
        
        # Create a linked expense-resource pair for deletion test
        expense_with_resource_data = {
            "expense": {
                "description": "Vendor: Temporary Consultant",
                "amount": 1500.0,
                "expense_type": "vendor",
                "project_id": self.project_id,
                "date": datetime.now(timezone.utc).isoformat()
            },
            "resource": {
                "name": "Temporary Consultant",
                "type": "vendor",
                "cost_per_unit": 1500.0,
                "availability": "Part-time",
                "allocated_amount": 1.0,
                "description": "Short-term consulting engagement",
                "project_id": self.project_id
            }
        }
        
        success, response, status = self.make_request('POST', 'expenses/with-resource', expense_with_resource_data, 200)
        if not success:
            self.log_test("Setup Deletion Test", False, f"Failed to create test data: {response}")
            return False
        
        expense_id = response['expense']['id']
        resource_id = response['resource']['id']
        
        # Verify resource exists before deletion
        success_res, resource_response, status_res = self.make_request('GET', f'resources/{resource_id}')
        if not success_res:
            self.log_test("Pre-deletion Resource Check", False, f"Resource not found before deletion: {resource_response}")
            return False
        
        # Delete the expense
        success, response, status = self.make_request('DELETE', f'expenses/{expense_id}', expected_status=200)
        if success:
            self.log_test("Delete Linked Expense", True, f"Expense deleted successfully")
            
            # Verify resource was also deleted
            success_res, resource_response, status_res = self.make_request('GET', f'resources/{resource_id}', expected_status=404)
            if status_res == 404:
                self.log_test("Linked Resource Deleted", True, "Resource was automatically deleted with expense")
            else:
                self.log_test("Linked Resource Deleted", False, f"Resource still exists after expense deletion: {resource_response}")
        else:
            self.log_test("Delete Linked Expense", False, f"Status {status}: {response}")
        
        return True

    def test_resource_deletion_removes_expenses(self):
        """Test that deleting a resource removes linked expenses"""
        print("\n🗑️ Testing Resource Deletion Removes Linked Expenses...")
        
        # Create a resource with cost (which auto-creates an expense)
        resource_data = {
            "name": "Test Equipment for Deletion",
            "type": "equipment",
            "cost_per_unit": 800.0,
            "availability": "Available",
            "allocated_amount": 2.0,
            "description": "Equipment to test deletion behavior",
            "project_id": self.project_id
        }
        
        success, response, status = self.make_request('POST', 'resources', resource_data, 201)
        if not success:
            self.log_test("Setup Resource Deletion Test", False, f"Failed to create resource: {response}")
            return False
        
        resource_id = response['id']
        
        # Get project expenses to find the auto-created expense
        success_exp, expenses_response, status_exp = self.make_request('GET', f'projects/{self.project_id}/expenses')
        if not success_exp:
            self.log_test("Get Expenses for Deletion Test", False, f"Failed to get expenses: {expenses_response}")
            return False
        
        # Find the expense linked to this resource
        linked_expense = None
        for expense in expenses_response:
            if expense.get('resource_id') == resource_id:
                linked_expense = expense
                break
        
        if not linked_expense:
            self.log_test("Find Linked Expense", False, "No expense found linked to the resource")
            return False
        
        expense_id = linked_expense['id']
        self.log_test("Find Linked Expense", True, f"Found linked expense {expense_id}")
        
        # Delete the resource
        success, response, status = self.make_request('DELETE', f'resources/{resource_id}', expected_status=200)
        if success:
            self.log_test("Delete Resource", True, "Resource deleted successfully")
            
            # Verify linked expense was also deleted
            success_exp, expense_response, status_exp = self.make_request('GET', f'expenses/{expense_id}', expected_status=404)
            if status_exp == 404:
                self.log_test("Linked Expense Deleted", True, "Expense was automatically deleted with resource")
            else:
                self.log_test("Linked Expense Deleted", False, f"Expense still exists after resource deletion: {expense_response}")
        else:
            self.log_test("Delete Resource", False, f"Status {status}: {response}")
        
        return True

    def test_budget_summary_updates(self):
        """Test that budget summary updates with expense changes"""
        print("\n💰 Testing Budget Summary Updates...")
        
        # Get initial budget summary
        success, initial_summary, status = self.make_request('GET', f'projects/{self.project_id}/budget-summary')
        if not success:
            self.log_test("Get Initial Budget Summary", False, f"Status {status}: {initial_summary}")
            return False
        
        initial_expenses = initial_summary['total_expenses']
        self.log_test("Get Initial Budget Summary", True, f"Initial expenses: ${initial_expenses}")
        
        # Create a new expense
        expense_data = {
            "description": "Budget Test Expense",
            "amount": 500.0,
            "expense_type": "other",
            "project_id": self.project_id,
            "date": datetime.now(timezone.utc).isoformat()
        }
        
        success, response, status = self.make_request('POST', 'expenses', expense_data, 201)
        if not success:
            self.log_test("Create Budget Test Expense", False, f"Status {status}: {response}")
            return False
        
        expense_id = response['id']
        self.created_expenses.append(expense_id)
        
        # Get updated budget summary
        success, updated_summary, status = self.make_request('GET', f'projects/{self.project_id}/budget-summary')
        if success:
            updated_expenses = updated_summary['total_expenses']
            expected_expenses = initial_expenses + 500.0
            
            if abs(updated_expenses - expected_expenses) < 0.01:
                self.log_test("Budget Summary Updates", True, f"Budget updated correctly: ${updated_expenses}")
            else:
                self.log_test("Budget Summary Updates", False, f"Expected ${expected_expenses}, got ${updated_expenses}")
        else:
            self.log_test("Get Updated Budget Summary", False, f"Status {status}: {updated_summary}")
        
        return True

    def cleanup(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete created expenses (this will also delete linked resources)
        for expense_id in self.created_expenses:
            success, response, status = self.make_request('DELETE', f'expenses/{expense_id}', expected_status=200)
            if success:
                print(f"   Deleted expense {expense_id}")
        
        # Delete any remaining resources
        for resource_id in self.created_resources:
            success, response, status = self.make_request('DELETE', f'resources/{resource_id}', expected_status=200)
            if success:
                print(f"   Deleted resource {resource_id}")
        
        # Delete test project
        if self.project_id:
            # Note: Project deletion endpoint might not exist, so we'll skip this
            print(f"   Test project {self.project_id} left for manual cleanup if needed")

    def run_all_tests(self):
        """Run all expense-resource management tests"""
        print("🚀 Starting Expense-Resource Management System Tests")
        print("=" * 60)
        
        # Setup
        if not self.setup_test_project():
            print("❌ Failed to setup test project. Aborting tests.")
            return False
        
        # Run test suites
        test_suites = [
            self.test_basic_expense_crud,
            self.test_expense_with_resource_creation,
            self.test_expense_resource_synchronization,
            self.test_expense_deletion_removes_resource,
            self.test_resource_deletion_removes_expenses,
            self.test_budget_summary_updates
        ]
        
        for test_suite in test_suites:
            try:
                test_suite()
            except Exception as e:
                print(f"❌ Test suite failed with exception: {str(e)}")
        
        # Cleanup
        self.cleanup()
        
        # Results
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED! Expense-Resource Management System is working correctly.")
            return True
        else:
            print("⚠️  Some tests failed. Please review the issues above.")
            return False

def main():
    tester = ExpenseResourceTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())