import * as React from 'react'
import { useSettings, updateSettings } from './settings'

const en = {
  // Nav
  'nav.overview': 'Overview',
  'nav.dashboard': 'Dashboard',
  'nav.workspace': 'Workspace',
  'nav.properties': 'Properties',
  'nav.contacts': 'Contacts',
  'nav.transactions': 'Transactions',
  'nav.activities': 'Activities',
  'nav.intelligence': 'Intelligence',
  'nav.marketIntelligence': 'Market Intelligence',
  'nav.aiAssistant': 'AI Assistant',
  'nav.configuration': 'Configuration',
  'nav.settings': 'Settings',
  'nav.collapse': 'Collapse',
  // Common
  'common.search': 'Search…',
  'common.notifications': 'Notifications',
  'common.noNotifications': 'No notifications yet.',
  'common.profile': 'Profile',
  'common.signOut': 'Sign out',
  'common.new': 'New',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.loading': 'Loading…',
  // Dashboard
  'dashboard.title': 'Overview',
  'dashboard.subtitle': 'Agency activity and commercial real estate performance.',
  'dashboard.kpi.properties': 'Active Properties',
  'dashboard.kpi.transactions': 'Open Transactions',
  'dashboard.kpi.dealValue': 'Total Deal Value',
  'dashboard.kpi.closed': 'Closed Deals',
  'dashboard.recentTx': 'Recent Transactions',
  'dashboard.recentTxDesc': 'Latest deals across the pipeline.',
  'dashboard.recentProps': 'Recently Added Properties',
  'dashboard.recentPropsDesc': 'Newest assets in your portfolio.',
  'dashboard.upcoming': 'Upcoming Activities',
  'dashboard.upcomingDesc': 'Scheduled calls, viewings and follow-ups.',
  'dashboard.insights': 'Market Insights',
  'dashboard.insightsDesc': 'Trends and signals derived from your agency\u2019s commercial real estate data.',
  'dashboard.insightsTitle': 'Insights require more data',
  // Pages
  'properties.title': 'Properties',
  'properties.subtitle': 'Commercial property portfolio — retail, office, hospitality, industrial and mixed-use.',
  'properties.new': 'New property',
  'contacts.title': 'Contacts',
  'contacts.subtitle': 'Owners, tenants, buyers, brokers and service providers.',
  'contacts.new': 'New contact',
  'transactions.title': 'Transactions',
  'transactions.subtitle': 'Sales, acquisitions and leases across the pipeline.',
  'transactions.new': 'New deal',
  'activities.title': 'Activities',
  'activities.subtitle': 'Calls, meetings, viewings and follow-ups.',
  'activities.new': 'New activity',
  'intelligence.title': 'Market Intelligence',
  'intelligence.subtitle': 'Analytics computed from your own imported data — nothing is estimated or fabricated.',
  'ai.title': 'AI Assistant',
  'ai.subtitle': 'CRE research and analysis assistant — powered by your own API key.',
  'settings.title': 'Settings',
  'settings.subtitle': 'Workspace and account preferences.',
  // Auth
  'auth.signIn': 'Sign in',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.welcome': 'Welcome back',
  'auth.forgot': 'Forgot password?',
  'auth.resetTitle': 'Reset your password',
  'auth.newPassword': 'New password',
  'auth.confirmPassword': 'Confirm password',
  'auth.sendReset': 'Send reset link',
  'auth.resetSent': 'If that email exists, a reset link is on its way. Check your inbox.',
  'auth.backToSignIn': 'Back to sign in',
  'auth.resetSuccess': 'Password updated — you can sign in now.',
  'auth.resetInvalid': 'This reset link is invalid or has expired. Request a new one.',
  'auth.passwordMismatch': 'Passwords do not match.',
  'auth.passwordTooShort': 'Password must be at least 8 characters.',
  'auth.updatePassword': 'Update password',
} as const

export type I18nKey = keyof typeof en

const it: Record<I18nKey, string> = {
  'nav.overview': 'Panoramica',
  'nav.dashboard': 'Dashboard',
  'nav.workspace': 'Area di lavoro',
  'nav.properties': 'Immobili',
  'nav.contacts': 'Contatti',
  'nav.transactions': 'Transazioni',
  'nav.activities': 'Attività',
  'nav.intelligence': 'Intelligence',
  'nav.marketIntelligence': 'Intelligenza di mercato',
  'nav.aiAssistant': 'Assistente AI',
  'nav.configuration': 'Configurazione',
  'nav.settings': 'Impostazioni',
  'nav.collapse': 'Comprimi',
  'common.search': 'Cerca…',
  'common.notifications': 'Notifiche',
  'common.noNotifications': 'Nessuna notifica.',
  'common.profile': 'Profilo',
  'common.signOut': 'Esci',
  'common.new': 'Nuovo',
  'common.save': 'Salva',
  'common.cancel': 'Annulla',
  'common.edit': 'Modifica',
  'common.delete': 'Elimina',
  'common.loading': 'Caricamento…',
  'dashboard.title': 'Panoramica',
  'dashboard.subtitle': 'Attività dell’agenzia e performance immobiliare commerciale.',
  'dashboard.kpi.properties': 'Immobili attivi',
  'dashboard.kpi.transactions': 'Transazioni aperte',
  'dashboard.kpi.dealValue': 'Valore totale operazioni',
  'dashboard.kpi.closed': 'Operazioni chiuse',
  'dashboard.recentTx': 'Transazioni recenti',
  'dashboard.recentTxDesc': 'Ultime operazioni nella pipeline.',
  'dashboard.recentProps': 'Immobili aggiunti di recente',
  'dashboard.recentPropsDesc': 'Nuovi asset in portafoglio.',
  'dashboard.upcoming': 'Attività in programma',
  'dashboard.upcomingDesc': 'Chiamate, sopralluoghi e follow-up programmati.',
  'dashboard.insights': 'Approfondimenti di mercato',
  'dashboard.insightsDesc': 'Tendenze e segnali derivati dai dati immobiliari della tua agenzia.',
  'dashboard.insightsTitle': 'Servono più dati per gli approfondimenti',
  'properties.title': 'Immobili',
  'properties.subtitle': 'Portafoglio immobiliare commerciale — retail, uffici, hospitality, industriale e misto.',
  'properties.new': 'Nuovo immobile',
  'contacts.title': 'Contatti',
  'contacts.subtitle': 'Proprietari, conduttori, acquirenti, broker e fornitori di servizi.',
  'contacts.new': 'Nuovo contatto',
  'transactions.title': 'Transazioni',
  'transactions.subtitle': 'Vendite, acquisizioni e locazioni lungo la pipeline.',
  'transactions.new': 'Nuova operazione',
  'activities.title': 'Attività',
  'activities.subtitle': 'Chiamate, riunioni, sopralluoghi e follow-up.',
  'activities.new': 'Nuova attività',
  'intelligence.title': 'Intelligenza di mercato',
  'intelligence.subtitle': 'Analisi calcolate sui tuoi dati importati — nessuna stima o dato inventato.',
  'ai.title': 'Assistente AI',
  'ai.subtitle': 'Assistente per ricerca e analisi CRE — basato sulla tua chiave API.',
  'settings.title': 'Impostazioni',
  'settings.subtitle': 'Preferenze dell’area di lavoro e dell’account.',
  'auth.signIn': 'Accedi',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.welcome': 'Bentornato',
  'auth.forgot': 'Password dimenticata?',
  'auth.resetTitle': 'Reimposta la password',
  'auth.newPassword': 'Nuova password',
  'auth.confirmPassword': 'Conferma password',
  'auth.sendReset': 'Invia link di reset',
  'auth.resetSent': 'Se l’email esiste, un link di reset è in arrivo. Controlla la posta.',
  'auth.backToSignIn': 'Torna all’accesso',
  'auth.resetSuccess': 'Password aggiornata — ora puoi accedere.',
  'auth.resetInvalid': 'Link di reset non valido o scaduto. Richiedine uno nuovo.',
  'auth.passwordMismatch': 'Le password non coincidono.',
  'auth.passwordTooShort': 'La password deve avere almeno 8 caratteri.',
  'auth.updatePassword': 'Aggiorna password',
}

const DICTS: Record<'en' | 'it', Record<I18nKey, string>> = { en, it }

interface I18nContextValue {
  lang: 'en' | 'it'
  setLang: (lang: 'en' | 'it') => void
  t: (key: I18nKey) => string
}

const I18nContext = React.createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (k) => en[k],
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { language } = useSettings()
  const setLang = (lang: 'en' | 'it') => updateSettings({ language: lang })
  const t = React.useCallback((key: I18nKey) => DICTS[language][key] ?? en[key], [language])
  const value = React.useMemo(() => ({ lang: language, setLang, t }), [language, setLang, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return React.useContext(I18nContext)
}
