import os
import zipfile

def build_zip():
    zip_path = "public/amibroker-web-project.zip"
    if os.path.exists(zip_path):
        os.remove(zip_path)

    ignored_dirs = {
        'node_modules',
        '.git',
        'dist',
        '.vite',
        '__pycache__'
    }
    
    ignored_files = {
        '.DS_Store',
        'amibroker-web-project.zip'
    }

    count = 0
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk("."):
            # Filter out ignored directories in-place
            dirs[:] = [d for d in dirs if d not in ignored_dirs and not d.startswith('.git')]
            
            for file in files:
                if file in ignored_files or file.endswith('.pyc'):
                    continue
                file_path = os.path.join(root, file)
                # archive name relative to root without leading ./
                arcname = os.path.relpath(file_path, ".")
                zipf.write(file_path, arcname)
                count += 1
                
    print(f"Successfully packaged {count} files into {zip_path} ({os.path.getsize(zip_path)} bytes)")

if __name__ == "__main__":
    build_zip()
