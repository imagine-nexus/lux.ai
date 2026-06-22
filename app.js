import { GoogleGenAI } from "https://esm.run/@google/genai";

const apiKeyInput = document.getElementById('apiKeyInput');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatBox = document.getElementById('chatBox');

let aiChatSession = null;

if (localStorage.getItem('lux_api_key')) {
    const savedKey = localStorage.getItem('lux_api_key');
    apiKeyInput.value = savedKey;
    initChat(savedKey);
}

apiKeyInput.addEventListener('input', (e) => {
    const key = e.target.value.trim();
    if (key) {
        localStorage.setItem('lux_api_key', key);
        initChat(key);
    } else {
        disableChat();
    }
});

function initChat(apiKey) {
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        aiChatSession = ai.chats.create({ model: 'gemini-2.5-flash' });
        
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
        
        if (chatBox.children.length <= 1) {
            appendMessage('LUX AI', 'System active. Query parameters cleared. How can I guide your workflow today?');
        }
    } catch (error) {
        appendMessage('LUX AI', 'Initialization failed. Confirm network stability and key rights.');
    }
}

function disableChat() {
    aiChatSession = null;
    userInput.disabled = true;
    sendBtn.disabled = true;
    localStorage.removeItem('lux_api_key');
}

async function handleSendMessage() {
    const text = userInput.value.trim();
    if (!text || !aiChatSession) return;

    appendMessage('You', text);
    userInput.value = '';

    const typingId = 'typing-' + Date.now();
    appendMessage('LUX AI', 'Thinking...', typingId);

    try {
        const response = await aiChatSession.sendMessage({ message: text });
        const container = document.getElementById(typingId).querySelector('.message-content');
        container.innerHTML = formatAIResponse(response.text);
    } catch (error) {
        const container = document.getElementById(typingId).querySelector('.message-content');
        container.textContent = `Operational Error: ${error.message}`;
    }
    
    chatBox.scrollTop = chatBox.scrollHeight;
}

function appendMessage(sender, text, id = null) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender === 'You' ? 'user-message' : 'bot-message');
    if (id) msgDiv.id = id;
    
    msgDiv.innerHTML = `
        <div class="sender-label">${sender}</div>
        <div class="message-content">${id ? text : formatAIResponse(text)}</div>
    `;
    
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function formatAIResponse(text) {
    let html = text;
    
    // 1. Convert code blocks ``` code ```
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // 2. Convert bold text **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 3. Simple list processing for lines starting with * or -
    const lines = html.split('\n');
    let inList = false;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('* ') || lines[i].trim().startsWith('- ')) {
            let content = lines[i].replace(/^[\s]*[\*-]\s/, '');
            if (!inList) {
                lines[i] = '<ul><li>' + content;
                inList = true;
            } else {
                lines[i] = '<li>' + content;
            }
        } else {
            if (inList) {
                lines[i] = '</ul>' + lines[i];
                inList = false;
            }
        }
    }
    if (inList) lines[lines.length - 1] += '</ul>';
    html = lines.join('\n');

    // 4. Convert line breaks cleanly
    return html.replace(/\n/g, '<br>');
}

sendBtn.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendMessage();
});