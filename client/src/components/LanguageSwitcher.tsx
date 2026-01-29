import { useTranslation } from "react-i18next";

export const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    
    const handleLanguageChange = (languageCode: string) => {
        i18n.changeLanguage(languageCode);
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>🌐</span>
            <select 
            value={i18n.language} 
            onChange={(e) => handleLanguageChange(e.target.value)}
            style={{
                padding: '6px 10px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '13px',
                backgroundColor: '#FFFFFF',
                color: '#1F2937',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
        > 
            <option value="en">🇬🇧 English</option>
            <option value="te">తెలుగు Telugu</option>
            <option value="hi">हिंदी Hindi</option>
        </select>
        </div>
    )
}

