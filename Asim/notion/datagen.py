import csv
from datetime import datetime, timedelta
import random

def generate_mock_tasks(num_tasks=50):
    # Current date
    current_date = datetime.now()
    
    # Lists for random selection
    task_prefixes = ["Develop", "Review", "Update", "Create", "Test", "Deploy", "Debug", "Optimize", "Implement", "Design"]
    task_subjects = ["Login System", "Dashboard", "User Profile", "API Integration", "Database Schema", 
                    "Authentication", "Search Feature", "Payment Gateway", "Analytics Module", "Email Template",
                    "Mobile App", "Landing Page", "Admin Panel", "Documentation", "Security Features"]
    
    task_suffixes = ["v1.0", "Phase 2", "Hotfix", "Beta", "MVP", "Release", "Sprint 1", "Integration"]
    
    categories = ["Development", "Design", "Marketing", "Documentation", "Testing", "Operations", "Other"]
    statuses = ["Not Started", "In Progress", "Completed"]
    priorities = ["High", "Medium", "Low"]
    
    tasks = []
    
    for _ in range(num_tasks):
        # Generate task name
        name_parts = [
            random.choice(task_prefixes),
            random.choice(task_subjects),
            random.choice(task_suffixes)
        ]
        name = " ".join(name_parts)
        
        # Generate deadline within next 90 days with spaces between dashes
        days_ahead = random.randint(1, 90)
        deadline = (current_date + timedelta(days=days_ahead)).strftime('%d - %m - %Y')  # updated format
        
        # Generate other fields
        status = random.choice(statuses)
        priority = random.choice(priorities)
        category = random.choice(categories)
        
        tasks.append({
            'Name': name,
            'Deadline': deadline,
            'Status': status,
            'Priority': priority,
            'Category': category
        })
    
    return tasks

def save_to_csv(tasks, filename='notion_mock_tasks.csv'):
    with open(filename, 'w', newline='', encoding='utf-8') as file:
        fieldnames = ['Name', 'Deadline', 'Status', 'Priority', 'Category']
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        
        writer.writeheader()
        for task in tasks:
            writer.writerow(task)

def main():
    # Generate 50 mock tasks
    tasks = generate_mock_tasks(50)
    
    # Save to CSV
    save_to_csv(tasks)
    
    # Print first few tasks as example
    print("Generated 50 mock tasks. Here are the first 5 examples:\n")
    for task in tasks[:5]:
        print(f"Name: {task['Name']}")
        print(f"Deadline: {task['Deadline']}")
        print(f"Status: {task['Status']}")
        print(f"Priority: {task['Priority']}")
        print(f"Category: {task['Category']}")
        print()

if __name__ == "__main__":
    main()