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

// Helper function to handle GitHub API errors
function handleGitHubError(error: any): { error: string; suggestion?: string } {
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
    return {
      error: 'Repository or file not found.',
      suggestion: 'Verify the repository exists and is accessible.',
    };
  }

  return {
    error: error.message || 'Failed to access GitHub repository.',
  };
}

export const listExpertiseFiles = ({ session }: GitHubExpertiseToolProps) =>
  tool({
    description:
      'List all files in the pedagogical expertise repository. This contains teaching best practices, coaching frameworks, and educational resources.',
    parameters: z.object({}),
    execute: async () => {
      try {
        if (!session?.user?.id) {
          return { error: 'User not authenticated' };
        }

        const client = await getGitHubClient();

        const response = await client.rest.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: '',
        });

        if (Array.isArray(response.data)) {
          const files = response.data
            .filter((item: any) => item.type === 'file')
            .map((file: any) => ({
              name: file.name,
              path: file.path,
              size: file.size,
              sha: file.sha,
              url: file.url,
            }));

          return {
            message: `Found ${files.length} files in pedagogical expertise repository`,
            files,
          };
        } else {
          return {
            error: 'Repository structure is not as expected.',
          };
        }
      } catch (error: any) {
        return handleGitHubError(error);
      }
    },
  });

export const readExpertiseFile = ({ session }: GitHubExpertiseToolProps) =>
  tool({
    description:
      'Read content from the pedagogical expertise repository. Access teaching frameworks, coaching strategies, and educational best practices.',
    parameters: z.object({
      fileName: z
        .string()
        .describe(
          'The name of the file to read (e.g., "10 Key Teaching Moves.md")',
        ),
    }),
    execute: async ({ fileName }) => {
      try {
        if (!session?.user?.id) {
          return { error: 'User not authenticated' };
        }

        const client = await getGitHubClient();

        // Get file content
        const response = await client.rest.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: fileName,
          mediaType: {
            format: 'raw',
          },
        });

        const content = response.data as unknown as string;

        return {
          message: `Successfully read expertise file "${fileName}"`,
          fileName,
          content,
        };
      } catch (error: any) {
        return handleGitHubError(error);
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
