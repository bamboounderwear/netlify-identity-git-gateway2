async function listRepoContents(path = '') {
    const user = netlifyIdentity.currentUser();
    const token = user.token.access_token;
    const url = `/.netlify/git/github/contents/${path}`;
    const bearer = `Bearer ${token}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            withCredentials: true,
            credentials: 'include',
            headers: {
                'Authorization': bearer,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (data.code === 400) {
            await netlifyIdentity.refresh();
            return listRepoContents(path);
        }
        return data;
    } catch (error) {
        console.error('Error fetching repository contents:', error);
        throw error;
    }
}

async function listRepoContentsRecursive(path = '') {
    const contents = await listRepoContents(path);
    let allContents = [];
    for (const item of contents) {
        allContents.push(item);
        if (item.type === 'dir') {
            const subContents = await listRepoContentsRecursive(item.path);
            allContents = allContents.concat(subContents);
        }
    }
    return allContents;
}

async function getData(path = '') {
    const user = netlifyIdentity.currentUser();
    const token = user.token.access_token;
    const url = `/.netlify/git/github/contents/${path}`;
    const bearer = `Bearer ${token}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            withCredentials: true,
            credentials: 'include',
            headers: {
                'Authorization': bearer,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (data.code === 400) {
            await netlifyIdentity.refresh();
            return getData(path);
        }
        data.content = atob(data.content);
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

async function saveDataToRepository(path, data) {
    const currentData = await getData(path);
    const user = netlifyIdentity.currentUser();
    const token = user.token.access_token;
    const url = `/.netlify/git/github/contents/${path}`;
    const bearer = `Bearer ${token}`;
    const contentData = {
        path,
        message: 'initial commit',
        content: btoa(data),
        branch: 'main',
        committer: { name: 'Dashpilot', email: 'support@dashpilot.com' }
    };
    if (currentData) {
        contentData.sha = currentData.sha;
    }

    try {
        const response = await fetch(url, {
            method: 'PUT',
            withCredentials: true,
            credentials: 'include',
            headers: {
                'Authorization': bearer,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contentData)
        });
        const result = await response.json();
        if (result.code === 400) {
            await netlifyIdentity.refresh();
            return saveDataToRepository(path, data);
        }
        return result;
    } catch (error) {
        console.error('Error saving data:', error);
        throw error;
    }
}
