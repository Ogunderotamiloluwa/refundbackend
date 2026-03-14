// Test LLM Service
const llmService = require('./llmService');

async function testLLM() {
  console.log('🧪 Testing LLM Service...\n');

  // Test data
  const testMessage = 'How can I build consistency with my morning workout habit?';
  const testHabits = [
    { name: 'Morning Workout', frequency: 'daily', progress: 75, streak: 7 },
    { name: 'Reading', frequency: 'daily', progress: 60, streak: 3 }
  ];
  const testRoutines = [
    { name: 'Morning Routine', time: '06:00', days: 'Weekdays' }
  ];
  const testTodos = [
    { title: 'Finish project', priority: 'high', time: '2026-03-15T17:00:00Z' },
    { title: 'Gym session', priority: 'medium', time: '2026-03-15T18:00:00Z' }
  ];

  try {
    console.log('📤 Sending test message to LLM...');
    console.log(`Message: "${testMessage}"\n`);

    const result = await llmService.getLLMResponse(
      testMessage,
      testHabits,
      testRoutines,
      testTodos,
      'Alex'
    );

    if (result) {
      console.log('\n✅ LLM Response received!');
      console.log(`📊 Model used: ${result.model}`);
      console.log('\n💬 Response:\n');
      console.log(result.response);
      console.log('\n✅ LLM Service is working perfectly!');
      process.exit(0);
    } else {
      console.log('\n❌ All LLM services failed');
      process.exit(1);
    }
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  }
}

testLLM();
