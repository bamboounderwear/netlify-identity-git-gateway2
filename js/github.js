async function listRepoContents(path = '') {
    return fetchWithAuth("/.netlify/git/github/contents/" + path, {
        method: 'GET'
    });
}

async function listRepoContentsRecursive(path = '') {
    let contents = await listRepoContents(path);
    let allContents = [];

    for (let item of contents) {
        allContents.push(item);
        if (item.type === 'dir') {
            let subContents = await listRepoContentsRecursive(item.path);
            allContents = allContents.concat(subContents);
        }
    }

    return allContents;
}

async function getData(mypath = '') {
    return fetchWithAuth("/.netlify/git/github/contents/" + mypath, {
        method: 'GET'
    }).then(data => {
        if (data.content) {
            data.content = atob(data.content);
        }
        return data;
    });
}

async function saveData(mypath, data, isBinary = false) {
    return getData(mypath).then(function(curfile) {
        let opts = {
            path: mypath,
            message: "initial commit",
            content: isBinary ? data : btoa(data),
            branch: "main",
            committer: { name: "Dashpilot", email: "support@dashpilot.com" },
        }
        if (typeof curfile !== 'undefined') {
            opts.sha = curfile.sha;
        }

        return fetchWithAuth("/.netlify/git/github/contents/" + mypath, {
            body: JSON.stringify(opts),
            method: 'PUT'
        });
    });
}

async function fetchWithAuth(url, options = {}) {
    let user = netlifyIdentity.currentUser();
    let token = user.token.access_token;
    options.headers = {
        ...options.headers,
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    };
    options.withCredentials = true;
    options.credentials = 'include';

    return fetch(url, options).then(resp => resp.json()).then(data => {
        if (data.code === 400) {
            return netlifyIdentity.refresh().then(function(token) {
                return fetchWithAuth(url, options);
            });
        } else {
            return data;
        }
    }).catch(error => {
        console.error(error);
        throw error;
    });
}
