import { tool } from 'ai';
import { z } from 'zod';
import { Octokit } from '@octokit/rest';
import type { Session } from 'next-auth';

// GitHub API client setup
const octokit = new Octokit({
  auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
});

const REPO_OWNER = 'agasthyaps';
const REPO_NAME = 'nisasbrain';

interface GitHubExpertiseToolProps {
  session: Session;
}

// Helper function to get GitHub client
async function getGitHubClient() {
  if (!process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
    throw new Error(
      'GitHub Personal Access Token not found. Please set GITHUB_PERSONAL_ACCESS_TOKEN environment variable.',
    );
  }
  return octokit;
}

// Helper function to handle GitHub API errors with improved messages
function handleGitHubError(
  error: any,
  context?: { path?: string; availablePaths?: string[] },
): { error: string; suggestion?: string; availablePaths?: string[] } {
  console.error('GitHub API error:', error);

  if (error.status === 401) {
    return {
      error:
        'GitHub authentication failed. Please check your Personal Access Token.',
      suggestion:
        'Ensure GITHUB_PERSONAL_ACCESS_TOKEN is set correctly in your environment.',
    };
  }

  if (error.status === 403) {
    return {
      error: 'GitHub API rate limit exceeded or access denied.',
      suggestion: 'Check your GitHub token permissions and rate limits.',
    };
  }

  if (error.status === 404) {
    const response: any = {
      error: context?.path
        ? `File or directory "${context.path}" not found in repository.`
        : 'Repository or file not found.',
      suggestion:
        'Verify the path exists and is spelled correctly. Use getExpertiseTree to see available files and directories.',
    };

    if (context?.availablePaths && context.availablePaths.length > 0) {
      response.suggestion += ' Available paths in this directory:';
      response.availablePaths = context.availablePaths;
    }

    return response;
  }

  return {
    error: error.message || 'Failed to access GitHub repository.',
  };
}

// Helper function to build tree structure recursively
async function buildTreeStructure(client: Octokit, path = ''): Promise<any[]> {
  try {
    const response = await client.rest.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path,
    });

    if (!Array.isArray(response.data)) {
      return [];
    }

    const items = [];
    for (const item of response.data) {
      const node: any = {
        name: item.name,
        path: item.path,
        type: item.type,
        size: item.size,
      };

      // Recursively get subdirectory contents
      if (item.type === 'dir') {
        node.children = await buildTreeStructure(client, item.path);
      }

      items.push(node);
    }

    return items;
  } catch (error) {
    console.error(`Error building tree for path ${path}:`, error);
    return [];
  }
}

// Helper function to format tree structure for display
function formatTreeStructure(items: any[], indent = ''): string {
  let output = '';
  const sortedItems = items.sort((a, b) => {
    // Directories first, then files
    if (a.type !== b.type) {
      return a.type === 'dir' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  for (let i = 0; i < sortedItems.length; i++) {
    const item = sortedItems[i];
    const isLast = i === sortedItems.length - 1;
    const prefix = isLast ? '└── ' : '├── ';

    output += indent + prefix + item.name;
    if (item.type === 'dir') {
      output += '/\n';
      if (item.children && item.children.length > 0) {
        const nextIndent = indent + (isLast ? '    ' : '│   ');
        output += formatTreeStructure(item.children, nextIndent);
      }
    } else {
      output += ` (${(item.size / 1024).toFixed(1)}KB)\n`;
    }
  }

  return output;
}

export const getExpertiseTree = ({ session }: GitHubExpertiseToolProps) =>
  tool({
    description:
      'Get the complete directory tree structure of the pedagogical expertise repository. Shows all files and folders in a hierarchical view, helping you navigate the repository structure.',
    parameters: z.object({
      maxDepth: z
        .number()
        .optional()
        .describe('Maximum depth to traverse (default: unlimited)'),
    }),
    execute: async ({ maxDepth }) => {
      try {
        if (!session?.user?.id) {
          return { error: 'User not authenticated' };
        }

        const client = await getGitHubClient();

        // Build the tree structure
        const tree = await buildTreeStructure(client, '');

        // Format as readable tree
        const treeDisplay = formatTreeStructure(tree);

        // Also provide a structured list of all paths for easy reference
        const allPaths: string[] = [];
        const collectPaths = (items: any[], parentPath = '') => {
          for (const item of items) {
            allPaths.push(item.path);
            if (item.children) {
              collectPaths(item.children, item.path);
            }
          }
        };
        collectPaths(tree);

        return {
          message: 'Successfully retrieved repository structure',
          treeDisplay,
          structure: tree,
          allPaths: allPaths.sort(),
          stats: {
            totalFiles: allPaths.filter(
              (p) => !tree.find((i: any) => i.path === p && i.type === 'dir'),
            ).length,
            totalDirectories: allPaths.filter((p) =>
              tree.find((i: any) => i.path === p && i.type === 'dir'),
            ).length,
          },
        };
      } catch (error: any) {
        return handleGitHubError(error);
      }
    },
  });

export const listExpertiseFiles = ({ session }: GitHubExpertiseToolProps) =>
  tool({
    description:
      'List files and directories in the pedagogical expertise repository. Can list root directory or specific subdirectories. Use this to navigate through directories.',
    parameters: z.object({
      path: z
        .string()
        .optional()
        .describe(
          'Directory path to list contents of (e.g., "curricula/eureka", "frameworks"). Leave empty for root directory.',
        ),
    }),
    execute: async ({ path = '' }) => {
      // Declare availablePaths outside try block for error handling
      let availablePaths: string[] = [];

      try {
        if (!session?.user?.id) {
          return { error: 'User not authenticated' };
        }

        const client = await getGitHubClient();

        // First, try to get available paths in case we need them for error messages
        try {
          const parentPath = path.includes('/')
            ? path.substring(0, path.lastIndexOf('/'))
            : '';
          const parentResponse = await client.rest.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: parentPath,
          });
          if (Array.isArray(parentResponse.data)) {
            availablePaths = parentResponse.data.map((item: any) => item.path);
          }
        } catch {
          // Ignore errors when getting available paths
        }

        const response = await client.rest.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path,
        });

        if (Array.isArray(response.data)) {
          const items = response.data.map((item: any) => ({
            name: item.name,
            path: item.path,
            type: item.type,
            size: item.size,
            sha: item.sha,
            url: item.url,
          }));

          const files = items.filter((item) => item.type === 'file');
          const directories = items.filter((item) => item.type === 'dir');

          return {
            message: `Contents of "${path || 'root'}" directory`,
            currentPath: path || '/',
            parentPath: path.includes('/')
              ? path.substring(0, path.lastIndexOf('/'))
              : null,
            directories: directories.map((d) => ({
              name: d.name,
              path: d.path,
            })),
            files: files.map((f) => ({
              name: f.name,
              path: f.path,
              size: f.size,
            })),
            stats: {
              totalFiles: files.length,
              totalDirectories: directories.length,
            },
          };
        } else {
          // Single file was accessed, not a directory
          return {
            error: `"${path}" is a file, not a directory. Use readExpertiseFile to read its contents.`,
            suggestion:
              'To list directory contents, provide a directory path or leave empty for root.',
          };
        }
      } catch (error: any) {
        return handleGitHubError(error, {
          path,
          availablePaths: availablePaths,
        });
      }
    },
  });

export const readExpertiseFile = ({ session }: GitHubExpertiseToolProps) =>
  tool({
    description:
      'Read content from the pedagogical expertise repository. Access teaching frameworks, coaching strategies, and educational best practices. Accepts both file names and full paths.',
    parameters: z.object({
      filePath: z
        .string()
        .describe(
          'The path or name of the file to read (e.g., "10 Key Teaching Moves.md" or "curricula/eureka/ist.md")',
        ),
    }),
    execute: async ({ filePath }) => {
      try {
        if (!session?.user?.id) {
          return { error: 'User not authenticated' };
        }

        const client = await getGitHubClient();

        // Try to get available files for better error messages
        let availableFiles: string[] = [];
        try {
          const dirPath = filePath.includes('/')
            ? filePath.substring(0, filePath.lastIndexOf('/'))
            : '';
          const dirResponse = await client.rest.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: dirPath,
          });
          if (Array.isArray(dirResponse.data)) {
            availableFiles = dirResponse.data
              .filter((item: any) => item.type === 'file')
              .map((item: any) => item.name);
          }
        } catch {
          // Ignore errors when getting available files
        }

        // Get file content
        const response = await client.rest.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: filePath,
          mediaType: {
            format: 'raw',
          },
        });

        const content = response.data as unknown as string;

        return {
          message: `Successfully read expertise file "${filePath}"`,
          filePath,
          content,
          contentLength: content.length,
          lineCount: content.split('\n').length,
        };
      } catch (error: any) {
        // Check if it might be a directory
        try {
          const client = await getGitHubClient();
          const checkResponse = await client.rest.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: filePath,
          });

          if (Array.isArray(checkResponse.data)) {
            return {
              error: `"${filePath}" is a directory, not a file.`,
              suggestion:
                'Use listExpertiseFiles to see directory contents, or specify a file within this directory.',
              directoryContents: checkResponse.data.map((item: any) => ({
                name: item.name,
                type: item.type,
                path: item.path,
              })),
            };
          }
        } catch {
          // Not a directory, return original error
        }

        return handleGitHubError(error, { path: filePath });
      }
    },
  });

export const searchExpertiseContent = ({ session }: GitHubExpertiseToolProps) =>
  tool({
    description:
      'Search for files in the pedagogical expertise repository by name or content. Useful for finding specific teaching resources or frameworks.',
    parameters: z.object({
      query: z
        .string()
        .describe(
          'Search query to find relevant expertise files (e.g., "warm demander", "teaching moves")',
        ),
    }),
    execute: async ({ query }) => {
      try {
        if (!session?.user?.id) {
          return { error: 'User not authenticated' };
        }

        const client = await getGitHubClient();

        // Search repository content
        const response = await client.rest.search.code({
          q: `${query} repo:${REPO_OWNER}/${REPO_NAME}`,
        });

        const files = response.data.items.map((item) => ({
          name: item.name,
          path: item.path,
          url: item.html_url,
          score: item.score,
        }));

        return {
          message: `Found ${files.length} files matching "${query}" in expertise repository`,
          query,
          files,
        };
      } catch (error: any) {
        return handleGitHubError(error);
      }
    },
  });

export const getExpertiseOverview = ({ session }: GitHubExpertiseToolProps) =>
  tool({
    description:
      'Get the overview and structure of the pedagogical expertise repository. This provides context about available teaching resources and frameworks.',
    parameters: z.object({}),
    execute: async () => {
      try {
        if (!session?.user?.id) {
          return { error: 'User not authenticated' };
        }

        const client = await getGitHubClient();

        // Get README content
        const response = await client.rest.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: 'README.md',
          mediaType: {
            format: 'raw',
          },
        });

        const readmeContent = response.data as unknown as string;

        return {
          message: 'Successfully retrieved expertise repository overview',
          overview: readmeContent,
        };
      } catch (error: any) {
        return handleGitHubError(error);
      }
    },
  });
