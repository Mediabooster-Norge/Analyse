# Vercel og Fluid Compute (300 s analyse-timeout)

Analysen bruker inntil **300 sekunder** (5 min) per API-kall. Det krever at **Fluid Compute** er aktivert.

**Viktig:** Fluid Compute virker også på **Hobby** (gratis). Med Fluid Compute på Hobby får du **300 s (5 min)** – samme som vi trenger. Du trenger altså **ikke** Pro bare for å få 300 s; slå på Fluid Compute og du kan forbli på Hobby.

| Plan   | Uten Fluid Compute | Med Fluid Compute   |
|--------|--------------------|---------------------|
| Hobby  | 60 s maks          | **300 s (5 min)**  |
| Pro    | 300 s maks         | 300 s default, 800 s maks |

## 1. Slå på Fluid Compute (gjelder Hobby og Pro)

Fluid Compute gir høyere function-timeout og bedre ytelse. På Hobby: 300 s. På Pro: inntil 800 s.

### Alternativ A: I Vercel Dashboard (anbefalt)

1. Gå til **Dashboard** og velg prosjektet (Analyseverktøy).
2. Klikk **Settings** (øverst).
3. I venstremenyen: **Functions**.
4. Finn seksjonen **Fluid Compute**.
5. Slå bryteren **på** (Enable).
6. Klikk **Save**.
7. **Redeploy** prosjektet (Deployments → … på siste deploy → Redeploy) så endringen gjelder.

### Alternativ B: I koden (vercel.json)

Prosjektet har allerede `"fluid": true` i `vercel.json`. Da aktiveres Fluid Compute ved hver deploy:

```json
{
  "fluid": true,
  "functions": { ... }
}
```

Hvis Dashboard viser at Fluid Compute er av, sjekk at `vercel.json` er committet og at du deployer fra den branchen. Etter deploy bør Fluid Compute være på.

## 2. Verifisere at det fungerer

- Etter at Fluid Compute er på bør `/api/analyze` kunne kjøre inntil 300 s uten å bli avbrutt av timeout.
- I Vercel Dashboard: **Settings** → **Functions** → se at Fluid Compute er **on** og at Function Max Duration tillater 300 s.

## Kort oppsummert

| Steg | Handling |
|------|----------|
| 1 | **Fluid Compute**: Settings → Functions → Fluid Compute **på** (eller la `vercel.json` med `"fluid": true` deploye). |
| 2 | **Redeploy** prosjektet. |

**Hobby:** Med Fluid Compute får du 300 s (5 min) – nok for analysen. **Pro** trengs bare hvis du vil ha over 5 min (opptil 800 s) eller andre Pro-fordeler.
