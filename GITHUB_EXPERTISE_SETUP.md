# GitHub Expertise Integration Setup

This project now includes GitHub repository access for pedagogical expertise knowledge base. The AI assistant can access teaching best practices, coaching frameworks, and educational resources from the `agasthyaps/nisasbrain` repository.

## Environment Variables

Add this environment variable to your `.env.local` or deployment environment:

```bash
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_personal_access_token_here
```

## GitHub Personal Access Token Setup

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name like "Nisa AI Expertise Access"
4. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `read:org` (Read organization data)
5. Click "Generate token"
6. Copy the token and add it to your environment variables

## How It Works

### Automatic System Prompt Enhancement
- The README content from the expertise repository is automatically appended to the end of the system prompt
- This happens at the start of each new chat session
- The content provides context about available teaching resources and frameworks
- The expertise content is added after the main prompt and request hints, ensuring it doesn't interfere with core instructions

### Available Tools

The AI assistant has access to these GitHub expertise tools:

1. **`getExpertiseTree`** - Get the complete directory tree structure of the repository, showing all files and folders hierarchically
2. **`listExpertiseFiles`** - List files and directories in a specific path (can navigate subdirectories)
3. **`readExpertiseFile`** - Read content from specific expertise files (accepts both names and full paths)
4. **`searchExpertiseContent`** - Search for files by name or content (e.g., "warm demander")
5. **`getExpertiseOverview`** - Get the repository overview from README.md

### User Interface

Tool results are displayed in a clean, collapsible format:
- **Collapsed view**: Shows a summary of the operation (e.g., "Expertise file retrieved - File loaded (1,234 characters)")
- **Expanded view**: Shows the full content when clicked
- **Error handling**: Clear error messages for authentication, rate limiting, or file not found issues
- **Loading states**: Shows appropriate loading messages during tool execution

### Tool Distinction

The system clearly distinguishes between:

- **GitHub Expertise Tools** (`getExpertiseTree`, `listExpertiseFiles`, `readExpertiseFile`, etc.) - Access to pedagogical expertise (GitHub repo)
- **Google Drive Knowledge Base Tools** (`listKnowledgeBaseFiles`, `readKnowledgeBaseFile`) - Access to user's personal knowledge base (Google Drive)

### Example Usage

Users can ask questions like:
- "Show me the structure of the expertise repository"
- "What files are in the curricula/eureka folder?"
- "Show me the 10 key teaching moves"
- "What are the warm demander principles?"
- "Find resources about mathematical discourse"
- "What's in the 313 model?"

The AI will automatically use the appropriate expertise tools to access the relevant content from the GitHub repository.

## Repository Structure

The expertise repository contains:
- `README.md` - Overview and structure of the knowledge base
- `10 Key Teaching Moves.md` - Foundational teaching practices
- `Key Math Teaching Practices.md` - Math-specific implementation
- `How to be a Warm Demander.md` - Coaching framework
- `313 Model.md` - Summer school implementation model
- `curricula/eureka/` - Eureka Math curriculum resources
  - `ist.md` - Coaching guide with teacher actions
  - `guidedobs.md` - Professional development for observations
  - `scope_sequence.md` - Curriculum progression PK-5
- `frameworks/danielson/` - Complete Danielson Framework for Teaching
- `Rigorous Math Questions to Promote Mathematical Discourse.md` - Question bank
- `Nisa's Knowledge Base - Sheet1.csv` - Metadata tracking

## Navigation Features

The tools provide enhanced navigation capabilities:

### Tree View (`getExpertiseTree`)
- Shows complete repository structure in a visual tree format
- Displays directories with `/` suffix and file sizes
- Provides a flat list of all paths for easy reference
- Helps understand the overall organization

### Directory Navigation (`listExpertiseFiles`)
- Navigate into any subdirectory by providing its path
- Shows files and directories separately
- Includes parent directory reference for easy navigation up
- Provides helpful stats about directory contents

### Improved Error Handling
- When a file/path is not found, suggests correct paths
- Detects when trying to read a directory vs. a file
- Shows available files/directories when navigation fails
- Provides clear guidance for fixing path issues

## Error Handling

The integration includes robust error handling for:
- **Authentication failures** - Clear guidance on token setup
- **Rate limiting** - Graceful handling of GitHub API limits
- **Network issues** - Fallback to base prompt if GitHub is unavailable
- **File not found** - Clear error messages for missing files

## Security Considerations

- **Read-only access** - All operations are read-only, no write permissions
- **Repository scope** - Limited to specific repository only
- **Token security** - GitHub token stored in environment variables
- **Error messages** - Don't expose sensitive information in error responses

## Fallback Behavior

If the GitHub integration is not configured or unavailable:
- The system continues to work with the base prompt
- No functionality is lost
- Clear error messages guide users to proper setup

## Monitoring

The integration includes logging for:
- GitHub API calls and responses
- Error conditions and rate limiting
- System prompt enhancement success/failure
- Tool usage patterns

## Troubleshooting

### Common Issues

1. **"GitHub authentication failed"**
   - Check that `GITHUB_PERSONAL_ACCESS_TOKEN` is set correctly
   - Verify the token has the required permissions

2. **"Repository or file not found"**
   - Ensure the repository `agasthyaps/nisasbrain` exists and is accessible
   - Check that the token has access to the repository

3. **"GitHub API rate limit exceeded"**
   - GitHub has rate limits for API calls
   - The system will retry automatically with exponential backoff

4. **"Failed to fetch GitHub expertise overview"**
   - Check network connectivity
   - Verify the README.md file exists in the repository

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

This will show detailed logs about GitHub API calls and any issues. 