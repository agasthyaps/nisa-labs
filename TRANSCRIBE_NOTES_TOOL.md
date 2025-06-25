# Transcribe Image Tool

## Overview

The Transcribe Image tool is an AI-powered feature that can process images and provide either transcriptions of handwritten text or detailed descriptions of other content. This tool is automatically activated when images are uploaded to the chat interface.

## How It Works

1. **Image Upload**: Users can upload images through the chat interface
2. **Automatic Processing**: Images are automatically processed when uploaded
3. **Content Analysis**: The AI analyzes the image content:
   - **Handwritten text**: Transcribes the text exactly as it appears
   - **Other content**: Provides detailed descriptions of photos, diagrams, etc.
4. **Content Integration**: The processed content is included in the message for the AI model to reference
5. **Response**: The AI model can use this content to provide informed responses

## Features

- **Handwritten Text Transcription**: Accurately transcribes handwritten notes, student work, lesson plans, etc.
- **Image Description**: Provides detailed descriptions of photos, diagrams, charts, and other visual content
- **Automatic Processing**: No manual tool calls needed - processing happens automatically
- **Chat History Integration**: Processed content becomes part of the conversation history

## Use Cases

- **Observation Notes**: Transcribe handwritten observation notes from classroom visits
- **Student Work**: Process images of student work samples for analysis
- **Lesson Materials**: Describe or transcribe lesson plans, anchor charts, etc.
- **General Images**: Get detailed descriptions of any visual content shared

## Technical Implementation

The tool uses the vision capabilities of the chat model to process images and extract meaningful content. The processed content is automatically appended to the message, making it available for the AI model to reference in subsequent responses.

## Example Output

For handwritten notes:
```
[Image content: 
Lesson Launch - Do Now
Students completed the warm-up problem on whiteboards. 
Most students were engaged and working independently.
Teacher circulated to check for understanding.]
```

For other images:
```
[Image content: 
A classroom with students working at desks. 
The teacher is standing at the front of the room pointing to a whiteboard.
The whiteboard shows a math problem with diagrams and equations.]
``` 