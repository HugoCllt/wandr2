import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View, type ListRenderItemInfo } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type {
  ChatMessageDTO,
  ChatMessageRoleDTO,
  ChatRecommendationDTO,
  ChatStreamPhase,
} from '@wandr/shared';
import { theme } from '../../src/theme/tokens';
import { AppText } from '../../src/ui/AppText';
import { Icon } from '../../src/ui/Icon';
import { ApiError } from '../../src/lib/api';
import { streamNdjson } from '../../src/lib/streamNdjson';
import { ChatBubble } from '../../src/components/ChatBubble';
import {
  ChatInput,
  buildChatContext,
  type ChatContextId,
} from '../../src/components/ChatInput';

const PROMPTS = [
  'Une soirée originale à deux',
  'Quelque chose d’actif dehors ce week-end',
  'Un resto qui vaut le détour',
];

type ChatTurn = { role: ChatMessageRoleDTO; text: string };

type ThreadMessageItem = { kind: 'message'; message: ChatMessageDTO };
type ThreadErrorItem = {
  kind: 'error';
  id: string;
  text: string;
  retryable: boolean;
  retryText?: string;
  historyBefore?: ChatTurn[];
  afterMessageId?: string;
};
type ThreadItem = ThreadMessageItem | ThreadErrorItem;

type Streaming = { phase: ChatStreamPhase; text: string; recommendations: ChatRecommendationDTO[] };

function newId(): string {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function chatMessage(
  role: ChatMessageRoleDTO,
  text: string,
  recommendations: ChatRecommendationDTO[] = [],
): ChatMessageDTO {
  return {
    id: newId(),
    role,
    text,
    suggestedActivities: [],
    recommendations,
    createdAt: new Date().toISOString(),
  };
}

export default function ChatScreen() {
  const router = useRouter();
  const [thread, setThread] = useState<ThreadItem[]>([]);
  const [streaming, setStreaming] = useState<Streaming | null>(null);
  const [draft, setDraft] = useState('');
  const [activeContextIds, setActiveContextIds] = useState<ChatContextId[]>([]);

  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const isStreaming = streaming !== null;
  const started = thread.length > 0 || isStreaming;

  const runTurn = useCallback(async (text: string, history: ChatTurn[]) => {
    const userMessage = chatMessage('user', text);
    setThread((prev) => [...prev, { kind: 'message', message: userMessage }]);
    setStreaming({ phase: 'thinking', text: '', recommendations: [] });

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const context = buildChatContext(activeContextIds);

    let answer = '';
    let recommendations: ChatRecommendationDTO[] = [];
    let streamErrorMessage: string | null = null;

    try {
      await streamNdjson(
        '/api/chat/messages',
        { text, history, context },
        (event) => {
          if (!mountedRef.current) return;
          if (event.type === 'status') {
            setStreaming((s) => (s ? { ...s, phase: event.phase } : s));
          } else if (event.type === 'token') {
            answer += event.text;
            setStreaming((s) => (s ? { ...s, text: answer } : s));
          } else if (event.type === 'recommendations') {
            recommendations = event.items;
            setStreaming((s) => (s ? { ...s, recommendations } : s));
          } else if (event.type === 'error') {
            streamErrorMessage = event.message;
          }
        },
        controller.signal,
      );

      if (streamErrorMessage) throw new Error(streamErrorMessage);
      if (!mountedRef.current) return;
      setThread((prev) => [
        ...prev,
        { kind: 'message', message: chatMessage('assistant', answer, recommendations) },
      ]);
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err instanceof Error && err.name === 'AbortError') return;
      if (!mountedRef.current) return;

      if (err instanceof ApiError && err.status === 403) {
        router.push('/premium-required');
        return;
      }
      if (err instanceof ApiError && err.status === 429) {
        setThread((prev) => [
          ...prev,
          {
            kind: 'error',
            id: newId(),
            text: 'Limite mensuelle atteinte. Réessayez le mois prochain.',
            retryable: false,
          },
        ]);
        return;
      }
      setThread((prev) => [
        ...prev,
        {
          kind: 'error',
          id: newId(),
          text: 'L’envoi du message a échoué.',
          retryable: true,
          retryText: text,
          historyBefore: history,
          afterMessageId: userMessage.id,
        },
      ]);
    } finally {
      if (mountedRef.current) {
        setStreaming(null);
      }
    }
  }, [activeContextIds, router]);

  function handleSend() {
    const t = draft.trim();
    if (t.length === 0 || isStreaming) return;
    setDraft('');
    const history = thread
      .filter((item): item is ThreadMessageItem => item.kind === 'message')
      .map((item) => ({ role: item.message.role, text: item.message.text }))
      .slice(-50);
    void runTurn(t, history);
  }

  const handleRetry = useCallback(
    (item: ThreadErrorItem) => {
      if (!item.retryable || !item.retryText || isStreaming) return;
      setThread((prev) =>
        prev.filter((i) => {
          if (i.kind === 'error' && i.id === item.id) return false;
          if (i.kind === 'message' && item.afterMessageId && i.message.id === item.afterMessageId) {
            return false;
          }
          return true;
        }),
      );
      void runTurn(item.retryText, item.historyBefore ?? []);
    },
    [runTurn, isStreaming],
  );

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  function toggleContext(id: ChatContextId) {
    setActiveContextIds((cur) => (cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]));
  }

  function pickPrompt(prompt: string) {
    setDraft(prompt);
  }

  const invertedListData = useMemo(() => [...thread].reverse(), [thread]);

  const keyExtractor = useCallback((item: ThreadItem) => {
    if (item.kind === 'message') return item.message.id;
    return item.id;
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ThreadItem>) => {
      if (item.kind === 'message') {
        return (
          <ChatBubble
            role={item.message.role}
            text={item.message.text}
            recommendations={item.message.recommendations}
          />
        );
      }
      return <ErrorBubble item={item} onRetry={handleRetry} disabled={isStreaming} />;
    },
    [handleRetry, isStreaming],
  );

  const liveBubble = useMemo(() => {
    if (!streaming) return null;
    const bubble =
      streaming.text.length === 0 ? (
        <ChatBubble role="assistant" text="" pendingPhase={streaming.phase} />
      ) : (
        <ChatBubble
          role="assistant"
          text={streaming.text}
          recommendations={streaming.recommendations}
        />
      );
    return <View style={styles.liveBubbleWrap}>{bubble}</View>;
  }, [streaming]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {started ? (
        <FlatList
          style={styles.list}
          inverted
          data={invertedListData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={liveBubble}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        <EmptyState onPickPrompt={pickPrompt} />
      )}
      <ChatInput
        value={draft}
        onChangeText={setDraft}
        onSend={handleSend}
        onStop={handleStop}
        isStreaming={isStreaming}
        activeContextIds={activeContextIds}
        onToggleContext={toggleContext}
      />
    </SafeAreaView>
  );
}

function EmptyState({ onPickPrompt }: { onPickPrompt: (prompt: string) => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyBadge}>
        <Icon name="chat" size={26} color={theme.colors.brass} strokeWidth={1.4} />
      </View>
      <AppText variant="display" style={styles.emptyTitle}>
        Où sortons-nous ?
      </AppText>
      <View style={styles.promptList}>
        {PROMPTS.map((prompt) => (
          <Pressable
            key={prompt}
            onPress={() => onPickPrompt(prompt)}
            accessibilityRole="button"
            style={styles.promptChip}
          >
            <AppText variant="body" color={theme.colors.ink}>
              {prompt}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ErrorBubble({
  item,
  onRetry,
  disabled,
}: {
  item: ThreadErrorItem;
  onRetry: (item: ThreadErrorItem) => void;
  disabled: boolean;
}) {
  return (
    <View style={styles.errorRow}>
      <View style={styles.errorBubble}>
        <AppText variant="body" color={theme.colors.live}>
          {item.text}
        </AppText>
        {item.retryable && (
          <Pressable
            onPress={() => onRetry(item)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            style={[styles.retryButton, disabled && styles.retryButtonDisabled]}
          >
            <AppText variant="subtitle" color={theme.colors.live}>
              Réessayer
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.offwhite,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: theme.space.s4,
    flexGrow: 1,
  },
  separator: {
    height: theme.space.s4,
  },
  liveBubbleWrap: {
    marginBottom: theme.space.s4,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.s4,
    paddingHorizontal: theme.space.s5,
  },
  emptyBadge: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brassTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    textAlign: 'center',
  },
  promptList: {
    gap: theme.space.s2,
    width: '100%',
    marginTop: theme.space.s2,
  },
  promptChip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.space.s4,
    paddingVertical: theme.space.s3,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  errorRow: {
    alignItems: 'flex-start',
  },
  errorBubble: {
    maxWidth: '82%',
    backgroundColor: theme.colors.liveTint,
    borderRadius: theme.radius.card,
    paddingHorizontal: theme.space.s4,
    paddingVertical: theme.space.s3,
    gap: theme.space.s2,
  },
  retryButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  retryButtonDisabled: {
    opacity: 0.4,
  },
});
