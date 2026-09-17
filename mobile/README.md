# Famiglia Grassi — Mobile

App iOS + Android realizzata con Expo/React Native e collegata allo stesso progetto Supabase dell'app desktop.

## Avvio locale

```bash
cd mobile
npm install
npx expo start
```

Poi:
- `a` per Android (emulatore/device)
- `i` per iOS (simulatore/device su macOS)

Per un build installabile servono le credenziali Apple/Google e un account/build EAS configurato.

## Backend

L'app usa Supabase Auth e il database esistente. Le sessioni mobile vengono salvate con Expo SecureStore. Il client usa esclusivamente la publishable key; non inserire mai una secret/service-role key nell'app.
