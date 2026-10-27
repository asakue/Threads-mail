# @vibery/mobile — React Native & Expo Mobile Client

Нативное мобильное приложение почтового мессенджера **«ВАЙБЕРЫ»** для iOS и Android.

## Ключевые возможности
- **Движок списков FlashList:** частота отрисовки 120 FPS в лентах на 50 000+ писем.
- **Локальное хранилище WatermelonDB:** C++ JSI / SQLite с ленивой реактивной подгрузкой.
- **Аппаратные жесты:** свайп влево для архивации (`#0071E3`), свайп вправо для отметки прочитанным.
- **Защита данных:** Zero-Knowledge шифрование локальной БД через SQLCipher.

## Запуск в разработке
```bash
# Установка зависимостей
npm install

# Запуск локального Expo сервера
npx expo start

# Запуск на iOS симуляторе (macOS)
npx expo start --ios

# Запуск на Android эмуляторе / устройстве
npx expo start --android
```

## Сборка релизных пакетов (EAS Build)
```bash
# Сборка iOS .ipa
eas build --platform ios --profile production

# Сборка Android .apk / .aab
eas build --platform android --profile production
```
