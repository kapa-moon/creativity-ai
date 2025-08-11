Qualtrics.SurveyEngine.addOnload(function()
{
    // Initialize variables to track paste events and chat data
    window.pasteEvents = [];
    window.chatData = null;
    window.chatDataReceived = false;
    window.finalDataStored = false;
    
    console.log('🚀 Qualtrics script loaded and initialized');
    
    // Listen for messages from the chat iframe
    window.addEventListener('message', function(event) {
        console.log('📨 Message received from iframe:', event.data);
        
        if (event.data.type === 'chatDataSubmitted') {
            // Store the chat data
            window.chatData = event.data.data;
            window.chatDataReceived = true;
            console.log('💾 Chat data captured:', window.chatData);
            
            // Store chat data immediately when received
            storeChatData();
            
        } else if (event.data.type === 'chatUpdate') {
            console.log('🔄 Chat update received:', event.data);
        }
    });
    
    // Function to store chat data specifically
    function storeChatData() {
        if (!window.chatData) {
            console.log('⚠️ No chat data to store');
            return;
        }
        
        try {
            console.log('💾 Storing chat data in embedded fields...');
            
            Qualtrics.SurveyEngine.setEmbeddedData('chatSessionId', window.chatData.sessionId || 'N/A');
            Qualtrics.SurveyEngine.setEmbeddedData('chatParticipantId', window.chatData.participantId || 'N/A');
            Qualtrics.SurveyEngine.setEmbeddedData('chatMessageCount', window.chatData.messageCount || 0);
            Qualtrics.SurveyEngine.setEmbeddedData('chatUserMessageCount', window.chatData.userMessageCount || 0);
            Qualtrics.SurveyEngine.setEmbeddedData('chatAiMessageCount', window.chatData.aiMessageCount || 0);
            Qualtrics.SurveyEngine.setEmbeddedData('chatSessionDurationMs', window.chatData.sessionDurationMs || 0);
            Qualtrics.SurveyEngine.setEmbeddedData('chatStartTime', window.chatData.startTime || 'N/A');
            Qualtrics.SurveyEngine.setEmbeddedData('chatEndTime', window.chatData.endTime || 'N/A');
            
            // Store conversation log as properly formatted JSON
            if (window.chatData.conversationLog) {
                var conversationJson = JSON.stringify(window.chatData.conversationLog, null, 2);
                Qualtrics.SurveyEngine.setEmbeddedData('chatConversationLog', conversationJson);
                console.log('💬 Conversation log stored (length: ' + conversationJson.length + ')');
            }
            
            console.log('✅ Chat data stored successfully');
            
        } catch (error) {
            console.error('❌ Error storing chat data:', error);
        }
    }
    
    // Function to store paste data specifically
    function storePasteData() {
        try {
            console.log('📋 Storing paste data in embedded fields...');
            
            // Store paste events
            var pasteEventsJson = JSON.stringify(window.pasteEvents || [], null, 2);
            Qualtrics.SurveyEngine.setEmbeddedData('pasteEvents', pasteEventsJson);
            Qualtrics.SurveyEngine.setEmbeddedData('totalPasteEvents', (window.pasteEvents || []).length);
            
            // Create summary of paste activity
            var pasteSummary = {};
            (window.pasteEvents || []).forEach(function(event) {
                if (!pasteSummary[event.fieldName]) {
                    pasteSummary[event.fieldName] = 0;
                }
                pasteSummary[event.fieldName]++;
            });
            
            var pasteSummaryJson = JSON.stringify(pasteSummary, null, 2);
            Qualtrics.SurveyEngine.setEmbeddedData('fieldInteractions', pasteSummaryJson);
            
            console.log('📋 Paste data stored:', {
                pasteEventsCount: (window.pasteEvents || []).length,
                pasteSummary: pasteSummary
            });
            
            console.log('✅ Paste data stored successfully');
            
        } catch (error) {
            console.error('❌ Error storing paste data:', error);
        }
    }
    
    // Function to store all final data (called on page unload/submit)
    function storeFinalData() {
        if (window.finalDataStored) {
            console.log('⚠️ Final data already stored, skipping');
            return;
        }
        
        console.log('🎯 Storing final data...');
        
        // Store chat data if we have it, otherwise store placeholder
        if (window.chatDataReceived && window.chatData) {
            storeChatData();
        } else {
            console.log('⚠️ No chat data received, storing placeholder values');
            Qualtrics.SurveyEngine.setEmbeddedData('chatSessionId', 'NO_CHAT_DATA');
            Qualtrics.SurveyEngine.setEmbeddedData('chatParticipantId', 'NO_CHAT_DATA');
            Qualtrics.SurveyEngine.setEmbeddedData('chatMessageCount', 0);
            Qualtrics.SurveyEngine.setEmbeddedData('chatUserMessageCount', 0);
            Qualtrics.SurveyEngine.setEmbeddedData('chatAiMessageCount', 0);
            Qualtrics.SurveyEngine.setEmbeddedData('chatSessionDurationMs', 0);
            Qualtrics.SurveyEngine.setEmbeddedData('chatStartTime', 'NO_CHAT_DATA');
            Qualtrics.SurveyEngine.setEmbeddedData('chatEndTime', 'NO_CHAT_DATA');
            Qualtrics.SurveyEngine.setEmbeddedData('chatConversationLog', 'NO_CHAT_DATA');
        }
        
        // Always store paste data
        storePasteData();
        
        window.finalDataStored = true;
        console.log('✅ Final data storage complete!');
    }
    
    // Make functions globally available
    window.storeChatData = storeChatData;
    window.storePasteData = storePasteData;
    window.storeFinalData = storeFinalData;
    
    console.log('📡 Message listener added');
});

Qualtrics.SurveyEngine.addOnReady(function()
{
    console.log('🎯 Qualtrics page ready');
    
    // Enhanced field detection for Qualtrics Form Field questions
    var questionContainer = this.getQuestionContainer();
    
    // Try multiple selectors to find form fields
    var selectors = [
        'input[type="text"]',
        'textarea', 
        'input.FormField',
        '.FormField input',
        '.FormField textarea',
        '[class*="FormField"] input',
        '[class*="FormField"] textarea',
        'input[class*="QR-QID"]',
        'textarea[class*="QR-QID"]',
        'input[name*="QR~QID"]',
        'textarea[name*="QR~QID"]'
    ];
    
    var allInputs = [];
    selectors.forEach(function(selector) {
        var found = questionContainer.querySelectorAll(selector);
        for (var i = 0; i < found.length; i++) {
            if (allInputs.indexOf(found[i]) === -1) {
                allInputs.push(found[i]);
            }
        }
    });
    
    console.log('🔍 Found', allInputs.length, 'form input fields using selectors:', selectors);
    
    // If no fields found with specific selectors, try a broader search
    if (allInputs.length === 0) {
        allInputs = questionContainer.querySelectorAll('input, textarea');
        console.log('🔄 Fallback search found', allInputs.length, 'input elements');
    }
    
    // Add paste event listeners to all found inputs
    allInputs.forEach(function(input, index) {
        var fieldName = input.name || input.id || input.className || 'field_' + (index + 1);
        
        console.log('🎯 Setting up paste tracking for field:', fieldName, 'Element:', input);
        
        // Track paste events
        input.addEventListener('paste', function(event) {
            console.log('🎯 PASTE DETECTED in field:', fieldName);
            
            try {
                // Get pasted content
                var pastedText = '';
                if (event.clipboardData) {
                    pastedText = event.clipboardData.getData('text/plain') || event.clipboardData.getData('text');
                } else if (window.clipboardData) {
                    pastedText = window.clipboardData.getData('Text');
                }
                
                // Create paste event record
                var pasteEvent = {
                    timestamp: new Date().toISOString(),
                    fieldName: fieldName,
                    fieldIndex: index + 1,
                    content: pastedText,
                    contentLength: pastedText.length,
                    elementInfo: {
                        tagName: input.tagName,
                        type: input.type || 'N/A',
                        className: input.className,
                        id: input.id
                    }
                };
                
                window.pasteEvents.push(pasteEvent);
                
                console.log('📋 Paste event recorded:', pasteEvent);
                
                // Store ONLY paste data immediately (not final data)
                if (window.storePasteData) {
                    window.storePasteData();
                }
                
                // Also capture final content after paste
                setTimeout(function() {
                    pasteEvent.finalContent = input.value;
                    pasteEvent.finalContentLength = input.value.length;
                    console.log('📝 Final content captured for', fieldName, ':', pasteEvent.finalContent.substring(0, 50) + '...');
                    
                    // Update paste data with final content (still not final data)
                    if (window.storePasteData) {
                        window.storePasteData();
                    }
                }, 10);
                
            } catch (error) {
                console.error('❌ Error recording paste event:', error);
            }
        });
    });
    
    console.log('✅ Paste tracking setup complete for', allInputs.length, 'fields');
});

Qualtrics.SurveyEngine.addOnUnload(function()
{
    console.log('🏁 Page unloading - final data storage');
    console.log('📊 Total paste events captured:', window.pasteEvents.length);
    console.log('💾 Chat data available:', !!window.chatData);
    console.log('💾 Chat data received flag:', window.chatDataReceived);
    
    // Force submit chat data if not already submitted
    var iframe = document.getElementById('chatIframe');
    if (iframe && iframe.contentWindow) {
        console.log('🚀 Forcing chat data submission from iframe');
        iframe.contentWindow.postMessage({ type: 'forceSubmitData' }, '*');
        
        // Wait a bit for the message to process
        setTimeout(function() {
            if (window.storeFinalData) {
                window.storeFinalData();
            }
        }, 500);
    } else {
        // No iframe, store immediately
        if (window.storeFinalData) {
            window.storeFinalData();
        }
    }
});

// Additional safeguard: Store data when participant clicks "Next" button
Qualtrics.SurveyEngine.addOnPageSubmit(function(type) {
    console.log('📤 Page submit detected, type:', type);
    
    // Force submit chat data if not already submitted
    var iframe = document.getElementById('chatIframe');
    if (iframe && iframe.contentWindow) {
        console.log('🚀 Forcing chat data submission from iframe before page submit');
        iframe.contentWindow.postMessage({ type: 'forceSubmitData' }, '*');
    }
    
    // Store final data
    if (window.storeFinalData) {
        window.storeFinalData();
    }
});