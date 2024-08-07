export const SEARCH_USERS = `
SELECT
    users.username,
    users.img,
    coalesce(array_length(users.followers,1),0) as followers_count,
    count(repos) as repos_count
FROM users
    FULL OUTER JOIN repositories repos
        ON users.id = repos.user_owner
WHERE users.username ILIKE $1
GROUP BY 
    users.username,
    users.img,
    users.followers
`;

export const USER_FOLLOWERS = `
SELECT
    json_build_object(
        'username',follower.username,
        'img',follower.img,
        'followers_count',coalesce(array_length(follower.followers,1),0), 
        'repos_count',count(repositories)
    ) as followers
FROM users usr 
    LEFT OUTER JOIN users follower 
        ON ARRAY[follower.id] && usr.followers 
    LEFT OUTER JOIN repositories 
        ON repositories.user_owner = follower.id 
WHERE usr.id = $1 
GROUP BY 
    follower.username, 
    follower.img, 
    follower.followers
`;

export const PROFILE_INFO = `
SELECT
    users.username as user_name,
    users.description as user_description,
    users.img as user_img,
    count(repositories) as repos_count,
    coalesce(array_length(users.followers,1),0) as followers_count, 
    count(usrs) as followed_count
FROM users
    FULL OUTER JOIN repositories
        ON users.id = repositories.user_owner 
    FULL OUTER JOIN users usrs 
        ON ARRAY[users.id] && usrs.followers
WHERE users.id = $1
GROUP BY
    users.username,
    users.description,
    users.img,
    users.followers
`;

export const REPOSITORIES_FILES = `
SELECT
    file.id,
    file.name,
    file.size,
    file.path,
    last_commit.last_commit_title,
    last_commit.last_commit_created_at
FROM (
    SELECT
        f.name, f.size,f.id, f.path
    FROM repositories
    LEFT OUTER JOIN files f
    ON f.repo = repositories.id
    WHERE repositories.user_owner = $1 AND repositories.name = $2
    ) as file,
    LATERAL (
    SELECT 
        c.title as last_commit_title,
        c.created_at as last_commit_created_at 
    FROM modifications 
        LEFT OUTER JOIN commits c 
            ON c.id = modifications.commit 
    WHERE modifications.file = file.id 
    ORDER BY c.created_at DESC LIMIT 1
    ) as last_commit 
WHERE file.size != 'N/A'
`;

export const REPOSITORIES_COMMITS = `
SELECT
    commits.title as title,
    contributors.name as author,
    commits.created_at as created_at,
    commits.hash as hash
FROM commits
    LEFT OUTER JOIN repositories 
        ON (
            SELECT id FROM repositories WHERE name = $1 AND user_owner = $2) = commits.repo
    LEFT OUTER JOIN contributors 
        ON contributors.id = commits.author
`;

export const REPOSITORIES_CONTRIBUTORS = `
SELECT
    contributors.name as name,
    last_commit.title as last_commit_title, 
    commits_created.count as commits_created
FROM 
    contributors, 
    LATERAL (
        SELECT title FROM commits WHERE commits.author = contributors.id ORDER BY created_at DESC LIMIT 1
    ) as last_commit,
    LATERAL (
        SELECT count(*) FROM commits WHERE commits.author = contributors.id
    ) as commits_created 
WHERE 
    contributors.repo = (
        SELECT id FROM repositories WHERE repositories.name = $1 AND repositories.user_owner = $2
    )`;

export const USER_REPOSITORIES = `
SELECT
    repositories.name as name,
    repositories.description as description,
    repositories.created_at as created_at,
    coalesce(array_length(repositories.likes,1),0) as likes,
    array_agg(languages.name) as languages
FROM repositories
    LEFT OUTER JOIN repositories_languages
        ON repositories_languages.repo_id = repositories.id
    LEFT OUTER JOIN languages
        ON repositories_languages.language_id = languages.id
WHERE repositories.user_owner = $1
GROUP BY repositories.name, repositories.description, repositories.likes, repositories.created_at
`

export const SEARCH_REPOSITORIES = `
SELECT
    users.username as user,
    repositories.name as name,
    repositories.description as description,
    repositories.created_at as created_at,
    coalesce(array_length(repositories.likes,1),0) as likes,
    array_agg(languages.name) as languages
FROM repositories
    LEFT OUTER JOIN users
        ON users.id = repositories.user_owner
    LEFT OUTER JOIN repositories_languages
        ON repositories_languages.repo_id = repositories.id
    LEFT OUTER JOIN languages
        ON repositories_languages.language_id = languages.id
WHERE repositories.name ILIKE $1
GROUP BY repositories.name, repositories.description, repositories.likes, users.username, repositories.created_at`

export const REPOSITORY_INFO = `
SELECT
    repositories.name as name,
    repositories.description as description,
    coalesce(array_length(repositories.likes,1),0) as likes,
    array_agg(languages.name) as languages,
    (
    SELECT 
        count(commits) as commits_count 
    FROM repositories 
        LEFT OUTER JOIN commits 
            ON commits.repo = repositories.id
    ),
    (
    SELECT  
        count(contributors) as contributors_count 
    FROM repositories 
        LEFT OUTER JOIN contributors 
            ON contributors.repo = repositories.id
    ),
    (
    SELECT 
        array_agg(json_build_object(
            'name',branches.name,
            'type',branches.type
        )) as branches 
    FROM repositories 
        LEFT OUTER JOIN branches 
            ON branches.repo = repositories.id
    ),
    (
    SELECT 
        json_build_object(
            'title',commits.title,
            'created_at',commits.created_at,
            'author',contributors.name
        ) as last_commit 
    FROM repositories 
        LEFT OUTER JOIN commits 
            ON commits.repo = repositories.id 
        LEFT OUTER JOIN contributors 
            ON contributors.id = commits.author 
    ORDER BY commits.created_at DESC LIMIT 1
    )
FROM repositories
    LEFT OUTER JOIN repositories_languages
        ON repositories_languages.repo_id = repositories.id
    LEFT OUTER JOIN languages
        ON repositories_languages.language_id = languages.id
WHERE repositories.user_owner = $1 AND repositories.name = $2
GROUP BY repositories.name, repositories.description, repositories.likes
`

export const COMMIT_INFO = `
SELECT
    commits.hash as hash,
    commits.title as title,
    commits.content as content,
    commits.created_at as created_at,
    contributors.name as author,
    branches.name as branch,
    (
    SELECT
        array_agg(json_build_object(
            'name',files.name,
            'size',files.size,
            'type',modifications.type
        )) as files
    FROM commits
        LEFT OUTER JOIN modifications 
            ON modifications.commit = commits.id
        LEFT OUTER JOIN files 
            ON modifications.file = files.id 
    WHERE commits.hash = $1
    ), 
    (
    SELECT 
        hash as prev_commit_hash 
    FROM commits c 
    WHERE c.created_at < commits.created_at 
    LIMIT 1
    ), 
    (
    SELECT 
        hash as next_commit_hash 
    FROM commits c 
    WHERE c.created_at > commits.created_at 
    ORDER BY c.created_at ASC 
    LIMIT 1
    )
FROM commits 
    LEFT OUTER JOIN contributors 
        ON contributors.id = commits.author 
    LEFT OUTER JOIN commits_branches 
        ON commits_branches.commit = commits.id 
    LEFT OUTER JOIN branches 
        ON commits_branches.branch = branches.id 
WHERE commits.hash = $1
`
