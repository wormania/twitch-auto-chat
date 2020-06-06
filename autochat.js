// ==UserScript==
// @name         Auto chat-bot
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.twitch.tv/wormania
// @match        https://www.twitch.tv/*
// @grant        none
// ==/UserScript==

(function() {
  const MESSAGE_LOOKBACK_COUNT = 5;
  const SAME_MESSAGES_NEEDED = 3;
  const MINIMUM_TIME_BETWEEN_CHATS = 5000; //ms

  'use strict';
  console.log("Auto chat-bot loaded");

  let chatWindow;

  function getChatWindow(){
    chatWindow = document.querySelector('.chat-scrollable-area__message-container');
    if(!chatWindow){
      console.log("Couldn't find chatbox");
      setTimeout(() => { getChatWindow() }, 2000);
      return;
    } else {
      console.log("Chatbox loaded");
      createObserver();
    }
  }

  getChatWindow();

  function createObserver(){
    let observer = new MutationObserver(callbackFunction);
    observer.observe(chatWindow, {childList: true});
  }


  function callbackFunction(mutationsList, observer){
    for(let mutation of mutationsList){
      for(let row of mutation.addedNodes){
        setTimeout(() => { logMessage(row); }, 500);
      }
    }
  }

  function logMessage(row){
    if(row.className === "chat-line__status"){
      return;
    }
    let message = row.querySelector('.chat-line__message .message');
    if(message === null){
      return;
    }
    let messageText = parseMessage(message);
    const shouldSendMessage = countMessage(messageText);
    if(shouldSendMessage){
      console.log(messageCount);
      console.log(messageText);
    }
    //sendMessage(messageText);
  }

  function parseMessage(message){
    let fullMessage = "";
    let containsEmote = false;

    for(let fragment of message.children){
      if(fragment.className === "text-fragment"){
        if(fragment.children.length === 1){
          for(let part of fragment.firstChild.childNodes){
            if(part.children){
              //BTTV Emote
              fullMessage += " ";
              fullMessage += part.children[0].alt;
              fullMessage += " ";
              containsEmote = true;
            } else {
              //Text around BTTV emote
              let splits = part.textContent.split('\n');
              for(let i = 0; i < splits.length; i++){
                let replaced = splits[i].trim();
                if(replaced !== ""){
                  fullMessage += " ";
                  fullMessage += replaced;
                  fullMessage += " ";
                }
              }
            }
          }
        }
        if(fragment.children.length === 0){
          //Plain text
          fullMessage += fragment.innerText;
        }
      } else if(fragment.className === "ffz--inline"){
        //FFZ emote or emoji
        fullMessage += fragment.firstChild.alt;
        containsEmote = true;
      }
    }

    fullMessage = fullMessage.replace(/  /g, " "); //Replace double spaces with single

    if(!containsEmote){
      fullMessage = "";
    }
    return fullMessage.trim();
  }

  const messageCount = Array();
  let arraySaturated = false;
  let lastSentMessage = "";

  function countMessage(message){
    messageCount.push(message);
    if(arraySaturated){
      messageCount.shift();
    } else {
      if(messageCount.length === MESSAGE_LOOKBACK_COUNT){
        arraySaturated = true;
      }
    }

    let count = 0;
    if(message === ""){
      return false;
    }

    for(let m of messageCount){
      if(m == message){
        count++;
      }
    }

    return (count >= SAME_MESSAGES_NEEDED);
  }

  function sendMessage(message){
    setChatNativeValue(message);
    //document.querySelector('[data-a-target="chat-send-button"]').click();
  }

  //Taken from: https://stackoverflow.com/questions/42795059/programmatically-fill-reactjs-form
  function setChatNativeValue(value) {
    const elem = document.querySelector('[data-a-target="chat-input"]');
    const valueSetter = Object.getOwnPropertyDescriptor(elem, 'value').set;
    const proto = Object.getPrototypeOf(elem);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  
    if (valueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(elem, value);
    } else {
      valueSetter.call(elem, value);
    }

    elem.dispatchEvent(new Event('input', { bubbles: true }));
  }
})();

// Test cases:
// a hachuDisgust b
// a monkaS b
// hachuDisgust a monkaS b hachuDisgust
// hachuDisgust monkaS hachuDisgust
// monkaS hachuDisgust monkaS