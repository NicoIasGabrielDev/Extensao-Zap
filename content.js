console.log("Zap Extension Content Script Loaded on WhatsApp Web");

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "send_message") {
        sendMessageOnWhatsApp(request.text)
            .then(() => {
                sendResponse({ success: true });
            })
            .catch((error) => {
                console.error("Failed to send message:", error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keeps the message channel open for async response
    }
});

// Function to send a message in WhatsApp Web
async function sendMessageOnWhatsApp(text) {
    return new Promise((resolve, reject) => {
        try {
            // Locate the message input field
            const textField = document.querySelector("footer div[contenteditable='true']");
            if (!textField) {
                reject(new Error("Message input field not found."));
                return;
            }
            
            // Insert the text into the input field
            textField.focus();
            // Use a Range and Selection to insert text
            const range = document.createRange();
            range.selectNodeContents(textField);
            range.collapse(false);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            textField.innerHTML = text; // Insert the text directly

            // Trigger the input event to simulate user typing
            const inputEvent = new InputEvent("input", { bubbles: true });
            textField.dispatchEvent(inputEvent);

            console.log("Text inserted successfully!");

            // Wait for the send button to change dynamically
            const interval = setInterval(() => {
                const sendButton = document.querySelector("footer button span[data-icon='send']");
                if (sendButton) {
                    // Click the send button
                    sendButton.closest("button").click();
                    console.log("Message successfully sent!");
                    clearInterval(interval); // Stop checking for the button
                    resolve();
                }
            }, 100); // Check every 100ms

            // Timeout if the button doesn't change
            setTimeout(() => {
                clearInterval(interval);
                reject(new Error("Send button did not appear. Please check the WhatsApp Web interface."));
            }, 5000); // Wait up to 5 seconds

        } catch (error) {
            reject(error);
        }
    });
}




