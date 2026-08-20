import sqlite3
from pathlib import Path

def migrate():
    db_path = Path("shoe_fit.db")
    if not db_path.exists():
        print("shoe_fit.db does not exist yet.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    tables_and_columns = [
        ("measurement_results", "foot_side", "VARCHAR(10) DEFAULT 'RIGHT'"),
        ("foot_profiles", "foot_side", "VARCHAR(10) DEFAULT 'RIGHT'"),
    ]

    for table, col, col_def in tables_and_columns:
        # Check if table exists
        exists = cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,)).fetchone()
        if not exists:
            continue
        cols = [c[1] for c in cursor.execute(f"PRAGMA table_info({table})").fetchall()]
        if col not in cols:
            print(f"Adding column {col} to {table}...")
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_def}")
            conn.commit()
            print(f"Successfully added {col} to {table}.")
        else:
            print(f"Column {col} already exists in {table}.")

    conn.close()

if __name__ == "__main__":
    migrate()
