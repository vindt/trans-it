const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';
const DEFAULT_MODEL = 'gemini-2.0-flash';

export async function translateTextStreaming(text, apiKey, aiModel) {
  const prompt = `Detect language and translate the following text to Vietnamese. Pay close attention to accuracy, technical terminology within the field of Information Technology, and maintain the original formatting as precisely as possible. Do not add any introductory or concluding phrases. Only output the translated Vietnamese text. The text to translate is: "${text}"`;
  return await makeHTTPRequestWithPrompt(prompt, apiKey, aiModel);
}

export async function correctTextStreaming(text, apiKey, aiModel) {
  const prompt = `Correct grammar and improve, just simple in daily communication (native speaker), majoring in IT. Do not add any introductory or concluding phrases, just return  options. Only output may have multiple sentences. The text to correct is: "${text}"`;
  return await makeHTTPRequestWithPrompt(prompt, apiKey, aiModel);
}


export function initCredentials(callback) {
  chrome.storage.sync.get(['apiKey', 'aiModel'], (result) => {
    if (!result.apiKey) {
      alert('Please provide an API key in the extension options.');
      return;
    }
    const aiModel = result.aiModel || DEFAULT_MODEL;
    if (!result.aiModel) {
      chrome.storage.sync.set({ aiModel }, () => {
        callback({ apiKey: result.apiKey, aiModel });
      });
    } else {
      callback({ apiKey: result.apiKey, aiModel });
    }
  });
}


async function makeHTTPRequestWithPrompt(text, apiKey, aiModel) {
  const fullUrl = `${API_URL}${aiModel}:streamGenerateContent?alt=json&key=${apiKey}`;
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: text }] }] }),
  });
  if (response.status !== 200) {
    return `Something went wrong. Please try again later.<br/>Error: ${response.status}`;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let result = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  return JSON.parse(result)
    .map((item) => item.candidates[0].content.parts[0].text)
    .join('');
}
