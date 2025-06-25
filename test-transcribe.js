// Simple test script to verify the transcribe notes tool
const { transcribeNotes } = require('./lib/ai/tools/transcribe-notes.ts');

async function testTranscribeNotes() {
  console.log('Testing transcribe notes tool...');

  // Test with a sample image URL (you can replace this with a real image URL)
  const testImageUrl = 'https://example.com/test-image.jpg';

  try {
    const result = await transcribeNotes.execute({ imageUrl: testImageUrl });
    console.log('Tool result:', result);
  } catch (error) {
    console.error('Error testing tool:', error);
  }
}

testTranscribeNotes();
