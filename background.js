// background.js atualizado

// Listener para quando a extensão é instalada
chrome.runtime.onInstalled.addListener(() => {
    console.log("Zap Extension instalada e pronta para uso no WhatsApp Web!");
});

// Listener para mensagens enviadas a partir de content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "injectScript" && message.file) {
        // Injetar script especificado na aba ativa
        chrome.scripting.executeScript(
            {
                target: { tabId: sender.tab.id },
                files: [message.file],
            },
            () => {
                console.log(`${message.file} injetado na aba ${sender.tab.id}`);
                sendResponse({ success: true });
            }
        );
        return true; // Indica que sendResponse será chamado de forma assíncrona
    }
});