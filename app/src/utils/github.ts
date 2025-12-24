export interface GitHubRepo {
    name: string;
    html_url: string;
    description: string | null;
    stargazers_count: number;
    forks_count: number;
    language: string | null;
    updated_at: string;
    fork: boolean;
}

export async function fetchUserRepositories(
    username: string,
    options: {
        sort?: 'created' | 'updated' | 'pushed' | 'full_name';
        perPage?: number;
    } = {}
): Promise<GitHubRepo[]> {
    const { sort = 'updated', perPage = 100 } = options;

    try {
        const response = await fetch(
            `https://api.github.com/users/${username}/repos?sort=${sort}&per_page=${perPage}`
        );

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }

        const repos = await response.json();
        return repos;
    } catch (error) {
        console.error('Failed to fetch GitHub repositories:', error);
        throw error;
    }
}

export function filterNonForks(repos: GitHubRepo[]): GitHubRepo[] {
    return repos.filter((repo) => !repo.fork);
}

export function sortByStars(repos: GitHubRepo[]): GitHubRepo[] {
    return repos.sort((a, b) => b.stargazers_count - a.stargazers_count);
}
