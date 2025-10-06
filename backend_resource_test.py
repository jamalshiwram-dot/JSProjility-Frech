import requests
import sys
import json
from datetime import datetime, timedelta

class ResourceManagementTester:
    def __init__(self, base_url="https://pm-dashboard-5.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None
        self.created_resources = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params)

            print(f"   Response Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def setup_test_project(self):
        """Create a test project for resource testing"""
        print("\n🏗️ Setting up test project...")
        
        project_data = {
            "name": f"Resource Test Project {datetime.now().strftime('%H%M%S')}",
            "description": "Test project for resource management functionality",
            "start_date": datetime.now().isoformat(),
            "end_date": (datetime.now() + timedelta(days=90)).isoformat(),
            "budget": 50000.0,
            "manager_id": "test-manager"
        }
        
        success, response = self.run_test(
            "Create Test Project",
            "POST",
            "projects",
            200,
            data=project_data
        )
        
        if success and 'id' in response:
            self.project_id = response['id']
            print(f"✅ Test project created with ID: {self.project_id}")
            return True
        else:
            print("❌ Failed to create test project")
            return False

    def test_resource_creation(self):
        """Test creating resources of all 4 types"""
        print("\n📋 Testing Resource Creation...")
        
        # Test data for all 4 resource types
        resource_test_cases = [
            {
                "name": "Team Member Resource",
                "type": "team_member",
                "availability": "Full-time",
                "description": "Senior Developer",
                "cost_per_unit": None,  # Team members should not have cost
                "allocated_amount": 1.0
            },
            {
                "name": "Vendor Resource",
                "type": "vendor",
                "availability": "On-demand",
                "description": "External consulting firm",
                "cost_per_unit": 150.0,  # Should create expense
                "allocated_amount": 40.0  # 40 hours
            },
            {
                "name": "Equipment Resource",
                "type": "equipment",
                "availability": "Available",
                "description": "High-end laptop",
                "cost_per_unit": 2500.0,  # Should create expense
                "allocated_amount": 2.0  # 2 laptops
            },
            {
                "name": "Material Resource",
                "type": "material",
                "availability": "In stock",
                "description": "Office supplies",
                "cost_per_unit": 50.0,  # Should create expense
                "allocated_amount": 10.0  # 10 units
            }
        ]
        
        for resource_data in resource_test_cases:
            resource_data["project_id"] = self.project_id
            
            success, response = self.run_test(
                f"Create {resource_data['type'].replace('_', ' ').title()} Resource",
                "POST",
                "resources",
                200,
                data=resource_data
            )
            
            if success and 'id' in response:
                self.created_resources.append(response)
                print(f"✅ {resource_data['type']} resource created successfully")
                
                # Verify resource properties
                if resource_data['type'] == 'team_member':
                    if response.get('cost_per_unit') is not None:
                        print(f"⚠️  Warning: Team member has cost_per_unit when it shouldn't")
                else:
                    if response.get('cost_per_unit') != resource_data['cost_per_unit']:
                        print(f"⚠️  Warning: Cost mismatch for {resource_data['type']}")
            else:
                print(f"❌ Failed to create {resource_data['type']} resource")

    def test_get_project_resources(self):
        """Test retrieving project resources"""
        print("\n📋 Testing Get Project Resources...")
        
        success, response = self.run_test(
            "Get Project Resources",
            "GET",
            f"projects/{self.project_id}/resources",
            200
        )
        
        if success:
            resources = response if isinstance(response, list) else []
            print(f"✅ Retrieved {len(resources)} resources")
            
            # Verify all resource types are present
            resource_types = [r.get('type') for r in resources]
            expected_types = ['team_member', 'vendor', 'equipment', 'material']
            
            for expected_type in expected_types:
                if expected_type in resource_types:
                    print(f"✅ Found {expected_type} resource")
                else:
                    print(f"❌ Missing {expected_type} resource")
            
            return resources
        else:
            print("❌ Failed to retrieve project resources")
            return []

    def test_expense_auto_creation(self):
        """Test that expenses are automatically created for resources with costs"""
        print("\n💰 Testing Automatic Expense Creation...")
        
        success, response = self.run_test(
            "Get Project Expenses",
            "GET",
            f"projects/{self.project_id}/expenses",
            200
        )
        
        if success:
            expenses = response if isinstance(response, list) else []
            print(f"✅ Retrieved {len(expenses)} expenses")
            
            # Check for auto-created expenses from resources
            resource_expenses = [e for e in expenses if e.get('resource_id')]
            print(f"✅ Found {len(resource_expenses)} resource-related expenses")
            
            # Verify expense types match resource types
            expected_expense_types = ['vendor', 'equipment', 'material']
            for expense in resource_expenses:
                expense_type = expense.get('expense_type')
                if expense_type in expected_expense_types:
                    print(f"✅ Found {expense_type} expense: {expense.get('description')} - ${expense.get('amount')}")
                else:
                    print(f"⚠️  Unexpected expense type: {expense_type}")
            
            return expenses
        else:
            print("❌ Failed to retrieve project expenses")
            return []

    def test_project_stage_update(self):
        """Test updating project stage"""
        print("\n🎯 Testing Project Stage Updates...")
        
        stages = ['initiation', 'planning', 'execution', 'monitoring', 'closing', 'closed']
        
        for stage in stages:
            success, response = self.run_test(
                f"Update Project Stage to {stage}",
                "PUT",
                f"projects/{self.project_id}/stage",
                200,
                params={'stage': stage}
            )
            
            if success:
                print(f"✅ Successfully updated stage to {stage}")
            else:
                print(f"❌ Failed to update stage to {stage}")

    def test_budget_summary_update(self):
        """Test that budget summary reflects resource expenses"""
        print("\n📊 Testing Budget Summary Updates...")
        
        success, response = self.run_test(
            "Get Budget Summary",
            "GET",
            f"projects/{self.project_id}/budget-summary",
            200
        )
        
        if success:
            budget_data = response
            print(f"✅ Budget Summary Retrieved:")
            print(f"   Total Budget: ${budget_data.get('budget', 0)}")
            print(f"   Total Expenses: ${budget_data.get('total_expenses', 0)}")
            print(f"   Remaining: ${budget_data.get('remaining', 0)}")
            print(f"   Percentage Used: {budget_data.get('percentage_used', 0):.1f}%")
            
            # Verify expenses are reflected in budget
            if budget_data.get('total_expenses', 0) > 0:
                print("✅ Expenses are reflected in budget summary")
            else:
                print("⚠️  No expenses found in budget summary")
            
            return budget_data
        else:
            print("❌ Failed to retrieve budget summary")
            return {}

    def run_all_tests(self):
        """Run all resource management tests"""
        print("🚀 Starting Resource Management API Tests")
        print("=" * 50)
        
        # Setup
        if not self.setup_test_project():
            print("❌ Failed to setup test project, aborting tests")
            return 1
        
        # Test resource creation
        self.test_resource_creation()
        
        # Test resource retrieval
        resources = self.test_get_project_resources()
        
        # Test expense auto-creation
        expenses = self.test_expense_auto_creation()
        
        # Test project stage updates
        self.test_project_stage_update()
        
        # Test budget summary updates
        budget_summary = self.test_budget_summary_update()
        
        # Print final results
        print("\n" + "=" * 50)
        print(f"📊 Final Results: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All resource management tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed - check output above")
            return 1

def main():
    tester = ResourceManagementTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())