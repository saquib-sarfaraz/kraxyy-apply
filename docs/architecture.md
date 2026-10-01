# Kraxyy Apply - System Architecture

## High-Level Topology

```text
                                  KRAXYY APPLY PLATFORM
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               │                            │                            │
      [ Web Application ]            [ Backend API ]           [ Chrome Extension ]
      React 18 + Vite + TS          Node.js + Express            Manifest V3 (MV3)
      Tailwind (Brand Palette)      Mongoose + JWT + Zod         Detector + Form Engine
      Port 5173                     Port 5001                    Popup + In-Page Dock
               │                            │                            │
               └───────────────────────────►│◄───────────────────────────┘
                                            │
                               ┌────────────┴────────────┐
                               │                         │
                         [ MongoDB ]             [ File Storage ]
                         Atlas / 27017           Local / S3 / R2
                               │
                       [ Admin Console ]
                       React 18 + Vite + Recharts
                       Port 5174
```

## Communication Principles

1. **Strict API Gateway**: The Chrome Extension NEVER directly connects to MongoDB or database drivers. Every request passes through authenticated endpoints (`/api/v1/extension/*`) using revocable extension tokens (`X-Extension-Token`).
2. **Review Before Submission**: The extension content script automates form field detection and input population, highlights modified fields in Olive (`#525B31`) and Mustard (`#B18B40`), presents an audit list, and requires the user to submit on the employer's page.
3. **Multi-Signal Detection Taxonomy**: Form inputs are analyzed by a scoring heuristic evaluating attributes (`name`, `id`, `autocomplete`), labels, placeholders, aria attributes, and surrounding DOM context against normalized taxonomies.
4. **Resilient Monolith**: All services are maintained within an npm workspace monorepo sharing TypeScript types, Zod schemas, and design constants.
