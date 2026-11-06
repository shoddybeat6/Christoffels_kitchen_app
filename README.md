# Christoffel's Kitchen — Functional App (Required Scope)

A working Expo + TypeScript React Native app that lets the chef **add** a
menu item and **view** every item added so far.

This build intentionally stays within the required scope for this part of
the PoE: **no editing, deleting, searching, filtering, or menu statistics**.
Those are planned for the Final PoE.

## How to run it

1. Install [Node.js](https://nodejs.org) (LTS version) if you don't have it.
2. From this project folder, install the dependencies:
   ```
   npm install
   ```
3. Start the app:
   ```
   npx expo start
   ```
4. Scan the QR code with the **Expo Go** app on your Android or iPhone, or
   press `a` / `i` in the terminal to launch an Android emulator / iOS
   simulator if you have one installed.

## Project files

| File | Purpose |
|---|---|
| `App.tsx` | The entire application — form to add a dish, and the list that displays every dish added. |
| `index.ts` | Expo's entry point; registers `App` as the root component. |
| `tsconfig.json` | TypeScript configuration, extending Expo's recommended base settings. |
| `app.json` | Expo configuration (app name, icons, splash, etc.). |
| `package.json` | Dependencies and npm scripts (Expo SDK 58). |

`node_modules` is **not** included in this zip to keep the submission small —
run `npm install` after unzipping to restore it.

## How the required scope was met

**1. User Interface**
- Clear application title and subtitle in a green header bar ("Christoffel's Kitchen" / "Menu Manager").
- Built entirely from standard React Native components: `SafeAreaView`, `View`, `Text`, `TextInput`, `TouchableOpacity`, `FlatList`, `ScrollView`, `KeyboardAvoidingView`.
- Readable text sizes/weights are defined once in a `StyleSheet` and reused, so headings, labels and body text stay visually consistent.
- Consistent spacing/alignment comes from shared padding, margin and border-radius values across the card, form and list sections.
- Layout is a single scrollable screen: an "Add a Menu Item" card on top, a "Menu Items" list below — simple and uncluttered.

**2. Capture Menu Information**
- Dish Name → `TextInput`
- Description → multiline `TextInput`
- Course → three `TouchableOpacity` "chips" built from a fixed `COURSES` array (`Starters`, `Mains`, `Desserts`) — the chef can only select one, never type a new course.
- Price → numeric `TextInput` (`keyboardType="numeric"`), validated as a positive number before it's accepted.
- A `MenuItem` TypeScript type (`{ id, name, description, course, price }`) gives every menu item a consistent, checked shape.

**3. Display Menu Items**
- Every valid submission is appended to the `menuItems` array held in `useState<MenuItem[]>`.
- The `FlatList` renders directly from that array, so adding a new dish immediately re-renders the list with the new item — no manual refresh needed.
- The chef can add as many dishes as they like; each appears as its own card with name, course, price and description.

**What was deliberately left out (per the required scope)**
- No edit or delete controls on a menu item.
- No search or course-filtering.
- No item count, average price, or other menu statistics.
