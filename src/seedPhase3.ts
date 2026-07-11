import { 
  getTrends, getStrategicContext,
  getAssumptions, getLeadingIndicators, getStrategicImplications,
  getScenarios, getStrategicOptions, getDecisionBriefs, getRoadmapItems,
  saveAssumptions, saveLeadingIndicators, saveStrategicImplications,
  saveScenarios, saveStrategicOptions, saveDecisionBrief, saveRoadmapItems, getSignals, getEvidences
} from './mockRepository';
import { generateAssumptionsFromTrends } from './assumptionEngine';
import { generateLeadingIndicators } from './indicatorEngine';
import { generateStrategicImplications } from './implicationEngine';
import { generateScenarios } from './scenarioEngine';
import { generateStrategicOptions } from './optionEngine';
import { generateDecisionBrief } from './decisionBriefEngine';
import { generateRoadmapItems } from './roadmapEngine';

export function seedPhase3() {
  const trends = getTrends();
  const context = getStrategicContext();
  if (!context || trends.length === 0) return;
  if (
    getAssumptions().length > 0 ||
    getLeadingIndicators().length > 0 ||
    getStrategicImplications().length > 0 ||
    getScenarios().length > 0 ||
    getStrategicOptions().length > 0 ||
    getDecisionBriefs().length > 0 ||
    getRoadmapItems().length > 0
  ) {
    return;
  }

  const assumptions = generateAssumptionsFromTrends(trends, context);
  saveAssumptions(assumptions);

  const indicators = generateLeadingIndicators(assumptions, getSignals());
  saveLeadingIndicators(indicators);

  const implications = generateStrategicImplications(trends, context, getEvidences());
  saveStrategicImplications(implications);

  const scenarios = generateScenarios(implications, assumptions, indicators, context);
  saveScenarios(scenarios);

  const options = generateStrategicOptions(implications, scenarios, assumptions, context);
  saveStrategicOptions(options);

  const brief = generateDecisionBrief(context, implications, options, assumptions, indicators);
  saveDecisionBrief(brief);

  // Generate roadmap items for options that default to 'accepted' or are undefined
  const acceptedOptions = options.filter(o => o.status === 'accepted' || !o.status);
  const roadmapItems = generateRoadmapItems(acceptedOptions.length > 0 ? acceptedOptions : options);
  saveRoadmapItems(roadmapItems);
}
