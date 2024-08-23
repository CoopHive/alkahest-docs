#!/usr/bin/env bun

import { readdir, mkdir } from "node:fs/promises";
import path from "path";
import fs from "fs";

const nameFromPath = (filePath: string) => {
  return path.basename(filePath, path.extname(filePath)).replace(/_/g, " ");
};

const spacesToUnder = (str: string) => str.replace(/ /g, "_");

interface TreeNode {
  [key: string]: TreeNode | null;
}

const generateSummary = (files: string[], basePath: string = ""): string => {
  const tree: TreeNode = {};

  files.forEach((file) => {
    const parts = file.split(path.sep);
    let current: TreeNode = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = null;
      } else {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part] as TreeNode;
      }
    }
  });

  const buildSummary = (
    node: TreeNode,
    prefix: string = "",
    indent: string = ""
  ): string => {
    let summary = "";
    const entries = Object.entries(node);

    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i];
      const name = nameFromPath(key);
      const dirPath = path.join(prefix, key);

      if (value === null) {
        // This is a file
        if (key.toLowerCase() === "readme.md") {
          summary += `${indent}- [${nameFromPath(prefix)}](./${spacesToUnder(
            prefix
          )}/README.md)\n`;
        } else if (!key.endsWith(".md") || !node[key.slice(0, -3)]) {
          // Only add .md files that don't have a corresponding folder
          summary += `${indent}- [${name}](./${spacesToUnder(dirPath)})\n`;
        }
      } else {
        // This is a folder
        const mdFile = key + ".md";
        if (node[mdFile] === null) {
          // There's a corresponding .md file for this folder
          summary += `${indent}- [${name}](./${spacesToUnder(dirPath)}.md)\n`;
          // Skip the .md file in the next iteration
          i++;
        } else {
          // No corresponding .md file, use README.md inside the folder
          summary += `${indent}- [${name}](./${spacesToUnder(
            dirPath
          )}/README.md)\n`;
        }
        summary += buildSummary(value, dirPath, indent + "  ");
      }
    }
    return summary;
  };

  return "# Summary\n\n" + buildSummary(tree, basePath);
};

const convertObsidianLinks = (
  content: string,
  currentFile: string,
  files: string[]
): string => {
  const linkRegex = /\[\[(.*?)\]\]/g;
  return content.replace(linkRegex, (match, title) => {
    const normalizedTitle = title.replace(/ /g, "_").toLowerCase();
    const filePath = files.find((file) => {
      const normalizedFile = file.replace(/ /g, "_").toLowerCase();
      return normalizedFile.endsWith(normalizedTitle + ".md");
    });

    if (filePath) {
      let relativePath = path.relative(path.dirname(currentFile), filePath);
      relativePath = "./" + relativePath;
      // Check if this is a folder README
      if (
        path.basename(filePath, ".md").toLowerCase() ===
        path.basename(path.dirname(filePath)).toLowerCase()
      ) {
        relativePath = path.join(path.dirname(relativePath), "README.md");
      }
      return `[${title}](${spacesToUnder(relativePath)})`;
    }
    // If no matching file is found, create a link to a file in the same directory
    return `[${title}](./${spacesToUnder(title)}.md)`;
  });
};

// get all files in ../alkahest-obsidian
const obsidianDir = "../alkahest-obsidian";
const files: string[] = (
  await readdir(obsidianDir, {
    recursive: true,
  })
)
  .filter(($) => $.endsWith(".md"))
  .map((file) => file.replace(/\\/g, "/")) // Normalize path separators
  .toSorted();

// paste to ../alkahest-mdbook
const mdbookDir = "../alkahest-mdbook/src";
await Promise.all(
  files.map(async ($) => {
    const sourcePath = path.join(obsidianDir, $);
    const rawContent = await Bun.file(sourcePath).text();
    const convertedContent = convertObsidianLinks(rawContent, $, files);
    const content = `# ${nameFromPath($)}\n\n${convertedContent}`;

    // Check if the file has the same name as its parent folder
    const dirName = path.dirname($);
    const baseName = path.basename($, ".md");
    let targetPath;

    if (baseName.toLowerCase() === path.basename(dirName).toLowerCase()) {
      // This file should become README.md in its parent folder
      targetPath = path.join(mdbookDir, dirName, "README.md");
    } else {
      targetPath = path.join(mdbookDir, spacesToUnder($));
    }

    // Ensure the directory exists
    await mkdir(path.dirname(targetPath), { recursive: true });

    await Bun.write(targetPath, content);
  })
);

const summary = generateSummary(
  files.map((file) => {
    const dirName = path.dirname(file);
    const baseName = path.basename(file, ".md");
    if (baseName.toLowerCase() === path.basename(dirName).toLowerCase()) {
      return path.join(dirName, "README.md");
    }
    return spacesToUnder(file);
  })
);
await Bun.write(path.join(mdbookDir, "SUMMARY.md"), summary);
