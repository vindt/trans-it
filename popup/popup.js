document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKey');
    const aiModelSelect = document.getElementById('aiModel');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const changeBtn = document.getElementById('changeBtn');

    chrome.storage.sync.get(['apiKey', 'aiModel'], (result) => {
        if (result.apiKey) {
            apiKey = result.apiKey;
            apiKeyInput.value = result.apiKey.slice(0, -10) + '**********';
            apiKeyInput.disabled = true;
            aiModelSelect.disabled = true;
            saveBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
            changeBtn.style.display = 'block';
        }
        if (result.aiModel) {
            aiModelSelect.value = result.aiModel;
        }
    });

    saveBtn.addEventListener('click', function() {
        const apiKey = apiKeyInput.value;
        const aiModel = aiModelSelect.value;
        if (apiKey && aiModel) {
            chrome.storage.sync.set({ apiKey: apiKey, aiModel: aiModel }, () => {
                apiKeyInput.disabled = true;
                aiModelSelect.disabled = true;
                saveBtn.style.display = 'none';
                changeBtn.style.display = 'block';
                cancelBtn.style.display = 'none';
                alert('API Key saved successfully!');
                apiKeyInput.value = apiKey.slice(0, -10) + '**********';
            });
        }
    });

    changeBtn.addEventListener('click', function() {
        apiKeyInput.disabled = false;
        chrome.storage.sync.get('apiKey', (data) => {
            if (data.apiKey) {
                apiKeyInput.value = data.apiKey;
            } else {
                apiKeyInput.value = '';
            }
        });
        aiModelSelect.disabled = false;
        saveBtn.style.display = 'block';
        cancelBtn.style.display = 'block';
        changeBtn.style.display = 'none';
    });

    cancelBtn.addEventListener('click', function() {
        apiKeyInput.disabled = true;
        aiModelSelect.disabled = true;
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
        changeBtn.style.display = 'block';
        chrome.storage.sync.get('apiKey', (data) => {
            if (data.apiKey) {
                apiKeyInput.value = data.apiKey.slice(0, -10) + '**********';
            } else {
                apiKeyInput.value = '';
            }
        });
    });

    apiKeyInput.addEventListener('input', () => {
        saveBtn.disabled = !apiKeyInput.value.trim();
    });
});
