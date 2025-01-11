// Inject content.js into WhatsApp Web if not already loaded
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0 || !tabs[0].url.includes("web.whatsapp.com")) {
        alert("Please open WhatsApp Web before using this feature.");
        return;
    }

    chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ["content.js"]
    }, () => {
        console.log("Content script manually injected.");
    });
});

// Save a message to the backend
document.getElementById("saveMessage").addEventListener("click", async () => {
    const messageInput = document.getElementById("messageInput").value;
    if (!messageInput) {
        alert("Please enter a message!");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: messageInput, audioUrl: "" }),
        });

        if (!response.ok) {
            throw new Error("Failed to save message. Please try again.");
        }

        const result = await response.json();
        alert("Message saved successfully!");
        document.getElementById("messageInput").value = "";

    } catch (error) {
        console.error("Error saving message:", error);
        alert("An error occurred while saving the message.");
    }
});

// Load messages from the backend
document.getElementById("loadMessages").addEventListener("click", async () => {
    try {
        const response = await fetch("http://localhost:3000/messages");
        if (!response.ok) {
            throw new Error("Failed to load messages.");
        }

        const messages = await response.json();
        const messageList = document.getElementById("messageList");
        messageList.innerHTML = ""; // Clear the existing list

        messages.forEach((msg) => {
            const li = document.createElement("li");
            li.textContent = msg.text;

            // Button to send message directly in WhatsApp Web
            const sendButton = document.createElement("button");
            sendButton.textContent = "Send";
            sendButton.addEventListener("click", () => {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs.length === 0 || !tabs[0].url.includes("web.whatsapp.com")) {
                        alert("Please open WhatsApp Web before using this feature.");
                        return;
                    }
                
                    chrome.tabs.sendMessage(tabs[0].id, { action: "send_message", text: msg.text }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error("Error:", chrome.runtime.lastError.message);
                            alert("Failed to send message. Ensure WhatsApp Web is open.");
                        } else if (response && response.success) {
                            alert("Message sent!");
                        } else {
                            alert("Failed to send message. Check the console for details.");
                        }
                    });
                });
            });

            li.appendChild(sendButton);
            messageList.appendChild(li);
        });

    } catch (error) {
        console.error("Error loading messages:", error);
        alert("An error occurred while loading messages.");
    }
});

// Handle audio upload
document.getElementById("audioUpload").addEventListener("change", async (event) => {
    const file = event.target.files[0];

    if (!file) {
        alert("Please select an audio file!");
        return;
    }

    try {
        const formData = new FormData();
        formData.append("audio", file);

        const response = await fetch("http://localhost:3000/audios", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error("Audio upload failed.");
        }

        alert("Audio uploaded successfully!");

    } catch (error) {
        console.error("Error uploading audio:", error);
        alert("An error occurred while uploading the audio.");
    }
});
