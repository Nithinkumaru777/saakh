import os
import subprocess
import shutil

repo_dir = r'd:\S3_CIA-2 PROJECTS\AI FOR FINANCE CIA-2'
worktree_dir = r'd:\S3_CIA-2 PROJECTS\saakh-pages-deploy'

# Clean up existing worktree if present
if os.path.exists(worktree_dir):
    try:
        subprocess.run(['git', 'worktree', 'remove', '--force', worktree_dir], cwd=repo_dir, capture_output=True)
    except Exception:
        pass
    if os.path.exists(worktree_dir):
        shutil.rmtree(worktree_dir, ignore_errors=True)

subprocess.run(['git', 'worktree', 'prune'], cwd=repo_dir, check=True)

# Create or checkout gh-pages in worktree
cmd = ['git', 'worktree', 'add', '-B', 'gh-pages', worktree_dir, 'origin/gh-pages']
res = subprocess.run(cmd, cwd=repo_dir, capture_output=True, text=True)
print("Worktree add:", res.returncode, res.stdout, res.stderr)

# Read prototype/index.html as pure binary bytes
with open(os.path.join(repo_dir, 'prototype', 'index.html'), 'rb') as f:
    html_bytes = f.read()

# Verify no mojibake in bytes
html_text = html_bytes.decode('utf-8')
mojibake = [l for l in html_text.splitlines() if 'â' in l or 'Ã' in l]
print(f"Mojibake count in source: {len(mojibake)}")
assert len(mojibake) == 0, f"Found mojibake in source: {mojibake[:5]}"

# Write to worktree as pure binary bytes
with open(os.path.join(worktree_dir, 'index.html'), 'wb') as f:
    f.write(html_bytes)
print("Wrote index.html to gh-pages worktree")

# Copy favicons and .nojekyll
for fname in ['favicon.svg', 'favicon.png', 'favicon.ico']:
    src = os.path.join(repo_dir, 'prototype', fname)
    if os.path.exists(src):
        shutil.copyfile(src, os.path.join(worktree_dir, fname))
        print(f"Copied {fname}")

with open(os.path.join(worktree_dir, '.nojekyll'), 'wb') as f:
    f.write(b'')

# Copy tutorial assets (full.mp4, poster.jpg, and all 44 clips)
tut_src = os.path.join(repo_dir, 'apps', 'web', 'public', 'tutorial')
tut_dst = os.path.join(worktree_dir, 'tutorial')
if os.path.exists(tut_dst):
    shutil.rmtree(tut_dst)
shutil.copytree(tut_src, tut_dst)
print("Copied tutorial directory to gh-pages worktree")

readme_content = """# Saakh — Live Demo (GitHub Pages)

This branch hosts the interactive client-side single-page application for **Saakh: AI-Based Loan Eligibility & Risk Assessment System**.

- **Live URL:** https://nithinkumaru777.github.io/saakh/
- **Course:** AI for Finance — CIA-2 · Topic 4
- **Student:** NITHIN KUMAR U
- **USN:** 2102508611
- **Source Repository:** https://github.com/Nithinkumaru777/saakh
"""
with open(os.path.join(worktree_dir, 'README.md'), 'w', encoding='utf-8', newline='\n') as f:
    f.write(readme_content)

# Git add, commit, push
subprocess.run(['git', 'add', '-A'], cwd=worktree_dir, check=True)
diff_res = subprocess.run(['git', 'status', '--porcelain'], cwd=worktree_dir, capture_output=True, text=True)
print("Git status in worktree:\n", diff_res.stdout)

if diff_res.stdout.strip():
    source = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], cwd=repo_dir, capture_output=True, text=True).stdout.strip()
    commit_msg = f"Deploy: prototype from master {source}"
    subprocess.run(['git', 'commit', '-m', commit_msg], cwd=worktree_dir, check=True)
    push_res = subprocess.run(['git', 'push', 'origin', 'gh-pages', '--force'], cwd=worktree_dir, capture_output=True, text=True)
    print("Git push result:", push_res.returncode, push_res.stdout, push_res.stderr)
    if push_res.returncode != 0:
        raise SystemExit("Push to gh-pages failed: the live site was not updated.")
else:
    print("Nothing to commit on gh-pages.")

# Clean up worktree
subprocess.run(['git', 'worktree', 'remove', '--force', worktree_dir], cwd=repo_dir, check=True)
print("Worktree cleaned up successfully.")
