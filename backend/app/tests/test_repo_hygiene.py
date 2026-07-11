import os
import subprocess
import pytest

def test_git_ignores_backend_files():
    """
    Test that critical backend generated files like venv, sqlite db, and pycache
    are properly ignored by git.
    """
    # Run from the project root
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
    
    files_to_test = [
        "backend/trendmap.db",
        "backend/venv",
        "backend/app/__pycache__",
        "backend/.env"
    ]
    
    for file_path in files_to_test:
        # git check-ignore returns 0 if the file is ignored, 1 if not ignored
        result = subprocess.run(
            ["git", "check-ignore", file_path],
            cwd=project_root,
            capture_output=True
        )
        assert result.returncode == 0, f"File {file_path} is NOT ignored by git! Please update .gitignore."
