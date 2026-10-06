from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Text
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./hospital.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    age = Column(Integer)
    gender = Column(String)
    admission_date = Column(String)
    department = Column(String)
    length_of_stay = Column(Integer) # in days

class Encounter(Base):
    __tablename__ = "encounters"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    date = Column(String)
    clinical_notes = Column(Text)
    medications = Column(String) # comma separated
    lab_bp_systolic = Column(Integer, nullable=True)
    lab_bp_diastolic = Column(Integer, nullable=True)

class InsightFlag(Base):
    __tablename__ = "insight_flags"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    flag_type = Column(String) # e.g., "Abnormal Lab", "Medication Conflict"
    description = Column(String)
    guideline_source = Column(String) # RAG explanation

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
