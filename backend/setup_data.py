import pandas as pd
from database import SessionLocal, Patient, Encounter
import random
import os

def setup_mock_data():
    db = SessionLocal()
    
    if db.query(Patient).count() > 0:
        print("Database already populated.")
        return
        
    print("Populating database...")
    csv_path = "healthcare_dataset.csv"

    if os.path.exists(csv_path):
        print(f"Detected {csv_path}! Importing Kaggle dataset...")
        try:
            df = pd.read_csv(csv_path).head(50) # Load first 50 to keep DB fast
            for index, row in df.iterrows():
                # Map Kaggle columns to our DB schema
                p = Patient(
                    name=str(row.get('Name', f"Patient {index}")),
                    age=int(row.get('Age', random.randint(30, 85))),
                    gender=str(row.get('Gender', 'U'))[0],
                    admission_date=str(row.get('Date of Admission', '2023-10-01')),
                    department=str(row.get('Medical Condition', 'General')),
                    length_of_stay=random.randint(2, 15) # Generate random LOS if not present
                )
                db.add(p)
                db.commit()
                db.refresh(p)
                
                # Create corresponding encounter
                meds = str(row.get('Medication', 'Aspirin'))
                condition = str(row.get('Medical Condition', 'Observation'))
                e = Encounter(
                    patient_id=p.id,
                    date=str(row.get('Date of Admission', '2023-10-01')),
                    clinical_notes=f"Patient admitted for {condition}. Requires monitoring.",
                    medications=meds,
                    lab_bp_systolic=random.randint(110, 160),
                    lab_bp_diastolic=random.randint(70, 100)
                )
                db.add(e)
            db.commit()
            print("Successfully imported Kaggle data!")
            return
        except Exception as e:
            print(f"Error loading CSV: {e}. Falling back to mock data.")

    print("No CSV found. Generating 20 synthetic mock patients...")
    depts = ["Cardiology", "Neurology", "General", "Orthopedics"]
    
    for i in range(1, 21):
        p = Patient(
            name=f"Patient {i}",
            age=random.randint(30, 85),
            gender=random.choice(["M", "F"]),
            admission_date=f"2023-10-{random.randint(1, 28):02d}",
            department=random.choice(depts),
            length_of_stay=random.randint(2, 15)
        )
        db.add(p)
    db.commit()
    
    for i in range(1, 21):
        e = Encounter(
            patient_id=i,
            date=f"2023-10-01",
            clinical_notes=f"Patient {i} presents with chest pain and shortness of breath. History of hypertension. Has been taking Aspirin and Lisinopril.",
            medications="Aspirin, Lisinopril, Ibuprofen",
            lab_bp_systolic=random.randint(110, 160),
            lab_bp_diastolic=random.randint(70, 100)
        )
        db.add(e)
    
    db.commit()
    db.close()
    print("Done!")

if __name__ == "__main__":
    setup_mock_data()
