# Alex Rivera

```json doc-meta
{
  "schemaVersion": 1,
  "lastUpdated": "2026-08-18",
  "generatedBy": "brag-docs@0.1.0"
}
```

## Executive Summary

A steady pattern of infrastructure ownership and mentorship over the past two quarters.

## Entries

### Shipped write-through cache for API Gateway metadata service

```json brag-entry
{
  "id": "2026-03-14-caching-layer",
  "date": "2026-03-14",
  "role": "lead",
  "type": "project",
  "impacts": [
    {
      "statement": "Reduced latency by roughly 40% for the metadata service under peak load",
      "metrics": [
        { "value": 40, "unit": "% faster" }
      ]
    },
    {
      "statement": "Cut infrastructure spend by avoiding a planned capacity upgrade",
      "metrics": [
        { "value": 12000, "unit": "USD saved annually" }
      ]
    }
  ],
  "collaborators": [
    "Jane Doe",
    "John Smith"
  ],
  "link": "https://github.com/org/repo/pull/1234"
}
```

Diagnosed a latency bottleneck via distributed tracing, designed a write-through Redis cache in front of the metadata service, and led rollout across three environments.

### Mentored two junior engineers through their first on-call rotation

```json brag-entry
{
  "id": "2025-11-01-mentorship",
  "date": "2025-11-01",
  "role": "mentor",
  "type": "mentorship",
  "impacts": [
    {
      "statement": "Both engineers went on-call independently within one quarter, faster than the team's typical ramp-up",
      "metrics": []
    }
  ],
  "collaborators": [
    "Priya Nair",
    "Sam Okafor"
  ],
  "link": null
}
```

Paired weekly, built a shared on-call runbook, shadowed their first live incidents.

## What I've Learned

### OpenTelemetry for distributed tracing

```json learned-entry
{
  "id": "2026-03-10-opentelemetry",
  "date": "2026-03-10",
  "category": "tool",
  "link": "https://opentelemetry.io"
}
```

Adopted for diagnosing latency across service boundaries during the caching-layer project.

### Redis cache-invalidation strategies

```json learned-entry
{
  "id": "2026-03-12-redis-invalidation",
  "date": "2026-03-12",
  "category": "technique",
  "link": null
}
```

Deepened knowledge of write-through vs. write-behind invalidation tradeoffs.

## Feedback

### Manager feedback on Q1 cross-team collaboration

```json feedback-entry
{
  "id": "2026-02-10-manager-feedback",
  "date": "2026-02-10",
  "sentiment": "constructive",
  "source": "Manager, Q1 1:1",
  "content": "PR descriptions sometimes assume shared context other teams don't have.",
  "howAddressed": "Started including a \"why\" section in every PR description.",
  "link": null
}
```

## Things I've Done Outside Work

### Spoke at LocalDevConf on distributed tracing

```json brag-entry
{
  "id": "2026-02-20-conf-talk",
  "date": "2026-02-20",
  "role": null,
  "type": "talk",
  "impacts": [
    {
      "statement": "Talk was well-attended and generated several follow-up conversations about adopting tracing internally",
      "metrics": [
        { "value": 120, "unit": "attendees" }
      ]
    }
  ],
  "collaborators": [],
  "link": "https://localdevconf.example.com/2026/talks/tracing"
}
```

30-minute talk on debugging latency with distributed tracing, based on the API Gateway caching project.
