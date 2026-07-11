import { eventBus, EventTypes } from '../eventBus';
import { repository } from '../repository';

export function initValidationAgent() {
  eventBus.subscribe('START_ANALYSIS_CYCLE', async () => {
    try {
      // 1. Fetch documents that need extraction
      const allDocs = await repository.getDocuments();
      const rawDocs = allDocs.filter(d => d.ingestionStatus === 'raw');
      
      if (rawDocs.length > 0) {
        await repository.logAgentActivity({
          id: crypto.randomUUID(),
          agentRole: 'SignalAnalysisAgent',
          taskType: 'Document Extraction',
          status: 'running',
          message: `Extracting signals from ${rawDocs.length} raw documents using LLM...`,
          timestamp: new Date().toISOString()
        });
        const baseUrl = typeof window !== 'undefined' ? '/api' : 'http://127.0.0.1:8000/api';
        for (const doc of rawDocs) {
          await fetch(`${baseUrl}/agents/extract/${doc.id}`, { method: 'POST' });
        }
      }

      // 2. Generate Trends
      await repository.logAgentActivity({
        id: crypto.randomUUID(),
        agentRole: 'SignalAnalysisAgent',
        taskType: 'Trend Clustering',
        status: 'running',
        message: 'Clustering recent signals into trends using LLM...',
        timestamp: new Date().toISOString()
      });

      const baseUrl = typeof window !== 'undefined' ? '/api' : 'http://127.0.0.1:8000/api';
      const response = await fetch(`${baseUrl}/agents/analyze`, { method: 'POST' });
      if (response.ok) {
        const trends = await response.json();
        for (const trend of trends) {
          await eventBus.publish(EventTypes.TREND_CANDIDATE_IDENTIFIED, {
            trendName: trend.name
          }, 'SignalAnalysisAgent');
        }
        await repository.logAgentActivity({
          id: crypto.randomUUID(),
          agentRole: 'SignalAnalysisAgent',
          taskType: 'Trend Clustering',
          status: 'completed',
          message: `Clustered signals into ${trends.length} new Candidate Trends.`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      await repository.logAgentActivity({
        id: crypto.randomUUID(),
        agentRole: 'SignalAnalysisAgent',
        taskType: 'Trend Clustering',
        status: 'failed',
        message: `Analysis cycle failed: ${e}`,
        timestamp: new Date().toISOString()
      });
    }
  });

  eventBus.subscribe(EventTypes.TREND_CANDIDATE_IDENTIFIED, async (payload) => {
    await repository.logAgentActivity({
      id: crypto.randomUUID(),
      agentRole: 'ValidationAgent',
      taskType: 'Evidence Stress-Testing',
      status: 'running',
      message: `Searching for contradictory evidence against: "${payload.trendName}"`,
      timestamp: new Date().toISOString()
    });

    // Create a new Debate
    const debateId = crypto.randomUUID();
    await repository.saveDebate({
      id: debateId,
      topic: `Validation of Trend: ${payload.trendName}`,
      status: 'active',
      messages: [
        {
          id: crypto.randomUUID(),
          debateId,
          agentRole: 'DiscoveryAgent',
          content: `Strong signal cluster found for "${payload.trendName}". Evidence heavily supported by vendor PR and VC funding announcements.`,
          timestamp: new Date().toISOString()
        }
      ],
      timestamp: new Date().toISOString()
    });
    
    eventBus.publish(EventTypes.DEBATE_STARTED, { debateId }, 'ValidationAgent');

    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Agent finds contradictory evidence
    const debates = await repository.getDebates();
    const debate = debates.find(d => d.id === debateId);
    if (debate) {
      debate.messages.push({
        id: crypto.randomUUID(),
        debateId,
        agentRole: 'ValidationAgent',
        content: `WARNING: Found contradictory evidence. Customer adoption metrics from recent pilot tests show a 60% drop-off due to poor item substitution handling. EU regulatory bodies have also proposed restrictions on automated grocery substitutions.`,
        timestamp: new Date().toISOString()
      });
      await repository.saveDebate(debate);
      await eventBus.publish(EventTypes.EVIDENCE_CONTRADICTED, { debateId }, 'ValidationAgent');
    }

    await repository.logAgentActivity({
      id: crypto.randomUUID(),
      agentRole: 'ValidationAgent',
      taskType: 'Evidence Stress-Testing',
      status: 'completed',
      message: 'Found significant contradictory evidence (regulatory & adoption hurdles). Lowering confidence.',
      timestamp: new Date().toISOString()
    });
  });
}
