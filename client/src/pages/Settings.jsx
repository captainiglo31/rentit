import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
    const { t, i18n } = useTranslation();
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                {t('common.settings')}
            </h1>

            <div className="bg-white dark:bg-slate-800 shadow sm:rounded-lg p-6 space-y-8">
                {/* Language */}
                <div>
                     <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                        {t('common.language')}
                     </h3>
                     <div className="mt-2 max-w-xs">
                         <select 
                            value={i18n.resolvedLanguage} 
                            onChange={(e) => i18n.changeLanguage(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                         >
                            <option value="en">English</option>
                            <option value="de">Deutsch</option>
                         </select>
                     </div>
                </div>

                {/* Theme */}
                <div className="flex items-center justify-between max-w-xl">
                     <div className="flex flex-col">
                        <span className="text-lg font-medium text-gray-900 dark:text-white">{t('common.darkMode')}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Use dark theme across the application.</span>
                     </div>
                     <button
                        onClick={toggleTheme}
                        type="button"
                        className={`${theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200'}
                             relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                     >
                        <span className="sr-only">Toggle Theme</span>
                        <span
                            aria-hidden="true"
                            className={`${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}
                                pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                        />
                     </button>
                </div>
            </div>
        </div>
    );
}
