import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme/tokens';
import { AppText } from '../ui/AppText';
import { Icon, type IconName } from '../ui/Icon';

export type ChatContextId = 'nearby' | 'tonight' | 'solo';

type ChatContextTool = { id: ChatContextId; label: string; icon: IconName; hint: string };

export const CHAT_CONTEXT_TOOLS: ChatContextTool[] = [
  { id: 'nearby', label: 'Près de moi', icon: 'pin', hint: 'près de moi, à proximité' },
  { id: 'tonight', label: 'Ce soir', icon: 'calendar', hint: 'pour ce soir' },
  { id: 'solo', label: 'Solo', icon: 'profile', hint: 'en solo, je serai seul·e' },
];

export function buildChatContext(activeIds: ChatContextId[]): string | undefined {
  const hints = CHAT_CONTEXT_TOOLS.filter((tool) => activeIds.includes(tool.id)).map((tool) => tool.hint);
  return hints.length > 0 ? `Contexte : je cherche quelque chose ${hints.join(', ')}.` : undefined;
}

const MIN_INPUT_HEIGHT = 44;
const MAX_INPUT_HEIGHT = 108;

type ChatInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled: boolean;
  activeContextIds: ChatContextId[];
  onToggleContext: (id: ChatContextId) => void;
};

export function ChatInput({
  value,
  onChangeText,
  onSend,
  disabled,
  activeContextIds,
  onToggleContext,
}: ChatInputProps) {
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);
  const canSend = value.trim().length > 0 && !disabled;

  function handleSend() {
    if (!canSend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend();
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.dock}>
        <View style={styles.toolsRow}>
          {CHAT_CONTEXT_TOOLS.map((tool) => {
            const active = activeContextIds.includes(tool.id);
            return (
              <Pressable
                key={tool.id}
                onPress={() => onToggleContext(tool.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={tool.label}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Icon
                  name={tool.icon}
                  size={13}
                  color={active ? theme.colors.white : theme.colors.ink}
                  strokeWidth={1.8}
                />
                <AppText variant="caption" color={active ? theme.colors.white : theme.colors.ink}>
                  {tool.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.inputRow}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder="Répondez ou précisez votre envie…"
            placeholderTextColor={theme.colors.smoke}
            multiline
            style={[
              styles.input,
              { height: Math.min(Math.max(MIN_INPUT_HEIGHT, inputHeight), MAX_INPUT_HEIGHT) },
            ]}
            onContentSizeChange={(e) =>
              setInputHeight(e.nativeEvent.contentSize.height + theme.space.s3 * 2)
            }
          />
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Envoyer"
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          >
            <Icon name="arrow" size={18} color={theme.colors.white} strokeWidth={1.8} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  dock: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    backgroundColor: theme.colors.surface2,
    paddingHorizontal: theme.space.s4,
    paddingTop: theme.space.s3,
    paddingBottom: theme.space.s4,
    gap: theme.space.s3,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: theme.space.s2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.s1,
    minHeight: 44,
    paddingHorizontal: theme.space.s3,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  chipActive: {
    backgroundColor: theme.colors.brass,
    borderColor: theme.colors.brass,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.space.s2,
  },
  input: {
    flex: 1,
    borderRadius: theme.radius.btn,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.space.s3,
    paddingVertical: theme.space.s2,
    fontFamily: theme.type.body.fontFamily,
    fontSize: theme.type.body.fontSize,
    color: theme.colors.ink,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
