async function listRepoContents(path = '') {
    let user = netlifyIdentity.currentUser()
    let token = user.token.access_token
    var url = "/.netlify/git/github/contents/" + path
    var bearer = 'Bearer ' + token

    return fetch(url, {
            method: 'GET',
            withCredentials: true,
            credentials: 'include',
            headers: {
                'Authorization': bearer,
                'Content-Type': 'application/json'
            }
        }).then(resp => {
            return resp.json()
        }).then(data => {
            if (data.code == 400) {
                return netlifyIdentity.refresh().then(function(token) {
                    return listRepoContents(path)
                })
            } else {
                return data
            }
        })
        .catch(error => {
            return error
        })
}

async function listRepoContentsRecursive(path = '') {
    let contents = await listRepoContents(path)
    let allContents = []

    for (let item of contents) {
        allContents.push(item)
        if (item.type === 'dir') {
            let subContents = await listRepoContentsRecursive(item.path)
            allContents = allContents.concat(subContents)
        }
    }

    return allContents
}

async function getData(mypath = '') {
    let user = netlifyIdentity.currentUser()
    let token = user.token.access_token
    var url = "/.netlify/git/github/contents/" + mypath
    var bearer = 'Bearer ' + token
    
    return fetch(url, {
            method: 'GET',
            withCredentials: true,
            credentials: 'include',
            headers: {
                'Authorization': bearer,
                'Content-Type': 'application/json'
            }
        }).then(resp => {
            return resp.json()
        }).then(data => {
            if (data.code == 400) {
                return netlifyIdentity.refresh().then(function(token) {
                    return getData(mypath)
                })
            } else {
                // base64 decode content
                data.content = atob(data.content)
                return data
            }
        })
        .catch(error => {
            return error
        })
}

async function saveData(mypath, data, isBinary = false) {
    return getData(mypath).then(function(curfile) {
        let user = netlifyIdentity.currentUser()
        let token = user.token.access_token
        let opts = {
            path: mypath,
            message: "initial commit",
            content: isBinary ? data : btoa(data),
            branch: "main",
            committer: { name: "Dashpilot", email: "support@dashpilot.com" },
        }
        if (typeof curfile !== 'undefined') {
            opts.sha = curfile.sha
        }

        var url = "/.netlify/git/github/contents/" + mypath
        var bearer = 'Bearer ' + token
        return fetch(url, {
                body: JSON.stringify(opts),
                method: 'PUT',
                withCredentials: true,
                credentials: 'include',
                headers: {
                    'Authorization': bearer,
                    'Content-Type': 'application/json'
                }
            }).then(resp => {
                return resp.json()
            }).then(data => {
                if (data.code == 400) {
                    return netlifyIdentity.refresh().then(function(token) {
                        return saveData(mypath, data, isBinary)
                    })
                } else {
                    return data
                }
            })
            .catch(error => this.setState({
                message: 'Error: ' + error
            }))
    })
}

javascript
document.querySelector('#uploadImageForm').addEventListener('submit', function(event) {
    event.preventDefault()

    const imageFile = document.querySelector('#imageFile').files[0]
    if (!imageFile) {
        alert('Please select an image file.')
        return
    }

    const reader = new FileReader()
    reader.onload = function(e) {
        const base64Image = e.target.result.split(',')[1] // Remove the base64 header
        const filePath = `images/${imageFile.name}`

        saveData(filePath, base64Image, true).then(function(result) {
            console.log(result)
            alert('Image uploaded successfully!')
        }).catch(function(error) {
            console.error(error)
            alert('Failed to upload image.')
        })
    }
    reader.readAsDataURL(imageFile)
})