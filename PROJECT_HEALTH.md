# 🩺 Joplin Auto-Tagger — Proje Sağlık Raporu

**Son ölçüm:** 2026-10-25 (önceki ölçüm 2026-05-19)
**Yöntem:** kapılar gerçekten koşturuldu (`tsc --noEmit`, `npm run build`, `git status`), tahmin yok.

---

## Sağlık Puanı: 78/100 🟡

| Kriter | Puan | Önceki | Gerekçe |
|--------|------|--------|---------|
| Dokümantasyon | 17/20 | 16 | README/CHANGELOG/CONTRIBUTING/SECURITY/GENERATOR_DOC; CHANGELOG 1.0.1–1.0.5 boşluğu kapatıldı |
| Kod Kalitesi | 17/20 | 15 | `strict: true` açık, ölü kod ve boş catch yok; `onStart` hâlâ 232 satır |
| Test Coverage | 5/15 | 5 | **Hâlâ 0 test** — CI yalnız derleme yapıyor |
| Git Sağlığı | 14/15 | 10 | mode-churn bitti, `.gitattributes` var; geçmiş squashed (tek baseline) |
| Yayın Durumu | 10/10 | 10 | npm 1.0.6 + GitHub Release + `.jpl` üretiliyor |
| Altyapı | 10/10 | 10 | Webpack + TS + CI (typecheck + build + dist) |
| Bakım | 5/10 | 6 | Son sürüm 2026-01; 9 aydır yeni özellik yok |

---

## Güçlü Yanlar 💪

- **Yayınlanmış npm paketi**: `@cenktekin2008/joplin-plugin-ai-tag-suggester` v1.0.6 (scoped) + eski scopesuz paket.
- **Çoklu AI sağlayıcı**: Gemini (default) + OpenRouter.
- **Temiz tip kapısı**: `tsc --noEmit` strict modda 0 hata.
- **Tekrarlayan derleme**: `npm run build` / `npm run dist` exit 0, `publish/*.jpl` üretiliyor.
- **Gizlilik altyapısı**: pre-commit/pre-push secret taraması + GitHub Actions secret scan.
- **Anahtar güvenliği**: iki sağlayıcı anahtarı da `secure: true` (Joplin tarafından maskelenir).

---

## Riskler ⚠️

| Risk | Seviye | Detay |
|------|--------|-------|
| **Test yok** | 🔴 | Davranış tamamen elle doğrulamaya bağlı; prompt/ayrıştırma mantığı regresyona açık |
| **Joplin Plugin Repo'da yok** | 🟡 | `manifests/com.cenktekin.ai-tag-suggester.json` → 404; kullanıcılar yalnız npm/GitHub'dan kurabilir |
| **`onStart` monoliti** | 🟡 | 232 satır, 4+ sorumluluk; 50 satır kuralını aşıyor |
| **`api/types.ts` (869 satır)** | 🟡 | Joplin API otomatik üretimi, elle güncelleniyor |
| **TypeScript 4.9** | 🟡 | TS 5.x değil; ts-loader ile uyum nedeniyle ertelenebilir |
| **AI API bağımlılığı** | 🟡 | Anahtarsız plugin çalışmaz; offline fallback bilinçli olarak reddedildi |

---

## Öneriler 🎯

| # | Öneri | Öncelik |
|---|-------|---------|
| 1 | Saf fonksiyonları ayır + vitest ile ≥15 test (prompt, tag normalize, JSON ayrıştırma) | Yüksek |
| 2 | `onStart` bölme: settings / message handlers / suggest akışı | Orta |
| 3 | Joplin Plugin Repo başvurusu (varlık hazır, yalnız PR) | Orta |
| 4 | TypeScript + loader zincirini birlikte yükselt | Düşük |

---

## Detaylar

- **Proje:** joplin-plugin-ai-tag-suggester v1.0.6
- **Lisans:** MIT
- **ID:** `com.cenktekin.ai-tag-suggester`
- **Dil:** TypeScript (TSX), React 18
- **Kaynak:** ~760 satır (`src/`) + 869 satır (`api/types.ts`)
- **Joplin min:** v2.10
- **Build:** Webpack 5 + ts-loader
- **Sağlayıcılar:** Gemini (default), OpenRouter
- **Dağıtım:** npm (scoped) + GitHub Releases
