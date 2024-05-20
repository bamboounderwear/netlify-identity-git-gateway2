document.addEventListener('DOMContentLoaded', function () {
    const loginButton = document.querySelector('#login');
    const saveDataForm = document.querySelector('#saveDataForm');
    const fileListContainer = document.querySelector('#file-list');

    loginButton.addEventListener('click', function () {
        netlifyIdentity.open();
    });

    netlifyIdentity.on('login', function (user) {
        loginButton.textContent = 'Log Out';
        fetchRepositoryContents();
    });

    saveDataForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const filePath = document.querySelector('#filePath').value;
        const fileContent = document.querySelector('#fileContent').value;
        saveData(filePath, fileContent);
    });

    async function fetchRepositoryContents() {
        try {
            const result = await listRepoContentsRecursive();
            console.log(result);
            fileListContainer.innerHTML = '<h5>Repository Contents</h5>';
            const ul = document.createElement('ul');
            result.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item.path;
                ul.appendChild(li);
            });
            fileListContainer.appendChild(ul);
        } catch (error) {
            console.error('Error fetching repository contents:', error);
        }
    }

    async function saveData(filePath, fileContent) {
        try {
            await saveDataToRepository(filePath, fileContent);
            alert('Data saved successfully!');
        } catch (error) {
            console.error('Error saving data:', error);
            alert('Failed to save data.');
        }
    }
});
