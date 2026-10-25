# PROJECT TRACKER — AI Tag Suggester

## Durum Özeti

| Alan | Durum |
|------|-------|
| **Son Sürüm** | v1.0.6 |
| **npm (scoped)** | ✅ `@cenktekin2008/joplin-plugin-ai-tag-suggester` 1.0.6 — bakımı yapılan paket |
| **npm (scopesuz)** | ⚠️ `joplin-plugin-ai-tag-suggester` 1.0.6 — artık bakımı yapılmıyor (README migration notu) |
| **Joplin Plugin Repo** | ❌ Listede değil (2026-10-25 doğrulandı: `manifests/com.cenktekin.ai-tag-suggester.json` → 404) |
| **GitHub Release** | ✅ v1.0.6 (`.jpl` asset mevcut) |

## Tamamlanan Görevler

- [2026-10-25] Git hijyeni: 66 dosyalık mode-churn (100755 → 100644) kalıcı düzeltildi, `.gitattributes` eklendi.
- [2026-10-25] Ölü kod temizlendi: 0 baytlık `src/webview/constants.ts`, kullanılmayan `fs`/`path` import'ları.
- [2026-10-25] Boş `catch` blokları gerekçeli `console.warn` ile dolduruldu.
- [2026-10-25] `geminiApiKey` ayarı `secure: true` yapıldı (OpenRouter anahtarıyla tutarlı).
- [2026-10-25] `tsconfig` → `strict: true` + `npm run typecheck` + CI adımı.
- [2026-10-25] Mevcut etiketler prompt'a dahil edildi — tekrar eden öneri engellendi.
- [2026-10-25] Eski/çelişkili artefaktlar `archive/` altına alındı (eski `com.joplin.AutoTag` manifestosu, 1.0.2 tarball, pnpm lock/workspace).
- [2026-03-30] v1.0.6 npmjs.com'a publish edildi (joplin-plugin-ai-tag-suggester, scopesuz).
- [2026-03-30] İki ayrı npm hesabı/paketi sorunu tespit edildi ve çözümü uygulandı.

## Alınan Kararlar

- [2026-10-25] Paket yöneticisi **npm** (tek lockfile: `package-lock.json`); pnpm dosyaları arşivlendi. CI `npm ci` ile tutarlı.
- [2026-10-25] Depo **PUBLIC**; `NEXT_ACTIONS.md` yerel `.git/info/exclude`'ta tutulur, iç yollar commit edilmez.
- [2026-10-25] `archive/` derleme kapsamı dışında (`tsconfig.exclude`) — arşiv kodu tip kapısını kıramaz.
- [2026-03-30] Joplin plugin yayınlama için `cenktekin` hesabı (scopesuz paket) kullanılacak.
- [2026-03-30] Publish öncesi package.json name scopesuz'a çevrilecek, publish sonrası geri alınacak.

## İleride Yapılacaklar (Backlog)

- [ ] Test altyapısı: vitest + saf fonksiyon çıkarımı (prompt kurulumu, tag normalize, JSON ayrıştırma). Şu an 0 test.
- [ ] `onStart` monolitini (232 satır) parçala: `registerSettings` / `registerMessageHandlers` / `suggestTagsForNote`.
- [ ] Joplin Plugin Repo'ya başvuru (manifest + `.jpl` release asset hazır).
- [ ] Scopesuz npm paketini `npm deprecate` ile işaretle.
- [ ] Publish workflow otomasyonu (script).

---
*Son Güncelleme: 2026-10-25*
