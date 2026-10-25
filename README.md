# clever-rentals — Гостевые квартиры «Клевер»

Эталонный исходный код проекта сервиса посуточной аренды квартир «Клевер» (выгружен с https://preview--clever-rentals.poehali.dev/).

## Стек технологий
- **Фреймворк**: React 19 + TanStack Start / TanStack Router (File-based Routing)
- **Стилизация**: Tailwind CSS + `tailwindcss-animate`
- **Компоненты**: Radix UI (Dialog, Popover, Tooltip, Sheet, Tabs, Switch, Checkbox, Slider и др.)
- **Иконки**: Lucide React
- **Дата и календарь**: date-fns, react-day-picker
- **Сборщик**: Vite 6+

## Структура проекта
- `src/routes/`:
  - `__root.tsx` — Корневой шаблон, метатеги, шрифты (Cormorant Garamond, Manrope), тостеры.
  - `index.tsx` — Главная страница (каталог квартир, фильтры, интерактивная карта, преимущества).
  - `apartment.$id.tsx` — Детальная страница квартиры (галерея, календарь бронирования, характеристики, правила).
  - `checkout.tsx` — Страница оформления и подтверждения брони.
  - `bookings.tsx` — Страница просмотра и управления бронированиями.
  - `admin.tsx` — Панель администратора (управление объектами, ценами, календарями, iCal).
- `src/components/`:
  - `site/` — Компоненты витрины (Header, Footer, Catalog, ApartmentCard, SearchBar, CityMap, HowItWorks, PageShell).
  - `apartment/` — Компоненты карточки квартиры (Gallery, BookingWidget).
  - `ui/` — Библиотека дизайн-системы (Button, Dialog, Popover, Calendar, Sheet, Tabs, Input и др.).
- `src/lib/`:
  - `apartments.ts` — База данных квартир, схемы типов (`Apartment`, `AmenityGroup`), занятые даты, расчет стоимости.
  - `search.ts` — Логика фильтрации и поиска квартир.
  - `utils.ts` — Утилиты для классов (clsx + tailwind-merge).
- `public/`:
  - `images/` — Локально сохраненные фотографии интерьеров и логотип.
  - `favicon.svg`, `robots.txt`.

## Запуск
```bash
npm install
npm run dev
```
