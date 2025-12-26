# Tools Reference

MyLocalCLI provides 26 tools that the AI can use to help you with coding tasks.

## Overview

Tools are actions the AI can take automatically:
- Reading and writing files
- Searching code
- Running commands
- Managing git

When you ask the AI to do something, it selects the appropriate tools.

## File Operations

### read_file
Read the contents of a file.

```
AI uses: read_file("src/index.js")
Result: Returns file content
```

### write_file
Create or overwrite a file.

```
AI uses: write_file("src/utils.js", "// utility functions\n...")
Result: File created/updated
```

### edit_file
Edit specific parts of a file. Uses fuzzy matching to find content.

```
AI uses: edit_file("src/app.js", old_content, new_content)
Result: Targeted edit applied
```

**Features:**
- Handles different line endings (CRLF/LF)
- Fuzzy matching for whitespace differences
- Shows line-level changes

### multi_edit_file
Make multiple edits to a file in one operation.

```
AI uses: multi_edit_file("src/app.js", [
  { old: "foo", new: "bar" },
  { old: "baz", new: "qux" }
])
```

### delete_file
Delete a file or directory.

```
AI uses: delete_file("temp/cache.json")
```

⚠️ Requires confirmation by default.

### copy_file
Copy a file to a new location.

```
AI uses: copy_file("src/template.js", "src/new-file.js")
```

### move_file
Move or rename a file.

```
AI uses: move_file("old-name.js", "new-name.js")
```

### file_info
Get file metadata.

```
AI uses: file_info("package.json")
Result: { size: 1234, modified: "2024-01-01", isDirectory: false }
```

### append_file
Add content to the end of a file.

```
AI uses: append_file("log.txt", "New entry\n")
```

### insert_at_line
Insert content at a specific line number.

```
AI uses: insert_at_line("src/app.js", 10, "// New code here")
```

### read_lines
Read specific lines from a file.

```
AI uses: read_lines("src/app.js", 1, 50)
Result: Lines 1-50 of the file
```

## Search & Navigation

### list_directory
List files and folders in a directory.

```
AI uses: list_directory("src/", recursive: true)
Result: Array of files with metadata
```

### search_files
Find files matching a glob pattern.

```
AI uses: search_files("**/*.test.js")
Result: ["tests/app.test.js", "tests/utils.test.js"]
```

### grep
Search for text in files.

```
AI uses: grep("TODO", "src/", include: "*.js")
Result: Matching lines with file:line:content
```

### tree
Show directory structure.

```
AI uses: tree("src/", depth: 3)
Result: ASCII tree structure
```

### find_replace
Find and replace text across multiple files.

```
AI uses: find_replace("oldName", "newName", "src/", include: "*.js")
Result: N files modified
```

⚠️ Requires confirmation.

### codebase_search
Semantic search for code concepts.

```
AI uses: codebase_search("authentication logic")
Result: Relevant code snippets ranked by relevance
```

## Git Operations

### git_status
Get repository status.

```
AI uses: git_status()
Result: { branch: "main", staged: 2, modified: 3 }
```

### git_diff
Show file changes.

```
AI uses: git_diff(staged: false)
Result: Unified diff output
```

### git_log
Show commit history.

```
AI uses: git_log(count: 10)
Result: Recent commits with messages
```

### git_commit
Create a commit.

```
AI uses: git_commit("feat: add user authentication")
```

⚠️ Requires confirmation.

## Shell Commands

### run_command
Execute a shell command.

```
AI uses: run_command("npm test")
```

**Cross-Platform Support:**
Commands are automatically translated on Windows:

| Unix | Windows |
|------|---------|
| `ls` | `dir` |
| `cat` | `type` |
| `rm` | `del` |
| `cp` | `copy` |
| `mv` | `move` |
| `pwd` | `cd` |
| `grep` | `findstr` |
| `which` | `where` |

**Safety Features:**
- Dangerous commands require confirmation
- Safe commands (ls, cat, git status) run automatically
- Timeout protection (30 seconds default)

### create_directory
Create a new directory.

```
AI uses: create_directory("src/components/ui")
```

## Web & External

### web_fetch
Fetch content from a URL.

```
AI uses: web_fetch("https://api.example.com/data")
Result: Response content
```

## Task Management

### todo_write
Create or update a task list.

```
AI uses: todo_write([
  { id: "1", content: "Fix bug", status: "pending", priority: "high" },
  { id: "2", content: "Add tests", status: "done", priority: "medium" }
])
```

## User Interaction

### ask_user
Ask the user for input or confirmation.

```
AI uses: ask_user("Which database should I use?", options: ["PostgreSQL", "MongoDB"])
Result: User's choice
```

## Tool Safety

### Auto-Approved (Safe)
- read_file, list_directory, search_files
- grep, tree, file_info
- git_status, git_diff, git_log
- Safe shell commands (ls, cat, pwd)

### Requires Confirmation
- write_file, edit_file, delete_file
- run_command (most commands)
- git_commit
- find_replace

### Dangerous (Extra Warning)
- rm -rf, del /s
- Format commands
- System modifications

## Auto-Approve Mode

Run with `--auto` to skip confirmations:

```bash
mlc --auto
```

⚠️ Use with caution - file operations will execute without asking.

## Viewing Available Tools

```bash
mlc
> /tools
```
