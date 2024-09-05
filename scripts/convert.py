#!/usr/bin/env python3
import glob
import os
import shutil
import re

src_path = "../alkahest-obsidian"
dest_path = "../alkahest-mdbook/src"

files = [
    f[len(src_path) + 1 :] for f in glob.glob(f"{src_path}/**", recursive=True) 
    if ".obsidian" not in f and ".git" not in f
]

def is_image_file(f):
    return any(f.lower().endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.gif'])

def convert_obsidian_links(source, files):
    def get_relative_path(source_path, target_path):
        return os.path.relpath(target_path, os.path.dirname(source_path)).replace("\\", "/")

    def find_matching_file(link, files):
        matching_files = [f for f in files if f.lower().endswith(f"/{link.lower()}.md")]
        return matching_files[0] if matching_files else ""

    def replace_link(match):
        link = match.group(1)
        mf = find_matching_file(link, files)
        return f"[{link}]({get_relative_path(source, mf).replace(' ', '_')})" if mf else match.group(0) 
    
    def replace_image_link(match):
        image = match.group(1)
        image_path = get_relative_path(source, f"{src_path}/{image}")
        return f"![{image}]({image_path.replace(' ', '_')})"
    
    with open(source, "r", encoding="utf-8") as file:
        content = f"# {os.path.basename(source).split('.')[0]}\n\n"
        content += file.read()

    content = re.sub(r"\[\[(.*?)\]\]", replace_link, content)
    content = re.sub(r"!\[\[(.*?)\]\]", replace_image_link, content)
    return content

# content
shutil.rmtree(dest_path, ignore_errors=True)
os.makedirs(dest_path)
for f in files:
    if f.endswith(".md"):
        with open(f"{src_path}/{f}", "r") as src:
            content = convert_obsidian_links(
                f"{src_path}/{f}", [f"{src_path}/{f}" for f in files]
            )
            os.makedirs(
                f"{dest_path}/{os.path.dirname(f)}".replace(" ", "_"), exist_ok=True
            )
            with open(f"{dest_path}/{f}".replace(" ", "_"), "w") as dest:
                dest.write(content)
    elif is_image_file(f):
        # Copy image files
        dest_dir = f"{dest_path}/{os.path.dirname(f)}".replace(" ", "_")
        os.makedirs(dest_dir, exist_ok=True)
        shutil.copy2(f"{src_path}/{f}", f"{dest_dir}/{os.path.basename(f).replace(' ', '_')}")

# summary
def file_to_line(f):
    tabs = f.count("/") * "\t"
    title = f.split("/")[-1].split(".")[0]
    if is_image_file(f): 
        return ""
    if f.endswith(".md"):
        return f"{tabs}- [{title}](./{f.replace(" ", "_")})\n"
    else:
        return f"{tabs}- [{title}]()\n" if f + ".md" not in files else ""

summary = "# Summary\n\n"
for f in sorted(files[1:]):
    summary += file_to_line(f)

with open(f"{dest_path}/SUMMARY.md", "w") as dest:
    dest.write(summary)
