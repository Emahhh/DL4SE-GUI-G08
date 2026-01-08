"""
SQLite Database Module for DL4SE Demo API.
This provides a simple SQLite database setup with async support.
"""

import sqlite3
import aiosqlite
from pathlib import Path


# Path to the SQLite database file
BACKEND_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BACKEND_DIR / "app_database.db"


def get_sync_connection():
    """Get a synchronous SQLite connection (useful for CLI tools)."""
    return sqlite3.connect(DATABASE_PATH)


async def get_async_connection():
    """Get an async SQLite connection for use in FastAPI endpoints."""
    return await aiosqlite.connect(DATABASE_PATH)


def init_database():
    """
    Initialize the SQLite database with example tables.
    Run this once on startup or when you need to reset the database.
    """
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create predictions_log table (to log prediction requests)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            score REAL NOT NULL,
            label INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create inventory_items table (SQLite version of your JSON inventory)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS inventory_items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'awaiting_review',
            owner TEXT DEFAULT '',
            created_at REAL NOT NULL,
            image_path TEXT NOT NULL,
            notes TEXT DEFAULT '',
            score REAL,
            label INTEGER
        )
    """)
    
    # Insert some sample data for demonstration
    cursor.execute("""
        INSERT OR IGNORE INTO users (username, email) VALUES
        ('demo_user', 'demo@example.com'),
        ('admin', 'admin@example.com'),
        ('inspector', 'inspector@example.com')
    """)
    
    conn.commit()
    conn.close()
    print(f"✓ SQLite database initialized at: {DATABASE_PATH}")


# Example CRUD functions for the users table
async def get_all_users():
    """Fetch all users from the database."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM users")
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def add_user(username: str, email: str):
    """Add a new user to the database."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute(
            "INSERT INTO users (username, email) VALUES (?, ?)",
            (username, email)
        )
        await db.commit()


async def log_prediction(score: float, label: int):
    """Log a prediction to the database."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute(
            "INSERT INTO predictions_log (score, label) VALUES (?, ?)",
            (score, label)
        )
        await db.commit()


async def get_prediction_history(limit: int = 50):
    """Get recent prediction history."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM predictions_log ORDER BY created_at DESC LIMIT ?",
            (limit,)
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


# ============== Inventory CRUD functions ==============

async def get_all_inventory_items():
    """Fetch all inventory items from SQLite."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM inventory_items ORDER BY created_at DESC")
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def add_inventory_item(item_id: str, name: str, status: str, owner: str, 
                              created_at: float, image_path: str, notes: str = "",
                              score: float = None, label: int = None):
    """Add a new inventory item to SQLite."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute(
            """INSERT INTO inventory_items 
               (id, name, status, owner, created_at, image_path, notes, score, label) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (item_id, name, status, owner, created_at, image_path, notes, score, label)
        )
        await db.commit()


async def update_inventory_item(item_id: str, **kwargs):
    """Update an inventory item in SQLite."""
    if not kwargs:
        return
    
    set_clauses = []
    values = []
    for key, value in kwargs.items():
        if value is not None:
            set_clauses.append(f"{key} = ?")
            values.append(value)
    
    if not set_clauses:
        return
    
    values.append(item_id)
    query = f"UPDATE inventory_items SET {', '.join(set_clauses)} WHERE id = ?"
    
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute(query, values)
        await db.commit()


async def get_inventory_item_by_id(item_id: str):
    """Get a single inventory item by ID."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM inventory_items WHERE id = ?", (item_id,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None


async def delete_inventory_item(item_id: str):
    """Delete an inventory item from SQLite."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute("DELETE FROM inventory_items WHERE id = ?", (item_id,))
        await db.commit()


async def get_inventory_items_by_ids(item_ids: list[str]):
    """Fetch multiple inventory items by ID.

    Returns a list of dict rows in undefined order.
    """
    if not item_ids:
        return []

    placeholders = ",".join(["?"] * len(item_ids))
    query = f"SELECT * FROM inventory_items WHERE id IN ({placeholders})"

    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(query, item_ids)
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def delete_inventory_items(item_ids: list[str]) -> int:
    """Delete multiple inventory items from SQLite.

    Returns the number of rows deleted.
    """
    if not item_ids:
        return 0

    placeholders = ",".join(["?"] * len(item_ids))
    query = f"DELETE FROM inventory_items WHERE id IN ({placeholders})"

    async with aiosqlite.connect(DATABASE_PATH) as db:
        cursor = await db.execute(query, item_ids)
        await db.commit()
        return cursor.rowcount or 0


# Initialize database when this module is imported
if __name__ == "__main__":
    # Run directly to initialize the database: python database.py
    init_database()
    print("Database setup complete!")
