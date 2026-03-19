import json
import os
import sys
from pathlib import Path

# Add the parent directory to sys.path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from app.config import supabase
from app.services.embeddings import generate_embedding


def seed_techniques():
    files = [
        {'path': 'data/techniques.json', 'lang': 'en'},
        {'path': 'data/techniques_th.json', 'lang': 'th'}
    ]

    for file_info in files:
        file_path = file_info['path']
        lang = file_info['lang']
        
        if not os.path.exists(file_path):
            print(f"Skipping {file_path}: File not found")
            continue

        print(f"Seeding from {file_path} ({lang})...")
        
        with open(file_path, 'r') as f:
            techniques = json.load(f)

        for technique in techniques:
            print(f"Processing: {technique['title']}")
            
            # Generate embedding
            embedding = generate_embedding(technique['embedding_text'])
            
            if not embedding:
                print(f"Failed to generate embedding for {technique['title']}")
                continue

            # Prepare data for insertion
            data = {
                "title": technique['title'],
                "category": technique['category'],
                "target_symptoms": technique['target_symptoms'],
                "content": technique['content'],
                "instructions": technique['instructions'],
                "when_to_use": technique['when_to_use'],
                "embedding": embedding,
                "embedding_text": technique['embedding_text'],
                "source": technique.get('source', 'Unknown'),
                "language": technique.get('language', lang) # Use file default if not in JSON
            }

            try:
                supabase.table("techniques").insert(data).execute()
                print(f"Inserted: {technique['title']}")
            except Exception as e:
                print(f"Error inserting {technique['title']}: {e}")

def seed_crisis_resources():
    files = [
        'data/crisis_resources.json',
        'data/crisis_resources_th.json'
    ]

    for file_path in files:
        if not os.path.exists(file_path):
            print(f"Skipping {file_path}: File not found")
            continue

        print(f"Seeding crisis resources from {file_path}...")
        
        with open(file_path, 'r') as f:
            resources = json.load(f)

        for resource in resources:
            data = {
                "name": resource['name'],
                "country": resource['country'],
                "phone": resource['phone'],
                "website": resource['website'],
                "description": resource['description'],
                "available_hours": resource['available_hours'],
                "company_lang": resource.get('company_lang', ''),
                "language": resource['language']
            }

            try:
                supabase.table("crisis_resources").insert(data).execute()
                print(f"Inserted: {resource['name']}")
            except Exception as e:
                print(f"Error inserting {resource['name']}: {e}")

if __name__ == "__main__":
    # seed_techniques()
    seed_crisis_resources()
