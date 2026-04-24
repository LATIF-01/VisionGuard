import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n/useI18n';
import {
  DEMO_SCENARIOS,
  DEMO_ANALYZE_STEP_KEYS,
  DEMO_SUGGESTED_PROMPTS,
  buildInitialChatMessages,
  getDemoScenarioById,
  getMockAssistantReply,
} from '../data/mockDemo';
import DemoScenarioList from '../components/demo/DemoScenarioList';
import DemoPlayer from '../components/demo/DemoPlayer';
import DemoSummaryCard from '../components/demo/DemoSummaryCard';
import DemoTimeline from '../components/demo/DemoTimeline';
import DemoChatPanel from '../components/demo/DemoChatPanel';

const ANALYZE_STEP_MS = 650;
const ANALYZE_FINISH_MS = 2600;

let chatIdSeq = 0;
function nextChatId() {
  chatIdSeq += 1;
  return `c-${chatIdSeq}`;
}

export default function Demo() {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState(DEMO_SCENARIOS[0]?.id ?? '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analyzeStepIndex, setAnalyzeStepIndex] = useState(0);
  const [chatMessages, setChatMessages] = useState(() => buildInitialChatMessages(DEMO_SCENARIOS[0]));
  const [chatInput, setChatInput] = useState('');
  const analyzeTimersRef = useRef([]);

  const scenario = useMemo(() => getDemoScenarioById(selectedId), [selectedId]);

  const analyzeStepLabels = useMemo(() => DEMO_ANALYZE_STEP_KEYS.map((key) => t(key)), [t]);

  const severityLabels = useMemo(
    () => ({
      normal: t('demo.severity.normal'),
      warning: t('demo.severity.warning'),
      critical: t('demo.severity.critical'),
    }),
    [t]
  );

  const metricLabels = useMemo(
    () => ({
      people: t('demo.metrics.people'),
      events: t('demo.metrics.events'),
      suspicious: t('demo.metrics.suspicious'),
    }),
    [t]
  );

  const storedTitleRef = useRef(null);
  useEffect(() => {
    if (storedTitleRef.current === null) {
      storedTitleRef.current = document.title;
    }
    document.title = `${t('demo.title')} — VisionGuard`;
    return () => {
      document.title = storedTitleRef.current ?? document.title;
    };
  }, [t]);

  const clearAnalyzeTimers = useCallback(() => {
    analyzeTimersRef.current.forEach((id) => clearTimeout(id));
    analyzeTimersRef.current = [];
  }, []);

  useEffect(() => {
    if (!isAnalyzing) return undefined;

    clearAnalyzeTimers();

    DEMO_ANALYZE_STEP_KEYS.forEach((_, i) => {
      if (i === 0) return;
      const tid = setTimeout(() => setAnalyzeStepIndex(i), i * ANALYZE_STEP_MS);
      analyzeTimersRef.current.push(tid);
    });

    const finishId = setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisComplete(true);
      setAnalyzeStepIndex(DEMO_ANALYZE_STEP_KEYS.length);
      clearAnalyzeTimers();
    }, ANALYZE_FINISH_MS);
    analyzeTimersRef.current.push(finishId);

    return () => clearAnalyzeTimers();
  }, [isAnalyzing, clearAnalyzeTimers]);

  const handleSelectScenario = useCallback((id) => {
    clearAnalyzeTimers();
    setIsAnalyzing(false);
    setAnalysisComplete(false);
    setAnalyzeStepIndex(0);
    setSelectedId(id);
    const next = getDemoScenarioById(id);
    if (next) setChatMessages(buildInitialChatMessages(next));
    setChatInput('');
  }, [clearAnalyzeTimers]);

  const handleAnalyze = useCallback(() => {
    clearAnalyzeTimers();
    setAnalysisComplete(false);
    setAnalyzeStepIndex(0);
    setIsAnalyzing(true);
  }, [clearAnalyzeTimers]);

  const handleReset = useCallback(() => {
    clearAnalyzeTimers();
    setIsAnalyzing(false);
    setAnalysisComplete(false);
    setAnalyzeStepIndex(0);
    if (scenario) setChatMessages(buildInitialChatMessages(scenario));
    setChatInput('');
  }, [clearAnalyzeTimers, scenario]);

  const appendAssistant = useCallback((content) => {
    setChatMessages((prev) => [...prev, { id: nextChatId(), role: 'assistant', content }]);
  }, []);

  const handleSend = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages((prev) => [...prev, { id: nextChatId(), role: 'user', content: text }]);
    setChatInput('');
    const reply = getMockAssistantReply(text);
    setTimeout(() => appendAssistant(reply), 450);
  }, [chatInput, appendAssistant]);

  const handlePromptChip = useCallback(
    (promptText) => {
      setChatInput(promptText);
      setChatMessages((prev) => [...prev, { id: nextChatId(), role: 'user', content: promptText }]);
      const reply = getMockAssistantReply(promptText);
      setTimeout(() => appendAssistant(reply), 450);
    },
    [appendAssistant]
  );

  if (!scenario) {
    return <div className="text-white p-6">{t('common.loading')}</div>;
  }

  return (
    <div className="demo-page space-y-6 max-w-[1920px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{t('demo.title')}</h1>
          <p className="mt-2 text-sm text-vg-text-muted max-w-3xl leading-relaxed">{t('demo.subtitle')}</p>
        </div>
      </div>

      {/* Top: scenarios | hero player | intelligence */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6 items-stretch min-h-0">
        <div className="xl:col-span-3 order-2 xl:order-1 min-h-0">
          <DemoScenarioList
            scenarios={DEMO_SCENARIOS}
            selectedId={selectedId}
            onSelect={handleSelectScenario}
            title={t('demo.scenariosTitle')}
            severityLabels={severityLabels}
          />
        </div>

        <div className="xl:col-span-6 order-1 xl:order-2 min-h-0 flex flex-col">
          <DemoPlayer
            activeScenarioLabel={t('demo.activeScenario')}
            title={scenario.title}
            videoSrc={scenario.videoSrc}
            isAnalyzing={isAnalyzing}
            analysisComplete={analysisComplete}
            analyzeStepLabels={analyzeStepLabels}
            activeAnalyzeStepIndex={Math.min(analyzeStepIndex, DEMO_ANALYZE_STEP_KEYS.length - 1)}
            onAnalyze={handleAnalyze}
            onReset={handleReset}
            onReplay={() => {}}
            analyzeLabel={isAnalyzing ? t('demo.analyzing') : t('demo.analyzeVideo')}
            resetLabel={t('demo.reset')}
            replayLabel={t('demo.replay')}
            completeLabel={t('demo.analysisComplete')}
            noSignalLabel={t('demo.noSignal')}
            videoNotSupportedLabel={t('dashboard.videoNotSupported')}
          />
        </div>

        <div className="xl:col-span-3 order-3 flex flex-col gap-4 min-h-0 max-h-[720px] xl:max-h-none">
          <div className="shrink-0">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-vg-text-muted mb-3 px-1">
              {t('demo.intelligenceTitle')}
            </h2>
            <DemoSummaryCard heading={t('demo.summaryHeading')} summary={scenario.summary} metricLabels={metricLabels} />
          </div>
          <DemoTimeline heading={t('demo.timelineHeading')} events={scenario.timeline} />
        </div>
      </div>

      {/* Bottom: full-width investigation chat */}
      <DemoChatPanel
        title={t('demo.chatTitle')}
        subtitle={t('demo.chatSubtitle')}
        messages={chatMessages}
        suggestedPrompts={DEMO_SUGGESTED_PROMPTS}
        inputValue={chatInput}
        onInputChange={setChatInput}
        onSend={handleSend}
        onSelectPrompt={handlePromptChip}
        placeholder={t('demo.chatPlaceholder')}
        sendLabel={t('demo.send')}
        userLabel={t('demo.youLabel')}
        assistantLabel={t('demo.assistantLabel')}
      />
    </div>
  );
}
