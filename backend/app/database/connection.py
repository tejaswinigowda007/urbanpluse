import os
import logging
from database.interface import DatabaseAdapter
from database.sqlite_fallback import SQLiteFallbackAdapter
from database.mongodb import MongoDBAdapter

logger = logging.getLogger("UrbanPulse.Database")

_DB_INSTANCE: DatabaseAdapter = None

async def init_database() -> DatabaseAdapter:
    global _DB_INSTANCE
    if _DB_INSTANCE is not None:
        return _DB_INSTANCE

    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB", "urbanpulse")
    use_mongo_flag = os.getenv("USE_MONGODB", "true").lower() == "true"

    if use_mongo_flag:
        try:
            logger.info(f"Attempting connection to MongoDB at {mongo_uri}...")
            mongo_adapter = MongoDBAdapter(uri=mongo_uri, db_name=db_name)
            await mongo_adapter.connect()
            _DB_INSTANCE = mongo_adapter
            logger.info(" Connected to MongoDB successfully.")
            print("[UrbanPulse DB] Connected to MongoDB.")
            return _DB_INSTANCE
        except Exception as e:
            logger.warning(f"MongoDB connection failed: {e}. Switching to modular SQLite document fallback.")
            print(f"[UrbanPulse DB] MongoDB not available ({e}). Using SQLite local document fallback.")
    
    sqlite_adapter = SQLiteFallbackAdapter()
    await sqlite_adapter.connect()
    _DB_INSTANCE = sqlite_adapter
    print("[UrbanPulse DB] SQLite document fallback initialized successfully.")
    return _DB_INSTANCE

async def get_db() -> DatabaseAdapter:
    global _DB_INSTANCE
    if _DB_INSTANCE is None:
        return await init_database()
    return _DB_INSTANCE
