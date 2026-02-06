import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: true,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      en: {
        translation: {
          common: {
            dashboard: "Dashboard",
            settings: "Settings",
            orders: "Orders",
            articles: "Articles",
            logout: "Logout",
            darkMode: "Dark Mode",
            language: "Language",
            week: "Week",
            day: "Day",
            search: "Search",
            addOrder: "Add Order",
            customerName: "Customer Name",
            resource: "Resource",
            status: "Status",
            categories: "Categories",
            orderDetails: "Order Details",
            phone: "Phone",
            email: "Email",
            rentalPeriod: "Rental Period",
            startDate: "Start Date",
            endDate: "End Date",
            draft: "Draft",
            confirmed: "Confirmed",
            completed: "Completed",
            cancelled: "Cancelled",
            noArticles: "No articles",
            editOrder: "Edit Order",
            saveChanges: "Save Changes",
            cancel: "Cancel",
            cancelEditing: "Cancel Editing",
            edited: "Edited",
            created: "Created",
            position: "Position",
            unknownCategory: "Uncategorized"
          }
        }
      },
      de: {
        translation: {
          common: {
             dashboard: "Dashboard",
             settings: "Einstellungen",
             orders: "Aufträge",
             articles: "Artikel",
             logout: "Abmelden",
             darkMode: "Dunkelmodus",
             language: "Sprache",
             week: "Woche",
             day: "Tag",
             search: "Suchen",
             addOrder: "Auftrag anlegen",
             customerName: "Kundenname",
             resource: "Ressource",
             status: "Status",
             categories: "Kategorien",
             orderDetails: "Auftragsdetails",
             phone: "Telefon",
             email: "E-Mail",
             rentalPeriod: "Mietzeitraum",
             startDate: "Startdatum",
             endDate: "Enddatum",
             draft: "Entwurf",
             confirmed: "Bestätigt",
             completed: "Abgeschlossen",
             cancelled: "Storniert",
             noArticles: "Keine Artikel",
             editOrder: "Auftrag bearbeiten",
             saveChanges: "Änderungen speichern",
             cancel: "Abbrechen",
             cancelEditing: "Bearbeitung abbrechen",
             edited: "Bearbeitet",
             created: "Erstellt",
             position: "Position",
             unknownCategory: "Unkategorisiert"
          }
        }
      }
    }
  });

export default i18n;
