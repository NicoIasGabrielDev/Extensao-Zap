// content.js
console.log("Zap Extension Content Script Loaded on WhatsApp Web");

function createFloatingUI() {
    if (document.getElementById("zap-extension-ui")) return;

    // Criar o contêiner principal
    const container = document.createElement("div");
    container.id = "zap-extension-ui";
    container.style.position = "fixed";
    container.style.bottom = "20px";
    container.style.right = "20px";
    container.style.width = "350px";
    container.style.padding = "15px";
    container.style.backgroundColor = "#ffffff";
    container.style.border = "1px solid #ccc";
    container.style.borderRadius = "8px";
    container.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
    container.style.zIndex = "10000";
    container.style.fontFamily = "Arial, sans-serif";

    const title = document.createElement("h4");
    title.innerText = "Zap Extension";
    title.style.margin = "0 0 10px 0";
    title.style.fontSize = "16px";
    title.style.color = "#333";
    container.appendChild(title);

    // Campo de entrada de texto
    const input = document.createElement("textarea");
    input.placeholder = "Digite sua mensagem...";
    input.style.width = "100%";
    input.style.height = "60px";
    input.style.marginBottom = "10px";
    input.style.padding = "10px";
    input.style.border = "1px solid #ccc";
    input.style.borderRadius = "5px";
    container.appendChild(input);

    // Botão para salvar a mensagem no backend
    const saveMessageButton = document.createElement("button");
    saveMessageButton.innerText = "Salvar Mensagem";
    saveMessageButton.style.width = "100%";
    saveMessageButton.style.marginBottom = "10px";
    saveMessageButton.style.padding = "10px";
    saveMessageButton.style.border = "none";
    saveMessageButton.style.backgroundColor = "#007bff";
    saveMessageButton.style.color = "#fff";
    saveMessageButton.style.borderRadius = "5px";
    saveMessageButton.style.cursor = "pointer";

    saveMessageButton.addEventListener("click", async () => {
        const message = input.value.trim();
        if (!message) {
            alert("Digite uma mensagem antes de salvar.");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: message, audioUrl: "" }),
            });

            if (!response.ok) throw new Error("Falha ao salvar a mensagem.");
            alert("Mensagem salva com sucesso!");
            input.value = ""; // Limpar o campo
        } catch (error) {
            console.error("Erro ao salvar mensagem:", error);
            alert("Erro ao salvar mensagem. Verifique o console.");
        }
    });

    container.appendChild(saveMessageButton);

    // Botão para carregar mensagens salvas
    const loadMessagesButton = document.createElement("button");
    loadMessagesButton.innerText = "Carregar Mensagens Salvas";
    loadMessagesButton.style.width = "100%";
    loadMessagesButton.style.marginBottom = "10px";
    loadMessagesButton.style.padding = "10px";
    loadMessagesButton.style.border = "none";
    loadMessagesButton.style.backgroundColor = "#007bff";
    loadMessagesButton.style.color = "#fff";
    loadMessagesButton.style.borderRadius = "5px";
    loadMessagesButton.style.cursor = "pointer";

    const messageList = document.createElement("ul");
    messageList.id = "message-list";
    messageList.style.listStyle = "none";
    messageList.style.padding = "0";
    messageList.style.margin = "10px 0";

    loadMessagesButton.addEventListener("click", async () => {
        try {
            const response = await fetch("http://localhost:3000/messages");
            if (!response.ok) throw new Error("Erro ao carregar mensagens.");

            const messages = await response.json();
            messageList.innerHTML = ""; // Limpar a lista existente

            messages.forEach((msg) => {
                const listItem = document.createElement("li");
                listItem.innerText = msg.text;
                listItem.style.padding = "5px 0";

                // Botão para enviar a mensagem
                const sendButton = document.createElement("button");
                sendButton.innerText = "Enviar";
                sendButton.style.marginLeft = "10px";
                sendButton.style.padding = "5px";
                sendButton.style.border = "none";
                sendButton.style.backgroundColor = "#25d366";
                sendButton.style.color = "#fff";
                sendButton.style.borderRadius = "5px";
                sendButton.style.cursor = "pointer";

                sendButton.addEventListener("click", () => {
                    sendMessageOnWhatsApp(msg.text);
                });

                listItem.appendChild(sendButton);
                messageList.appendChild(listItem);
            });
        } catch (error) {
            console.error("Erro ao carregar mensagens:", error);
            alert("Erro ao carregar mensagens. Verifique o console.");
        }
    });

    container.appendChild(loadMessagesButton);
    container.appendChild(messageList);

    // Adicionar a interface ao body
    document.body.appendChild(container);
}

// Função para enviar a mensagem no WhatsApp Web
async function sendMessageOnWhatsApp(text) {
    return new Promise((resolve, reject) => {
        try {
            const textField = document.querySelector("footer div[contenteditable='true']");
            if (!textField) {
                alert("Não foi possível encontrar o campo de mensagem.");
                reject(new Error("Campo de mensagem não encontrado."));
                return;
            }

            textField.focus();
            document.execCommand("selectAll", false, null);
            document.execCommand("delete", false, null);
            document.execCommand("insertText", false, text);

            const interval = setInterval(() => {
                const sendButton = document.querySelector("footer button span[data-icon='send']");
                if (sendButton) {
                    sendButton.closest("button").click();
                    console.log("Mensagem enviada com sucesso:", text);
                    clearInterval(interval);
                    resolve();
                }
            }, 100);

            setTimeout(() => {
                clearInterval(interval);
                reject(new Error("Botão de envio não apareceu."));
            }, 5000);
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
            reject(error);
        }
    });
}

// Garantir que a interface flutuante esteja sempre carregada
createFloatingUI();
