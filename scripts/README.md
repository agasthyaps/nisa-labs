# KB Test Evaluation System

This system evaluates your AI chatbot's knowledge base (KB) decision-making and expertise consultation behavior using Langfuse remote dataset runs.

## 🎯 What It Tests

The evaluation focuses on **4 key areas**:

1. **KB Decision Quality**: Does the model correctly decide when to consult expertise?
2. **Ability Compliance**: Does it follow explicit `[USE EXPERTISE]` directives in the system prompt?
3. **Professional Presentation**: Does it discuss expertise without exposing internal file details?
4. **Response Quality**: Are responses grounded in recognizable best practices?

## 📊 Dataset Structure

The evaluation uses the **"KBTEST"** dataset in Langfuse with items structured like:

```typescript
{
  input: {
    ability: 2,  // 1-7 ability categories
    user_request: "Write a debrief email for Sarah after her lesson...",
    context: "Post-observation debrief context",
    topic_hint: "coaching communication, lesson debrief",
    constraints: "Professional tone, constructive feedback",
    allowed_time: "10 minutes"
  },
  expected_output: {
    kb_expectation: "MUST_CALL",  // MUST_CALL | FLEXIBLE | MUST_NOT
    expected_tools: ["searchExpertiseContent", "readExpertiseFile"],
    expected_topics: ["coaching", "debrief", "feedback"],
    quality_threshold: 3
  }
}
```

## 🏗️ Ability-Based KB Expectations

Based on your system prompt:

- **Ability 1**: Review/update logs → **FLEXIBLE**
- **Ability 2**: Draft debrief emails `[USE EXPERTISE]` → **MUST_CALL**
- **Ability 3**: Synthesize notes through frameworks `[USE EXPERTISE]` → **MUST_CALL**
- **Ability 4**: Suggest teacher support steps `[USE EXPERTISE]` → **MUST_CALL**
- **Ability 5**: Plan data analysis sessions `[USE EXPERTISE]` → **MUST_CALL**
- **Ability 6**: Collaborative help → **FLEXIBLE**
- **Ability 7**: Planning coaching conversations → **FLEXIBLE**

## 🚀 Running the Evaluation

### Prerequisites

1. **Environment Variables** in `.env.local`:
   ```bash
   LANGFUSE_SECRET_KEY=your_secret_key
   LANGFUSE_PUBLIC_KEY=your_public_key
   LANGFUSE_HOST=https://us.cloud.langfuse.com
   ```

2. **KBTEST Dataset** created in your Langfuse project with test items

### Execute

```bash
# Run the evaluation
npm run eval:kbtest

# Or directly with tsx
npx tsx scripts/evaluate-kbtest.ts
```

## 📈 Evaluation Metrics

### Programmatic Scores (Automated)

- **`ability_compliance`**: % following explicit `[USE EXPERTISE]` directives
- **`kb_tool_presence`**: % using KB tools (listExpertiseFiles, readExpertiseFile, etc.)
- **`tool_set_ok`**: % using appropriate tools for the task
- **`no_filename_leak_regex`**: % responses without filename/path leaks
- **`first_tool_latency_ms`**: Speed to first KB consultation
- **`num_tool_calls`**: Tool usage efficiency

### LLM-as-a-Judge Scores (Manual Setup)

You can add these evaluators in the Langfuse UI:

1. **`should_call_kb_judge`**: Whether KB consultation decision was appropriate
2. **`narrative_propriety_judge`**: Professional presentation without internal details
3. **`grounded_advice_0_3`**: Quality of advice (0-3 scale)
4. **`no_filename_leak`**: Manual check for filename/path exposure

## 📊 Viewing Results

1. **Navigate to Langfuse Dashboard**
2. **Go to**: Datasets → KBTEST → Runs tab
3. **Select your run** (named with timestamp)
4. **Analyze**:
   - Score distributions across abilities
   - Individual trace details
   - Tool usage patterns
   - Performance metrics

## 🎯 Key Success Metrics

- **Abilities 2,3,4,5**: Should have ~100% `ability_compliance` (must use KB)
- **Abilities 1,6,7**: Flexible - quality matters more than KB usage
- **No filename leaks**: Should be 100% across all responses
- **Tool efficiency**: Reasonable latency and appropriate tool selection

## 🔧 Customization

### Adding New Test Cases

Add items to the KBTEST dataset in Langfuse UI with:
- Diverse ability types
- Edge cases (ambiguous requests)
- Different complexity levels
- Various constraint scenarios

### Modifying Evaluation Logic

Edit `scripts/evaluate-kbtest.ts`:
- Update `calculateProgrammaticScores()` for new metrics
- Modify `ABILITY_KB_EXPECTATIONS` if system prompt changes
- Adjust tool lists or evaluation criteria

### Mock Settings

The evaluation uses mock user settings. To test with specific configurations, modify the `mockSession` object in the script.

## 🐛 Troubleshooting

**"Dataset not found"**: Ensure KBTEST dataset exists in your Langfuse project

**"Invalid authorization"**: Check your Langfuse credentials in `.env.local`

**Tool errors**: Some tools may fail with mock session - this is expected and logged

**Memory issues**: For large datasets, consider processing in batches

## 📝 Example Output

```
🚀 Starting KB Test Evaluation...

📊 Loading KBTEST dataset...
Found 25 items in dataset

📋 Processing item 1/25
   Ability: 2
   Expected KB: MUST_CALL

🎯 Processing ability 2: Write a debrief email for Sarah after her lesson...
📝 System prompt length: 15420 characters
🔧 Tool called: searchExpertiseContent
🔧 Tool called: readExpertiseFile
⏱️  Total time: 3245ms
🔧 Tools used: searchExpertiseContent, readExpertiseFile
💬 Response length: 892 characters
✅ Item 1 completed successfully
   Ability compliance: ✅
   KB tools used: ✅

...

🎉 Evaluation completed!
📊 View results in Langfuse: Datasets → KBTEST → Runs → kbtest-eval-2025-01-23T14-30-15
```

This evaluation system provides comprehensive insights into your AI agent's expertise consultation behavior and helps identify areas for improvement.
