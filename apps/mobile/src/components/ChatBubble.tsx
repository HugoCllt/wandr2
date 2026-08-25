import { ScrollView, StyleSheet, View } from 'react-native';
import type { ChatMessageRoleDTO, ChatRecommendationDTO, ChatStreamPhase } from '@wandr/shared';
import { theme } from '../theme/tokens';
import { AppText } from '../ui/AppText';
import { ChatRecoCard } from './ChatRecoCard';
import { ChatStatus } from './ChatStatus';

type ChatBubbleProps = {
  role: ChatMessageRoleDTO;
  text: string;
  recommendations?: ChatRecommendationDTO[];
  pendingPhase?: ChatStreamPhase;
};

export function ChatBubble({ role, text, recommendations = [], pendingPhase }: ChatBubbleProps) {
  if (role === 'user') {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <AppText variant="body" color={theme.colors.ink}>
            {text}
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.assistantRow}>
      <View style={styles.avatar}>
        <AppText style={styles.avatarLetter}>W</AppText>
      </View>
      {pendingPhase ? (
        <ChatStatus phase={pendingPhase} />
      ) : (
        <View style={styles.assistantContent}>
          <View style={styles.assistantBubble}>
            <AppText variant="body" color={theme.colors.ink}>
              {text}
            </AppText>
          </View>
          {recommendations.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recosRow}
            >
              {recommendations.map((item, i) => (
                <ChatRecoCard key={`${item.activity.id}-${i}`} item={item} />
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  userRow: {
    alignItems: 'flex-end',
  },
  userBubble: {
    maxWidth: '82%',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.card,
    paddingHorizontal: theme.space.s4,
    paddingVertical: theme.space.s3,
  },
  assistantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space.s3,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brassTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: theme.type.title.fontFamily,
    fontSize: theme.type.body.fontSize,
    color: theme.colors.brass700,
  },
  assistantContent: {
    flex: 1,
    gap: theme.space.s3,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.card,
    paddingHorizontal: theme.space.s4,
    paddingVertical: theme.space.s3,
  },
  recosRow: {
    gap: theme.space.s3,
    paddingRight: theme.space.s4,
  },
});
