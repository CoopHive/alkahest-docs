#!/usr/bin/env python3
import glob
import os
import shutil
import re

src_path = "../alkahest-obsidian"
dest_path = "../alkahest-mdbook/src"

files = glob.glob(f"{src_path}/**", recursive=True)
files = [
    f[len(src_path) + 1 :] for f in files if ".obsidian" not in f and ".git" not in f
]

def convert_obsidian_links(source: str, files: list[str]) -> str:
    def get_relative_path(source_path: str, target_path: str) -> str:
        source_dir = os.path.dirname(source_path)
        rel_path = os.path.relpath(target_path, source_dir)
        return rel_path.replace("\\", "/")  # Ensure forward slashes for consistency

    def find_matching_file(link: str, files: list[str]) -> str:
        matching_files = [f for f in files if f.lower().endswith(f"/{link.lower()}.md")]
        if not matching_files:
            return ""
        elif len(matching_files) == 1:
            return matching_files[0]
        else:
            # If multiple matches, find the one with the most matching path components
            link_parts = link.lower().split("/")
            best_match = max(
                matching_files,
                key=lambda f: sum(part in f.lower() for part in link_parts),
            )
            return best_match

    def replace_link(match):
        link = match.group(1)
        matching_file = find_matching_file(link, files)
        if not matching_file:
            return match.group(0)  # Return original if no match found
        relative_path = get_relative_path(source, matching_file)
        return f"[{link}]({relative_path})"

    with open(source, "r", encoding="utf-8") as file:
        content = file.read()

    # Regular expression to match Obsidian links
    pattern = r"\[\[(.*?)\]\]"

    # Replace all matched Obsidian links
    converted_content = re.sub(pattern, replace_link, content)

    return converted_content

# content
shutil.rmtree(dest_path, ignore_errors=True)
os.makedirs(dest_path)
for f in files:
    if not f.endswith(".md"):
        continue
    with open(f"{src_path}/{f}", "r") as src:
        content = src.read()
        content = convert_obsidian_links(
            f"{src_path}/{f}", [f"{src_path}/{f}" for f in files]
        )
        os.makedirs(
            f"{dest_path}/{os.path.dirname(f)}".replace(" ", "_"), exist_ok=True
        )
        with open(f"{dest_path}/{f}".replace(" ", "_"), "w") as dest:
            dest.write(content)

# summary
def file_to_line(f):
    tabs = f.count("/") * "\t"
    title = f.split("/")[-1].split(".")[0]
    if f.endswith(".md"):
        return f"{tabs}- [{title}](./{f.replace(" ", "_")})\n"
    else:
        return f"{tabs}- [{title}]()\n" if f + ".md" not in files else ""

summary = "# Summary\n\n"
for f in sorted(files[1:]):
    summary += file_to_line(f)

with open(f"{dest_path}/SUMMARY.md", "w") as dest:
    dest.write(summary)
