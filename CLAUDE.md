# CLAUDE.md — Core Guardrails

**See ARCHITECTURE.md for full layer design and examples.**

---

## Dependency Rules (Enforce)

```
Allowed:    web/ → application/ → domain/
            infrastructure/ → domain/ (implements ports)
            
Forbidden:  domain/ → application/infrastructure/web/
            web/ → infrastructure/
            cycles anywhere
```

---

## Layer Responsibilities

| Layer | Job | NOT |
|-------|-----|-----|
| **Domain** | Business logic, entities, ports | No frameworks, HTTP, Prisma, React |
| **Application** | Orchestrate domain + infra | No DB calls, no HTTP routes, no UI |
| **Infrastructure** | Adapters implementing ports | No business logic, no orchestration |
| **Contracts** | DTOs, view models | No logic, no domain entities |
| **Web** | Pages, hooks, API routes (thin) | No business logic |

---

## Ports & Adapters (Selective)

**Use Hexagonal for (only):**
- Database (IActivityRepository → PrismaActivityRepository)
- Search (ISearchProvider → ElasticsearchAdapter)
- Map (IMapProvider → MapboxAdapter)
- LLM (ILLMProvider → OpenAIAdapter)
- Cache (ICache → RedisAdapter)

**Skip for:** Filters, sorting, favorites, detail, carousel

---

## Feed Engine Rule

Feed engine = GetFeedUseCase orchestration only.
- Merge filters + rank + paginate
- NOT: section rendering, search parsing, chat logic, map clustering

---

## Testing

- **Domain:** Unit tests, no mocks
- **Application:** Integration tests, mocked ports
- **Infrastructure:** Real/containerized services
- **E2E:** Critical paths only

Coverage: domain 90%+, application 80%+

---

## Naming

```
Entities:    Activity, User (nouns)
Ports:       IActivityRepository, IMapProvider
Adapters:    PrismaActivityRepository, MapboxAdapter
Use Cases:   GetFeedUseCase, SearchActivitiesUseCase
DTOs:        ActivityDTO, FeedQueryDTO
Presets:     HOME_PRESET, SPORT_PRESET
Errors:      ActivityNotFoundError
```

---

## Code Review (AI Agent Checklist)

- [ ] No framework imports in domain/
- [ ] Layer dependencies form DAG (no cycles)
- [ ] Contracts: pure types, no methods
- [ ] Error handling: domain → application → HTTP
- [ ] Infrastructure: implements one port only
- [ ] Tests: appropriate per layer

---

**Authority:** DDD + Clean Architecture  
**See:** ARCHITECTURE.md (full design) | STEP_ZERO.md (setup) | PRD.md (requirements)
