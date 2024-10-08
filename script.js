const API_URL = 'https://spark-api.xf-yun.com/v1.1/chat';
const API_KEY = '8b1d9bb9760993391da0c0c52ae9e3ee';
const API_SECRET = 'MDQ5MWY0NWM1Mzk2NDhkMWE5N2UzMjc1'; // 替换为实际的 API_SECRET

function getWebsocketUrl() {
    const host = "spark-api.xf-yun.com";
    const path = "/v1.1/chat";
    const date = new Date().toGMTString();
    const algorithm = "hmac-sha256";
    const headers = "host date request-line";
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, API_SECRET);
    const signature = CryptoJS.enc.Base64.stringify(signatureSha);
    const authorizationOrigin = `api_key="${API_KEY}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
    const authorization = btoa(authorizationOrigin);

    return `wss://${host}${path}?authorization=${authorization}&date=${date}&host=${host}`;
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    
    if (message === '') return;

    addMessage(message, 'user-message');
    input.value = '';

    try {
        const ws = new WebSocket(getWebsocketUrl());
        let aiReply = '';
        
        ws.onopen = () => {
            const params = {
                header: {
                    app_id: "5cb3a0ec", // 替换为实际的 app_id
                    uid: "1234"
                },
                parameter: {
                    chat: {
                        domain: "general",
                        random_threshold: 0.5,
                        max_tokens: 2048,
                        auditing: "default"
                    }
                },
                payload: {
                    message: {
                        text: [{ role: "user", content: message }]
                    }
                }
            };
            ws.send(JSON.stringify(params));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.header.code !== 0) {
                console.error('Error:', data.header.code, data.header.message);
                addMessage('抱歉，发生了一个错误。请稍后再试。', 'ai-message', 'logo.jpg');
            } else if (data.payload.choices.text) {
                aiReply += data.payload.choices.text[0].content;
                updateAIMessage(aiReply);
            }
            if (data.header.status === 2) {
                ws.close();
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            addMessage('抱歉，发生了一个错误。请稍后再试。', 'ai-message', 'logo.jpg');
        };

    } catch (error) {
        console.error('Error:', error);
        addMessage('抱歉，发生了一个错误。请稍后再试。', 'ai-message', 'logo.jpg');
    }
}

function addMessage(text, className, avatarUrl = null) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', className);

    if (avatarUrl) {
        const avatarElement = document.createElement('img');
        avatarElement.src = avatarUrl;
        avatarElement.alt = 'AI Avatar';
        avatarElement.classList.add('avatar');
        messageElement.appendChild(avatarElement);
    }

    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    contentElement.textContent = text;
    messageElement.appendChild(contentElement);

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateAIMessage(text) {
    const chatMessages = document.getElementById('chat-messages');
    let aiMessage = chatMessages.querySelector('.ai-message:last-child');
    
    if (!aiMessage) {
        aiMessage = document.createElement('div');
        aiMessage.classList.add('message', 'ai-message');
        const avatarElement = document.createElement('img');
        avatarElement.src = 'logo.jpg';
        avatarElement.alt = 'AI Avatar';
        avatarElement.classList.add('avatar');
        aiMessage.appendChild(avatarElement);
        
        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        aiMessage.appendChild(contentElement);
        
        chatMessages.appendChild(aiMessage);
    }
    
    const contentElement = aiMessage.querySelector('.message-content');
    contentElement.textContent = text;
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

document.getElementById('user-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});