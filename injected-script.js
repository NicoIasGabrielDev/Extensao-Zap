// injected-script.js atualizado

// Sobrescrever getUserMedia para retornar o Fake MediaStream
navigator.mediaDevices.getUserMedia = async function (constraints) {
    if (constraints.audio && window.fakeMediaStream) {
        console.log("Interceptando MediaStream e retornando falso.");
        return window.fakeMediaStream;
    }
    console.error("Fake MediaStream não está configurado.");
    return Promise.reject("Fake MediaStream não está configurado.");
};

// Garantir que o Fake MediaStream esteja configurado ao carregar
if (!window.fakeMediaStream) {
    console.error("Fake MediaStream não foi inicializado. Verifique o fluxo de criação no content.js.");
}

