// ====================================================================
// PROMPT CONTEXT
// Calcola profilo e concern runtime (FASE 2–3)
// ====================================================================

class PromptContext {
  constructor(input) {
    // FIX Bug 10: Input validation (AGGRESSIVE LOGGING)
    if (!input || typeof input !== 'object') {
      const safeInput = input ? String(input).substring(0, 100) : 'null/undefined';
      console.error(`🚨 CRITICAL: PromptContext received INVALID input (Type: ${typeof input}). Snippet: [${safeInput}]`);
      // Stack trace trick to identify caller
      try { throw new Error(); } catch(e) { console.error(`   Caller Trace: ${e.stack.split('\n')[2].trim()}`); }
      input = {}; // Fallback per prevenire crash
    }
    
    // FIX Bug 6: Sanitize invalid lastUpdated if present in memory
    // (PromptContext receives raw input, we must ensure dates are valid before usage)
    if (input.memory && input.memory.lastUpdated) {
      if (isNaN(new Date(input.memory.lastUpdated).getTime())) {
        console.warn(`⚠️ PromptContext detected invalid lastUpdated in memory, resetting to null`);
        input.memory.lastUpdated = null;
      }
    }
    this.input = input;
    this.concerns = this._computeConcerns();
    this.profile = this._computeProfile();
    this.meta = this._buildMeta();
  }

  // --------------------------------------------------
  // CONCERNS
  // --------------------------------------------------

  _computeConcerns() {
    const i = this.input;

    return {
      language_safety:
        i.email?.detectedLanguage !== 'it' ||
        (i.classification?.confidence ?? 1) < 0.8,

      hallucination_risk:
        (i.knowledgeBase?.length ?? 0) > 800 ||
        i.temporal?.mentionsDates ||
        i.temporal?.mentionsTimes,

      formatting_risk:
        i.temporal?.mentionsTimes ||
        ['information', 'sacrament'].includes(i.classification?.category),

      temporal_risk:
        i.temporal?.mentionsDates ||
        i.knowledgeBase?.containsDates,

      discernment_risk:
        i.requestType?.needsDiscernment ||
        i.territory?.addressFound,

      emotional_sensitivity:
        i.requestType?.type === 'pastoral' ||
        i.classification?.subIntents?.emotional_distress ||
        i.classification?.subIntents?.bereavement,

      repetition_risk:
        i.memory?.exists ||
        (i.conversation?.messageCount ?? 0) > 1,

      identity_consistency:
        !i.email?.isReply ||
        i.requestType?.type !== 'technical',

      response_scope_control:
        i.email?.isReply ||
        (i.classification?.confidence ?? 1) < 0.7,

      // 🧠 Controllo saluto per continuità conversazionale
      salutation_control:
        i.salutationMode && i.salutationMode !== 'full'
    };
  }

  // --------------------------------------------------
  // PROFILE
  // --------------------------------------------------

  _computeProfile() {
    const c = this.concerns;

    if (c.discernment_risk || c.emotional_sensitivity) {
      return 'heavy';
    }

    if (
      c.hallucination_risk ||
      c.formatting_risk ||
      c.temporal_risk
    ) {
      return 'standard';
    }

    return 'lite';
  }

  // --------------------------------------------------
  // META (debug / audit)
  // --------------------------------------------------

  _buildMeta() {
    const active = Object.entries(this.concerns)
      .filter(([_, v]) => v)
      .map(([k]) => k);

    return {
      profile: this.profile,
      activeConcerns: active
    };
  }
}

// Funzione Factory
function createPromptContext(input) {
  return new PromptContext(input);
}
