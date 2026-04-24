import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n/useI18n';
import {
  DEMO_SCENARIOS,
  DEMO_ANALYZE_STEP_KEYS,
  buildInitialChatMessages,
  getDemoScenarioById,
  getMockAssistantReply,
} from '../data/mockDemo';
import DemoScenarioList from '../components/demo/DemoScenarioList';
import DemoPlayer from '../components/demo/DemoPlayer';
import DemoSummaryCard from '../components/demo/DemoSummaryCard';
import DemoTimeline from '../components/demo/DemoTimeline';
import DemoChatPanel from '../components/demo/DemoChatPanel';

const ANALYZE_STEP_MS = 430;
const ANALYZE_FINISH_MS = 2400;
const EVENT_REVEAL_MS = 240;

let chatIdSeq = 0;
function nextChatId() {
  chatIdSeq += 1;
  return `c-${chatIdSeq}`;
}

export default function Demo() {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState(DEMO_SCENARIOS[0]?.id ?? '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [analyzeStepIndex, setAnalyzeStepIndex] = useState(0);
  const [revealedEventCount, setRevealedEventCount] = useState(0);
  const [chatMessages, setChatMessages] = useState(() => buildInitialChatMessages(DEMO_SCENARIOS[0]));
  const [chatInput, setChatInput] = useState('');
  const [demoVideoPlaybackReady, setDemoVideoPlaybackReady] = useState(false);
  const analyzeTimersRef = useRef([]);
  const revealTimersRef = useRef([]);
  const chatReplyTimerRef = useRef(null);

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

  const clearRevealTimers = useCallback(() => {
    revealTimersRef.current.forEach((id) => clearTimeout(id));
    revealTimersRef.current = [];
  }, []);

  const clearChatReplyTimer = useCallback(() => {
    if (chatReplyTimerRef.current) clearTimeout(chatReplyTimerRef.current);
    chatReplyTimerRef.current = null;
  }, []);

  // One place to stop timers and return to the pre-analysis UI state.
  const resetAnalysisState = useCallback(() => {
    clearAnalyzeTimers();
    clearRevealTimers();
    clearChatReplyTimer();
    setIsAnalyzing(false);
    setIsAnalyzed(false);
    setAnalyzeStepIndex(0);
    setRevealedEventCount(0);
  }, [clearAnalyzeTimers, clearRevealTimers, clearChatReplyTimer]);

  useEffect(
    () => () => {
      clearAnalyzeTimers();
      clearRevealTimers();
      clearChatReplyTimer();
    },
    [clearAnalyzeTimers, clearRevealTimers, clearChatReplyTimer]
  );

  useEffect(() => {
    if (!isAnalyzing) return undefined;

    clearAnalyzeTimers();

    DEMO_ANALYZE_STEP_KEYS.forEach((_, i) => {
      if (i === 0) return;
      const tid = setTimeout(() => setAnalyzeStepIndex(i), i * ANALYZE_STEP_MS);
      analyzeTimersRef.current.push(tid);
    });

    const finishId = setTimeout(() => {
      clearRevealTimers();
      setIsAnalyzing(false);
      setIsAnalyzed(true);
      setAnalyzeStepIndex(DEMO_ANALYZE_STEP_KEYS.length - 1);
      setRevealedEventCount(0);
      setChatMessages((prev) => [
        ...prev,
        {
          id: nextChatId(),
          role: 'assistant',
          content: t('demo.chatAutoInsight'),
        },
      ]);
      clearAnalyzeTimers();
    }, ANALYZE_FINISH_MS);
    analyzeTimersRef.current.push(finishId);

    return () => clearAnalyzeTimers();
  }, [isAnalyzing, clearAnalyzeTimers, clearRevealTimers, t]);

  useEffect(() => {
    if (!isAnalyzed || isAnalyzing || !scenario) return undefined;
    clearRevealTimers();
    // Reveal events in sequence to simulate timeline generation.
    scenario.events.forEach((_, i) => {
      const tid = setTimeout(() => setRevealedEventCount(i + 1), (i + 1) * EVENT_REVEAL_MS);
      revealTimersRef.current.push(tid);
    });
    return () => clearRevealTimers();
  }, [isAnalyzed, isAnalyzing, scenario, clearRevealTimers]);

  const handleSelectScenario = useCallback((id) => {
    resetAnalysisState();
    setSelectedId(id);
    const next = getDemoScenarioById(id);
    if (next) setChatMessages(buildInitialChatMessages(next));
    setChatInput('');
  }, [resetAnalysisState]);

  const handleAnalyze = useCallback(() => {
    resetAnalysisState();
    if (scenario) setChatMessages(buildInitialChatMessages(scenario));
    clearAnalyzeTimers();
    setAnalyzeStepIndex(0);
    setIsAnalyzing(true);
  }, [clearAnalyzeTimers, resetAnalysisState, scenario]);

  const handleReset = useCallback(() => {
    resetAnalysisState();
    if (scenario) setChatMessages(buildInitialChatMessages(scenario));
    setChatInput('');
  }, [resetAnalysisState, scenario]);

  const appendAssistant = useCallback((content) => {
    setChatMessages((prev) => [...prev, { id: nextChatId(), role: 'assistant', content }]);
  }, []);

  const handleSend = useCallback(() => {
    if (!isAnalyzed || !scenario) return;
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages((prev) => [...prev, { id: nextChatId(), role: 'user', content: text }]);
    setChatInput('');
    const reply = getMockAssistantReply(scenario, text);
    clearChatReplyTimer();
    chatReplyTimerRef.current = setTimeout(() => appendAssistant(reply), 450);
  }, [chatInput, appendAssistant, isAnalyzed, scenario, clearChatReplyTimer]);

  const handlePromptChip = useCallback(
    (promptText) => {
      if (!isAnalyzed || !scenario) return;
      setChatInput(promptText);
      setChatMessages((prev) => [...prev, { id: nextChatId(), role: 'user', content: promptText }]);
      const reply = getMockAssistantReply(scenario, promptText);
      clearChatReplyTimer();
      chatReplyTimerRef.current = setTimeout(() => appendAssistant(reply), 450);
    },
    [appendAssistant, isAnalyzed, scenario, clearChatReplyTimer]
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

      {/* Top: event timeline (alone, scrollable) | hero player | summary + scenario list */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6 items-stretch min-h-0">
        <div className="xl:col-span-3 order-2 xl:order-1 flex flex-col h-full min-h-0 max-h-[720px] xl:max-h-none">
          <DemoTimeline
            heading={t('demo.timelineHeading')}
            events={scenario.events}
            isReady={isAnalyzed}
            visibleCount={revealedEventCount}
            skeletonLabel={t('demo.awaitingAnalysis')}
            animateSkeleton={demoVideoPlaybackReady}
          />
        </div>

        <div className="xl:col-span-6 order-1 xl:order-2 min-h-0 flex flex-col">
          <DemoPlayer
            activeScenarioLabel={t('demo.activeScenario')}
            title={scenario.title}
            rawVideoSrc={scenario.rawVideoUrl}
            analyzedVideoSrc={scenario.analyzedVideoUrl}
            isAnalyzing={isAnalyzing}
            isAnalyzed={isAnalyzed}
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
            onVideoPlaybackReadyChange={setDemoVideoPlaybackReady}
            videoStableKey={`${selectedId}-${isAnalyzed}`}
          />
        </div>

        <div className="xl:col-span-3 order-3 flex flex-col gap-4 min-h-0 max-h-[720px] xl:max-h-none">
          <div className="shrink-0">
            <DemoSummaryCard
              heading={t('demo.summaryHeading')}
              summary={scenario.summary}
              metrics={scenario.metrics}
              metricLabels={metricLabels}
              isReady={isAnalyzed}
              skeletonLabel={t('demo.awaitingAnalysis')}
              animateSkeleton={demoVideoPlaybackReady}
            />
          </div>
          <div className="min-h-0 flex-1 flex flex-col">
            <DemoScenarioList
              scenarios={DEMO_SCENARIOS}
              selectedId={selectedId}
              onSelect={handleSelectScenario}
              title={t('demo.scenariosTitle')}
              severityLabels={severityLabels}
            />
          </div>
        </div>
      </div>

      {/* Bottom: full-width investigation chat */}
      <DemoChatPanel
        title={t('demo.chatTitle')}
        subtitle={t('demo.chatSubtitle')}
        messages={chatMessages}
        suggestedPrompts={scenario.suggestedPrompts}
        inputValue={chatInput}
        onInputChange={setChatInput}
        onSend={handleSend}
        onSelectPrompt={handlePromptChip}
        placeholder={t('demo.chatPlaceholder')}
        sendLabel={t('demo.send')}
        userLabel={t('demo.youLabel')}
        assistantLabel={t('demo.assistantLabel')}
        isEnabled={isAnalyzed}
        lockedMessage={t('demo.chatLockedMessage')}
        skeletonLabel={t('demo.awaitingAnalysis')}
        animateSkeleton={demoVideoPlaybackReady}
      />
    </div>
  );
}
