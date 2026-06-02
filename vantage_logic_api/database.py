from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Load the .env file
load_dotenv()

# Get the database URL from .env
DATABASE_URL = os.getenv("DATABASE_URL")

# Create the connection to PostgreSQL
engine = create_engine(DATABASE_URL)

# Each request to the API gets its own database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class that all your models will inherit from
Base = declarative_base()

# This function gives each API request a database session
# and closes it cleanly when the request is done
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()