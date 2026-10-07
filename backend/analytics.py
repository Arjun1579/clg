import pandas as pd
from database import engine

def get_hospital_metrics():
    # We query the database using pandas!
    
    # 1. Admission Trends by Department
    df_patients = pd.read_sql("SELECT * FROM patients", engine)
    admissions = df_patients.groupby('department').size().reset_index(name='count')
    
    # 1.5 Module: Revenue Analytics
    revenue = df_patients.groupby('department')['billing_amount'].sum().reset_index(name='total_revenue')
    
    # 1.6 Module: Admission Types (Patient Flow)
    admission_types = df_patients.groupby('admission_type').size().reset_index(name='count')
    
    # 2. Average Length of Stay
    avg_los = df_patients['length_of_stay'].mean()
    
    # 3. Insight Flags (Abnormal Labs vs Medication Conflicts)
    df_flags = pd.read_sql("SELECT * FROM insight_flags", engine)
    if not df_flags.empty:
        flags_dist = df_flags.groupby('flag_type').size().reset_index(name='count')
    else:
        flags_dist = pd.DataFrame(columns=['flag_type', 'count'])
        
    return {
        "admissions_by_department": admissions.to_dict(orient='records'),
        "revenue_by_department": revenue.to_dict(orient='records'),
        "admission_types": admission_types.to_dict(orient='records'),
        "average_length_of_stay_days": round(float(avg_los), 1) if pd.notna(avg_los) else 0.0,
        "flags_distribution": flags_dist.to_dict(orient='records'),
        "total_patients": len(df_patients)
    }
