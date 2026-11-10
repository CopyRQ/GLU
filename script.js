const repository = {
    owner: "CopyRQ",
    name: "GLU",
    branch: "main",
};

const apiRoot = "https://api.github.com";
const collator = new Intl.Collator("nl", {
    numeric: true,
    sensitivity: "base",
});

function getRepositoryUrl(value) {
    const normalized = value.replace(/^git@github\.com:/, "https://github.com/");
    const match = normalized.match(
        /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/,
    );

    if (!match) {
        throw new Error(`Niet-ondersteurde submodule-URL: ${value}`);
    }

    return {
        owner: match[1],
        name: match[2],
    };
}

function parseSubmodules(contents) {
    const submodules = new Map();
    let path;

    for (const line of contents.split(/\r?\n/)) {
        if (/^\s*\[submodule\s+"[^"]+"\]\s*$/.test(line)) {
            path = undefined;
        } else if (/^\s*path\s*=/.test(line)) {
            path = line.replace(/^\s*path\s*=\s*/, "").trim();
        } else if (/^\s*url\s*=/.test(line) && path) {
            const url = line.replace(/^\s*url\s*=\s*/, "").trim();
            submodules.set(path.replace(/\\/g, "/"), url);
            path = undefined;
        }
    }

    return submodules;
}

async function fetchJson(url) {
    const response = await fetch(url, {
        headers: {
            Accept: "application/vnd.github+json",
        },
    });

    if (!response.ok) {
        throw new Error(
            `GitHub kon pagina's niet ophalen (${response.status} ${response.statusText}).`,
        );
    }

    return response.json();
}

async function fetchText(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(
            `GitHub kon de submodule-instellingen niet ophalen (${response.status} ${response.statusText}).`,
        );
    }
    return response.text();
}

async function fetchTree(owner, name, revision) {
    const url = new URL(
        `${apiRoot}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/git/trees/${encodeURIComponent(revision)}`,
    );
    url.searchParams.set("recursive", "1");

    const tree = await fetchJson(url);
    if (tree.truncated) {
        throw new Error(`De GitHub-bestandslijst van ${owner}/${name} is afgekapt.`);
    }
    return tree.tree;
}

function createPageUrl(relativePath) {
    const encodedPath = relativePath
        .split("/")
        .map(encodeURIComponent)
        .join("/");
    return new URL(`./${encodedPath}/`, document.baseURI).href;
}

function createPublishedUrl(owner, name, relativePath) {
    const baseUrl = `https://${owner.toLowerCase()}.github.io/${name}/`;
    const suffix = relativePath
        .split("/")
        .filter(Boolean)
        .map(encodeURIComponent)
        .join("/");
    return suffix ? `${baseUrl}${suffix}/` : baseUrl;
}

function getLabel(folderName) {
    const label = folderName
        .replace(/^\d{4}-P\d+-/i, "")
        .replace(/[_-]+/g, " ");
    return label.charAt(0).toLocaleUpperCase("nl") + label.slice(1);
}

function addPage(tree, path, url) {
    const parts = path.split("/");
    let children = tree;
    let node;

    for (const part of parts) {
        if (!children.has(part)) {
            children.set(part, {
                label: getLabel(part),
                url: null,
                children: new Map(),
            });
        }

        node = children.get(part);
        children = node.children;
    }

    node.url = url;
}

function getProjectPath(path) {
    if (!path.startsWith("Projects/")) {
        return null;
    }
    return path.slice("Projects/".length);
}

function addRepositoryPages(tree, entries, options = {}) {
    for (const entry of entries) {
        if (
            entry.type !== "blob"
            || (entry.path !== "index.html" && !entry.path.endsWith("/index.html"))
        ) {
            continue;
        }

        const pagePath = entry.path === "index.html"
            ? ""
            : entry.path.slice(0, -"/index.html".length);
        const fullPath = options.pathPrefix
            ? `${options.pathPrefix}${pagePath ? `/${pagePath}` : ""}`
            : pagePath;
        const projectPath = getProjectPath(fullPath);
        if (!projectPath) {
            continue;
        }

        const pageUrl = options.pathPrefix
            ? createPublishedUrl(
                options.owner,
                options.name,
                pagePath,
            )
            : createPageUrl(fullPath);
        addPage(tree, projectPath, pageUrl);
    }
}

function renderNodes(nodes) {
    const list = document.createElement("ul");
    const sortedNodes = [...nodes.values()].sort((a, b) =>
        collator.compare(a.label, b.label)
    );

    for (const node of sortedNodes) {
        const item = document.createElement("li");
        if (node.url) {
            const link = document.createElement("a");
            link.href = node.url;
            link.textContent = node.label;
            item.append(link);
        } else {
            item.textContent = node.label;
        }

        if (node.children.size > 0) {
            item.append(renderNodes(node.children));
        }
        list.append(item);
    }

    return list;
}

async function loadProjectPages() {
    const repositoryTree = await fetchTree(
        repository.owner,
        repository.name,
        repository.branch,
    );
    const submoduleEntries = repositoryTree.filter(
        (entry) => entry.type === "commit",
    );
    const submodules = submoduleEntries.length
        ? parseSubmodules(
            await fetchText(
                `https://raw.githubusercontent.com/${repository.owner}/${repository.name}/${repository.branch}/.gitmodules`,
            ),
        )
        : new Map();
    const projectTree = new Map();

    addRepositoryPages(projectTree, repositoryTree);

    for (const entry of submoduleEntries) {
        const submoduleUrl = submodules.get(entry.path);
        if (!submoduleUrl) {
            throw new Error(`Geen URL gevonden voor submodule: ${entry.path}`);
        }

        const submoduleRepository = getRepositoryUrl(submoduleUrl);
        const submoduleTree = await fetchTree(
            submoduleRepository.owner,
            submoduleRepository.name,
            entry.sha,
        );
        addRepositoryPages(projectTree, submoduleTree, {
            ...submoduleRepository,
            pathPrefix: entry.path,
        });
    }

    return projectTree;
}

async function main() {
    const status = document.querySelector("#status");
    const navigation = document.querySelector("#project-navigation");

    try {
        const pages = await loadProjectPages();
        navigation.replaceChildren(renderNodes(pages));
        status.remove();
    } catch (error) {
        console.error(error);
        status.textContent = `Pagina's laden is mislukt: ${error.message}`;
        status.setAttribute("role", "alert");
    }
}

main();
