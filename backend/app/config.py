import os
from dotenv import load_dotenv
load_dotenv()
 
class Settings:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    QDRANT_URL = os.getenv("QDRANT_URL")
    CLIENT_ID = os.getenv("CLIENT_ID")
    CLIENT_SECRET = os.getenv("CLIENT_SECRET")
    TENANT_ID = os.getenv("TENANT_ID")
    SHAREPOINT_SITE_NAME = os.getenv("SHAREPOINT_SITE_NAME")
    SHAREPOINT_DOC_LIB = os.getenv("SHAREPOINT_DOC_LIB")
    SHAREPOINT_FOLDER_PATH = os.getenv("SHAREPOINT_FOLDER_PATH")
 
settings = Settings()