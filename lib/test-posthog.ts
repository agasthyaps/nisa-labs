// Simple test to verify PostHog integration
export function testPostHogIntegration() {
  if (typeof window === 'undefined') {
    console.log('❌ Not in browser environment');
    return;
  }

  console.log('🔍 Testing PostHog Integration...');

  // Check if PostHog is loaded
  if (!window.posthog) {
    console.log('❌ PostHog not found on window object');
    return;
  }

  console.log('✅ PostHog object found');

  // Check if essential methods exist
  const methods = ['capture', 'identify', 'reset'];
  methods.forEach((method) => {
    if (typeof window.posthog[method] === 'function') {
      console.log(`✅ ${method} method available`);
    } else {
      console.log(`❌ ${method} method not available`);
    }
  });

  // Test capture
  try {
    window.posthog.capture('test_event', {
      test: true,
      timestamp: new Date().toISOString(),
    });
    console.log('✅ Test event captured successfully');
  } catch (error) {
    console.log('❌ Failed to capture test event:', error);
  }

  console.log('✅ PostHog integration test complete');
}

// Run test automatically when loaded in browser (for debugging)
if (typeof window !== 'undefined') {
  // Wait for PostHog to load
  setTimeout(() => {
    testPostHogIntegration();
  }, 2000);
}
