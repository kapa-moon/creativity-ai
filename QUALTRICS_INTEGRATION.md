# Qualtrics Integration Guide

This guide explains how to integrate your deployed Next.js chat interface with Qualtrics surveys.

## 🎯 Overview

Your chat interface is now ready to collect conversation data and integrate with Qualtrics surveys. This allows you to:

1. Embed your chat interface in Qualtrics questions
2. Collect chat conversation data
3. Pass chat data back to Qualtrics for analysis
4. Create dynamic survey flows based on chat interactions

## 🚀 Deployment URL

Once deployed on Vercel, your chat interface will be available at:
```
https://your-app-name.vercel.app/chat
```

## 📊 Integration Methods

### Method 1: Embedded HTML (Recommended)

Add your chat interface directly into a Qualtrics question using HTML:

```html
<!-- In Qualtrics Question HTML -->
<div style="width: 100%; height: 500px;">
  <iframe 
    src="https://your-app-name.vercel.app/chat" 
    width="100%" 
    height="500px"
    frameborder="0"
    style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
  </iframe>
</div>

<script>
// Listen for chat completion messages
window.addEventListener('message', function(event) {
  if (event.origin !== 'https://your-app-name.vercel.app') return;
  
  if (event.data.type === 'chatCompleted') {
    // Store chat data in Qualtrics embedded data
    Qualtrics.SurveyEngine.setEmbeddedData('chatSessionId', event.data.sessionId);
    Qualtrics.SurveyEngine.setEmbeddedData('chatMessageCount', event.data.messageCount);
    Qualtrics.SurveyEngine.setEmbeddedData('chatSummary', event.data.summary);
  }
});
</script>
```

### Method 2: Direct Link in Survey

Create a question with a direct link to your chat interface:

```
Please use the chat interface below to complete the conversation task:

[Click here to open chat interface](https://your-app-name.vercel.app/chat)

Return to this survey when you've completed the chat.
```

### Method 3: URL Redirect with Parameters

Redirect participants to your chat interface and then back to Qualtrics:

```javascript
// JavaScript in Qualtrics
var chatUrl = 'https://your-app-name.vercel.app/chat?return=' + 
              encodeURIComponent(window.location.href) + 
              '&participantId=' + '${e://Field/ResponseID}';
window.location.href = chatUrl;
```

## 🔄 Data Flow Integration

### Step 1: Collect Chat Data

Your chat interface automatically logs:
- Session ID
- All messages with timestamps
- User interaction patterns
- Session duration
- Conversation summary

### Step 2: Submit Data to API

The chat interface can submit data to your API endpoint:

```javascript
// In your chat interface
const submitChatData = async () => {
  const chatData = chatLogger.current.prepareQualtricData();
  
  await fetch('/api/qualtrics-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: sessionId,
      action: 'submitChatData',
      data: chatData
    })
  });
};
```

### Step 3: Retrieve Data in Qualtrics

Use Qualtrics Web Service to get chat data:

```javascript
// In Qualtrics Survey Flow
Qualtrics.SurveyEngine.addOnload(function() {
  var sessionId = "${e://Field/chatSessionId}";
  
  fetch('https://your-app-name.vercel.app/api/qualtrics-data?sessionId=' + sessionId)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Use chat data in your survey
        Qualtrics.SurveyEngine.setEmbeddedData('chatDuration', data.data.duration);
        Qualtrics.SurveyEngine.setEmbeddedData('chatMessages', data.data.messageCount);
      }
    });
});
```

## 🛠️ Setup Instructions

### 1. Deploy Your App

```bash
# Deploy to Vercel
vercel --prod

# Note your deployment URL
echo "Your chat URL: https://your-app-name.vercel.app/chat"
```

### 2. Configure Qualtrics Survey

1. **Create a new survey** in Qualtrics
2. **Add a new question** (Text/Graphic type)
3. **Click "HTML View"** and paste the embed code
4. **Set up embedded data fields** in Survey Flow:
   - chatSessionId
   - chatMessageCount
   - chatDuration
   - chatSummary

### 3. Test Integration

1. **Preview your survey** in Qualtrics
2. **Complete a chat session** in the embedded interface
3. **Check embedded data** is populated correctly
4. **Verify data export** includes chat metrics

## 📋 Dynamic Survey Integration

### Conditional Logic Based on Chat

```javascript
// Example: Show different questions based on chat length
if ("${e://Field/chatMessageCount}" > 10) {
  // Show detailed follow-up questions
} else {
  // Show basic follow-up questions
}
```

### Piped Text from Chat

```
Based on your conversation where you said "${e://Field/chatSummary}", 
how would you rate your experience?
```

## 🔐 Security Considerations

### CORS Configuration

Add CORS headers to your API:

```typescript
// In your API route
const headers = {
  'Access-Control-Allow-Origin': 'https://qualtrics.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

### Data Privacy

- ✅ Implement data retention policies
- ✅ Anonymize sensitive information
- ✅ Use HTTPS for all communications
- ✅ Comply with GDPR/privacy regulations

## 📊 Data Analysis

### Qualtrics Data Export

Your survey data will include:

```json
{
  "ResponseID": "R_123456789",
  "chatSessionId": "session_1234567890_abc123",
  "chatMessageCount": 15,
  "chatDuration": 240000,
  "chatSummary": "user: Hello | bot: You said: Hello | ...",
  "participant_rating": 5
}
```

### Advanced Analytics

Combine chat data with survey responses:

```r
# R analysis example
chat_data <- survey_data %>%
  filter(!is.na(chatSessionId)) %>%
  mutate(
    chat_length_category = case_when(
      chatMessageCount < 5 ~ "Short",
      chatMessageCount < 15 ~ "Medium",
      TRUE ~ "Long"
    )
  )
```

## 🚨 Troubleshooting

### Common Issues

1. **iframe not loading**
   - Check CORS settings
   - Verify deployment URL
   - Test in incognito mode

2. **Data not passing to Qualtrics**
   - Check embedded data field names
   - Verify JavaScript execution
   - Test postMessage communication

3. **Session data lost**
   - Implement localStorage persistence
   - Add session recovery logic
   - Check browser cookies

### Debug Mode

Enable debug logging in your chat interface:

```javascript
// Add to your chat component
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Chat data:', chatData);
  console.log('Session ID:', sessionId);
}
```

## 📚 Resources

- [Qualtrics API Documentation](https://api.qualtrics.com/)
- [Qualtrics JavaScript API](https://www.qualtrics.com/support/survey-platform/survey-module/question-options/add-javascript/)
- [Embedded Data Guide](https://www.qualtrics.com/support/survey-platform/survey-module/survey-flow/standard-elements/embedded-data/)
- [Web Service Element](https://www.qualtrics.com/support/survey-platform/survey-module/survey-flow/standard-elements/web-service/)

## 🔄 Next Steps

1. **Deploy your app** to Vercel
2. **Create a test survey** in Qualtrics
3. **Embed your chat interface** using the methods above
4. **Test the complete data flow**
5. **Analyze the collected data**

Your chat interface is now ready for seamless Qualtrics integration! 🎉 