import sqlite3

def clean_fks():
    conn = sqlite3.connect('trendmap.db')
    cursor = conn.cursor()
    
    # Pragma foreign_key_check returns: table, rowid, parent_table, fkid
    cursor.execute("PRAGMA foreign_key_check")
    violations = cursor.fetchall()
    
    count = 0
    for table, rowid, parent_table, fkid in violations:
        # We delete the row that is violating the FK constraint
        cursor.execute(f"DELETE FROM {table} WHERE rowid = ?", (rowid,))
        count += 1
        
    conn.commit()
    conn.close()
    print(f"Deleted {count} rows violating foreign key constraints.")

if __name__ == '__main__':
    clean_fks()
