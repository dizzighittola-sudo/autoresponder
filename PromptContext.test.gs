// Unit tests for PromptContext
function testPromptContextConcerns() {
  const input = {
    email: { subject: 'Re: Orari messe', body: 'Quali sono gli orari?', isReply: true, detectedLanguage: 'it' },
    classification: { category: 'information', subIntents: {}, confidence: 0.9 },
    requestType: { type: 'technical' },
    memory: { exists: false, providedInfoCount: 0 },
    conversation: { messageCount: 1 },
    territory: { addressFound: false },
    knowledgeBase: { length: 0, containsDates: false },
    temporal: { mentionsDates: false, mentionsTimes: false }
  };
  const pc = new PromptContext(input);
  const concerns = pc.concerns;
  console.assert(concerns.language_safety === false, 'language_safety should be false');
  console.assert(concerns.formatting_risk === false, 'formatting_risk should be false');
  console.assert(concerns.temporal_risk === false, 'temporal_risk should be false');
  console.log('✅ testPromptContextConcerns passed');
}

function runAllPromptContextTests() {
  testPromptContextConcerns();
}
