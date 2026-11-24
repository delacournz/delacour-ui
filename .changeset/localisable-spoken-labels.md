---
"@delacour/react-native-ui": minor
---

Localisable spoken strings. `DelacourProvider` takes a `labels` map, keyed by component, laid over the English defaults in the new `lib/labels` catalog; `useLabels(component, own)` and `LabelsProvider` come from `hooks/use-labels`. Pagination, Breadcrumb, Kpi and Carousel read their names, values and visible words from it and take a `labels` prop that wins over the provider's. Every default is today's English, so nothing changes until an app passes labels.
