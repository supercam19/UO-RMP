function handleMessage(request: object, sender: chrome.runtime.MessageSender, sendResponse: Function) {
    console.log('Background script received message:', request);
    sendResponse({ status: 'received' });
    return true;
}


chrome.runtime.onMessage.addListener(handleMessage)