// content.js atualizado

// Preparar o Fake MediaStream global
// Atualizar o método createFakeMediaStream para garantir a conexão correta
async function createFakeMediaStream(audioUrl) {
    try {
        const response = await fetch(audioUrl);
        if (!response.ok) throw new Error("Erro ao baixar o áudio.");
        const blob = await response.blob();

        const audioContext = new AudioContext();
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;

        // Criar o destino do MediaStream
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination); // Conectar ao destino do MediaStream
        source.loop = false;

        // Configurar o Fake MediaStream global
        window.fakeMediaStream = destination.stream;
        console.log("Fake MediaStream criado com sucesso:", window.fakeMediaStream);

        return { source, audioBuffer, destination };
    } catch (error) {
        console.error("Erro ao criar Fake MediaStream:", error);
    }
}

// Sobrescrever enumerateDevices para forçar o uso de dispositivos falsos
navigator.mediaDevices.enumerateDevices = async function () {
    console.log("Forçando detecção de dispositivos falsos.");
    return [
        {
            kind: "audioinput",
            label: "Fake Microphone",
            deviceId: "fake-device-id",
        },
    ];
};

function createFloatingUI() {
    if (document.getElementById("zap-extension-ui")) return;

    // Criar o contêiner principal
    const container = document.createElement("div");
    container.id = "zap-extension-ui";
    container.style.position = "fixed";
    container.style.bottom = "300px";
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

    // Input para upload de áudio
    const audioUpload = document.createElement("input");
    audioUpload.type = "file";
    audioUpload.accept = "audio/*";
    audioUpload.style.marginBottom = "10px";
    audioUpload.style.width = "100%";

    audioUpload.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (!file) {
            alert("Selecione um arquivo de áudio!");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("audio", file);

            const response = await fetch("http://localhost:3000/audios", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Erro ao fazer upload do áudio.");

            alert("Áudio salvo com sucesso!");
            loadAudios(); // Atualizar lista de áudios
        } catch (error) {
            console.error("Erro ao salvar áudio:", error);
            alert("Erro ao salvar áudio. Verifique o console.");
        }
    });

    container.appendChild(audioUpload);
    // Botão para carregar áudios salvos
    const loadAudiosButton = document.createElement("button");
    loadAudiosButton.innerText = "Carregar Áudios Salvos";
    loadAudiosButton.style.width = "100%";
    loadAudiosButton.style.marginBottom = "10px";
    loadAudiosButton.style.padding = "10px";
    loadAudiosButton.style.border = "none";
    loadAudiosButton.style.backgroundColor = "#007bff";
    loadAudiosButton.style.color = "#fff";
    loadAudiosButton.style.borderRadius = "5px";
    loadAudiosButton.style.cursor = "pointer";

    loadAudiosButton.addEventListener("click", loadAudios);
    container.appendChild(loadAudiosButton);

    // Lista de áudios salvos
    const audioList = document.createElement("ul");
    audioList.id = "audio-list";
    audioList.style.listStyle = "none";
    audioList.style.padding = "0";
    audioList.style.margin = "10px 0";

    container.appendChild(audioList);

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

// Função para carregar áudios do backend
async function loadAudios() {
    try {
        const response = await fetch("http://localhost:3000/audios");
        if (!response.ok) throw new Error("Erro ao carregar áudios.");

        const audios = await response.json();
        const audioList = document.getElementById("audio-list");
        audioList.innerHTML = ""; // Limpar lista existente

        audios.forEach((audio) => {
            const listItem = document.createElement("li");
            listItem.style.marginBottom = "10px";

            // Player de áudio
            const audioPlayer = document.createElement("audio");
            audioPlayer.controls = true;

            // Carregar o arquivo como Blob
            fetch(audio.url)
                .then(response => {
                    if (!response.ok) throw new Error("Erro ao carregar o áudio.");
                    return response.blob();
                })
                .then(blob => {
                    const blobUrl = URL.createObjectURL(blob);
                    audioPlayer.src = blobUrl;
                })
                .catch(error => {
                    console.error("Erro ao carregar o áudio:", error);
                    alert("Erro ao carregar o áudio.");
                });

            // Botão para enviar áudio
            const sendAudioButton = document.createElement("button");
            sendAudioButton.innerText = "Enviar Áudio";
            sendAudioButton.style.padding = "5px";
            sendAudioButton.style.border = "none";
            sendAudioButton.style.backgroundColor = "#25d366";
            sendAudioButton.style.color = "#fff";
            sendAudioButton.style.borderRadius = "5px";
            sendAudioButton.style.cursor = "pointer";

            sendAudioButton.addEventListener("click", () => {
                sendAudioAsRecorded(audio.url);
            });

            listItem.appendChild(audioPlayer);
            listItem.appendChild(sendAudioButton);
            audioList.appendChild(listItem);
        });
    } catch (error) {
        console.error("Erro ao carregar áudios:", error);
        alert("Erro ao carregar áudios. Verifique o console.");
    }
}


// Sobrescrever getUserMedia para retornar o Fake MediaStream
navigator.mediaDevices.getUserMedia = async function (constraints) {
    if (constraints.audio) {
        if (!window.fakeMediaStream) {
            console.error("Fake MediaStream não configurado.");
            return Promise.reject("Fake MediaStream não configurado.");
        }
        console.log("Retornando Fake MediaStream para áudio.");
        return window.fakeMediaStream;
    }
    return Promise.reject("Apenas áudio é suportado.");
};

// Função para enviar áudio como se fosse gravado na hora
async function sendAudioAsRecorded(audioUrl) {
    try {
        // Criar e configurar o Fake MediaStream
        const { source, audioBuffer, destination } = await createFakeMediaStream(audioUrl);

        // Sobrescrever o getUserMedia para forçar o uso do Fake MediaStream
        navigator.mediaDevices.getUserMedia = async (constraints) => {
            if (constraints.audio) {
                console.log("Forçando uso do Fake MediaStream.");
                return destination.stream; // Retornar o stream do destino
            }
            return Promise.reject("Apenas áudio é suportado.");
        };

        console.log("Fake MediaStream configurado e pronto para uso.");

        // Localizar o botão de gravação
        const recordButton = await waitForElement('button[data-tab="11"][aria-label="Mensagem de voz"]', 5000);
        if (!recordButton) throw new Error("Botão de gravação não encontrado.");

        // Simular o início da gravação
        console.log("Simulando início de gravação...");
        recordButton.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        console.log("Gravação simulada iniciada.");

        // Reproduzir o áudio no Fake MediaStream
        source.start(0);
        console.log("Reproduzindo áudio do upload no Fake MediaStream. Duração:", audioBuffer.duration);

        // Finalizar gravação após a duração do áudio
        setTimeout(() => {
            console.log("Finalizando gravação simulada...");
            recordButton.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
            console.log("Gravação simulada finalizada.");
        }, audioBuffer.duration * 1000 + 500); // 500ms de buffer adicional

        // Enviar o áudio ao final da gravação
        setTimeout(async () => {
            console.log("Localizando botão de envio...");
            const sendButton = await waitForElement("button[aria-label='Enviar']", 10000);
            if (!sendButton) {
                console.error("Botão de envio não encontrado.");
                return;
            }

            // Simular clique no botão de envio
            sendButton.click();
            console.log("Áudio enviado com sucesso!");
        }, audioBuffer.duration * 1000 + 1000); // Tempo adicional para o envio
    } catch (error) {
        console.error("Erro ao enviar áudio como gravado:", error);
    }
}




// Função para monitorar alterações no DOM e encontrar elementos
/**
 * Waits for a DOM element to appear based on the selector.
 * @param {string} selector - The CSS selector of the element to wait for.
 * @param {number} timeout - The maximum time to wait for the element (in milliseconds).
 * @returns {Promise<Element|null>} - Resolves with the element if found, or null if not.
 */
async function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        // Check if the element already exists
        const element = document.querySelector(selector);
        if (element) {
            console.log(`[waitForElement] Element found immediately: ${selector}`);
            return resolve(element);
        }

        // Set up a MutationObserver to detect changes in the DOM
        const observer = new MutationObserver((mutations, observer) => {
            const elapsed = Date.now() - startTime;
            const targetElement = document.querySelector(selector);

            if (targetElement) {
                console.log(`[waitForElement] Element found after ${elapsed}ms: ${selector}`);
                observer.disconnect();
                return resolve(targetElement);
            }

            if (elapsed > timeout) {
                console.warn(`[waitForElement] Timeout reached (${timeout}ms) for: ${selector}`);
                observer.disconnect();
                return resolve(null);
            }
        });

        // Observe the body for changes in its subtree
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        // Fallback timeout
        setTimeout(() => {
            console.warn(`[waitForElement] Timeout triggered without finding the element: ${selector}`);
            observer.disconnect();
            resolve(null);
        }, timeout);
    });
}





// Injetar script para sobrescrever o Web Worker
function injectScript(fn) {
    const script = document.createElement("script");
    script.textContent = `(${fn.toString()})();`;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
}

// Garantir que a interface flutuante esteja sempre carregada
createFloatingUI();