import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/lib/theme';
import { useNotifications } from '../../src/providers/NotificationsProvider';
import { AnimatedButton } from '../../src/components/AnimatedButton';


interface SettingItemProps {
  title: string;
  description: string;
  value: boolean;
  onToggle: () => void;
  icon: string;
  delay?: number;
}

function SettingItem({ title, description, value, onToggle, icon, delay = 0 }: SettingItemProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
      }}
    >
      <View 
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: isDark ? '#2C1F3A' : '#F0E8FA',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
        }}
      >
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
          {title}
        </Text>
        <Text style={{ fontSize: 13, color: isDark ? '#6B5B7A' : '#9B8AA8', marginTop: 2 }}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#767577', true: colors.primary }}
        thumbColor={value ? '#FFF' : '#F4F3F4'}
      />
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { settings, updateSettings, hasPermission, requestPermissions } = useNotifications();

  const handleRequestPermission = async () => {
    await requestPermissions();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View 
        style={{ 
          backgroundColor: colors.surface,
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Text style={{ fontSize: 24, color: colors.primary }}>←</Text>
          </Pressable>
          <View>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.primary }}>
              Notifications
            </Text>
            <Text style={{ fontSize: 14, color: isDark ? '#B57EDC' : '#9B59B6', marginTop: 4 }}>
              Gère tes préférences
            </Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Status */}
        <View style={{ marginBottom: 24 }}>
          <View
            style={{
              backgroundColor: hasPermission ? '#22C55E20' : '#FF6B6B20',
              padding: 16,
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 24, marginRight: 12 }}>
              {hasPermission ? '✅' : '⚠️'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                {hasPermission ? 'Notifications activées' : 'Notifications désactivées'}
              </Text>
              <Text style={{ fontSize: 13, color: isDark ? '#6B5B7A' : '#9B8AA8' }}>
                {hasPermission 
                  ? 'Tu recevras des notifications selon tes préférences' 
                  : 'Active les notifications pour ne rien manquer'}
              </Text>
            </View>
            {!hasPermission && (
              <Pressable
                onPress={handleRequestPermission}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>Activer</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Message Notifications */}
        <Text 
          style={{ 
            fontSize: 14, 
            fontWeight: '600', 
            color: isDark ? '#B57EDC' : '#9B59B6',
            marginBottom: 12,
            marginLeft: 4,
          }}
        >
          MESSAGERIE
        </Text>
        <SettingItem
          title="Nouveaux messages"
          description="Quand quelqu'un t'envoie un message"
          value={settings.newMessages}
          onToggle={() => updateSettings({ newMessages: !settings.newMessages })}
          icon="💬"
          delay={100}
        />
        <SettingItem
          title="Mentions"
          description="Quand quelqu'un te mentionne"
          value={settings.mentions}
          onToggle={() => updateSettings({ mentions: !settings.mentions })}
          icon="@️"
          delay={150}
        />

        {/* Social Notifications */}
        <Text 
          style={{ 
            fontSize: 14, 
            fontWeight: '600', 
            color: isDark ? '#B57EDC' : '#9B59B6',
            marginBottom: 12,
            marginLeft: 4,
            marginTop: 16,
          }}
        >
          SOCIAL
        </Text>
        <SettingItem
          title="Nouveaux abonnés"
          description="Quand quelqu'un commence à te suivre"
          value={settings.newFollowers}
          onToggle={() => updateSettings({ newFollowers: !settings.newFollowers })}
          icon="👤"
          delay={200}
        />
        <SettingItem
          title="J'aime sur mes posts"
          description="Quand quelqu'un like ton contenu"
          value={settings.postLikes}
          onToggle={() => updateSettings({ postLikes: !settings.postLikes })}
          icon="❤️"
          delay={250}
        />
        <SettingItem
          title="Commentaires"
          description="Quand quelqu'un commente ton post"
          value={settings.postComments}
          onToggle={() => updateSettings({ postComments: !settings.postComments })}
          icon="💭"
          delay={300}
        />

        {/* Academic Notifications */}
        <Text 
          style={{ 
            fontSize: 14, 
            fontWeight: '600', 
            color: isDark ? '#B57EDC' : '#9B59B6',
            marginBottom: 12,
            marginLeft: 4,
            marginTop: 16,
          }}
        >
          ÉTUDES
        </Text>
        <SettingItem
          title="Événements"
          description="Rappels d'examens, soirées, rendus"
          value={settings.events}
          onToggle={() => updateSettings({ events: !settings.events })}
          icon="📅"
          delay={350}
        />
        <SettingItem
          title="Offres de stage"
          description="Nouvelles offres correspondant à ton profil"
          value={settings.jobOffers}
          onToggle={() => updateSettings({ jobOffers: !settings.jobOffers })}
          icon="💼"
          delay={400}
        />

        {/* Test Notification */}
        <View style={{ marginTop: 24 }}>
          <AnimatedButton
            title="Envoyer une notification test"
            onPress={async () => {
              const { scheduleLocalNotification } = useNotifications();
              await scheduleLocalNotification(
                'Test LinkUp',
                'Ceci est une notification de test!',
                { type: 'test' }
              );
            }}
            variant="secondary"
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
