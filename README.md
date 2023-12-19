# DRevoLootion

VSCode Extension for rapidly developing i18n projects

## Features
- Displaying all translations when hovering over a translate key (e.g. 'common.yes').
- CTRL + click on a translation key opens the localization file and positions the cursor at the necessary line.
- Scanner for untranslated strings. It is activated in the settings. The extension scans the open file for lines containing Cyrillic characters (ignores comments).
- Untranslated strings are displayed in a separate view within vscode.
- In the settings, you can specify the path to the localization files.
- Autocomplete for translate key. The extension suggests translate keys based on input, shows valid keys, translations.

### Features (ru)
- Получение всех переводов, при наведении мышки на translation key (напр. 'common.yes')
- CTRL + клик мышкой на translate key открывает файл локализации, и устанавливает курсор на нужной линии
- Сканер непереведенных строк. Включается в настройках. Расширение сканирует открытый файл на наличие строк с кириллецей (игнорирует комментарии)
- Непереведенные строки отображаются в отдельном view, внутри vscode
- В настройках можно указаать путь к файлам локализации
- Автодополнение translate key. Расширение подсказывает translate key, в зависимости от ввода, показывает допустимые keys, переводы.