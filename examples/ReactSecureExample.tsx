import React, { useEffect } from 'react';
import { useTabStateSync, TabStateSyncOptions } from '../src';

// Definição do tipo de dados a ser sincronizado
interface UserSettings {
    theme: 'light' | 'dark';
    fontSize: number;
    language: string;
}

// Opções de segurança
const secureOptions: TabStateSyncOptions = {
    namespace: 'myapp',
    enableEncryption: true,
    encryptionKey: 'secure-random-string-123',
    debug: process.env.NODE_ENV === 'development'
};

export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
    // Usar o hook com as opções de segurança
    const [settings, setSettings] = useTabStateSync<UserSettings>(
        'user-settings',
        { theme: 'light', fontSize: 16, language: 'en' },
        secureOptions
    );

    // Validação de dados (importante para segurança)
    useEffect(() => {
        // Validar que os dados estão no formato esperado
        if (!isValidSettings(settings)) {
            // Reset para valores padrão se os dados forem inválidos
            setSettings({ theme: 'light', fontSize: 16, language: 'en' });
        }
    }, [settings, setSettings]);

    // Função de validação para garantir segurança
    function isValidSettings(data: any): data is UserSettings {
        return (
            data &&
            typeof data === 'object' &&
            (data.theme === 'light' || data.theme === 'dark') &&
            typeof data.fontSize === 'number' &&
            typeof data.language === 'string'
        );
    }

    // Atualiza uma configuração específica
    const updateSetting = <K extends keyof UserSettings>(
        key: K,
        value: UserSettings[K]
    ) => {
        setSettings({ ...settings, [key]: value });
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSetting }}>
            {children}
        </SettingsContext.Provider>
    );
}

// Contexto para disponibilizar as configurações na árvore de componentes
const SettingsContext = React.createContext<{
    settings: UserSettings;
    updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}>({
    settings: { theme: 'light', fontSize: 16, language: 'en' },
    updateSetting: () => { },
});

// Hook para componentes consumirem as configurações
export const useSettings = () => React.useContext(SettingsContext); 