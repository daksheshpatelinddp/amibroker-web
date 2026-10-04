import os
import shutil
import zipfile

def build_zip():
    os.makedirs("public", exist_ok=True)

    # 1. Copy individual workflow YAML files into public/ for instant direct download
    workflow_files = [
        "deploy_render.yml",
        "deploy.yml",
        "daily_nse_bhavcopy_r2.yml",
        "daily_bse_bhavcopy_r2.yml"
    ]
    for wf in workflow_files:
        src = os.path.join(".github/workflows", wf)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join("public", wf))
            print(f"[+] Copied {src} -> public/{wf}")

    # 2. Package lightweight github-workflows.zip
    wf_zip_path = "public/github-workflows.zip"
    if os.path.exists(wf_zip_path):
        os.remove(wf_zip_path)
    with zipfile.ZipFile(wf_zip_path, 'w', zipfile.ZIP_DEFLATED) as wf_zip:
        for wf in workflow_files:
            src = os.path.join(".github/workflows", wf)
            if os.path.exists(src):
                wf_zip.write(src, os.path.join(".github/workflows", wf))
                wf_zip.write(src, os.path.join("github-workflows", wf))
        if os.path.exists("github-workflows/README.md"):
            wf_zip.write("github-workflows/README.md", "README.md")
    print(f"[+] Successfully packaged {wf_zip_path} ({os.path.getsize(wf_zip_path)} bytes)")

    # 3. Package complete project zip
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
            dirs[:] = [d for d in dirs if d not in ignored_dirs and d != '.git']
            
            for file in files:
                if file in ignored_files or file.endswith('.pyc'):
                    continue
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, ".")
                zipf.write(file_path, arcname)
                count += 1
                
    print(f"Successfully packaged {count} files into {zip_path} ({os.path.getsize(zip_path)} bytes)")

if __name__ == "__main__":
    build_zip()
